# Local Dev (#282 — Supabase Self-Hosted)

로컬 개발은 Supabase CLI 로 Postgres + Auth 를 모두 로컬에서 돌립니다. 원격 Supabase 의존 없음.

## Prereqs

```bash
brew install supabase/tap/supabase  # CLI >= 2.0
brew install just                   # Justfile 러너
# Docker Desktop 실행 중이어야 함
```

## One-command start

```bash
just dev
```

이 명령은:
1. `just local-deps` — Supabase CLI 스택 + meili/redis/searxng 기동
2. 3초 대기 후
3. `local-be & local-fe` 병렬 실행 (Ctrl+C 로 두 프로세스 동시 종료)

인프라 컨테이너는 백그라운드에 남음. 종료: `just dev-down`.

첫 실행 시 스키마 미적용 상태라면:

```bash
just dev-reset   # supabase db reset → supabase/migrations/*.sql 적용 + scripts/seed.sql
```

## Port matrix

| Service               | Host port | Notes |
|-----------------------|-----------|-------|
| Supabase Postgres     | 54322     | `postgres:postgres@localhost:54322/postgres` |
| Supabase API (Kong)   | 54321     | GoTrue / PostgREST / Storage / Realtime 게이트웨이 |
| Supabase Studio       | 54323     | UI — 유저 생성, 테이블 조회 |
| Inbucket (이메일)     | 54324     | 로컬 이메일 확인 |
| Analytics (Logflare)  | 54327     | 로컬 로그 |
| Redis                 | 6303      | Local container (internal 6379) |
| Meilisearch           | 7700      | Local container |
| SearXNG               | 4000      | Local container |
| api-server HTTP       | 8000      | Native (`bun run dev:local-be`) |
| api-server gRPC       | 50053     | Native — AI callback listener |
| ai-server HTTP        | 10000     | Native |
| ai-server gRPC        | 50052     | Native — receives jobs from api-server |
| web (Next.js)         | 3000      | Native (`bun run dev:local-fe`) |

## Justfile recipes

| Recipe | What it does |
|--------|--------------|
| `just dev` | `local-deps` → 3s wait → `local-be & local-fe` (Ctrl+C kills both) |
| `just dev-down` | Supabase + 의존 컨테이너 정지 (볼륨 유지) |
| `just dev-reset` | `supabase db reset` — 마이그레이션 재적용 + `scripts/seed.sql` |
| `just local-deps` | Supabase 스택 + 의존 컨테이너만 기동 |
| `just local-be` | api-server + ai-server native, 로그는 `.logs/local/{api,ai}.log` |
| `just local-fe` | Next.js dev server |
| `just seed [URL]` | `scripts/seed.sql` 적용 (기본: 로컬 Postgres 54322) |

## Env setup

1. 템플릿 복사:

```bash
cp .env.backend.example .env.backend.dev
cp packages/api-server/.env.dev.example packages/api-server/.env.dev
cp packages/web/.env.local.example packages/web/.env.local
```

2. Supabase CLI 기동 후 로컬 키 확인:

```bash
just local-deps          # supabase start 포함
supabase status          # anon key / service_role key / JWT secret 출력
```

3. 위 출력을 `.env.*` 파일의 `DATABASE_ANON_KEY` / `DATABASE_SERVICE_ROLE_KEY` / `DATABASE_JWT_SECRET` / `NEXT_PUBLIC_DATABASE_ANON_KEY` 에 붙여넣기.

### Primary env names

```bash
# 로컬 Supabase Postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# 로컬 GoTrue (Auth)
DATABASE_API_URL=http://localhost:54321
DATABASE_ANON_KEY=<supabase status 에서 복사>
DATABASE_SERVICE_ROLE_KEY=<supabase status 에서 복사>
DATABASE_JWT_SECRET=<supabase status 에서 복사>

# Web public (브라우저 노출)
NEXT_PUBLIC_DATABASE_API_URL=http://localhost:54321
NEXT_PUBLIC_DATABASE_ANON_KEY=<supabase status 에서 복사 (동일값)>
```

Legacy `SUPABASE_*` 이름도 fallback 으로 읽힘 (#268). 매핑은 `packages/web/lib/supabase/env.ts:ENV_ALIASES`.

## Auth flow (self-hosted)

```
Browser  ──► localhost:3000  ──► supabase-js (Auth)
                                  │
                                  ▼
                          로컬 GoTrue  http://localhost:54321/auth/v1/*
                                  │
                          JWT 발급 (로컬 JWT secret)
                                  │
                          JWT 쿠키 / localStorage 저장
                                  │
Browser  ──► localhost:3000/api/v1/*  ──► localhost:8000 (api-server)
                                           │
                                           ├─► JWT 검증 (DATABASE_JWT_SECRET, 로컬 GoTrue 값)
                                           │
                                           └─► 로컬 Postgres 조회/쓰기 (DATABASE_URL)
```

- 로그인/회원가입/이메일 확인 모두 로컬에서 닫힘. 인터넷 불필요.
- 이메일은 실제로 발송되지 않고 **Inbucket (http://localhost:54324)** 에서 확인.
- 테스트 유저 생성이 가장 빠른 경로: **Studio (http://localhost:54323) → Authentication → Add user**.
- api-server 가 JWT 에서 추출한 `sub` (UUID) 를 로컬 `public.users` 에서 룩업. 누락 시:
  - 빠른 해결: 새로 만든 Auth 유저 UUID 를 `scripts/seed.sql` 에 추가 후 `just seed`
  - 장기: api-server 미들웨어가 첫 JWT 검증 시 upsert (#267 follow-up)

## Data reset

```bash
just dev-reset
```

이 명령은:
1. `supabase db reset` 실행 → Postgres 초기화
2. `supabase/migrations/*.sql` 을 순서대로 재적용
3. `scripts/seed.sql` 실행 (카테고리·로컬 유저 stub 등)

볼륨은 유지됨. Auth 유저는 리셋되지 않음 (별도 관리).

**완전 초기화** (Auth 포함, 볼륨 제거) 가 필요한 경우:

```bash
just dev-down
supabase stop --no-backup
docker volume ls | grep supabase_ | awk '{print $2}' | xargs docker volume rm
just local-deps
just dev-reset
```

## Running migrations manually

- Supabase 마이그레이션 (SOT): `supabase db reset` 또는 `supabase migration up`
- SeaORM 마이그레이션 (api-server 내부, B.3 이후 통합 예정):

```bash
cd packages/api-server
cargo run --bin migration
```

현 시점에서는 `supabase/migrations/*.sql` 이 기준. SeaORM 마이그레이션은 api-server startup 시 자동 실행되지만 B.3 (통합 작업) 전까지는 partial coverage 임.

## Troubleshooting

- `supabase start` 실패 → `docker ps` 로 기존 `supabase_*` 컨테이너 확인, `supabase stop --no-backup` 후 재시도
- 포트 충돌 (54321/54322/54323) → `lsof -i :54321` 로 확인, `.env.backend.dev` 이전 값(5432) 참조 여부 점검
- pgvector 누락 → `psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dx"` 로 확인, 없으면 `supabase/migrations/` 의 `CREATE EXTENSION vector` 구문 적용 여부 점검
- JWT 검증 실패 → `supabase status` 의 JWT secret 과 `.env.backend.dev` 의 `DATABASE_JWT_SECRET` 일치 여부 확인
