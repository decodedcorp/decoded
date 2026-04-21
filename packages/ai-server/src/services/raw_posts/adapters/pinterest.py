"""PinterestAdapter — #214.

Scrapes public Pinterest boards via Pinterest's own resource endpoints
(`BoardResource` + `BoardFeedResource`), the same XHRs the web app uses.
Requires no API key, no stealth browser, no residential proxy. A 2026-04-21
spike verified ~1000 pins / minute, multi-board, unauthenticated, untrottled.

The adapter only handles `source_type="board"` in phase 1. `search` / `user` /
`pin` (related-pin expansion) are left for follow-up PRs; their endpoints
(`BaseSearchResource`, `RelatedPinFeedResource`) work the same way.

No DB or R2 access — the adapter's only responsibility is producing
`list[RawMedia]`. Pre-filtering against already-ingested pins and uploading
to R2 are the pipeline's job.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import httpx

from ..models import FetchRequest, RawMedia


logger = logging.getLogger(__name__)


_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

# Pinterest's web app version header. Any realistic value is accepted; the
# presence of the header itself is what the resource endpoint expects.
_X_APP_VERSION = "0cbfdeb"

_PINTEREST_ORIGIN = "https://www.pinterest.com"

# Pinterest CDN serves multiple resolutions under these path segments.
# Downgrade any we see to `/originals/` so R2 stores the highest-quality copy.
_RESOLUTION_SEGMENTS = ("/236x/", "/474x/", "/736x/", "/1200x/")


class PinterestAdapter:
    """Implements `SourceAdapter` for Pinterest boards."""

    platform: str = "pinterest"

    def __init__(self, environment) -> None:
        self._env = environment

    async def fetch(self, req: FetchRequest) -> List[RawMedia]:
        if req.source_type != "board":
            raise NotImplementedError(
                f"PinterestAdapter phase 1 supports only source_type='board'; "
                f"got {req.source_type!r}"
            )
        username, slug = _parse_board_identifier(req.source_identifier)
        target = (
            self._env.PINTEREST_INITIAL_LIMIT
            if req.mode == "initial"
            else self._env.PINTEREST_INCREMENTAL_LIMIT
        )
        target = max(1, min(target, req.limit if req.limit > 0 else target))

        async with httpx.AsyncClient(
            headers={"User-Agent": _USER_AGENT, "Accept-Language": "en-US,en;q=0.9"},
            follow_redirects=True,
            timeout=30,
        ) as http:
            cookies = await self._prime_session(http, username, slug)
            board_id = await self._fetch_board_id(http, cookies, username, slug)
            return await self._paginate_board_feed(
                http, cookies, username, slug, board_id, target, req.mode
            )

    # ---- HTTP helpers ----------------------------------------------------

    async def _prime_session(
        self, http: httpx.AsyncClient, username: str, slug: str
    ) -> Dict[str, str]:
        """Load the board page once to obtain csrftoken + session cookies."""
        url = f"{_PINTEREST_ORIGIN}/{username}/{slug}/"
        resp = await http.get(url)
        resp.raise_for_status()
        cookies = dict(resp.cookies)
        if "csrftoken" not in cookies:
            raise RuntimeError(
                f"Pinterest session prime returned no csrftoken (board={username}/{slug})"
            )
        return cookies

    async def _fetch_board_id(
        self,
        http: httpx.AsyncClient,
        cookies: Dict[str, str],
        username: str,
        slug: str,
    ) -> str:
        """Resolve the board's numeric id from `BoardResource.get`."""
        url = f"{_PINTEREST_ORIGIN}/resource/BoardResource/get/"
        data = {
            "options": {"username": username, "slug": slug, "field_set_key": "detailed"},
            "context": {},
        }
        resp = await http.get(
            url,
            headers=_xhr_headers(cookies, username, slug),
            params={"source_url": f"/{username}/{slug}/", "data": _json_compact(data)},
        )
        resp.raise_for_status()
        board = (resp.json().get("resource_response") or {}).get("data") or {}
        board_id = board.get("id")
        if not board_id:
            raise RuntimeError(
                f"BoardResource returned no id for {username}/{slug}; "
                f"keys={sorted(board)[:10]}"
            )
        logger.info(
            "pinterest.adapter: resolved board %s/%s → id=%s (pin_count=%s)",
            username,
            slug,
            board_id,
            board.get("pin_count"),
        )
        return str(board_id)

    async def _paginate_board_feed(
        self,
        http: httpx.AsyncClient,
        cookies: Dict[str, str],
        username: str,
        slug: str,
        board_id: str,
        target: int,
        mode: str,
    ) -> List[RawMedia]:
        url = f"{_PINTEREST_ORIGIN}/resource/BoardFeedResource/get/"
        referer = f"{_PINTEREST_ORIGIN}/{username}/{slug}/"
        headers = _xhr_headers(cookies, username, slug, referer=referer)
        delay = max(0, self._env.PINTEREST_PAGE_DELAY_MS) / 1000.0

        collected: List[RawMedia] = []
        seen: set[str] = set()
        bookmark: Optional[str] = None
        page = 0
        # Defensive cap so a bad cursor can't loop forever.
        # 25 pins per page, so this supports boards up to 2500 pins per cycle.
        max_pages = 100

        while len(collected) < target and page < max_pages:
            page += 1
            opts: Dict[str, Any] = {
                "board_id": board_id,
                "page_size": 25,
                "prepend": False,
            }
            if bookmark is not None:
                opts["bookmarks"] = [bookmark]
            resp = await http.get(
                url,
                headers=headers,
                params={
                    "source_url": f"/{username}/{slug}/",
                    "data": _json_compact({"options": opts, "context": {}}),
                },
            )
            resp.raise_for_status()
            body = resp.json()
            rr = body.get("resource_response") or {}
            pins = rr.get("data") or []
            next_bookmark = rr.get("bookmark")

            for pin in pins:
                if not isinstance(pin, dict):
                    continue
                media = _pin_to_raw_media(pin, username, slug)
                if media is None or media.external_id in seen:
                    continue
                seen.add(media.external_id)
                collected.append(media)
                if len(collected) >= target:
                    break

            if not pins or next_bookmark in (None, "", "-end-") or next_bookmark == bookmark:
                break
            bookmark = next_bookmark
            if delay > 0:
                await asyncio.sleep(delay)

        logger.info(
            "pinterest.adapter: %s scrape → %d pins across %d pages (board=%s/%s)",
            mode,
            len(collected),
            page,
            username,
            slug,
        )
        return collected


