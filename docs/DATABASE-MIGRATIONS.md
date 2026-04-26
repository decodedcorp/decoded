# Database Migrations

**한 줄 요약**: prod/assets 두 Supabase 프로젝트(#333) 각각 자체 마이그레이션 디렉토리. prod 는 `supabase/migrations/*.sql` SOT (SeaORM 은 dev 에서 skip), assets 는 `supabase-assets/migrations/*.sql` only (SeaORM 무관).

## 현재 상태

| Supabase 프로젝트 | 마이그레이션 위치 | SeaORM 적용 여부 | 비고 |
|---|---|---|---|
| **prod** | `supabase/migrations/*.sql` (SOT) + SeaORM (`packages/api-server/migration/src/*.rs`) | dev: skip(`SKIP_DB_MIGRATIONS=1`), prod: 실행 | 두 시스템 공존, Supabase 측을 신뢰 (B.3 통합 전까지) |
| **assets** (#333) | `supabase-assets/migrations/*.sql` only | **항상 skip** (api-server 의 SeaORM 마이그레이션은 prod pool 만 대상) | 별도 cloud 프로젝트. `supabase link --project-ref <assets-ref>` 후 `supabase db push` |

prod 의 두 시스템(Supabase + SeaORM)은 같은 테이블/제약을 만들려고 해서 객체 충돌이 발생합니다. **Supabase 측을 신뢰**하고 SeaORM 쪽은 dev 에서 꺼두는 전략.

assets 는 SeaORM 을 일절 사용하지 않습니다. api-server 의 `Migrator::up` 은 prod `state.db` 에만 호출되고, assets 스키마는 SQL 파일이 단일 SOT 입니다.

## assets 워크플로우 (#333)

```bash
# 최초 1회 — cloud assets 프로젝트와 로컬 디렉토리 link
cd supabase-assets
supabase link --project-ref <assets-cloud-ref>

# 신규 마이그레이션 추가
# supabase-assets/migrations/<timestamp>_<name>.sql 작성

# cloud 적용
supabase db push
```

assets 프로젝트는 로컬 인스턴스를 띄우지 않습니다 — 로컬 개발은 cloud assets 를 공유하거나 (`ASSETS_DATABASE_URL`), 비워두면 `DATABASE_URL` 로 fallback (`APP_ENV=local` 일 때만 허용).

## dev 워크플로우 (로컬 self-hosted)

```bash
# 1) 스키마 + seed 재적용 (clean slate)
just dev-reset
#   → supabase db reset  (supabase/migrations/*.sql 순서대로 적용)
#   → scripts/local-deps-connect.sh  (네트워크 alias 재연결 — 재시작되므로 필수)
#   → just seed   (scripts/seed.sql 카테고리/유저 stub)

# 2) 스키마 변경 시
# supabase/migrations/ 에 새 파일 추가 (예: 20260501120000_add_col.sql)
# 다시 just dev-reset
```

**env 플래그**: `.env.backend.dev` / `packages/api-server/.env.dev` 에 `SKIP_DB_MIGRATIONS=1` 이 있어야 api-server 가 기동 시 SeaORM 마이그레이션을 건너뜁니다. `scripts/local-env-sync.sh` 가 자동 세팅.

## prod 워크플로우

**이 저장소에서는 관리하지 않음.** 스키마 변경은 다음 순서:

1. `supabase/migrations/` 에 새 `.sql` 파일 추가 (idempotent 하게: `IF NOT EXISTS` / `DO $$ ... $$` 블록)
2. 로컬에서 `just dev-reset` 으로 통과하는지 검증
3. PR 머지 → 배포 플랫폼 / Supabase Dashboard 가 prod 에 적용 (현 시점 수동/CI 선택은 운영팀 주도)
4. prod 에서는 `SKIP_DB_MIGRATIONS` 를 **unset** 유지 (SeaORM partial coverage 라 굳이 끌 필요 없음)

## `SKIP_DB_MIGRATIONS` 의미

`packages/api-server/src/main.rs` 가 env 로드 후 체크:

- `SKIP_DB_MIGRATIONS=1` (또는 `true`) → SeaORM `Migrator::up` 스킵, warn 로그 1줄
- unset / `0` → SeaORM 이 `seaql_migrations` 테이블 기준으로 pending 마이그레이션 적용

**어디서 켜는가:**

| env | 값 | 이유 |
|---|---|---|
| dev (로컬) | `1` | supabase/migrations 가 SOT. SeaORM 과 객체 충돌 회피 |
| staging / prod | unset | SeaORM 이 partial 이라 사실상 no-op 에 가깝고, 스키마는 supabase/migrations 기반 |

## 스키마 변경 안전 체크리스트

prod 에 영향을 줄 수 있는 마이그레이션 작성 시:

- [ ] `IF NOT EXISTS` / `IF EXISTS` 로 **idempotent** 보장
- [ ] 소유자 전환 (auth 스키마 등) 필요 시 `DO $$ BEGIN ... END $$` 로 existence 검사 후 분기 (`m20230101_000000_local_auth_stub.rs` 참고 — CREATE 권한이 없는 스키마에서 안전)
- [ ] `ALTER TABLE` 로 인한 락 시간 / 다운타임 유발 여부 평가
- [ ] 로컬 `just dev-reset` 으로 **clean install** 통과
- [ ] 기존 데이터가 있는 DB 에서 적용되는지 (가능하면 prod snapshot 으로 dry-run)

## Supabase 스키마 싱크 (Cloud → local)

원격 DEV 의 스키마가 로컬보다 앞서있을 때 sync 하는 방법 (PR #284 에서 한 번 수행):

```bash
supabase db dump --db-url "$REMOTE_URL" --schema public --schema warehouse \
  -f /tmp/remote-schema-fresh.sql

# extensions prefix 추가 (extensions.vector 등 참조 해결)
# 기존 supabase/migrations/20260409075040_remote_schema.sql 교체
# supabase db reset 으로 검증
```

## 데이터 이관 (원격 → 로컬)

`supabase_admin` role (superuser) 을 써야 `auth.*` 스키마 INSERT 가능:

```bash
pg_dump "$REMOTE_URL" --data-only --schema public --schema warehouse \
  --disable-triggers -f /tmp/data.sql
docker exec -i -e PGPASSWORD=postgres supabase_db_decoded-backend \
  psql -U supabase_admin -d postgres < /tmp/data.sql
```

auth 데이터는 별도:

```bash
pg_dump "$REMOTE_URL" --data-only -t auth.users -t auth.identities -f /tmp/auth.sql
docker exec -i -e PGPASSWORD=postgres supabase_db_decoded-backend \
  psql -U supabase_admin -d postgres < /tmp/auth.sql
```

## Future: B.3 SeaORM 통합

deferred PR: `supabase/migrations/*.sql` 을 idempotent SeaORM 마이그레이션으로 재작성하고 두 시스템을 하나로 통합. 완료되면:

- `SKIP_DB_MIGRATIONS` 플래그 삭제
- 이 문서 재작성
- prod 에서도 api-server 가 마이그레이션 실행 (또는 별도 `cargo run --bin migration`)

현 시점에는 deferred — 별도 이슈.

## 관련

- env matrix: [`docs/agent/environments.md`](agent/environments.md)
- 로컬 개발: [`LOCAL-DEV.md`](LOCAL-DEV.md)
- Rust API 규칙: [`packages/api-server/AGENT.md`](../packages/api-server/AGENT.md)
