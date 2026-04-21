# Database Migrations (active)

**supabase-dev** 스키마에 맞춰 새로 추가하는 SeaORM 마이그레이션만 둔다.

**주의**: 이미 `seaql_migrations`가 채워진 기존 DB에 연결할 때는, 첫 마이그레이션부터 스키마와 충돌하지 않게 작성해야 한다. 완전히 빈 DB(greenfield)에 맞추는 것이 목표다.

- 과거 전체 마이그레이션 소스: [`../legacy/`](../legacy/) (보관, 크레이트 이름 `migration_legacy`)
- Supabase CLI SQL: [`../../supabase/migrations/`](../../supabase/migrations/)
- 에이전트 규칙: [`../AGENT.md`](../AGENT.md) §2.4

## 실행

```bash
cd packages/api-server/migration
cargo run -- up
```

## Entity 생성

스키마 반영 후 (기존과 동일):

```bash
cd ..
sea-orm-cli generate entity \
  --database-url "$DATABASE_URL" \
  --output-dir src/entities \
  --with-serde both
```
