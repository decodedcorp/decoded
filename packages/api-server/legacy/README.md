# Database Migrations — **legacy (archived)**

> 이 디렉터리는 **보관**용이다. 크레이트 이름은 `migration_legacy`이며 `cargo run -p migration_legacy`로 실행한다.  
> **활성** SeaORM 마이그레이션은 [`../migration/`](../migration/) 을 사용한다.

SeaORM 마이그레이션 및 Supabase 설정 가이드 (과거 본문)

## 마이그레이션 실행

### 1. Rust 마이그레이션 실행

```bash
# 마이그레이션 디렉토리로 이동 (legacy 크레이트)
cd legacy

# 마이그레이션 적용
cargo run -- up

# 마이그레이션 롤백
cargo run -- down

# 마이그레이션 상태 확인
cargo run -- status

# 마이그레이션 새로고침 (down → up)
cargo run -- refresh
```

### 2. Supabase SQL 스크립트 실행

Rust 마이그레이션 후, Supabase Dashboard의 SQL Editor에서 다음 파일들을 순서대로 실행하세요:

1. **Auth 트리거**: `sql/01_auth_trigger_handle_new_user.sql`
   - Supabase Auth에서 새 사용자 생성 시 자동으로 users 테이블에 레코드 생성

2. **RLS 정책**: `sql/02_rls_policy_users.sql`
   - users 테이블에 Row Level Security 정책 적용
   - 모든 사용자가 프로필 조회 가능
   - 사용자는 자신의 프로필만 수정/삭제 가능

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
