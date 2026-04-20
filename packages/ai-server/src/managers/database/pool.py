"""Async Postgres connection pool manager.

Uses `asyncpg` for direct TCP access to the Postgres instance pointed to by
`DATABASE_URL`. Works transparently against:
- 로컬 Postgres 컨테이너 (`postgresql://postgres:postgres@localhost:5432/decoded`)
- 원격 Supabase pooler (`postgresql://postgres.<ref>:<pwd>@aws-...pooler.supabase.com:5432/postgres`)

Pool is lazily initialized on first `pool()` call and reused for the process
lifetime. Size is bounded by `DATABASE_POOL_MIN`/`DATABASE_POOL_MAX` to stay
within Supabase pooler quota on prod.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import asyncpg


logger = logging.getLogger(__name__)


class DatabaseManager:
    """Singleton asyncpg connection pool, injected via the DI container.

    Usage:
        async with db_manager.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM posts WHERE id = $1", post_id)
    """

    def __init__(self, environment) -> None:
        self._env = environment
        self._pool: Optional[asyncpg.Pool] = None
        self._lock = asyncio.Lock()

    async def pool(self) -> asyncpg.Pool:
        """Return the shared pool, initializing it on first call."""
        if self._pool is not None:
            return self._pool
        async with self._lock:
            if self._pool is not None:
                return self._pool
            dsn = self._env.DATABASE_URL
            if not dsn:
                raise RuntimeError(
                    "DatabaseManager: DATABASE_URL is not configured. Set it in your env file."
                )
            self._pool = await asyncpg.create_pool(
                dsn=dsn,
                min_size=self._env.DATABASE_POOL_MIN,
                max_size=self._env.DATABASE_POOL_MAX,
                # Keep queries short-lived; long transactions are not expected here.
                command_timeout=30,
            )
            logger.info(
                "DatabaseManager: pool initialized (min=%s, max=%s)",
                self._env.DATABASE_POOL_MIN,
                self._env.DATABASE_POOL_MAX,
            )
            return self._pool

    def acquire(self):
        """Return an async context manager that yields a pooled connection.

        Mirrors `asyncpg.Pool.acquire()` but ensures pool initialization.
        """
        return _AcquireProxy(self)

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None
            logger.info("DatabaseManager: pool closed")


class _AcquireProxy:
    """Thin proxy so callers can `async with db_manager.acquire() as conn:`.

    `asyncpg.Pool.acquire()` already returns such a context manager but we
    need to await `pool()` first to lazy-init.
    """

    def __init__(self, manager: DatabaseManager) -> None:
        self._manager = manager
        self._acquirer = None

    async def __aenter__(self):
        pool = await self._manager.pool()
        self._acquirer = pool.acquire()
        return await self._acquirer.__aenter__()

    async def __aexit__(self, exc_type, exc, tb):
        if self._acquirer is not None:
            return await self._acquirer.__aexit__(exc_type, exc, tb)
