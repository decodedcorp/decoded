# Phase v2-04: Desktop Infrastructure - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

데스크톱 사용자를 위한 반응형 레이아웃 구현. 헤더, 푸터, 네비게이션, 멀티 컬럼 구조 포함. 페이지별 콘텐츠 구현은 v2-05 이후 페이즈에서 진행.

</domain>

<decisions>
## Implementation Decisions

### 헤더 & 네비게이션
- 검색바는 우측 아이콘으로 표시 (클릭 시 확장 또는 모달)
- 네비게이션 아이템은 텍스트 링크 형태 (Home, Discover, Create)
- 헤더는 Sticky (항상 상단에 고정, 스크롤해도 따라옴)
- 로그인/로그아웃 상태에 따른 사용자 영역 표시 (알림, 아바타 메뉴)
- 기존 로고 (DecodedLogo 컴포넌트) 사용

### 사이드바 & 레이아웃
- 사이드바 없음 — 헤더 네비게이션만 사용
- 컬럼 레이아웃은 페이지별 유동적 (1/2/3컬럼 자유롭게 적용)
- 컨텐츠 영역 최대 너비: Full-width (제한 없음, 사이드 패딩만 적용)
- 데스크톱: 상단 헤더 네비게이션
- 모바일: 하단 NavBar (MobileNavBar) 유지

### 모바일 헤더
- 모바일 상단 헤더: 로고 + 검색
- 기존 Header.tsx (모바일 전용) 구조 유지하되 decoded.pen 디자인 적용

### 푸터 구성
- 4칼럼 풀 구조 (decoded.pen 기본): 브랜드 + Company + Support + Connect
- Connect 섹션에 소셜 링크와 뉴스레터 포함
- 푸터 위치: 컨텐츠 후 자연스럽게 표시 (sticky 아님)
- 모바일에서는 아코디언 접기 (Company, Support 섹션)

### 반응형 전환
- 브레이크포인트: 768px (Tailwind md)
- 768px 미만 = 모바일, 768px 이상 = 데스크톱
- 컴포넌트 구조: 별도 컴포넌트 유지
  - DesktopHeader (신규 구현)
  - MobileHeader (기존 Header.tsx 리네임 및 정리)
  - DesktopFooter / MobileFooter (또는 CSS 반응형으로 통합)

### Claude's Discretion
- 헤더 내부 요소 간격 및 배치 세부사항
- 검색 드롭다운/모달 구현 방식
- 푸터 각 섹션의 정확한 링크 항목
- 애니메이션 및 전환 효과 디테일

</decisions>

<specifics>
## Specific Ideas

- decoded.pen 디자인을 기준으로 구현
- 기존 DecodedLogo 컴포넌트 재사용 (모바일/데스크톱 동일)
- CMN-01-header.md, CMN-02-footer.md 스펙 문서 참조
- 현재 모노레포 구조 (packages/web) 내에서 작업

</specifics>

<deferred>
## Deferred Ideas

None — 논의가 페이즈 범위 내에서 유지됨

</deferred>

---

*Phase: v2-04-desktop-infrastructure*
*Context gathered: 2026-01-29*
