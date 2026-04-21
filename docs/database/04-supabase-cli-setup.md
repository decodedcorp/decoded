# Supabase CLI Setup Guide

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) (`brew install supabase/tap/supabase`)
- Docker Desktop (for `db pull`, `db diff`, `start`)

## Initial Setup

```bash
# 1. Supabase 계정 로그인
supabase login

# 2. 프로젝트 링크 (DEV 환경)
supabase link --project-ref fvxchskblyhuswzlcmql
```

> `config.toml`과 `migrations/`는 이미 커밋되어 있으므로 clone 후 위 두 명령만 실행하면 됩니다.

## Migration Strategy

> **공식 SOT 정책 (#282 이후)**: `supabase/migrations/*.sql` 이 단일 진실원천입니다.  
> 워크플로우 / 안전 체크리스트 / `SKIP_DB_MIGRATIONS` 플래그는 [`docs/DATABASE-MIGRATIONS.md`](../DATABASE-MIGRATIONS.md) 참조.

SeaORM 마이그레이션(`packages/api-server/migration/`)은 공존하지만 dev 에서는 `SKIP_DB_MIGRATIONS=1` 로 꺼져있고, prod 에서도 partial coverage 라 사실상 no-op 에 가깝습니다. 신규 스키마 변경은 `supabase/migrations/` 에만 추가하세요.

## Common Commands

### 스키마 변경 감지 및 마이그레이션 생성

```bash
# 리모트와 로컬 마이그레이션 상태 비교
supabase migration list

# 리모트 스키마 변경 감지 (Docker 필요)
supabase db diff --schema public

# 변경사항을 마이그레이션 파일로 저장
supabase db diff --schema public -f descriptive_name

# warehouse 스키마
supabase db diff --schema warehouse -f descriptive_name
```

### 마이그레이션 적용

```bash
# 리모트 DEV에 적용
supabase db push
```

### 타입 재생성

```bash
supabase gen types typescript --linked > packages/shared/src/types/supabase/types.ts
```

### 리모트 스키마 pull (Docker 필요)

```bash
supabase db pull --schema public
```

## Docker Dependency

| Docker 필요       | Docker 불필요    |
| ----------------- | ---------------- |
| `db pull`         | `migration list` |
| `db diff`         | `migration new`  |
| `start` (로컬 DB) | `db push`        |
| `db reset`        | `gen types`      |

## Environment

| 환경 | Project Ref            | 용도                    |
| ---- | ---------------------- | ----------------------- |
| DEV  | `fvxchskblyhuswzlcmql` | 개발/테스트 (기본 링크) |
| PROD | `womgfycekpzodibauiyl` | 프로덕션                |

PROD에 작업할 때는 `--project-ref womgfycekpzodibauiyl` 플래그를 명시하거나 `supabase link`로 전환합니다.
