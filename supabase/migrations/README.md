# Supabase CLI migrations (active)

**supabase-dev** 기준으로 새로 추가하는 SQL만 둔다.

- 과거 스냅샷·incremental 전체: [`../legacy/`](../legacy/)
- SeaORM 활성 트랙: [`../../packages/api-server/migration/`](../../packages/api-server/migration/)
- 에이전트 역할 구분: [`../../packages/api-server/AGENT.md`](../../packages/api-server/AGENT.md) §2.4

## 적용

```bash
# 프로젝트 링크 후
supabase db push
```
