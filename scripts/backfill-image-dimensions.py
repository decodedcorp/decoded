#!/usr/bin/env python3
"""
Backfill image_width and image_height for public.posts and public.item tables.

Usage:
    python backfill-image-dimensions.py [--dry-run] [--table {posts,item,both}] [--limit N]

Dependencies:
    pip install psycopg2-binary Pillow requests

Environment:
    DATABASE_URL  PostgreSQL connection string (required)
"""

import argparse
import io
import logging
import os
import time
from dataclasses import dataclass
from typing import Optional

import psycopg2
import psycopg2.extras
import requests
from PIL import Image, UnidentifiedImageError

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BATCH_SIZE = 100
RATE_LIMIT_MS = 50          # milliseconds between HTTP requests
MAX_RETRIES = 3
PARTIAL_READ_BYTES = 65536  # 64 KiB — enough for most image headers

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class TableConfig:
    table: str              # schema-qualified table name
    id_col: str             # primary key column
    url_col: str            # primary image URL column
    fallback_url_col: Optional[str]  # fallback column if url_col is NULL
    width_col: str
    height_col: str


TABLE_CONFIGS: dict[str, TableConfig] = {
    "posts": TableConfig(
        table="public.posts",
        id_col="id",
        url_col="image_url",
        fallback_url_col=None,
        width_col="image_width",
        height_col="image_height",
    ),
    "item": TableConfig(
        table="public.item",
        id_col="id",
        url_col="cropped_image_path",
        fallback_url_col="thumbnail_url",
        width_col="image_width",
        height_col="image_height",
    ),
}


# ---------------------------------------------------------------------------
# Image dimension extraction
# ---------------------------------------------------------------------------

def fetch_dimensions(url: str) -> Optional[tuple[int, int]]:
    """
    Returns (width, height) for the image at *url*, or None on failure.

    Tries a partial read (Range header) first; falls back to full download
    if PIL cannot decode the truncated data.
    """
    headers = {"User-Agent": "decoded-backfill/1.0"}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # --- partial read ---
            partial_headers = {**headers, "Range": f"bytes=0-{PARTIAL_READ_BYTES - 1}"}
            resp = requests.get(url, headers=partial_headers, timeout=15, stream=False)

            if resp.status_code == 404:
                log.warning("  404 for URL: %s", url)
                return None

            if resp.status_code not in (200, 206):
                log.warning("  HTTP %s for URL: %s", resp.status_code, url)
                if attempt < MAX_RETRIES:
                    time.sleep(1.0 * attempt)
                    continue
                return None

            try:
                img = Image.open(io.BytesIO(resp.content))
                return img.size  # (width, height)
            except (UnidentifiedImageError, Exception):
                pass  # fall through to full download

            # --- full download fallback ---
            resp_full = requests.get(url, headers=headers, timeout=30)
            if resp_full.status_code != 200:
                log.warning("  Full download HTTP %s for URL: %s", resp_full.status_code, url)
                return None

            img = Image.open(io.BytesIO(resp_full.content))
            return img.size

        except requests.exceptions.ConnectionError as exc:
            log.warning("  Connection error (attempt %d/%d): %s — %s", attempt, MAX_RETRIES, url, exc)
        except requests.exceptions.Timeout:
            log.warning("  Timeout (attempt %d/%d): %s", attempt, MAX_RETRIES, url)
        except (UnidentifiedImageError, Exception) as exc:
            log.warning("  Cannot decode image (attempt %d/%d): %s — %s", attempt, MAX_RETRIES, url, exc)
            return None  # no point retrying a bad image

        if attempt < MAX_RETRIES:
            time.sleep(1.0 * attempt)

    return None


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_connection(database_url: str):
    return psycopg2.connect(database_url)


def count_pending(cur, cfg: TableConfig, limit: Optional[int]) -> int:
    """Count rows that still need backfilling."""
    limit_clause = f"LIMIT {limit}" if limit else ""
    url_expr = cfg.url_col
    if cfg.fallback_url_col:
        url_expr = f"COALESCE({cfg.url_col}, {cfg.fallback_url_col})"

    cur.execute(
        f"""
        SELECT COUNT(*) FROM (
            SELECT {cfg.id_col}
            FROM {cfg.table}
            WHERE ({cfg.width_col} IS NULL OR {cfg.height_col} IS NULL)
              AND {url_expr} IS NOT NULL
              AND {url_expr} <> ''
            {limit_clause}
        ) sub
        """
    )
    return cur.fetchone()[0]


