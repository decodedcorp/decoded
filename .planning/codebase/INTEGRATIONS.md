# External Integrations

**Analysis Date:** 2026-03-26 (updated 2026-04-21 for #282 self-hosted dev)

> **Env split (#282)**: dev 는 Supabase CLI **self-hosted** (port 54322, `just dev` 로 기동). prod 는 **Cloud Supabase**. 상세 endpoint matrix: [`docs/agent/environments.md`](../../docs/agent/environments.md). 마이그레이션: [`docs/DATABASE-MIGRATIONS.md`](../../docs/DATABASE-MIGRATIONS.md).

## External Services

| Service | Purpose | Auth |
|---------|---------|------|
| Supabase (PostgreSQL) | Primary DB, RLS. Dev=CLI self-hosted / Prod=Cloud | Anon key + service role key |
| Supabase Auth | OAuth (Kakao, Google, Apple). Dev=로컬 GoTrue / Prod=Cloud | Managed |
| Cloudflare R2 | Image storage (S3-compatible) | AWS SDK config |
| Meilisearch | Full-text search index | API key |
| OpenAI | LLM inference | API key |
| Groq | Fast LLM inference | API key |
| Google GenAI (Gemini) | LLM inference | API key |
| Perplexity AI | Metadata extraction | API key |
| SearXNG (self-hosted) | Private search engine | None |
| Redis | Job queue + AI caching | Password |
| Telegram Bot | AI server notifications | Bot token |
| DiceBear | Placeholder avatars | None (public) |
| picsum.photos | Dev placeholder images | None (public) |

---

## Rust Backend (`packages/api-server`)

**Framework & Runtime:**
- Axum 0.8.8 — HTTP framework
- Tokio async runtime
- utoipa 5.3 — OpenAPI spec generation (source of truth for Orval code gen)

**Database & Storage:**
- SeaORM 1.1.19 — PostgreSQL ORM (Supabase)
- aws-sdk-s3 1.119 — Cloudflare R2 via S3-compatible API

**Search:**
- Meilisearch SDK 0.32 — full-text search index

**AI / gRPC:**
- Tonic 0.14.2 — gRPC client to AI server (`packages/ai-server`)

**Caching & Scheduling:**
- moka 0.12 — in-memory cache
- tokio-cron-scheduler 0.13 — batch jobs

---

## AI Server (`packages/ai-server`)

**Framework & Runtime:**
- FastAPI 0.115 + Uvicorn 0.34
- gRPC service (grpcio 1.74) — receives calls from Rust backend

**LLM Providers:**
- OpenAI — general inference
- Groq — fast inference
- Google GenAI (Gemini) — multimodal inference
- Perplexity AI — metadata extraction and web-grounded queries

**LLM Routing Logic:**
| Input type | Provider |
|-----------|---------|
| Link | Perplexity |
| Local / YouTube | LocalLLM + SearXNG |
| Image | Perplexity |
| Text | Perplexity |

**Agent Framework:**
- LangGraph 0.3+ — multi-step agent orchestration

**Local Inference:**
- PyTorch 2.7 + Transformers 4.53

**Search:**
- SearXNG (self-hosted) — private web search used by LocalLLM routing path

**Task Queue & Notifications:**
- ARQ 0.26 — Redis-based async task queue
- python-telegram-bot 21 — push notifications for long-running AI jobs

---

## Web Frontend (`packages/web`)

### APIs & Proxy Routes

All backend calls are proxied through Next.js API routes to avoid CORS.

```
Browser → Next.js API Route (app/api/v1/*)
        ↓
        Rust Backend (${API_BASE_URL})
        ↓
Response
```

**Posts & Content:**
- `GET /api/v1/posts` — list with filtering (artist_name, group_name, category, sort, page, per_page)
- `POST /api/v1/posts` — create post with detected items and metadata
- `POST /api/v1/posts/analyze` — AI image analysis (item detection)
- `POST /api/v1/posts/extract-metadata` — structured metadata extraction
- `POST /api/v1/posts/upload` — image upload to Cloudflare R2

**Spots:**
- `GET /api/v1/spots/[spotId]` — fetch spot detail
- `PATCH /api/v1/spots/[spotId]` — update spot
- `GET /api/v1/spots/[spotId]/solutions` — list solutions for a spot
- `POST /api/v1/spots/[spotId]/solutions` — add solution to a spot

**Solutions:**
- `GET /api/v1/solutions/[solutionId]` — fetch solution detail
- `PATCH /api/v1/solutions/[solutionId]` — update solution
- `POST /api/v1/solutions/[solutionId]/adopt` — adopt a solution
- `POST /api/v1/solutions/convert-affiliate` — convert solution to affiliate link

**Users & Profiles:**
- `GET /api/v1/users/me` | `PATCH /api/v1/users/me` — current user profile
- `GET /api/v1/users/me/stats` — user statistics (posts, comments, likes_received, points, rank)
- `GET /api/v1/users/me/activities` — user activity timeline
- `GET /api/v1/users/[userId]` — public user profile

**Rankings & Badges:**
- `GET /api/v1/rankings` — global rankings
- `GET /api/v1/rankings/me` — current user ranking position
- `GET /api/v1/badges` — all badge definitions
- `GET /api/v1/badges/me` — current user badges

**VTON (Virtual Try-On):**
- `POST /api/v1/vton` — run virtual try-on
- `GET /api/v1/vton/items` — list VTON items

**Categories:**
- `GET /api/v1/categories` — all item categories with localized names

**Post Magazines:**
- `GET /api/v1/post-magazines/[id]` — editorial magazine detail

**Events:**
- `POST /api/v1/events` — behavioral analytics event ingestion

**Admin:**
- `GET /api/v1/admin/dashboard/stats` — dashboard KPI stats
- `GET /api/v1/admin/dashboard/chart` — dashboard chart data
- `GET /api/v1/admin/dashboard/today` — today's snapshot
- `GET /api/v1/admin/ai-cost/kpi` — AI cost KPIs
- `GET /api/v1/admin/ai-cost/chart` — AI cost chart
- `GET /api/v1/admin/audit` — audit log
- `GET /api/v1/admin/pipeline` — pipeline status
- `GET /api/v1/admin/server-logs` — server log entries
- `GET /api/v1/admin/server-logs/stream` — live log stream (SSE)

### Generated API Client

- Generator: Orval 8.5.3 — config at `packages/web/orval.config.ts`
- Source: `packages/api-server/openapi.json` (generated by utoipa in Rust backend)
- Output: `packages/web/lib/api/generated/` (gitignored — always regenerated locally)
- Zod schemas: `lib/api/generated/zod/decodedApi.zod.ts`
- Regenerate command: `cd packages/web && bun run generate:api`
- Extend behavior: edit `lib/api/mutator/custom-instance.ts` or `orval.config.ts`, never generated files
- Upload endpoints (4 multipart POST) are excluded from generation — see `orval.config.ts` transformer

### Data Storage

**Supabase (PostgreSQL):**
- Project URL: `NEXT_PUBLIC_SUPABASE_URL`
- Public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (limited permissions)
- Admin key: `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Client: @supabase/supabase-js 2.86.0
- Type definitions: `lib/supabase/types.ts` (generated Database types)
- Query patterns:
  - Server: `lib/supabase/queries/*.server.ts` via `createSupabaseServerClient()`
  - Client: `lib/supabase/queries/*.ts` via `supabaseBrowserClient`

**Cloudflare R2:**
- Domain pattern: `**.r2.dev` (allowed in `next.config.js`)
- Purpose: post images, user uploads

**Caching:**
- TanStack Query (React Query): server state caching for API responses
- Next.js fetch with `revalidate: 60` for server-side queries (ISR)

### Authentication

**Provider:** Supabase Auth (PostgreSQL-backed)
- OAuth: Google, Apple, Kakao
- Store: `useAuthStore` in `lib/stores/authStore.ts` (Zustand)
- Browser client: `supabaseBrowserClient` from `lib/supabase/client.ts`
- Server client: `createSupabaseServerClient()` from `lib/supabase/server.ts`
- JWT extraction: `getAuthToken()` in `lib/api/client.ts`
- Token injection: `Authorization: Bearer {token}` header
- Session management: cookie-based via @supabase/auth-helpers-nextjs

---

## Environment Configuration

**Public Variables (Browser-Accessible):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key (limited permissions)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — secondary publishable key
- `NEXT_PUBLIC_API_BASE_URL` — optional client API override (defaults to empty for proxy mode)
- `NEXT_PUBLIC_USE_MOCK_SEARCH` — enable mock search data (boolean, defaults false)

**Server-Only Variables:**
- `API_BASE_URL` — Rust backend base URL (required for proxy routes), e.g. `https://dev.decoded.style`
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key (never expose to browser)

**Secrets Location:**
- Development: `.env.local` (gitignored, see `.env.local.example`)
- Production: Environment variables in hosting platform (Vercel dashboard, etc.)

---

## Development Commands

```bash
bun run dev              # all packages via Turborepo
bun run dev:web          # Next.js frontend only
bun run dev:api-server   # Rust backend (cargo watch)
bun run dev:ai-server    # Python AI server (uv run python)
bun run dev:local-deps   # Docker (Meilisearch, Redis, SearXNG, etc.)
bun run generate:api     # regenerate Orval API client from openapi.json
```

---

## Monitoring & Observability

**Error Tracking:** Not configured

**Logs:**
- Console logging for development (`NODE_ENV === "development"` checks)
- Server-side error logging in proxy routes via `console.error()`
- Admin SSE endpoint (`/admin/server-logs/stream`) for live Rust backend logs
- Telegram Bot notifications for AI server job results
- No centralized logging service

---

## CI/CD & Deployment

**Hosting:** Vercel (inferred from Next.js App Router usage)

**CI Pipeline:** Not detected in repository (no GitHub Actions, GitLab CI, etc.)

---

## External Image Services

**Development / Mock Data:**
- `picsum.photos` — placeholder images for UI testing (allowed in `next.config.js`)
- `api.dicebear.com` — generated profile avatars; style: Avataaars (allowed in `next.config.js`)

---

*Integration audit: 2026-03-26*
