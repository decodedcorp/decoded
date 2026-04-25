"""asyncpg wrapper for the raw_posts pipeline (#214).

Replaces the #258 gRPC callback: the ai-server now owns the full lifecycle
(dispatch → fetch → upsert → state update) and writes `public.raw_post_sources`
and `public.raw_posts` directly.

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
                  FROM public.raw_post_sources
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
                  FROM public.raw_post_sources
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
                "UPDATE public.raw_post_sources SET last_enqueued_at = now() WHERE id = $1",
                source_id,
            )

    async def mark_scraped(self, source_id: UUID) -> None:
        async with self._db.acquire() as conn:
            await conn.execute(
                "UPDATE public.raw_post_sources SET last_scraped_at = now() WHERE id = $1",
                source_id,
            )

    async def set_initial_scraped(self, source_id: UUID) -> None:
        """Stamp `initial_scraped_at` so subsequent runs switch to incremental mode."""
        async with self._db.acquire() as conn:
            await conn.execute(
                """UPDATE public.raw_post_sources
                      SET initial_scraped_at = now()
                    WHERE id = $1 AND initial_scraped_at IS NULL""",
                source_id,
            )

    async def fetch_existing_external_ids(
        self, *, platform: str, external_ids: Iterable[str]
    ) -> Set[str]:
        """Subset of `external_ids` already present in `public.raw_posts`.

        Pipeline calls this before download to skip items we've already ingested.
        """
        ids = list(dict.fromkeys(external_ids))  # dedup input, preserve order
        if not ids:
            return set()
        async with self._db.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT external_id
                  FROM public.raw_posts
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
        """Upsert scrape results. Returns the number of rows written.

        파이프라인 상태머신 (#333):
          - 새로 생긴 row 는 status=COMPLETED 로 INSERT 되고, pipeline_events 에
            `NULL → COMPLETED` 전이가 기록된다. ai-server 가 fetch + R2 업로드를
            끝낸 시점 == 파이프라인 자동 처리 완료.
          - 기존 row (ON CONFLICT) 는 r2/caption/metadata 만 refresh 하고 status
            는 건드리지 않는다 — admin 이 이미 VERIFIED 한 경우 결정을 보존하고,
            다른 상태에서도 다음 재평가까지 그대로 둔다.
        """
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
                # 각 row 를 개별 INSERT (RETURNING id, inserted) 해서 새 row 에만
                # pipeline_events 를 기록한다. 배치당 수백 건 이하라 개별 round-trip
                # 비용은 무시 가능.
                for row in rows:
                    inserted_row = await conn.fetchrow(
                        """
                        INSERT INTO public.raw_posts (
                            source_id, platform, external_id, external_url, image_url,
                            r2_key, r2_url, caption, author_name, platform_metadata,
                            dispatch_id, status
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11,
                                'COMPLETED'::public.pipeline_status)
                        ON CONFLICT (platform, external_id) DO UPDATE SET
                            r2_key = EXCLUDED.r2_key,
                            r2_url = EXCLUDED.r2_url,
                            caption = EXCLUDED.caption,
                            author_name = EXCLUDED.author_name,
                            platform_metadata = EXCLUDED.platform_metadata,
                            dispatch_id = EXCLUDED.dispatch_id,
                            updated_at = now()
                        RETURNING id, (xmax = 0) AS inserted
                        """,
                        *row,
                    )
                    if inserted_row is not None and inserted_row["inserted"]:
                        await conn.execute(
                            """
                            INSERT INTO public.pipeline_events
                                (raw_post_id, from_status, to_status, actor, note)
                            VALUES ($1, NULL, 'COMPLETED'::public.pipeline_status,
                                    NULL, $2)
                            """,
                            inserted_row["id"],
                            f"dispatch:{dispatch_id}",
                        )
        return len(rows)

    async def mark_raw_post_error(
        self, raw_post_id: UUID, *, note: Optional[str] = None
    ) -> None:
        """파이프라인 실패 시 raw_post 를 ERROR 상태로 전이하고 pipeline_events 기록 (#333).

        업스트림 fetch 또는 R2 upload 가 부분적으로 성공한 뒤 하류 단계에서 터지는 경우에만
        호출한다. 전량 실패(아무 row 도 INSERT 안 됐을 때) 는 대상 raw_post 가 존재하지 않으므로
        source 레벨의 `last_scraped_at` 만 업데이트하고 호출하지 않는다.
        """
        async with self._db.acquire() as conn:
            async with conn.transaction():
                r = await conn.fetchrow(
                    """
                    UPDATE public.raw_posts
                       SET status = 'ERROR'::public.pipeline_status,
                           parse_error = COALESCE($2, parse_error),
                           updated_at = now()
                     WHERE id = $1
                       AND status <> 'VERIFIED'::public.pipeline_status
                    RETURNING id, status
                    """,
                    raw_post_id,
                    note,
                )
                if r is None:
                    return
                await conn.execute(
                    """
                    INSERT INTO public.pipeline_events
                        (raw_post_id, from_status, to_status, actor, note)
                    VALUES ($1, NULL, 'ERROR'::public.pipeline_status, NULL, $2)
                    """,
                    raw_post_id,
                    note,
                )
