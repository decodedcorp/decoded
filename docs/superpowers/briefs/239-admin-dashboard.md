# Brief — #239 admin dashboard unbounded row fetch

**브랜치**: `perf/239-admin-dashboard-rpc`
**워크트리**: `.worktrees/239-admin-dashboard` (PORT=3005)
**작성일**: 2026-04-17 (operator 세션에서 사전 분석)
**우선순위**: `priority: high` — 프로덕션 지표 silent truncation
**다음 단계**: Superpowers `brainstorming` → `writing-plans` → TDD 구현

## 이슈 요약

`packages/web/lib/api/admin/dashboard.ts`에서 unbounded `.select()` 때문에 Supabase의 1000 row cap에 걸려 차트/MAU 지표가 silently 잘못 계산됨. 프로덕션 트래픽에선 OOM 리스크까지.

## 영향 범위 (단일 파일 + SQL)

**hotspot A — `fetchDashboardStats` (L88-124)**

```ts
supabase.from("user_events").select("user_id").gte("created_at", today.toISOString())
supabase.from("user_events").select("user_id").gte("created_at", thirtyDaysAgo.toISOString())
// … prevDAU, prevMAU 동일 패턴 × 4회
```

→ L126-129에서 JS `Set`으로 dedupe. 1000 row cap에 걸리면 MAU가 silently 낮게 표시.

**hotspot B — `fetchChartData` (L165-197)**

```ts
supabase.from("view_logs").select("created_at").gte("created_at", sinceIso)
supabase.from("click_logs").select("created_at").gte("created_at", sinceIso)
supabase.from("search_logs").select("created_at").gte("created_at", sinceIso)
supabase.from("user_events").select("created_at, user_id").gte("created_at", sinceIso)
```

→ 최대 90일 × 4 테이블 fetch. OOM 리스크.

## 접근법 (이슈 제안 + 보강)

**권장 — RPC 2개 신설**

1. `admin_distinct_user_count(from_ts, to_ts)` → `COUNT(DISTINCT user_id)` 1 row 반환
2. `admin_daily_metrics(from_ts, to_ts)` → `date_trunc('day', created_at)` GROUP BY로 일당 1 row:
   ```sql
   SELECT
     date_trunc('day', created_at)::date AS day,
     table_source,  -- 'view' | 'click' | 'search' | 'event'
     count(*) AS events,
     count(DISTINCT user_id) FILTER (WHERE table_source='event') AS unique_users
   FROM (
     SELECT created_at, NULL::uuid AS user_id, 'view' AS table_source FROM view_logs
     UNION ALL
     SELECT created_at, NULL, 'click' FROM click_logs
     UNION ALL
     SELECT created_at, NULL, 'search' FROM search_logs
     UNION ALL
     SELECT created_at, user_id, 'event' FROM user_events
   ) t
   WHERE created_at >= from_ts
   GROUP BY 1, 2;
   ```

**RLS/권한**: admin role만 실행 가능하도록 `REVOKE ... FROM anon, authenticated; GRANT ... TO service_role;` (PR #246에서 확립한 패턴 참고)

**대안 — 임시 완화 (RPC 미흡 시)**: `.limit(50000)` + 도달 시 경고 로깅. RPC가 정답.

## 수정 파일

1. `supabase/migrations/20260417_admin_dashboard_rpcs.sql` (신규)
2. `packages/web/lib/api/admin/dashboard.ts` — JS 집계 제거, RPC 호출로 교체
3. `packages/web/lib/api/admin/dashboard.test.ts`? — 기존 테스트 확인

## 검증 체크리스트

- [ ] 로컬 Supabase에 마이그레이션 적용 (`bun run db:migrate:local` 또는 동등 명령)
- [ ] RPC 결과가 기존 JS 집계와 일치 (소량 데이터셋)
- [ ] localhost:3005 admin 대시보드 렌더 확인
- [ ] anon/authenticated 역할로 RPC 호출 시 403 확인
- [ ] `bun run lint` + `bunx tsc --noEmit` 통과
- [ ] PRD 적용 시 유의사항 문서화 (memory: `db-migration-sync` 참고)

## 참고 파일 & 메모리

- `packages/web/lib/api/admin/audit-log.ts` — warehouse 스키마 접근 패턴 예시
- Memory: `[DB migration strategy]` — Supabase CLI로 RPC/RLS 관리
- Memory: `[Supabase typegen]` — 마이그레이션 후 types.ts 재생성 필요
- 관련 이슈 #246 — anon EXECUTE revoke 패턴 (PR #246)

## Operator와 조율할 항목

- RPC 네이밍 컨벤션 확인 (`admin_*` 프리픽스가 기존 함수와 충돌 없는지)
- warehouse 스키마에 둘지 public에 둘지 (SECURITY DEFINER 선택)

## Coordination

- 다른 워크트리와 파일 겹침 없음
- 마이그레이션 충돌 가능성: #237이 admin_audit_log 확장 시 — 타임스탬프로 분리
