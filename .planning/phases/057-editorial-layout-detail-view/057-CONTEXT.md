# Phase 57: Editorial Layout & Detail View - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

/posts/[id] 상세페이지의 모든 텍스트 영역에 @chenglou/pretext 라이브러리를 적용하여 CLS 0 달성. 높이 예약 + 페이드인 패턴 통일. /editorial 페이지는 존재하지 않으며, /explore와 /posts/[id]만 대상.

</domain>

<decisions>
## Implementation Decisions

### Pretext 적용 범위
- **D-01:** 상세페이지의 **모든 텍스트 영역**에 pretext 적용 — title, subtitle, editorial paragraphs, pull_quote, item descriptions, AI summary 등
- **D-02:** 현재 MagazineTitleSection(title), MagazineEditorialSection(pull_quote)에만 적용 중 → 나머지 텍스트 영역으로 확장

### 동작 방식
- **D-03:** **높이 예약 + 페이드인** 패턴 통일 — pretext로 측정한 높이를 `minHeight`로 설정 → 텍스트 로드 후 부드러운 페이드인. MagazineTitleSection의 기존 패턴을 전 영역에 확장.
- **D-04:** CLS 0을 목표로 모든 텍스트 블록이 렌더링 전에 정확한 높이를 예약

### 페이지 범위
- **D-05:** /editorial 페이지는 존재하지 않음. /explore와 /posts/[id] 상세페이지만 대상
- **D-06:** 상세페이지 구조(HeroSection, InteractiveShowcase, ShopGrid, MagazineEditorialSection 등)는 현재 상태 유지 — pretext 적용만 추가

### Claude's Discretion
- 각 텍스트 영역별 font/lineHeight 파라미터 결정
- useTextLayout vs useBatchTextLayout vs useTextTruncation 중 영역별 적절한 훅 선택
- 페이드인 애니메이션 세부 타이밍

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Pretext Library
- `packages/web/lib/hooks/usePretext.ts` — useTextLayout, useBatchTextLayout, useTextTruncation 훅 정의

### Detail Page Components
- `packages/web/lib/components/detail/ImageDetailContent.tsx` — 상세 콘텐츠 메인 컴포넌트 (pretext 적용 대상 orchestrator)
- `packages/web/lib/components/detail/magazine/MagazineTitleSection.tsx` — title pretext 적용 완료 (참조 패턴)
- `packages/web/lib/components/detail/magazine/MagazineEditorialSection.tsx` — pull_quote pretext 적용 완료 (참조 패턴)
- `packages/web/lib/components/detail/HeroSection.tsx` — Hero 텍스트 영역
- `packages/web/lib/components/detail/AISummarySection.tsx` — AI 요약 텍스트 영역
- `packages/web/lib/components/detail/InteractiveShowcase.tsx` — 아이템 설명 텍스트
- `packages/web/lib/components/detail/ShopGrid.tsx` — 아이템 그리드 텍스트

### Design System
- `packages/web/app/globals.css` — CSS 변수 정의 (`--mag-accent`)
- `docs/agent/design-system-llm.md` — 디자인 시스템 컴포넌트 목록

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTextLayout` 훅: 단일 텍스트 Canvas 측정 — title/subtitle/pull_quote에 사용
- `useBatchTextLayout` 훅: 동일 font/width의 다중 텍스트 일괄 측정 — item list, tag group에 적합
- `useTextTruncation` 훅: 라인 수 기반 말줄임 계산 — 긴 텍스트 영역에 적합
- `@chenglou/pretext` 라이브러리: prepare() + layout() 원시 함수 re-export 됨

### Established Patterns
- MagazineTitleSection 패턴: `useTextLayout` → `minHeight` → GSAP 페이드인
- MagazineEditorialSection 패턴: `useTextLayout` → `quoteHeight` → CSS transition reveal
- 브랜드 컬러: `var(--mag-accent)` 통일 완료 (Phase 56)

### Integration Points
- `ImageDetailContent.tsx` — 모든 하위 섹션을 조율하는 orchestrator
- 각 섹션 컴포넌트에 개별적으로 pretext 훅 추가 필요
- GSAP ScrollTrigger와 pretext 측정이 공존하는 패턴 이미 확립

</code_context>

<specifics>
## Specific Ideas

- 기존 MagazineTitleSection의 `minHeight` + 페이드인 패턴을 모든 텍스트 섹션에 동일하게 확장
- 사용자가 "상세 페이지는 잘 된거같아서 pretext 적용만 하면 될거같다"고 확인 — 구조 변경 없이 pretext 레이어만 추가

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 057-editorial-layout-detail-view*
*Context gathered: 2026-04-02*
