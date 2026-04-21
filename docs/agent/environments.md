---
title: Environments — Agent Reference
owner: human
status: approved
updated: 2026-04-21
tags: [agent, harness, ops, db]
---

# Environments — Agent Reference

**한 줄 요약**: dev 는 Supabase CLI 로 로컬 self-hosted, prod 는 Cloud Supabase. staging 은 현재 정의되지 않음.

이 문서는 env-sensitive 코드를 작성/리뷰하는 agent 가 **가장 먼저 참조**할 SSOT 입니다. 값은 `.env.*.example` 과 `supabase/config.toml` 이 최종 사실이며, 본 표는 그것들을 요약합니다.

## 의사결정 플로우 (agent)

env-sensitive 코드를 만지기 전:

1. 이 코드가 어느 env 에서 돌아야 하는가? (dev / prod / 양쪽)
2. 아래 matrix 로 해당 env 의 endpoint / 키 경로 확인
3. 값을 **코드에 하드코드하지 말 것** — `env_primary_or_legacy` (api-server) 또는 `getEnvWithAlias` (web) 같은 기존 헬퍼 경유
4. 마이그레이션 관련이면 → [`docs/DATABASE-MIGRATIONS.md`](../DATABASE-MIGRATIONS.md)

## Env Matrix

| 항목 | **dev** (로컬) | **staging** | **prod** |
|---|---|---|---|
| Supabase 모드 | **Self-hosted** (Supabase CLI) | **TBD — 현재 없음** ([staging.md](staging.md)) | **Cloud Supabase** |
| 기동 방법 | `just dev` (`supabase start` + app 서버) | n/a | 배포 플랫폼 (Vercel / Fly 등) |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:54322/postgres` | n/a | Cloud pooler URL (예: `postgresql://postgres.<ref>:<pw>@aws-...pooler.supabase.com:5432/postgres`) |
| `DATABASE_API_URL` (GoTrue) | `http://127.0.0.1:54321` | n/a | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_DATABASE_API_URL` | `http://127.0.0.1:54321` | n/a | `https://<ref>.supabase.co` |
| `DATABASE_ANON_KEY` / `DATABASE_SERVICE_ROLE_KEY` / `DATABASE_JWT_SECRET` | `supabase status -o env` 출력값 | n/a | Supabase Dashboard > Settings > API |
| JWT 서명 알고리즘 | **ES256** (로컬 GoTrue JWKS) | n/a | Cloud GoTrue JWKS (ES256 또는 RS256) |
| **`SKIP_DB_MIGRATIONS`** | **`1`** (supabase/migrations 가 SOT) | unset | unset (현 시점) |
| Storage (이미지 등) | **Cloudflare R2** (`R2_BUCKET_NAME=dev`) | n/a | Cloudflare R2 (`R2_BUCKET_NAME=prod` 등) |
| Meilisearch | `http://localhost:7700` (Docker) | n/a | Managed Meilisearch 또는 self-hosted |
| Redis | `localhost:6303` (Docker) | n/a | Managed Redis |
| SearXNG | `http://localhost:4000` (Docker) | n/a | self-hosted SearXNG |
| ai-server gRPC (api→ai) | `http://localhost:50052` | n/a | in-cluster 내부 endpoint |
| api-server gRPC (ai→api) | `http://localhost:50053` | n/a | in-cluster 내부 endpoint |

Legacy `SUPABASE_*` 이름(예: `SUPABASE_URL`, `SUPABASE_ANON_KEY`)은 `DATABASE_*` 로 rename 된 상태이며 (#268), fallback 으로 계속 읽힙니다. **신규 코드는 `DATABASE_*` 만 사용.**

## Env 파일 매핑

| 파일 | 용도 | 관리 위치 |
|---|---|---|
| `.env.backend.example` | 템플릿 (dev 기본값으로 작성, prod 은 주석으로 안내) | 저장소 |
| `.env.backend.dev` | dev 로컬 실제 값 | 개발자 로컬 (gitignored) |
| `.env.backend.staging` | — | 현재 없음 |
| `.env.backend.prod` | — | 저장소 외부 (배포 플랫폼에서 주입) |
| `packages/api-server/.env.example` | Rust API 템플릿 | 저장소 |
| `packages/api-server/.env.dev.example` | dev 로컬 템플릿 (`SKIP_DB_MIGRATIONS=1` 포함) | 저장소 |
| `packages/api-server/.env.dev` | dev 로컬 실제 값 | 개발자 로컬 (gitignored) |
| `packages/web/.env.local.example` | Next.js dev 템플릿 | 저장소 |
| `packages/web/.env.local` | dev 로컬 실제 값 | 개발자 로컬 (gitignored) |

**자동 셋업**: `just dev` (또는 `just local-env-sync`) 가 `supabase status -o env` 결과를 dev 파일 3개에 주입합니다. `scripts/local-env-sync.sh` 참조. 개인 secret (OPENAI / R2 / Rakuten 등)은 allowlist 밖이라 건드리지 않음.

## Env-sensitive 코드 작성 지침 (agent)

- **api-server (Rust)**: `packages/api-server/src/config.rs` 의 `env_primary_or_legacy("DATABASE_*", "SUPABASE_*")` 헬퍼 사용. 신규 키 추가 시 동일 패턴으로.
- **web (Next.js)**: `packages/web/lib/supabase/env.ts` 의 `getEnvWithAlias()` 사용. 브라우저 노출 키는 `NEXT_PUBLIC_` prefix.
- **ai-server (Python)**: `packages/ai-server/src/post_editorial/config.py` 의 primary/legacy fallback 패턴.

## 관련 문서

- 로컬 개발 상세: [`docs/LOCAL-DEV.md`](../LOCAL-DEV.md)
- 포트·명령어 표: [`monorepo.md`](monorepo.md)
- 마이그레이션 SOT: [`docs/DATABASE-MIGRATIONS.md`](../DATABASE-MIGRATIONS.md)
- staging 정의: [`staging.md`](staging.md)
- Rust API 전용 규칙: [`packages/api-server/AGENT.md`](../../packages/api-server/AGENT.md)
