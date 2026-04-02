# Phase 49: Tries Tab Frontend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

TriesGrid를 Orval 생성 hook 기반 무한스크롤로 리라이트하고 스텁 코드를 완전 제거한다.

</domain>

<decisions>
## Implementation Decisions

### Type Migration
- `TryResult` 인터페이스 삭제 → Orval 생성 `TryItem` 타입 import
- `result_image_url` → `image_url` (Phase 48에서 백엔드 스키마에 맞춤)
- `item_count` 필드 제거 (백엔드 TryItem에 없음)
- `source_post_id` 제거 (백엔드 TryItem에 없음)

### Data Fetching
- `fetchMyTries` 스텁 함수 완전 삭제
- `useGetMyTries` (Orval 생성) 기반 useInfiniteQuery 패턴 적용
- page/per_page 쿼리 파라미터 사용, per_page=20 기본

### UI States
- 로딩: 기존 스켈레톤 그리드 유지 (4개 플레이스홀더)
- 빈 상태: 기존 UI 유지 (Sparkles 아이콘 + "No try-on results yet")
- 에러: 간단한 에러 메시지 ("Failed to load tries" + retry 버튼)
- 무한스크롤: IntersectionObserver 기반 자동 로드

### Claude's Discretion
- IntersectionObserver vs react-intersection-observer 라이브러리
- 카드 UI 레이아웃 미세 조정 (item_count 제거 후 오버레이 구성)

</decisions>

<canonical_refs>
## Canonical References

### Frontend Components
- `packages/web/lib/components/profile/TriesGrid.tsx` — 현재 스텁 구현
- `packages/web/app/profile/ProfileClient.tsx` — TriesGrid 사용처

### Generated API
- `packages/web/lib/api/generated/users/users.ts` — useGetMyTries hook
- `packages/web/lib/api/generated/models/tryItem.ts` — TryItem 타입

### Requirements
- `.planning/REQUIREMENTS.md` — TRIES-03, TRIES-04, TRIES-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useGetMyTries` hook (Orval 생성) — Phase 48에서 생성
- 기존 TriesGrid 스켈레톤/빈 상태 UI — 재사용 가능
- `useUserActivities`의 useInfiniteQuery 패턴 — 참조 구현

### Integration Points
- ProfileClient.tsx에서 TriesGrid 렌더링 — import 변경 불필요

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard infinite scroll grid

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 49-tries-tab-frontend*
*Context gathered: 2026-03-26*
