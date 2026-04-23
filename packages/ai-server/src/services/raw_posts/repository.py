"""asyncpg wrapper for the raw_posts pipeline (#214).

Replaces the #258 gRPC callback: the ai-server now owns the full lifecycle
(dispatch → fetch → upsert → state update) and writes `warehouse.raw_post_sources`
and `warehouse.raw_posts` directly.

Read-only cross-service writes are OK here — the DB schema is owned by
api-server's SeaORM migrations; this is just a client.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List, Optional, Set
from uuid import UUID

from src.managers.database import DatabaseManager
from src.services.raw_posts.models import RawPostResult


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DueSource:
    """Minimal row shape returned by `fetch_due_sources`."""

    id: UUID
    platform: str
    source_type: str
    source_identifier: str
    fetch_interval_seconds: int
    initial_scraped_at: Optional[datetime]


class RawPostsRepository:
    def __init__(self, database_manager: DatabaseManager) -> None:
        self._db = database_manager

    async def fetch_due_sources(self) -> List[DueSource]:
        """Active sources whose `fetch_interval_seconds` has elapsed since last enqueue."""
        async with self._db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, platform, source_type, source_identifier,
                       fetch_interval_seconds, initial_scraped_at
                  FROM warehouse.raw_post_sources
                 WHERE is_active = true
                   AND (last_enqueued_at IS NULL
                        OR now() - last_enqueued_at
                           > fetch_interval_seconds * interval '1 second')
                 ORDER BY last_enqueued_at NULLS FIRST, id
                """,
            )
        return [
            DueSource(
                id=r["id"],
                platform=r["platform"],
                source_type=r["source_type"],
                source_identifier=r["source_identifier"],
                fetch_interval_seconds=r["fetch_interval_seconds"],
                initial_scraped_at=r["initial_scraped_at"],
            )
            for r in rows
        ]

    async def fetch_source(self, source_id: UUID) -> Optional[DueSource]:
        """Load a single source (used by the manual /trigger API)."""
        async with self._db.acquire() as conn:
            r = await conn.fetchrow(
                """
                SELECT id, platform, source_type, source_identifier,
                       fetch_interval_seconds, initial_scraped_at
                  FROM warehouse.raw_post_sources
                 WHERE id = $1
                """,
                source_id,
            )
        if r is None:
            return None
        return DueSource(
            id=r["id"],
            platform=r["platform"],
            source_type=r["source_type"],
            source_identifier=r["source_identifier"],
            fetch_interval_seconds=r["fetch_interval_seconds"],
            initial_scraped_at=r["initial_scraped_at"],
        )

    async def mark_enqueued(self, source_id: UUID) -> None:
        async with self._db.acquire() as conn:
            await conn.execute(
                "UPDATE warehouse.raw_post_sources SET last_enqueued_at = now() WHERE id = $1",
                source_id,
            )

    async def mark_scraped(self, source_id: UUID) -> None:
        async with self._db.acquire() as conn:
            await conn.execute(
                "UPDATE warehouse.raw_post_sources SET last_scraped_at = now() WHERE id = $1",
                source_id,
            )

    async def set_initial_scraped(self, source_id: UUID) -> None:
        """Stamp `initial_scraped_at` so subsequent runs switch to incremental mode."""
        async with self._db.acquire() as conn:
            await conn.execute(
                """UPDATE warehouse.raw_post_sources
                      SET initial_scraped_at = now()
                    WHERE id = $1 AND initial_scraped_at IS NULL""",
                source_id,
            )

    async def fetch_existing_external_ids(
        self, *, platform: str, external_ids: Iterable[str]
    ) -> Set[str]:
        """Subset of `external_ids` already present in `warehouse.raw_posts`.

        Pipeline calls this before download to skip items we've already ingested.
        """
        ids = list(dict.fromkeys(external_ids))  # dedup input, preserve order
        if not ids:
            return set()
        async with self._db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT external_id
                  FROM warehouse.raw_posts
                 WHERE platform = $1 AND external_id = ANY($2::text[])
                """,
                platform,
                ids,
            )
        return {r["external_id"] for r in rows}

    async def upsert_raw_posts(
        self,
        *,
        source_id: UUID,
        platform: str,
        dispatch_id: str,
        results: List[RawPostResult],
    ) -> int:
        """Upsert scrape results. Returns the number of rows written."""
        if not results:
            return 0
        rows = [
            (
                source_id,
                platform,
                r.external_id,
                r.external_url,
                r.image_url,
                r.r2_key,
                r.r2_url,
                r.caption,
                r.author_name,
                json.dumps(r.platform_metadata) if r.platform_metadata else None,
                dispatch_id,
            )
            for r in results
        ]
        async with self._db.acquire() as conn:
            async with conn.transaction():
                # asyncpg has no batch UPSERT; use executemany against the same
                # prepared statement. Volumes per cycle are ≤ a few hundred so
                # this is plenty fast.
                await conn.executemany(
                    """
                    INSERT INTO warehouse.raw_posts (
                        source_id, platform, external_id, external_url, image_url,
                        r2_key, r2_url, caption, author_name, platform_metadata,
                        dispatch_id
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
                    ON CONFLICT (platform, external_id) DO UPDATE SET
                        r2_key = EXCLUDED.r2_key,
                        r2_url = EXCLUDED.r2_url,
                        caption = EXCLUDED.caption,
                        author_name = EXCLUDED.author_name,
                        platform_metadata = EXCLUDED.platform_metadata,
                        dispatch_id = EXCLUDED.dispatch_id,
                        updated_at = now()
                    """,
                    rows,
                )
        return len(rows)
