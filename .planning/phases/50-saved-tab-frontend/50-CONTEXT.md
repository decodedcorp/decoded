# Phase 50: Saved Tab Frontend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

SavedGrid를 Orval 생성 hook 기반 무한스크롤로 리라이트하고, collectionStore의 MOCK_PINS/MOCK_BOARDS를 완전 제거한다. Pins/Boards/Collage 서브탭 개념 제거 → 단순 saved posts 그리드.

</domain>

<decisions>
## Implementation Decisions

### SavedGrid Rewrite
- 기존 Pins/Boards/Collage 서브탭 구조 제거 → 단순 saved posts 그리드
- `collectionStore` 의존 완전 제거
- `useGetMySaved` (Orval 생성) 기반 useInfiniteQuery로 교체
- SavedItem 타입: id, post_id, post_title, post_thumbnail_url, saved_at

### Mock Data Removal
- `collectionStore.ts`의 MOCK_PINS, MOCK_BOARDS 상수 완전 삭제
- collectionStore 자체는 collection 페이지에서 아직 사용할 수 있으므로 mock만 제거 (store 삭제 여부는 Claude 재량)

### UI States
- 로딩: 스켈레톤 그리드 (TriesGrid와 동일 패턴)
- 빈 상태: Bookmark 아이콘 + "저장한 포스트가 없습니다" + 안내 문구
- 에러: 에러 메시지 + retry 버튼
- 무한스크롤: IntersectionObserver 기반

### Claude's Discretion
- collectionStore를 완전히 삭제할지 mock만 제거할지 (다른 페이지 사용 여부 확인)
- 카드 디자인 (포스트 썸네일 + 제목 + 저장 날짜)
- PinGrid/BoardGrid/CollageView 컴포넌트 정리 여부

</decisions>

<canonical_refs>
## Canonical References

### Frontend Components
- `packages/web/lib/components/profile/SavedGrid.tsx` — 현재 mock 기반 구현
- `packages/web/lib/stores/collectionStore.ts` — MOCK_PINS/MOCK_BOARDS 포함
- `packages/web/lib/components/collection/` — PinGrid, BoardGrid, CollageView (정리 대상)

### Generated API
- `packages/web/lib/api/generated/users/users.ts` — useGetMySaved hook
- `packages/web/lib/api/generated/models/savedItem.ts` — SavedItem 타입

### Requirements
- `.planning/REQUIREMENTS.md` — SAVED-03, SAVED-04, SAVED-05

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useGetMySaved` hook (Orval 생성) — Phase 48에서 생성
- Phase 49 TriesGrid 무한스크롤 패턴 — 동일 패턴 적용

### Integration Points
- ProfileClient.tsx에서 SavedGrid 렌더링

</code_context>

<specifics>
## Specific Ideas

No specific requirements — REQUIREMENTS.md에 "Pins & Boards 컨셉 제거, 단순 saved posts 그리드로 대체" 명시

</specifics>

<deferred>
## Deferred Ideas

None

</deferred>

---

*Phase: 50-saved-tab-frontend*
*Context gathered: 2026-03-26*
