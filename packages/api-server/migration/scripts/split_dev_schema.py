#!/usr/bin/env python3
"""
Split repo-root dev-schema-*.sql into SeaORM sql/*.sql and supabase/migrations/20260421*.sql.
Run from repo root: python3 packages/api-server/migration/scripts/split_dev_schema.py
"""
from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
DUMP = REPO_ROOT / "dev-schema-20260421.sql"
MIG_SQL = REPO_ROOT / "packages/api-server/migration/sql"
SUPABASE_MIG = REPO_ROOT / "supabase/migrations"

TRIGGER_FN_NAMES = frozenset(
    {
        "update_updated_at_column",
        "set_updated_at",
        "touch_updated_at",
    }
)


def strip_restrict(lines: list[str]) -> list[str]:
    out: list[str] = []
    for line in lines:
        s = line.strip()
        if s.startswith("\\restrict") or s.startswith("\\unrestrict"):
            continue
        out.append(line)
    return out


def parse_header(first_line: str) -> tuple[str, str, str]:
    """Return (name_field, type_field, schema_field)."""
    m = re.match(
        r"-- Name: (?P<name>.+?); Type: (?P<type>[^;]+); Schema: (?P<schema>[^;]+);",
        first_line.strip(),
    )
    if not m:
        return ("", "", "")
    return (m.group("name"), m.group("type").strip(), m.group("schema").strip())


def is_trigger_helper_function(block_text: str, name_field: str) -> bool:
    if not name_field:
        return False
    base = name_field.split("(")[0].strip()
    if base in TRIGGER_FN_NAMES:
        return True
    if "CREATE FUNCTION public.update_updated_at_column" in block_text:
        return True
    if "CREATE FUNCTION warehouse.set_updated_at" in block_text:
        return True
    if "CREATE FUNCTION warehouse.touch_updated_at" in block_text:
        return True
    return False


