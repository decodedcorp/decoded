# Phase 56: Explore UI Enhancement - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Explore 페이지의 Spot 컴포넌트 브랜드 컬러 통일, hierarchical 필터 전체 연결, editorial 콘텐츠 전용 노출, 상세페이지 Pretext 매거진 레이아웃 적용, 뱃지 삭제, 상세페이지 브랜드 컬러 통일.

</domain>

<decisions>
## Implementation Decisions

### Spot 컴포넌트 통일
- **D-01:** SpotDot과 HeroSpotMarker를 브랜드 컬러(네온 옐로우 `#eafd67` / `--mag-accent`)로 통일한다. HeroSpotMarker의 하드코딩된 색상을 CSS 변수로 대체.
- **D-02:** SpotDot은 메인페이지와 상세페이지 모두에서 동일한 스타일로 렌더링되어야 한다.

### 필터 수정
- **D-03:** Hierarchical filter 전체 연결 — ExploreClient가 Media/Cast/Context 파라미터를 useInfinitePosts에 전달하고, Supabase 쿼리에서 실제 필터링이 동작하도록 한다.
- **D-04:** 현재 ExploreFilterBar/Sheet UI는 이미 존재하므로 API 연결만 추가하면 됨.

### Explore 콘텐츠 범위
- **D-05:** Explore 페이지는 모든 post를 표시하되, 상세페이지(클릭 시)가 editorial 형태로 보여진다. hasMagazine 필터를 Explore 기본으로 적용하지 않음 — 대신 상세 뷰에서 editorial 레이아웃을 적용.

### 상세페이지 정비
- **D-06:** 상세페이지 왼쪽 상단의 PostBadge(카테고리/소스 뱃지) 전부 삭제. SpotDot은 유지.
- **D-07:** Pretext 라이브러리를 상세페이지 매거진 섹션에 적용하여 텍스트 레이아웃 품질 향상. usePretext 훅이 이미 존재함.
- **D-08:** 상세페이지 전체 컬러를 브랜드 컬러(네온 옐로우 `--mag-accent`)로 통일. magazine accent color 오버라이드 대신 일관된 브랜드 컬러 사용.

### Claude's Discretion
- 필터 파라미터의 Supabase 쿼리 구현 방식 (eq, in, contains 등)
- Pretext 적용 시 구체적 텍스트 영역 선택

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `docs/agent/design-system-llm.md` — 디자인 시스템 컴포넌트 목록, import 경로
- `packages/web/app/globals.css` — CSS 변수 정의 (`--mag-accent: #eafd67`)
- `packages/web/tailwind.config.ts` — Tailwind 컬러 매핑 (`mag.accent`)

### Explore Architecture
- `docs/agent/web-routes-and-features.md` — 웹 라우트, 기능 영역
- `packages/web/app/explore/ExploreClient.tsx` — Explore 메인 클라이언트
- `packages/web/lib/hooks/useImages.ts` — useInfinitePosts 훅 (Supabase 쿼리)

### Filter System
- `packages/web/lib/components/explore/ExploreFilterBar.tsx` — 데스크톱 hierarchical 필터
- `packages/web/lib/components/explore/ExploreFilterSheet.tsx` — 모바일 hierarchical 필터
- `packages/shared/stores/hierarchicalFilterStore.ts` — 필터 상태 관리

### Spot Components
- `packages/web/lib/components/detail/SpotDot.tsx` — 상세 Spot 마커
- `packages/web/lib/components/main-renewal/HeroSpotMarker.tsx` — 메인 Hero Spot 마커

### Detail Page
- `packages/web/lib/components/detail/ImageDetailModal.tsx` — 드로어 모달
- `packages/web/lib/components/detail/ImageDetailContent.tsx` — 상세 콘텐츠
- `packages/web/lib/components/detail/ImageDetailPreview.tsx` — 상세 프리뷰
- `packages/web/lib/hooks/usePretext.ts` — Pretext 텍스트 측정 훅

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePretext` 훅: Canvas 기반 텍스트 측정 — 매거진 레이아웃에 즉시 활용 가능
- `hierarchicalFilterStore`: 필터 UI 상태 이미 관리 중 — API 연결만 필요
- `ExploreFilterBar/Sheet`: hierarchical UI 이미 완성 — 데이터 바인딩만 추가
- `--mag-accent` CSS 변수: 브랜드 컬러 이미 정의 — 참조만 통일하면 됨

### Established Patterns
- Supabase 쿼리: `useInfinitePosts`에서 `.eq()`, `.not()` 체이닝 패턴
- 컬러: `hsl(var(--primary))` fallback → `var(--mag-accent)` 오버라이드 패턴
- 무한스크롤: TanStack Query `useInfiniteQuery` + intersection observer

### Integration Points
- `ExploreClient.tsx` → `useInfinitePosts()`: 필터 파라미터 추가 지점
- `SpotDot.tsx` `accentColor` prop: 브랜드 컬러 기본값 변경 지점
- `HeroSpotMarker.tsx`: 하드코딩된 `#eafd67`를 CSS 변수로 변경

</code_context>

<specifics>
## Specific Ideas

- 브랜드 컬러(네온 옐로우 `#eafd67`)를 모든 Spot 관련 UI에서 일관되게 사용
- 상세페이지가 editorial 역할을 수행 — Explore의 카드를 클릭하면 매거진 스타일 상세 뷰
- 기존 PostBadge 오버레이를 깔끔하게 제거하여 이미지 중심 UX

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 56-explore-ui-enhancement*
*Context gathered: 2026-04-02*
