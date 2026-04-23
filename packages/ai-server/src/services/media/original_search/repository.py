"""asyncpg writes for reverse image search results (#261)."""

from __future__ import annotations

import json
import logging
from typing import Optional
from uuid import UUID

from src.managers.database import DatabaseManager

from .models import ArchivedOriginal


logger = logging.getLogger(__name__)


_ALLOWED_ORIGINAL_STATUSES = {
    "pending",
    "searching",
    "found",
    "not_found",
    "skipped",
}


class OriginalSearchRepository:
    def __init__(self, database_manager: DatabaseManager) -> None:
        self._db = database_manager

    async def mark_searching(self, raw_post_id: UUID) -> None:
        async with self._db.acquire() as conn:
            await conn.execute(
                """
                UPDATE warehouse.raw_posts
                   SET original_status = 'searching',
                       updated_at = now()
                 WHERE id = $1 AND original_status IN ('pending','not_found')
                """,
                raw_post_id,
            )

    async def set_status(
        self, raw_post_id: UUID, status: str
    ) -> None:
        if status not in _ALLOWED_ORIGINAL_STATUSES:
            raise ValueError(f"unknown original_status: {status!r}")
        async with self._db.acquire() as conn:
            await conn.execute(
                """
                UPDATE warehouse.raw_posts
                   SET original_status = $2,
                       updated_at = now()
                 WHERE id = $1
                """,
                raw_post_id,
                status,
            )

    async def insert_archived(
        self,
        raw_post_id: UUID,
        archived: ArchivedOriginal,
        *,
        is_primary: bool = True,
    ) -> UUID:
        """Insert the archived original; mark as primary by default.

        If `is_primary=True` and another primary exists for this raw_post,
        the unique partial index would conflict — clear existing primary
        in the same transaction to keep the invariant ("at most one
        primary per raw_post").
        """
        metadata_json = json.dumps(archived.metadata or {})
        async with self._db.acquire() as conn:
            async with conn.transaction():
                if is_primary:
                    await conn.execute(
                        """
                        UPDATE warehouse.source_media_originals
                           SET is_primary = false
                         WHERE raw_post_id = $1 AND is_primary = true
                        """,
                        raw_post_id,
                    )
                new_id: UUID = await conn.fetchval(
                    """
                    INSERT INTO warehouse.source_media_originals (
                        raw_post_id, origin_url, origin_domain, r2_key, r2_url,
                        width, height, byte_size, image_hash,
                        search_provider, is_primary, metadata
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
                    ON CONFLICT (r2_key) DO UPDATE SET
                        origin_url = EXCLUDED.origin_url,
                        origin_domain = EXCLUDED.origin_domain,
                        r2_url = EXCLUDED.r2_url,
                        width = EXCLUDED.width,
                        height = EXCLUDED.height,
                        byte_size = EXCLUDED.byte_size,
                        image_hash = EXCLUDED.image_hash,
                        is_primary = EXCLUDED.is_primary,
                        metadata = EXCLUDED.metadata
                    RETURNING id
                    """,
                    raw_post_id,
                    archived.origin_url,
                    archived.origin_domain,
                    archived.r2_key,
                    archived.r2_url,
                    archived.width,
                    archived.height,
                    archived.byte_size,
                    archived.image_hash,
                    archived.search_provider,
                    is_primary,
                    metadata_json,
                )
        return new_id

    async def fetch_primary(self, raw_post_id: UUID) -> Optional[dict]:
        """Fetch the current primary original for a raw_post, if any."""
        async with self._db.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, origin_url, origin_domain, r2_key, r2_url,
                       width, height, byte_size, image_hash, search_provider
                  FROM warehouse.source_media_originals
                 WHERE raw_post_id = $1 AND is_primary = true
                 LIMIT 1
                """,
                raw_post_id,
            )
        return dict(row) if row else None