# ---- Module-level helpers ------------------------------------------------


def _parse_board_identifier(identifier: str) -> Tuple[str, str]:
    """Accept `<user>/<slug>` or a full pinterest.com board URL.

    Returns `(username, slug)`. Raises ValueError on malformed input.
    """
    raw = (identifier or "").strip()
    if not raw:
        raise ValueError("pinterest board identifier is empty")
    if raw.startswith(("http://", "https://")):
        parsed = urlparse(raw)
        raw = parsed.path.strip("/")
    raw = raw.strip("/")
    parts = [p for p in raw.split("/") if p]
    if len(parts) < 2:
        raise ValueError(
            f"invalid pinterest board identifier: {identifier!r} (expected <user>/<slug>)"
        )
    return parts[0], parts[1]


def _xhr_headers(
    cookies: Dict[str, str],
    username: str,
    slug: str,
    *,
    referer: Optional[str] = None,
) -> Dict[str, str]:
    return {
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "X-APP-VERSION": _X_APP_VERSION,
        "X-Pinterest-AppState": "active",
        "X-Pinterest-PWS-Handler": "www/[username]/[slug].js",
        "X-CSRFToken": cookies.get("csrftoken", ""),
        "Referer": referer or f"{_PINTEREST_ORIGIN}/{username}/{slug}/",
    }


def _json_compact(obj: Dict[str, Any]) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False)


def _upgrade_to_originals(image_url: Optional[str]) -> Optional[str]:
    """Rewrite Pinterest CDN URLs to the /originals/ variant for R2 archival."""
    if not image_url:
        return image_url
    for seg in _RESOLUTION_SEGMENTS:
        if seg in image_url:
            return image_url.replace(seg, "/originals/")
    return image_url


def _pin_to_raw_media(
    pin: Dict[str, Any], board_username: str, board_slug: str
) -> Optional[RawMedia]:
    pin_id = pin.get("id")
    if not pin_id:
        return None
    images = pin.get("images") or {}
    orig = (images.get("orig") or {}).get("url")
    fallback = (
        (images.get("736x") or {}).get("url")
        or (images.get("474x") or {}).get("url")
        or (images.get("236x") or {}).get("url")
    )
    image_url = _upgrade_to_originals(orig or fallback)
    if not image_url:
        return None
    title = (pin.get("title") or pin.get("grid_title") or "").strip() or None
    description = (pin.get("description") or "").strip() or None
    pinner = (pin.get("pinner") or {}).get("username")
    external_url = f"{_PINTEREST_ORIGIN}/pin/{pin_id}/"
    platform_metadata = {
        "board": f"{board_username}/{board_slug}",
        "title": title,
        "description": description,
        "pinner": pinner,
        "link": pin.get("link"),
    }
    # Strip falsy values to keep the jsonb lean.
    platform_metadata = {k: v for k, v in platform_metadata.items() if v}
    return RawMedia(
        external_id=str(pin_id),
        external_url=external_url,
        image_url=image_url,
        caption=title or description,
        author_name=pinner,
        platform_metadata=platform_metadata,
    )
