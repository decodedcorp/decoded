# Phase v2-05: Home & Explore Pages - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Home 페이지와 Explore 페이지에 decoded.pen 디자인 시스템을 적용합니다. 기존 기능(데이터 페칭, 무한 스크롤, 필터링)은 유지하면서 레이아웃과 스타일만 변경합니다. 새로운 기능 추가는 범위 외입니다.

</domain>

<decisions>
## Implementation Decisions

### Home Page Layout
- decoded.pen에 정의된 섹션 순서와 구성을 따름 (기존 9개 섹션 재구성 가능)
- HeroSection은 현재 구현 유지 (decoded.pen Hero 적용 안 함)
- 섹션 간 간격(spacing)과 구분자(divider)는 decoded.pen 정의 따름
- 섹션 애니메이션(motion/react whileInView fade-up) 현재 방식 유지

### Explore Page Behavior
- ThiingsGrid(Pinterest 스타일 무한 방향 스크롤 그리드) 유지
- 카드 스타일은 decoded.pen 적용 (그리드 동작은 기존 유지)
- 카테고리 필터 UI는 decoded.pen에 정의된 컴포넌트/위치 적용
- 필터 변경 시 fade-out/fade-in 애니메이션 추가 (부드러운 전환)
- decoded.pen에 정의된 페이지 헤더(타이틀, 설명) 영역 추가
- Explore 페이지 기능과 디자인은 크게 수정하지 않음

### Responsive Transitions
- decoded.pen에 정의된 브레이크포인트(모바일/태블릿/데스크톱) 적용
- 그리드 열 수: 모바일 2열 → 태블릿 3열 → 데스크톱 4열 (일반적 패턴)
- 수평 스크롤 카루셀(Artist Spotlight, What's New 등)은 decoded.pen 정의 따름
- 브레이크포인트 전환 시 레이아웃 애니메이션: Claude 재량 (성능/UX 고려)

### Content Loading States
- 섹션별 개별 스켈레톤 UI 적용 (섹션 타입에 맞는 스켈레톤)
- 스켈레톤 애니메이션: Tailwind animate-pulse 유지
- 빈 상태(empty state): decoded.pen에 정의된 빈 상태 컴포넌트 사용
- 에러 상태(error state): decoded.pen에 정의된 에러 컴포넌트 사용

### Claude's Discretion
- 브레이크포인트 전환 시 CSS transition 적용 여부 (성능 고려)
- decoded.pen에 없는 세부 스타일링 결정
- 스켈레톤 레이아웃 세부 구현

</decisions>

<specifics>
## Specific Ideas

- decoded.pen을 single source of truth로 사용
- 기존 HeroSection 유지 (디자인 변경 없음)
- Explore 페이지 ThiingsGrid 핵심 동작 보존
- 필터 전환 시 부드러운 fade 애니메이션으로 UX 개선

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v2-05-home-explore*
*Context gathered: 2026-01-29*
