#!/usr/bin/env python3
"""
Batch embedding generation for Vector Search (Phase 29).

Fetches posts, spots, solutions from Supabase, builds searchable text,
calls OpenAI text-embedding-3-small API, and upserts into embeddings table.

Usage:
    export DATABASE_URL="postgresql://..."
    export OPENAI_API_KEY="sk-..."
    python scripts/generate_embeddings.py

Requirements:
    pip install openai psycopg2-binary
"""

import os
import sys
from typing import Any

# Load .env from project root if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:
    print("Install psycopg2-binary: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

try:
    from openai import OpenAI
except ImportError:
    print("Install openai: pip install openai", file=sys.stderr)
    sys.exit(1)


BATCH_SIZE = 100
EMBEDDING_DIMENSIONS = 256
MODEL = "text-embedding-3-small"


def _safe_str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, dict):
        return " ".join(_safe_str(x) for x in v.values() if x)
    if isinstance(v, list):
        return " ".join(_safe_str(x) for x in v if x)
    return str(v).strip()


def fetch_posts(conn) -> list[tuple[str, str, str]]:
    """Returns [(entity_id, entity_type, content_text), ...]"""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, artist_name, group_name, title, context
        FROM posts
        WHERE status = 'active'
    """)
    rows = cur.fetchall()
    cur.close()

    results = []
    for (post_id, artist_name, group_name, title, context) in rows:
        parts = [
            _safe_str(artist_name),
            _safe_str(group_name),
            _safe_str(title),
            _safe_str(context),
        ]
        text = " ".join(p for p in parts if p).strip()
        if not text:
            text = str(post_id)  # fallback to avoid empty
        results.append((str(post_id), "post", text))
    return results


def fetch_spots(conn) -> list[tuple[str, str, str]]:
    """Returns [(entity_id, entity_type, content_text), ...]"""
    cur = conn.cursor()
    cur.execute("""
        SELECT sp.id, p.artist_name, p.group_name, sub.name
        FROM spots sp
        JOIN posts p ON sp.post_id = p.id
        LEFT JOIN subcategories sub ON sp.subcategory_id = sub.id
    """)
    rows = cur.fetchall()
    cur.close()

    results = []
    for (spot_id, artist_name, group_name, sub_name) in rows:
        sub_text = _safe_str(sub_name) if sub_name else ""
        parts = [_safe_str(artist_name), _safe_str(group_name), sub_text]
        text = " ".join(p for p in parts if p).strip()
        if not text:
            text = str(spot_id)
        results.append((str(spot_id), "spot", text))
    return results


def fetch_solutions(conn) -> list[tuple[str, str, str]]:
    """Returns [(entity_id, entity_type, content_text), ...]"""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, title, keywords, metadata, description
        FROM solutions
        WHERE status = 'active'
    """)
    rows = cur.fetchall()
    cur.close()

    results = []
    for (sol_id, title, keywords, metadata, description) in rows:
        parts = [_safe_str(title), _safe_str(description)]

        if keywords:
            if isinstance(keywords, list):
                parts.extend(_safe_str(k) for k in keywords)
            else:
                parts.append(_safe_str(keywords))

        if metadata and isinstance(metadata, dict):
            meta_kw = metadata.get("keywords")
            if meta_kw and isinstance(meta_kw, list):
                parts.extend(_safe_str(k) for k in meta_kw)

        text = " ".join(p for p in parts if p).strip()
        if not text:
            text = str(sol_id)
        results.append((str(sol_id), "solution", text))
    return results


def get_embeddings(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """Call OpenAI embeddings API in a single batch."""
    if not texts:
        return []

    resp = client.embeddings.create(
        model=MODEL,
        input=texts,
        dimensions=EMBEDDING_DIMENSIONS,
    )
    return [d.embedding for d in sorted(resp.data, key=lambda x: x.index)]


def format_vector(vec: list[float]) -> str:
    return "[" + ",".join(str(x) for x in vec) + "]"


def upsert_embeddings(conn, rows: list[tuple]) -> None:
    """Upsert (entity_type, entity_id, content_text, embedding)."""
    cur = conn.cursor()
    for (entity_type, entity_id, content_text, vec) in rows:
        vec_str = format_vector(vec)
        cur.execute("""
            INSERT INTO embeddings (entity_type, entity_id, content_text, embedding)
            VALUES (%s, %s::uuid, %s, %s::vector)
            ON CONFLICT (entity_type, entity_id)
            DO UPDATE SET content_text = EXCLUDED.content_text, embedding = EXCLUDED.embedding
        """, (entity_type, entity_id, content_text, vec_str))
    conn.commit()
    cur.close()


def main() -> None:
    db_url = os.environ.get("DATABASE_URL")
    api_key = os.environ.get("OPENAI_API_KEY")

    if not db_url:
        print("DATABASE_URL is required", file=sys.stderr)
        sys.exit(1)
    if not api_key:
        print("OPENAI_API_KEY is required", file=sys.stderr)
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    client = OpenAI(api_key=api_key)

    all_items: list[tuple[str, str, str]] = []
    all_items.extend(fetch_posts(conn))
    all_items.extend(fetch_spots(conn))
    all_items.extend(fetch_solutions(conn))

    total = len(all_items)
    print(f"Total items to embed: {total}")

    inserted = 0
    for i in range(0, total, BATCH_SIZE):
        batch = all_items[i : i + BATCH_SIZE]
        texts = [t[2] for t in batch]
        embeddings = get_embeddings(client, texts)

        rows = [
            (entity_type, entity_id, content_text, embeddings[j])
            for j, (entity_id, entity_type, content_text) in enumerate(batch)
        ]
        upsert_embeddings(conn, rows)
        inserted += len(rows)
        print(f"Embedded {inserted}/{total}")

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
