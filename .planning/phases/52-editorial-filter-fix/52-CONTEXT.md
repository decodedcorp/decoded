# Phase 52: Editorial Filter Fix - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

`/editorial` 페이지가 매거진 연결 포스트만 표시하도록 Supabase 필터를 활성화하고, `has_magazine` 파라미터를 OpenAPI spec에 추가하여 타입 안전한 필터링 지원. `/explore`는 영향 없음.

</domain>

<decisions>
## Implementation Decisions

### Supabase Filter Column
- `post_magazine_id IS NOT NULL` 사용 (Phase 51 리서치 확정)
- **주의:** ROADMAP의 success criteria에 `post_magazine_title`이 언급되지만 이는 DB 컬럼이 아님. 실제 DB 컬럼은 `post_magazine_id`
- `useInfinitePosts`의 `// Note: hasMagazine filter not yet supported` 주석 위치에 필터 추가
- 필터 코드: `.not("post_magazine_id", "is", null)` — `hasMagazine`이 true일 때만 적용

### OpenAPI Spec Update
- Rust 백엔드 `packages/api-server/src/domains/posts/` 핸들러에 `has_magazine` query parameter 추가
- `utoipa`로 OpenAPI spec 자동 생성 후 `openapi.json` 업데이트
- `bun run generate:api`로 Orval 재생성 → `ListPostsParams`에 `has_magazine` 필드 추가

### Scope Constraints
- `/explore` 페이지는 영향 없음 — `hasMagazine` 기본값 `false`
- Supabase 직접 쿼리 유지 (리스트는 REST 마이그레이션 대상 아님, REQUIREMENTS.md Out of Scope)
- Orval 생성 파일은 gitignored — `.gitkeep`만 추적

### Claude's Discretion
- Rust 핸들러의 정확한 파라미터 바인딩 방식
- Orval 재생성 후 타입 확인 방법
- 필터 적용 시 Supabase query builder 체이닝 순서

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Filter implementation
- `packages/web/lib/hooks/useImages.ts` §159-224 — `useInfinitePosts` hook, line 204에 TODO 주석
- `packages/web/app/editorial/page.tsx` — Editorial 페이지 (ExploreClient에 hasMagazine 전달)
- `packages/web/app/explore/ExploreClient.tsx` — ExploreClient, hasMagazine prop 처리

### Backend API
- `packages/api-server/openapi.json` — 현재 OpenAPI spec (has_magazine 파라미터 없음)
- `packages/api-server/src/domains/posts/` — Rust 포스트 핸들러/서비스
- `packages/web/orval.config.ts` — Orval 코드 생성 설정

### Requirements
- `.planning/REQUIREMENTS.md` — FILT-01 (hasMagazine Supabase 필터), FILT-02 (OpenAPI has_magazine 파라미터)
- `.planning/ROADMAP.md` §Phase 52 — Success criteria 4개 항목

### Phase 51 findings
- `.planning/phases/51-data-validation-gate/51-VALIDATION-REPORT.md` — 169개 editorial posts 확인, post_magazine_id가 올바른 DB 컬럼
- `.planning/phases/51-data-validation-gate/51-RESEARCH.md` — post_magazine_title은 DB 컬럼 아님 (Rust 서비스 레이어 batch join)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useInfinitePosts` hook — 이미 `hasMagazine` 파라미터 수용, query key에 포함, 필터 로직만 누락
- `ExploreClient` — 이미 `hasMagazine` prop으로 editorial/explore 분기
- `editorial/page.tsx` — 이미 `<ExploreClient hasMagazine />` 호출

### Established Patterns
- Supabase query builder 체이닝: `.eq()`, `.not()`, `.ilike()` 패턴 사용 (useImages.ts:195-203)
- Orval 코드 생성: `bun run generate:api` → `lib/api/generated/` (gitignored)
- OpenAPI → utoipa (Rust) → openapi.json → Orval → TypeScript types

### Integration Points
- `useInfinitePosts` 변경은 `ExploreClient`를 통해 `/explore`와 `/editorial` 모두에 영향
- `hasMagazine: false` (기본값)일 때 `/explore`는 기존과 동일해야 함
- OpenAPI 변경 후 Orval 재생성 필요

</code_context>

<specifics>
## Specific Ideas

No specific requirements — implementation path is clear from existing code patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 52-editorial-filter-fix*
*Context gathered: 2026-04-01*
