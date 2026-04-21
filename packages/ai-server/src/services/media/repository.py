"""asyncpg wrapper for the vision parsing pipeline (#260).

Reads rows out of `warehouse.raw_posts` where `parse_status='pending'`,
claims them atomically (`FOR UPDATE SKIP LOCKED`), and stamps the lifecycle
transitions (`parsing` → `parsed` / `skipped` / `failed`).

Writes to `seed_posts` / `seed_spots` / `seed_solutions` / `seed_asset` live
in `SeedWriter`; this module only touches `raw_posts`.
"""

from __future__ import annotations

import json
import logging
from typing import List, Optional
from uuid import UUID

from src.managers.database import DatabaseManager
from src.services.media.models import ParseCandidate


logger = logging.getLogger(__name__)


class MediaRepository:
    def __init__(self, database_manager: DatabaseManager) -> None:
        self._db = database_manager

    async def claim_pending(
        self, *, limit: int, max_attempts: int
    ) -> List[ParseCandidate]:
        """Atomically claim up to `limit` rows for parsing.

        Inside one transaction:
          1. SELECT ... FOR UPDATE SKIP LOCKED
          2. UPDATE the same rows to `parsing`, bumping `parse_attempts`

        The bump happens here so `mark_failed` only has to decide whether the
        already-incremented counter crossed `max_attempts`.
        """
        if limit <= 0:
            return []
        async with self._db.acquire() as conn:
            async with conn.transaction():
                rows = await conn.fetch(
                    """
                    SELECT id, platform, external_id, external_url, r2_key, r2_url,
                           caption, image_hash, parse_attempts
                      FROM warehouse.raw_posts
                     WHERE parse_status = 'pending'
                       AND parse_attempts < $2
                       AND r2_url IS NOT NULL
                       AND r2_url <> ''
                     ORDER BY created_at
                     LIMIT $1
                     FOR UPDATE SKIP LOCKED
                    """,
                    limit,
                    max_attempts,
                )
                if not rows:
                    return []
                ids = [r["id"] for r in rows]
                await conn.execute(
                    """
                    UPDATE warehouse.raw_posts
                       SET parse_status = 'parsing',
                           parse_attempts = parse_attempts + 1,
                           updated_at = now()
                     WHERE id = ANY($1::uuid[])
                    """,
                    ids,
                )
        return [
            ParseCandidate(
                id=r["id"],
                platform=r["platform"],
                external_id=r["external_id"],
                external_url=r["external_url"],
                r2_key=r["r2_key"],
                r2_url=r["r2_url"],
                caption=r["caption"],
                image_hash=r["image_hash"],
                # `parse_attempts` on the returned object is the *pre-bump*
                # value — we read before the UPDATE. Callers shouldn't care.
                parse_attempts=r["parse_attempts"] + 1,
            )
            for r in rows
        ]

    async def fetch_by_id(self, raw_post_id: UUID) -> Optional[ParseCandidate]:
        """Look up a single raw_posts row. Used by the manual reparse API."""
        async with self._db.acquire() as conn:
            r = await conn.fetchrow(
                """
                SELECT id, platform, external_id, external_url, r2_key, r2_url,
                       caption, image_hash, parse_attempts
                  FROM warehouse.raw_posts
                 WHERE id = $1
                """,
                raw_post_id,
            )
        if r is None:
            return None
        return ParseCandidate(
            id=r["id"],
            platform=r["platform"],
            external_id=r["external_id"],
            external_url=r["external_url"],
            r2_key=r["r2_key"],
            r2_url=r["r2_url"],
            caption=r["caption"],
            image_hash=r["image_hash"],
            parse_attempts=r["parse_attempts"],
        )

    async def claim_for_reparse(
        self, raw_post_id: UUID
    ) -> Optional[ParseCandidate]:
        """Atomically reset+claim a single row for manual reparse.

        Inside one transaction: lock the row, flip it to `parsing`, zero out
        attempts/error, bump `parse_attempts` to 1 (same as `claim_pending`
        would on a fresh cycle), and return the candidate. Returns None if
        the row doesn't exist or has no r2_url to parse.
        """
        async with self._db.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    """
                    SELECT id, platform, external_id, external_url, r2_key, r2_url,
                           caption, image_hash
                      FROM warehouse.raw_posts
                     WHERE id = $1
                     FOR UPDATE
                    """,
                    raw_post_id,
                )
                if row is None:
                    return None
                if not row["r2_url"]:
                    return None
                await conn.execute(
                    """
                    UPDATE warehouse.raw_posts
                       SET parse_status = 'parsing',
                           parse_attempts = 1,
                           parse_error = NULL,
                           updated_at = now()
                     WHERE id = $1
                    """,
                    raw_post_id,
                )
        return ParseCandidate(
            id=row["id"],
            platform=row["platform"],
            external_id=row["external_id"],
            external_url=row["external_url"],
            r2_key=row["r2_key"],
            r2_url=row["r2_url"],
            caption=row["caption"],
            image_hash=row["image_hash"],
            parse_attempts=1,
        )

    async def mark_parsed(
        self,
        raw_post_id: UUID,
        *,
        seed_post_id: UUID,
        parse_result: dict,
    ) -> None:
        async with self._db.acquire() as conn:
            await conn.execute(
                """
                UPDATE warehouse.raw_posts
                   SET parse_status = 'parsed',
                       seed_post_id = $2,
                       parse_result = $3::jsonb,
                       parse_error = NULL,
                       updated_at = now()
                 WHERE id = $1
                """,
                raw_post_id,
                seed_post_id,
                json.dumps(parse_result),
            )

    async def mark_skipped(self, raw_post_id: UUID) -> None:
        """Vision returned zero items — image is not a fashion-decode post."""
        async with self._db.acquire() as conn:
            await conn.execute(
                """
                UPDATE warehouse.raw_posts
                   SET parse_status = 'skipped',
                       parse_error = NULL,
                       updated_at = now()
                 WHERE id = $1
                """,
                raw_post_id,
            )

    async def mark_failed(
        self,
        raw_post_id: UUID,
        *,
        error: str,
        max_attempts: int,
    ) -> None:
        """Record a failure.

        If the row's attempts reached `max_attempts` it stays terminal (`failed`);
        otherwise bounce back to `pending` so the next cycle retries. Attempts
        were already bumped in `claim_pending`, so we just compare the stored
        counter.
        """
        trimmed_error = (error or "")[:500]
        async with self._db.acquire() as conn:
            await conn.execute(
                """
                UPDATE warehouse.raw_posts
                   SET parse_status = CASE
                         WHEN parse_attempts >= $3 THEN 'failed'
                         ELSE 'pending'
                       END,
                       parse_error = $2,
                       updated_at = now()
                 WHERE id = $1
                """,
                raw_post_id,
                trimmed_error,
                max_attempts,
            )
