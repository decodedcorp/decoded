"""Insert a parse result into `seed_posts` / `seed_spots` / `seed_asset` as one
atomic transaction (#260).

**Authoritative schema**: this writer targets the actual dev/prod Supabase
schema (not the SeaORM migration file — the two have drifted; see PR
description). Shape verified via `\\d` on 2026-04-21:

* `seed_posts`:
    id, source_post_id uuid (FK warehouse.posts, nullable),
    source_image_id uuid (FK warehouse.images, nullable),
    image_url NOT NULL, media_source jsonb, group_id uuid, artist_id uuid,
    metadata jsonb, status text (default 'draft'), backend_post_id uuid unique,
    publish_error text, timestamps.
    NO `context` column — if editorial context is needed it goes in metadata.
* `seed_spots`:
    id, seed_post_id (FK NOT NULL, CASCADE), request_order int NOT NULL,
    position_left text NOT NULL, position_top text NOT NULL,
    status text default 'draft', solutions jsonb NOT NULL default '[]',
    subcategory_id uuid (FK, nullable — resolved later by entity-matching PR),
    publish_error, timestamps.
    Solutions are EMBEDDED as a JSONB array. There is no separate
    `seed_solutions` table on dev/prod.
* `seed_asset`:
    id, seed_post_id (FK NOT NULL, CASCADE), source_url, source_domain,
    archived_url, image_hash text NOT NULL UNIQUE, metadata jsonb, timestamps.

Caller guarantees: `parsed.items` is non-empty. If the image had no items,
the scheduler marks raw_posts `skipped` without touching seed_*.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse
from uuid import UUID

from src.managers.database import DatabaseManager
from src.services.media.models import ParseCandidate, ParsedDecodeResult, ParsedItem


logger = logging.getLogger(__name__)


class SeedWriterError(RuntimeError):
    """Raised when the writer is called in an invalid state."""


def _clamp_pct(v: int) -> int:
    if v < 0:
        return 0
    if v > 100:
        return 100
    return v


def _source_domain(url: str) -> Optional[str]:
    try:
        netloc = urlparse(url).netloc
        return netloc or None
    except Exception:
        return None


def _solution_payload(item: ParsedItem) -> dict:
    """Shape matches what seed-downstream consumers expect on seed_spots.solutions."""
    return {
        "brand": item.brand,
        "product_name": item.product_name,
        "price_amount": item.price_amount,
        "price_currency": item.price_currency,
        "subcategory": item.subcategory,
        "status": "draft",
    }


def _build_metadata(
    candidate: ParseCandidate,
    parsed: ParsedDecodeResult,
    *,
    original_status: str,
) -> dict:
    return {
        "source_raw_post_id": str(candidate.id),
        "celebrity_name": parsed.celebrity_name,
        "group_name": parsed.group_name,
        "occasion": parsed.occasion,
        "parsed_at": datetime.now(timezone.utc).isoformat(),
        "original_status": original_status,
    }


class SeedWriter:
    def __init__(self, database_manager: DatabaseManager) -> None:
        self._db = database_manager

    async def write_for_parse_result(
        self,
        candidate: ParseCandidate,
        parsed: ParsedDecodeResult,
        *,
        image_sha256: str,
        image_url: Optional[str] = None,
        original_status: str = "not_found",
    ) -> UUID:
        """Write a full seed row set. Returns the new seed_posts.id.

        Invariant: `parsed.items` must be non-empty; the scheduler filters
        zero-item results to `parse_status='skipped'` without calling here.

        `image_url` is what `seed_posts.image_url` points at. Defaults to
        `candidate.r2_url` (the composite fallback) when the reverse-search
        step didn't find a better original. `original_status` is surfaced
        into `seed_posts.metadata` so curators can quickly filter seeds
        that still need an original upgrade.
        """
        if not parsed.items:
            raise SeedWriterError(
                "SeedWriter.write_for_parse_result called with zero items"
            )
        if not candidate.r2_url:
            raise SeedWriterError(
                "SeedWriter.write_for_parse_result called with empty r2_url"
            )

        effective_image_url = image_url or candidate.r2_url
        if not effective_image_url:
            raise SeedWriterError(
                "SeedWriter.write_for_parse_result: no usable image_url"
            )

        media_source = json.dumps(
            {
                "platform": candidate.platform,
                "external_id": candidate.external_id,
                "external_url": candidate.external_url,
            }
        )
        metadata = json.dumps(
            _build_metadata(candidate, parsed, original_status=original_status)
        )
        asset_metadata = json.dumps(
            {"r2_key": candidate.r2_key} if candidate.r2_key else {}
        )

        async with self._db.acquire() as conn:
            async with conn.transaction():
                seed_post_id: UUID = await conn.fetchval(
                    """
                    INSERT INTO warehouse.seed_posts
                        (image_url, media_source, metadata, status)
                    VALUES ($1, $2::jsonb, $3::jsonb, 'draft')
                    RETURNING id
                    """,
                    effective_image_url,
                    media_source,
                    metadata,
                )

                await conn.execute(
                    """
                    INSERT INTO warehouse.seed_asset
                        (seed_post_id, source_url, source_domain,
                         archived_url, image_hash, metadata)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                    ON CONFLICT (image_hash) DO NOTHING
                    """,
                    seed_post_id,
                    candidate.external_url,
                    _source_domain(candidate.external_url),
                    candidate.r2_url,
                    image_sha256,
                    asset_metadata,
                )

                if not candidate.image_hash:
                    await conn.execute(
                        """
                        UPDATE warehouse.raw_posts
                           SET image_hash = $2
                         WHERE id = $1 AND image_hash IS NULL
                        """,
                        candidate.id,
                        image_sha256,
                    )

                for idx, item in enumerate(parsed.items):
                    await conn.execute(
                        """
                        INSERT INTO warehouse.seed_spots
                            (seed_post_id, request_order, position_left,
                             position_top, solutions, status)
                        VALUES ($1, $2, $3, $4, $5::jsonb, 'draft')
                        """,
                        seed_post_id,
                        idx,
                        str(_clamp_pct(item.position_x_pct)),
                        str(_clamp_pct(item.position_y_pct)),
                        json.dumps([_solution_payload(item)]),
                    )

        return seed_post_id
