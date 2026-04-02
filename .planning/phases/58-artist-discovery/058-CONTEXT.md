# Phase 58: Artist Discovery - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Source:** Auto-mode (recommended defaults selected)

<domain>
## Phase Boundary

Explore 페이지에 아티스트 프로필 카드와 트렌딩 아티스트 섹션을 추가하여 아티스트 기반 콘텐츠 탐색 경로 제공.

</domain>

<decisions>
## Implementation Decisions

### 아티스트 카드 디자인
- **D-01:** 기존 `PersonResultCard` 패턴을 확장하여 아티스트 프로필 카드 구현 — 아바타, 이름, 카테고리, 아이템 수 표시
- **D-02:** `/cast/[id]` 경로로 링크 (기존 PersonResultCard 패턴 유지)

### 트렌딩 섹션 배치
- **D-03:** Explore 페이지 상단 (masonry 그리드 위)에 수평 스크롤 트렌딩 아티스트 섹션 배치
- **D-04:** 기존 `ExploreClient` 내부에 통합 — 별도 페이지 없음

### 데이터 소스
- **D-05:** posts 테이블의 `artist_name` 필드를 집계하여 트렌딩 아티스트 목록 구성 — 별도 artists 테이블 없음 (프로젝트 원칙: brand/artist별 테이블 없음)
- **D-06:** 트렌딩 기준은 최근 N일 내 포스트 수 기준 정렬

### Claude's Discretion
- 트렌딩 기간 (7일/14일/30일)
- 아티스트 카드 호버 효과 세부 스타일
- 아바타 이미지 소스 (posts 테이블에서 첫 번째 이미지 활용 vs 별도 프로필 이미지)
- 수평 스크롤 UI 세부 구현 (snap scroll, 화살표 등)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Explore Architecture
- `packages/web/app/explore/ExploreClient.tsx` — Explore 메인 클라이언트 (트렌딩 섹션 통합 대상)
- `docs/agent/web-routes-and-features.md` — 웹 라우트, 기능 영역

### Existing Artist/Person Components
- `packages/web/lib/components/search/PersonResultCard.tsx` — 기존 인물 결과 카드 (참조 패턴)
- `packages/web/lib/components/search/PeopleResultSection.tsx` — 인물 섹션 레이아웃
- `packages/web/lib/components/main/CelebrityGrid.tsx` — 메인 셀럽 그리드 (참조)
- `packages/web/lib/components/main/CelebritySection.tsx` — 메인 셀럽 섹션 (참조)

### Data Layer
- `packages/web/lib/supabase/types.ts` — DB 타입 (artist_name 필드)
- `packages/web/lib/hooks/useImages.ts` — useInfinitePosts 훅

### Design System
- `docs/agent/design-system-llm.md` — 디자인 시스템 컴포넌트 목록
- `packages/web/app/globals.css` — CSS 변수

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PersonResultCard`: 아바타 + 이름 + 카테고리 + 아이템 수 패턴 — 확장 가능
- `CelebrityGrid`/`CelebritySection`: 메인 페이지 셀럽 그리드 패턴
- `MagazineCelebSection`: 매거진 상세 셀럽 카드 패턴 (3/4 비율 카드)
- `ExploreFilterBar`: 필터 UI — castId 필터 이미 존재

### Established Patterns
- 수평 스크롤: 프로젝트 내 기존 수평 스크롤 패턴 확인 필요
- Supabase 집계: `.select()` with `.group()` 또는 RPC function
- 브랜드 컬러: `var(--mag-accent)` 통일 (Phase 56)

### Integration Points
- `ExploreClient.tsx` — 트렌딩 섹션 삽입 지점 (masonry 그리드 위)
- `useInfinitePosts` — 아티스트 필터링 연동
- `/cast/[id]` 라우트 — 아티스트 상세 링크 대상

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches (auto-mode defaults)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 058-artist-discovery*
*Context gathered: 2026-04-02 via auto-mode*