def fetch_batch(cur, cfg: TableConfig, offset: int, batch_size: int, limit: Optional[int]):
    """Fetch a batch of rows that need backfilling."""
    url_expr = cfg.url_col
    if cfg.fallback_url_col:
        url_expr = f"COALESCE({cfg.url_col}, {cfg.fallback_url_col})"

    effective_limit = batch_size
    if limit is not None:
        effective_limit = min(batch_size, max(0, limit - offset))
        if effective_limit <= 0:
            return []

    cur.execute(
        f"""
        SELECT {cfg.id_col}, {url_expr} AS resolved_url
        FROM {cfg.table}
        WHERE ({cfg.width_col} IS NULL OR {cfg.height_col} IS NULL)
          AND {url_expr} IS NOT NULL
          AND {url_expr} <> ''
        ORDER BY {cfg.id_col}
        LIMIT %s OFFSET %s
        """,
        (effective_limit, offset),
    )
    return cur.fetchall()


def apply_update(cur, cfg: TableConfig, row_id, width: int, height: int, dry_run: bool) -> None:
    if dry_run:
        log.info("  [DRY-RUN] Would update %s id=%s → width=%d height=%d", cfg.table, row_id, width, height)
        return

    cur.execute(
        f"""
        UPDATE {cfg.table}
        SET {cfg.width_col} = %s, {cfg.height_col} = %s
        WHERE {cfg.id_col} = %s
        """,
        (width, height, row_id),
    )


# ---------------------------------------------------------------------------
# Core backfill logic
# ---------------------------------------------------------------------------

def backfill_table(conn, cfg: TableConfig, dry_run: bool, limit: Optional[int]) -> dict:
    stats = {"processed": 0, "updated": 0, "skipped": 0, "errors": 0}

    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as count_cur:
        total = count_pending(count_cur, cfg, limit)

    log.info("Table %s: %d rows to backfill", cfg.table, total)
    if total == 0:
        return stats

    offset = 0
    while True:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            rows = fetch_batch(cur, cfg, offset, BATCH_SIZE, limit)

        if not rows:
            break

        for row in rows:
            row_id = row["id"] if isinstance(row, dict) else row[0]
            url = row["resolved_url"] if isinstance(row, dict) else row[1]

            stats["processed"] += 1
            log.info(
                "[%s] %d/%d — id=%s url=%.80s",
                cfg.table,
                stats["processed"],
                total,
                row_id,
                url,
            )

            dimensions = fetch_dimensions(url)

            if dimensions is None:
                log.warning("  Skipping id=%s — could not determine dimensions", row_id)
                stats["skipped"] += 1
            else:
                width, height = dimensions
                try:
                    with conn.cursor() as update_cur:
                        apply_update(update_cur, cfg, row_id, width, height, dry_run)
                    if not dry_run:
                        conn.commit()
                    stats["updated"] += 1
                except Exception as exc:
                    conn.rollback()
                    log.error("  DB error for id=%s: %s", row_id, exc)
                    stats["errors"] += 1

            # Rate limiting
            time.sleep(RATE_LIMIT_MS / 1000.0)

        offset += len(rows)

        # Respect --limit: if we've hit the limit, stop
        if limit is not None and stats["processed"] >= limit:
            break

    return stats


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill image_width/image_height for posts and item tables.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be updated without writing to the database.",
    )
    parser.add_argument(
        "--table",
        choices=["posts", "item", "both"],
        default="both",
        help="Which table to backfill (default: both).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        metavar="N",
        help="Process at most N rows per table (useful for testing).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("ERROR: DATABASE_URL environment variable is not set.")

    tables_to_run: list[str]
    if args.table == "both":
        tables_to_run = ["posts", "item"]
    else:
        tables_to_run = [args.table]

    if args.dry_run:
        log.info("=== DRY-RUN MODE — no database writes will occur ===")

    conn = get_connection(database_url)

    try:
        all_stats: dict[str, dict] = {}
        for table_key in tables_to_run:
            cfg = TABLE_CONFIGS[table_key]
            log.info("--- Starting backfill for %s ---", cfg.table)
            stats = backfill_table(conn, cfg, dry_run=args.dry_run, limit=args.limit)
            all_stats[table_key] = stats
            log.info(
                "--- Finished %s: processed=%d updated=%d skipped=%d errors=%d ---",
                cfg.table,
                stats["processed"],
                stats["updated"],
                stats["skipped"],
                stats["errors"],
            )
    finally:
        conn.close()

    log.info("=== Backfill complete ===")
    for table_key, stats in all_stats.items():
        log.info(
            "  %s: processed=%d updated=%d skipped=%d errors=%d",
            TABLE_CONFIGS[table_key].table,
            stats["processed"],
            stats["updated"],
            stats["skipped"],
            stats["errors"],
        )


if __name__ == "__main__":
    main()
