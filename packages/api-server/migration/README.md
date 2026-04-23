# SeaORM Migrations (공존 / 레거시)

> ⚠️ **SOT 아님**: #282 이후 저장소의 DB 마이그레이션 단일 진실원천은 [`supabase/migrations/*.sql`](../../../supabase/migrations/) 입니다. 워크플로우는 [`docs/DATABASE-MIGRATIONS.md`](../../../docs/DATABASE-MIGRATIONS.md) 참조.
>
> 이 디렉토리는 SeaORM 마이그레이션을 유지하지만 dev 에서는 `SKIP_DB_MIGRATIONS=1` 로 꺼져 있습니다. 신규 스키마 변경은 `supabase/migrations/` 에 추가하세요. B.3 통합 PR 에서 이 디렉토리는 재작성 또는 제거 예정.

## 언제 이 디렉토리를 건드리는가

- SeaORM 마이그레이션 목록을 supabase/migrations 와 mirror 해 두고 싶을 때 (로컬 plain Postgres 호환 보조 용도)
- prod 에서 `SKIP_DB_MIGRATIONS` 를 unset 유지하기 때문에, SQL 과 동등한 idempotent SeaORM 정의를 유지할 때
- **신규 테이블/컬럼 스키마 자체**는 여기 추가하지 말 것 — supabase/migrations 에 추가

## 마이그레이션 실행 (로컬 plain Postgres 에서만)

```bash
cd migration

cargo run -- up        # 적용
cargo run -- down      # 롤백
cargo run -- status    # 상태
cargo run -- refresh   # down → up
```

> `just dev` 가 기본 로컬 경로이며 Supabase self-hosted + `supabase db reset` 으로 `supabase/migrations/` 를 적용합니다. 위 cargo 명령은 SeaORM 동기화 디버깅 용도로만 쓰세요.

## `sql/` 레거시 스크립트 (historical reference)

`sql/01_auth_trigger_handle_new_user.sql`, `sql/02_rls_policy_users.sql`, `sql/03_rls_policy_posts.sql` 은 #202 이전의 수동 적용 스크립트입니다. 현재 이 내용은 `supabase/migrations/20260409075040_remote_schema.sql` 스냅샷에 흡수되어 dev/prod 양쪽에 이미 반영돼 있습니다. **새 마이그레이션은 여기 추가하지 말 것.**

## 마이그레이션 목록

### m20240101_000001_create_users

- users 테이블 생성
- auth.users 외래키 참조 (CASCADE DELETE)
- updated_at 자동 업데이트 트리거
- 인덱스: email, username, rank

## Entity 생성

마이그레이션 실행 후 SeaORM Entity를 생성합니다:

```bash
# 프로젝트 루트로 이동
cd ..

# entity 디렉토리 생성 (없는 경우)
mkdir -p src/entities

# Entity 생성
sea-orm-cli generate entity \
  --database-url "$DATABASE_URL" \
  --output-dir src/entities \
  --with-serde both
```

## 참고

- [SeaORM Migration 문서](https://www.sea-ql.org/SeaORM/docs/migration/writing-migration/)
- [Supabase RLS 문서](https://supabase.com/docs/guides/auth/row-level-security)