def main() -> None:
    if not DUMP.is_file():
        raise SystemExit(f"missing dump: {DUMP}")

    lines = strip_restrict(DUMP.read_text(encoding="utf-8").splitlines(keepends=True))

    starts: list[int] = []
    for i, line in enumerate(lines):
        if line.startswith("-- Name: "):
            starts.append(i)

    blocks: list[str] = []
    for j, start in enumerate(starts):
        end = starts[j + 1] if j + 1 < len(starts) else len(lines)
        blocks.append("".join(lines[start:end]))

    buckets: dict[str, list[str]] = {
        "002_warehouse_types": [],
        "003_public_tables": [],
        "004_warehouse_tables": [],
        "005_views": [],
        "006_indexes_and_constraints": [],
        "007_triggers_ddl": [],
        "supabase_functions": [],
        "supabase_rls": [],
    }

    # Preamble SETs before first table (after functions in dump): lines between first TABLE and previous
    # Lines after search_similar function, before first public TABLE (SET default_tablespace / heap).
    preamble_table_setup = "".join(lines[234:238])

    for b in blocks:
        first = b.splitlines()[0] if b else ""
        name_f, typ, schema_f = parse_header(first)

        if typ == "SCHEMA" and "warehouse" in first and "public" not in first.split("Type:")[0]:
            buckets["002_warehouse_types"].append(b)
            continue
        if typ == "TYPE":
            buckets["002_warehouse_types"].append(b)
            continue

        if typ == "TABLE":
            if "seaql_migrations" in first and "Type: TABLE" in first:
                continue
            if schema_f == "public":
                buckets["003_public_tables"].append(b)
            elif schema_f == "warehouse":
                buckets["004_warehouse_tables"].append(b)
            continue

        if typ == "VIEW":
            buckets["005_views"].append(b)
            continue

        if typ == "INDEX":
            buckets["006_indexes_and_constraints"].append(b)
            continue

        if typ == "CONSTRAINT" or typ == "FK CONSTRAINT":
            if "seaql_migrations" in first:
                continue
            buckets["006_indexes_and_constraints"].append(b)
            continue

        if typ == "TRIGGER":
            buckets["007_triggers_ddl"].append(b)
            continue

        if typ == "FUNCTION":
            if is_trigger_helper_function(b, name_f):
                buckets["007_triggers_ddl"].append(b)
            else:
                buckets["supabase_functions"].append(b)
            continue

        if typ == "COMMENT":
            if "FUNCTION" in first and "handle_new_user" in first:
                buckets["supabase_functions"].append(b)
                continue
            if "COLUMN" in first or "TABLE" in first:
                if schema_f == "public":
                    buckets["003_public_tables"].append(b)
                elif schema_f == "warehouse":
                    buckets["004_warehouse_tables"].append(b)
                continue
            if "SCHEMA" in first:
                continue
            continue

        if typ == "POLICY":
            if "seaql_migrations" in first:
                continue
            buckets["supabase_rls"].append(b)
            continue

        if typ == "ROW SECURITY":
            if "seaql_migrations" in first:
                continue
            buckets["supabase_rls"].append(b)
            continue

        # ignore SCHEMA public, COMMENT ON SCHEMA, etc.

    MIG_SQL.mkdir(parents=True, exist_ok=True)
    SUPABASE_MIG.mkdir(parents=True, exist_ok=True)

    ext = """-- Baseline: extensions required by dev schema (not in pg_dump --schema-only).
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
"""
    (MIG_SQL / "001_enable_extensions.sql").write_text(ext, encoding="utf-8")

    def write_bucket(rel: str, parts: list[str], prefix: str = "") -> None:
        body = prefix + "\n".join(parts)
        (MIG_SQL / rel).write_text(body, encoding="utf-8")

    write_bucket(
        "002_warehouse_types.sql",
        buckets["002_warehouse_types"],
        "-- warehouse schema + enum types\n\n",
    )

    write_bucket(
        "003_public_tables.sql",
        buckets["003_public_tables"],
        "CREATE SCHEMA IF NOT EXISTS public;\n"
        + "COMMENT ON SCHEMA public IS 'standard public schema';\n\n"
        + preamble_table_setup
        + "\n",
    )

    write_bucket(
        "004_warehouse_tables.sql",
        buckets["004_warehouse_tables"],
        "-- warehouse tables\n\n",
    )

    write_bucket("005_views.sql", buckets["005_views"], "-- views\n\n")

    write_bucket(
        "006_indexes_and_constraints.sql",
        buckets["006_indexes_and_constraints"],
        "-- PK, UNIQUE, indexes, FKs (reordered: indexes+FK after tables; triggers excluded)\n\n",
    )

    trig = buckets["007_triggers_ddl"]
    # Ensure trigger functions appear before CREATE TRIGGER lines
    trig_sorted = sorted(
        trig,
        key=lambda s: (
            0 if "CREATE FUNCTION" in s else 1,
            s,
        ),
    )
    write_bucket(
        "007_triggers_ddl.sql",
        trig_sorted,
        "SET check_function_bodies = false;\n\n",
    )

    supa_fn = (
        "SET check_function_bodies = false;\n"
        "SET client_min_messages = warning;\n\n"
        + "".join(buckets["supabase_functions"])
    )
    (SUPABASE_MIG / "20260421100000_baseline_functions.sql").write_text(
        supa_fn, encoding="utf-8"
    )

    auth_trig = """-- Auth trigger (not present in schema-only dump; pairs with public.handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
"""
    (SUPABASE_MIG / "20260421110000_baseline_triggers_auth.sql").write_text(
        auth_trig, encoding="utf-8"
    )

    (SUPABASE_MIG / "20260421120000_baseline_rls.sql").write_text(
        "".join(buckets["supabase_rls"]),
        encoding="utf-8",
    )

    print("Wrote:", MIG_SQL / "001_enable_extensions.sql", "… 007_triggers_ddl.sql")
    print("Wrote:", SUPABASE_MIG / "20260421100000_baseline_functions.sql")
    print("Wrote:", SUPABASE_MIG / "20260421110000_baseline_triggers_auth.sql")
    print("Wrote:", SUPABASE_MIG / "20260421120000_baseline_rls.sql")


if __name__ == "__main__":
    main()
