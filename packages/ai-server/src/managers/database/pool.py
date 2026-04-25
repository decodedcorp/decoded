"""Async Postgres connection pool manager.

Uses `asyncpg` for direct TCP access. ai-server is the primary writer for the
raw_posts pipeline and targets the **assets** Supabase project (#333), so the
pool is initialized from `ASSETS_DATABASE_URL`. Local dev falls back to
`DATABASE_URL` with a warning so onboarding is not blocked by missing cloud
assets credentials — in production (`APP_ENV=production`) the fallback is
disallowed.

Works transparently against:
- 로컬 Supabase CLI Postgres (`postgresql://postgres:postgres@localhost:54322/postgres`) (#282)
- 원격 Supabase pooler (`postgresql://postgres.<ref>:<pwd>@aws-...pooler.supabase.com:5432/postgres`)
- 클라우드 assets Supabase pooler (#333)

Pool is lazily initialized on first `pool()` call and reused for the process
lifetime.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Optional

import asyncpg


logger = logging.getLogger(__name__)


class DatabaseManager:
    """Singleton asyncpg connection pool, injected via the DI container.

    Targets the assets Supabase project (#333). Other modules (e.g. `post_editorial`)
    that still need the legacy `DATABASE_URL` should open their own connection
    rather than go through this manager.

    Usage:
        async with db_manager.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM public.raw_posts WHERE id = $1", pid)
    """

    def __init__(self, environment) -> None:
        self._env = environment
        self._pool: Optional[asyncpg.Pool] = None
        self._lock = asyncio.Lock()

    def _resolve_dsn(self) -> str:
        """Pick ASSETS_DATABASE_URL, or fall back to DATABASE_URL on non-production.

        Production: missing ASSETS_DATABASE_URL is fatal (prevents accidental writes
        to the prod DB by a misconfigured deployment).
        Local/dev: fall back to DATABASE_URL with WARN, so devs onboarding without
        cloud assets credentials can still boot.
        """
        dsn = getattr(self._env, "ASSETS_DATABASE_URL", "") or ""
        if dsn:
            return dsn
        app_env = (getattr(self._env, "APP_ENV", "") or "").lower()
        if app_env in ("production", "prod"):
            raise RuntimeError(
                "DatabaseManager: ASSETS_DATABASE_URL is required in production (#333)."
            )
        fallback = self._env.DATABASE_URL
        if not fallback:
            raise RuntimeError(
                "DatabaseManager: neither ASSETS_DATABASE_URL nor DATABASE_URL set."
            )
        logger.warning(
            "DatabaseManager: ASSETS_DATABASE_URL unset (APP_ENV=%s) — falling back to "
            "DATABASE_URL. raw_posts pipeline will write to the prod DB instead of assets.",
            app_env or "unset",
        )
        return fallback

    async def pool(self) -> asyncpg.Pool:
        """Return the shared pool, initializing it on first call."""
        if self._pool is not None:
            return self._pool
        async with self._lock:
            if self._pool is not None:
                return self._pool
            dsn = self._resolve_dsn()
            min_size = getattr(self._env, "ASSETS_DATABASE_POOL_MIN", None) or self._env.DATABASE_POOL_MIN
            max_size = getattr(self._env, "ASSETS_DATABASE_POOL_MAX", None) or self._env.DATABASE_POOL_MAX
            self._pool = await asyncpg.create_pool(
                dsn=dsn,
                min_size=min_size,
                max_size=max_size,
                # Keep queries short-lived; long transactions are not expected here.
                command_timeout=30,
            )
            logger.info(
                "DatabaseManager: assets pool initialized (min=%s, max=%s)",
                min_size,
                max_size,
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
