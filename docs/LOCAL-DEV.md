# Local Dev (Path X-1)

Local development with Postgres running as a container, auth staying on remote Supabase.

## One-command start

```bash
just dev
```

This brings up infra (postgres + redis + meili + searxng) as containers, then starts api-server + ai-server + web in the same terminal. Ctrl+C stops BE/FE; run `just dev-down` to stop the containers.

If you see `DATABASE_URL` errors on the first run, the schema hasn't been built yet — start just the backend with `just local-be` once so SeaORM runs the migrator, then `just seed` to populate test data.

## Port matrix

| Service            | Host port | Notes |
|--------------------|-----------|-------|
| Postgres           | 5432      | Local container. `postgres:postgres@localhost:5432/decoded` |
| Redis              | 6303      | Local container (published from internal 6379) |
| Meilisearch        | 7700      | Local container |
| SearXNG            | 4000      | Local container |
| api-server HTTP    | 8000      | Native (bun run dev:local-be) |
| api-server gRPC    | 50053     | Native — AI callback listener |
| ai-server HTTP     | 10000     | Native |
| ai-server gRPC     | 50052     | Native — receives jobs from api-server |
| web (Next.js)      | 3000      | Native (bun run dev:local-fe) |

## Justfile recipes

| Recipe | What it does |
|--------|--------------|
| `just dev` | `local-deps` → 3s wait → `local-be & local-fe` (parallel, Ctrl+C kills both) |
| `just dev-down` | Stops infra containers (keeps volume) |
| `just dev-reset` | Drops postgres volume + restarts infra + applies `seed.sql` |
| `just local-deps` | Just the infra containers (postgres + redis + meili + searxng) |
| `just local-be` | api-server + ai-server native, logs to `.logs/local/{api,ai}.log` |
| `just local-fe` | Next.js dev server |
| `just seed [URL]` | Apply `scripts/seed.sql` to the given Postgres (defaults to local) |

## Env setup

Copy templates and fill:

```bash
cp .env.backend.example .env.backend.dev
cp packages/api-server/.env.dev.example packages/api-server/.env.dev
cp packages/web/.env.local.example packages/web/.env.local
```

Primary env names (set these for new setups):

```bash
# Postgres — local container
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/decoded

# Auth — remote Supabase project (your team's dev project)
DATABASE_API_URL=https://xxx.supabase.co
DATABASE_ANON_KEY=eyJ...
DATABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_JWT_SECRET=<from Supabase Dashboard>

# Web public (exposed to browser)
NEXT_PUBLIC_DATABASE_API_URL=https://xxx.supabase.co
NEXT_PUBLIC_DATABASE_ANON_KEY=eyJ...
```

Legacy `SUPABASE_*` names still work as a fallback during the #268 rollout — see `packages/web/lib/supabase/env.ts:ENV_ALIASES` for the full mapping.

## Auth flow (hybrid)

```
Browser  ──► localhost:3000  ──► supabase-js (auth only)
                                  │
                                  ▼
                          Remote Supabase Auth (login, JWT issuance)
                                  │
                          JWT stored in cookies / local storage
                                  │
Browser  ──► localhost:3000/api/v1/*  ──► localhost:8000 (api-server)
                                           │
                                           ├─► verifies JWT with DATABASE_JWT_SECRET
                                           │   (remote Supabase's secret)
                                           │
                                           └─► reads/writes local Postgres (DATABASE_URL)
```

- Login is **always** remote Supabase (GoTrue). Local Postgres has no auth system.
- JWT is verified locally by api-server using the JWT secret (shared with remote Supabase).
- Extracted `sub` (user UUID) is looked up in local `public.users`. If missing:
    - Workaround: put the dev team's shared Auth UUIDs into `scripts/seed.sql` and run `just seed`
    - Future: api-server middleware will upsert on first JWT verify (#267 follow-up)

## Data reset

```bash
just dev-reset
```

This:
1. Stops all infra containers
2. Drops the postgres volume (`decoded-backend_postgres-data-dev`)
3. Restarts infra
4. Runs `scripts/seed.sql`

After reset, start the backend once (`just local-be`) so the SeaORM migrator rebuilds the schema before your seed actually lands. If seed fails with "relation does not exist", that's the ordering — apply the migration first.

## Running migrations manually

```bash
cd packages/api-server
cargo run --bin migration
```

Migrations are idempotent (see `m20260501_000001_decouple_auth_users_fk.rs` for the pattern) so you can re-run against prod-like state safely.
