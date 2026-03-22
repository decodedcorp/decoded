# Requirements: decoded-app v2.1 Design System Expansion

**Defined:** 2026-02-05
**Core Value:** 완전한 사용자 경험 — decoded.pen 디자인 시스템 100% 구현

## v2.1 Requirements

decoded.pen에 정의된 미구현 컴포넌트 완성.

### Interactive Components

- [ ] **COMP-01**: Tag 컴포넌트 6개 변형 (All, Latest, Clothing, Accessories, Shoes, Bags)
- [ ] **COMP-02**: ActionButton 3개 변형 (Default, Solid, Outline)
- [ ] **COMP-03**: StepIndicator 3단계 프로그레스 (Step1, Step2, Step3)
- [ ] **COMP-04**: Hotspot 3개 변형 (Default, Numbered, Inactive)

### Navigation Components

- [ ] **NAV-01**: NavBar 모바일 하단 네비게이션
- [ ] **NAV-02**: NavItem 2개 변형 (Default, Active)
- [ ] **NAV-03**: SectionHeader 섹션 제목 컴포넌트
- [ ] **NAV-04**: SearchTabs 검색 결과 탭 네비게이션

### Card Components

- [x] **CARD-01**: ArtistCard 아티스트 카드 ✅
- [x] **CARD-02**: StatCard 통계 카드 ✅
- [x] **CARD-03**: SpotCard 3개 변형 (Default, Active, Compact) ✅
- [x] **CARD-04**: ShopCarouselCard 쇼핑 캐러셀 카드 ✅

### Profile Components

- [ ] **PROF-01**: Badge 뱃지 컴포넌트
- [ ] **PROF-02**: LeaderItem 3개 변형 (Default, Highlight)
- [ ] **PROF-03**: RankingItem 3개 변형 (Default, Down, Neutral)

### Detail Components

- [ ] **DETL-01**: SpotDetail 스팟 상세 컴포넌트

### Login Components

- [ ] **AUTH-01**: OAuthButton 3개 변형 (Kakao, Google, Apple)
- [ ] **AUTH-02**: GuestButton 게스트 버튼
- [ ] **AUTH-03**: Divider "또는" 구분선
- [ ] **AUTH-04**: LoginCard 로그인 카드 래퍼

### State Components

- [ ] **STATE-01**: LoadingSpinner 로딩 스피너 (decoded.pen 스타일)
- [ ] **STATE-02**: SkeletonCard 스켈레톤 카드 확장

### UI Improvements

- [ ] **UI-01**: BottomSheet decoded.pen 스타일 업그레이드

### Quality Assurance

- [ ] **QA-01**: Visual QA Playwright 스크린샷 자동화
- [ ] **QA-02**: 모든 페이지 4개 breakpoint 스크린샷 캡처
- [ ] **QA-03**: decoded.pen과 시각적 차이 문서화

## Future Requirements (v2.2+)

Deferred to future release.

### Advanced Analysis

- **ADV-01**: ChromaticAnalysis 색상 분석 컴포넌트
- **ADV-02**: StyleRadar 스타일 레이더 차트

### Content Components

- **CONT-01**: EditorTip 에디터 팁
- **CONT-02**: ArticleQuote 인용구

### Desktop Layouts

- **DSK-01**: DesktopSidebar (v2.0에서 제거됨, 필요시 복원)
- **DSK-02**: DesktopLayout 2/3 컬럼 변형

## Out of Scope

| Feature | Reason |
|---------|--------|
| EmptyState | 각 페이지에서 커스텀으로 구현 중 |
| ErrorState | 각 페이지에서 커스텀으로 구현 중 |
| DesktopCard | Card로 충분히 대체 가능 |
| DesktopHero | Home HeroSection에서 구현됨 |
| DesktopSearch | SearchInput으로 대체됨 |
| DesktopTab/TabBar | 별도 탭 컴포넌트로 분리 필요 시 추가 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 | v2.1-Phase-1 | Pending |
| COMP-02 | v2.1-Phase-1 | Pending |
| COMP-03 | v2.1-Phase-1 | Pending |
| COMP-04 | v2.1-Phase-1 | Pending |
| NAV-01 | v2.1-Phase-2 | Pending |
| NAV-02 | v2.1-Phase-2 | Pending |
| NAV-03 | v2.1-Phase-2 | Pending |
| NAV-04 | v2.1-Phase-2 | Pending |
| CARD-01 | v2.1-Phase-3 | Complete |
| CARD-02 | v2.1-Phase-3 | Complete |
| CARD-03 | v2.1-Phase-3 | Complete |
| CARD-04 | v2.1-Phase-3 | Complete |
| PROF-01 | v2.1-Phase-4 | Pending |
| PROF-02 | v2.1-Phase-4 | Pending |
| PROF-03 | v2.1-Phase-4 | Pending |
| DETL-01 | v2.1-Phase-4 | Pending |
| AUTH-01 | v2.1-Phase-5 | Pending |
| AUTH-02 | v2.1-Phase-5 | Pending |
| AUTH-03 | v2.1-Phase-5 | Pending |
| AUTH-04 | v2.1-Phase-5 | Pending |
| STATE-01 | v2.1-Phase-5 | Pending |
| STATE-02 | v2.1-Phase-5 | Pending |
| UI-01 | v2.1-Phase-5 | Pending |
| QA-01 | v2.1-Phase-6 | Pending |
| QA-02 | v2.1-Phase-6 | Pending |
| QA-03 | v2.1-Phase-6 | Pending |

**Coverage:**
- v2.1 requirements: 26 total
- Mapped to phases: 26 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-06 after phase v2.1-03 completion*
