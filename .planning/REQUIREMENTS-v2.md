# Requirements: decoded-app v2.0

**Defined:** 2026-01-29
**Core Value:** decoded.pen 디자인을 코드로 완벽하게 구현하여 디자인-코드 일관성 확보

## v2.0 Requirements

Pencil MCP를 활용하여 decoded.pen 디자인을 React 컴포넌트로 변환.
기존 기능은 유지하며 디자인/레이아웃만 적용.

### Design System - Buttons

- [ ] **BTN-01**: Button/Default 컴포넌트 구현 (Primary 스타일)
- [ ] **BTN-02**: Button/Secondary 컴포넌트 구현
- [ ] **BTN-03**: Button/Outline 컴포넌트 구현
- [ ] **BTN-04**: Button/Ghost 컴포넌트 구현
- [ ] **BTN-05**: Button/Destructive 컴포넌트 구현
- [ ] **BTN-06**: Button/Small 사이즈 variant 구현
- [ ] **BTN-07**: Button/Large 사이즈 variant 구현
- [ ] **BTN-08**: Button/Icon (아이콘 전용) 구현
- [ ] **BTN-09**: Button/IconGhost 구현

### Design System - Cards

- [ ] **CARD-01**: Card/Default 컴포넌트 구현 (header, content, actions 슬롯)
- [ ] **CARD-02**: ProductCard/Default 컴포넌트 구현
- [ ] **CARD-03**: ItemCard/Default 컴포넌트 구현
- [ ] **CARD-04**: GridCard/Default 컴포넌트 구현
- [ ] **CARD-05**: FeedCard/Default 컴포넌트 구현
- [ ] **CARD-06**: ProfileHeaderCard/Default 컴포넌트 구현

### Design System - Inputs

- [ ] **INP-01**: Input/Default 컴포넌트 구현 (아이콘, placeholder)
- [ ] **INP-02**: Input/Group 컴포넌트 구현 (label + field)
- [ ] **INP-03**: SearchInput/Default 컴포넌트 구현

### Design System - Tags

- [ ] **TAG-01**: Tag/All 카테고리 태그 구현
- [ ] **TAG-02**: Tag/Latest 카테고리 태그 구현
- [ ] **TAG-03**: Tag/Clothing 카테고리 태그 구현
- [ ] **TAG-04**: Tag/Accessories 카테고리 태그 구현
- [ ] **TAG-05**: Tag/Shoes 카테고리 태그 구현
- [ ] **TAG-06**: Tag/Bags 카테고리 태그 구현

### Design System - Typography

- [ ] **TYPO-01**: Hero 텍스트 스타일 정의
- [ ] **TYPO-02**: H1-H4 헤딩 스타일 정의
- [ ] **TYPO-03**: Body 텍스트 스타일 정의
- [ ] **TYPO-04**: Small/Caption 텍스트 스타일 정의

### Design System - Action Buttons

- [ ] **ACT-01**: ActionButton/Default 구현
- [ ] **ACT-02**: ActionButton/Solid 구현
- [ ] **ACT-03**: ActionButton/Outline 구현

### Design System - Desktop Components

- [ ] **DSK-01**: DesktopHeader/Default 구현
- [ ] **DSK-02**: DesktopFooter/Default 구현
- [ ] **DSK-03**: DesktopNavItem/Default 및 Active 구현
- [ ] **DSK-04**: DesktopSidebar/Default 구현
- [ ] **DSK-05**: DesktopCard/Default 구현
- [ ] **DSK-06**: DesktopLayout/TwoColumn 구현
- [ ] **DSK-07**: DesktopLayout/ThreeColumn 구현
- [ ] **DSK-08**: DesktopHero/Default 구현
- [ ] **DSK-09**: DesktopSearch/Default 구현
- [ ] **DSK-10**: DesktopTab/Default 및 Active 구현
- [ ] **DSK-11**: DesktopTabBar/Default 구현
- [ ] **DSK-12**: SearchTabs/Default 구현

### Page - Home

- [ ] **HOME-01**: Home 모바일 레이아웃 구현 (Page 1: Home)
- [ ] **HOME-02**: Home 데스크탑 레이아웃 구현 (Page 1: Home Desktop)
- [ ] **HOME-03**: DomGallery 섹션 레이아웃 적용
- [ ] **HOME-04**: Discover Items 섹션 레이아웃 적용

### Page - Feed

- [ ] **FEED-01**: Feed 모바일 레이아웃 구현 (Page 2: Feed)
- [ ] **FEED-02**: Feed 데스크탑 레이아웃 구현 (Page 2: Feed Desktop)
- [ ] **FEED-03**: Things Grid 레이아웃 적용
- [ ] **FEED-04**: Feed Cards 컴포넌트 연동

### Page - Profile

- [ ] **PROF-01**: Profile 모바일 레이아웃 구현 (Page 3: Profile)
- [ ] **PROF-02**: Profile 데스크탑 레이아웃 구현 (Page 3: Profile Desktop)
- [ ] **PROF-03**: ProfileHeaderCard 연동
- [ ] **PROF-04**: 사용자 활동 탭 레이아웃

### Page - Search

- [ ] **SRCH-01**: Search 모바일 레이아웃 구현 (Page 4: Search)
- [ ] **SRCH-02**: Search 데스크탑 레이아웃 구현 (Page 4: Search Desktop)
- [ ] **SRCH-03**: SearchInput 컴포넌트 연동
- [ ] **SRCH-04**: SearchTabs 연동

### Page - Image Detail

- [ ] **IMG-01**: Image Detail 모바일 레이아웃 구현 (Page 5: Image Detail)
- [ ] **IMG-02**: Image Detail 데스크탑 레이아웃 구현 (Page 5: Image Detail Desktop)
- [ ] **IMG-03**: Scroll Action 애니메이션 적용
- [ ] **IMG-04**: Item Cards 연동

### Page - Request Flow

- [ ] **REQ-01**: Request Upload 페이지 구현 (Page 6a)
- [ ] **REQ-02**: Request Detection 페이지 구현 (Page 6b)
- [ ] **REQ-03**: Request Details 페이지 구현 (Page 6c)
- [ ] **REQ-04**: Request Flow 전환 애니메이션

### Page - Explore

- [ ] **EXP-01**: Explore 페이지 레이아웃 구현 (Page 7: Explore)
- [ ] **EXP-02**: Explore Grid 레이아웃 적용
- [ ] **EXP-03**: 카테고리 필터 연동

### Page - Login

- [ ] **AUTH-01**: Login 모바일 레이아웃 구현 (Page 8: Login)
- [ ] **AUTH-02**: Login 데스크탑 레이아웃 구현 (Page 8: Login Desktop)

### Documentation

각 Phase 완료 후 문서 업데이트:

- [ ] **DOC-01**: docs/design-system/ 디자인 토큰 문서 업데이트
- [ ] **DOC-02**: specs/ 컴포넌트 스펙 문서 업데이트
- [ ] **DOC-03**: .planning/codebase/ 코드베이스 분석 업데이트
- [ ] **DOC-04**: CLAUDE.md 디자인 시스템 섹션 추가

## Out of Scope

| Feature | Reason |
|---------|--------|
| 새로운 기능 추가 | v2.0은 디자인 적용만, 기능은 v1.1에서 처리 |
| 백엔드 API 변경 | v1.1 마일스톤 범위 |
| Admin 대시보드 | 별도 마일스톤 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BTN-01 | v2-Phase 2 | Complete |
| BTN-02 | v2-Phase 2 | Complete |
| BTN-03 | v2-Phase 2 | Complete |
| BTN-04 | v2-Phase 2 | Complete |
| BTN-05 | v2-Phase 2 | Complete |
| BTN-06 | v2-Phase 2 | Complete |
| BTN-07 | v2-Phase 2 | Complete |
| BTN-08 | v2-Phase 2 | Complete |
| BTN-09 | v2-Phase 2 | Complete |
| CARD-01 | v2-Phase 3 | Complete |
| CARD-02 | v2-Phase 3 | Complete |
| CARD-03 | v2-Phase 3 | Complete |
| CARD-04 | v2-Phase 3 | Complete |
| CARD-05 | v2-Phase 3 | Complete |
| CARD-06 | v2-Phase 3 | Complete |
| INP-01 | v2-Phase 2 | Complete |
| INP-02 | v2-Phase 2 | Complete |
| INP-03 | v2-Phase 2 | Complete |
| TAG-01 | v2-Phase 2 | Complete |
| TAG-02 | v2-Phase 2 | Complete |
| TAG-03 | v2-Phase 2 | Complete |
| TAG-04 | v2-Phase 2 | Complete |
| TAG-05 | v2-Phase 2 | Complete |
| TAG-06 | v2-Phase 2 | Complete |
| TYPO-01 | v2-Phase 1 | Pending |
| TYPO-02 | v2-Phase 1 | Pending |
| TYPO-03 | v2-Phase 1 | Pending |
| TYPO-04 | v2-Phase 1 | Pending |
| ACT-01 | v2-Phase 2 | Complete |
| ACT-02 | v2-Phase 2 | Complete |
| ACT-03 | v2-Phase 2 | Complete |
| DSK-01 | v2-Phase 4 | Pending |
| DSK-02 | v2-Phase 4 | Pending |
| DSK-03 | v2-Phase 4 | Pending |
| DSK-04 | v2-Phase 4 | Pending |
| DSK-05 | v2-Phase 4 | Pending |
| DSK-06 | v2-Phase 4 | Pending |
| DSK-07 | v2-Phase 4 | Pending |
| DSK-08 | v2-Phase 4 | Pending |
| DSK-09 | v2-Phase 4 | Pending |
| DSK-10 | v2-Phase 4 | Pending |
| DSK-11 | v2-Phase 4 | Pending |
| DSK-12 | v2-Phase 4 | Pending |
| HOME-01 | v2-Phase 5 | Pending |
| HOME-02 | v2-Phase 5 | Pending |
| HOME-03 | v2-Phase 5 | Pending |
| HOME-04 | v2-Phase 5 | Pending |
| FEED-01 | v2-Phase 6 | Complete |
| FEED-02 | v2-Phase 6 | Complete |
| FEED-03 | v2-Phase 6 | Complete |
| FEED-04 | v2-Phase 6 | Complete |
| PROF-01 | v2-Phase 6 | Complete |
| PROF-02 | v2-Phase 6 | Complete |
| PROF-03 | v2-Phase 6 | Complete |
| PROF-04 | v2-Phase 6 | Complete |
| SRCH-01 | v2-Phase 7 | Pending |
| SRCH-02 | v2-Phase 7 | Pending |
| SRCH-03 | v2-Phase 7 | Pending |
| SRCH-04 | v2-Phase 7 | Pending |
| IMG-01 | v2-Phase 7 | Pending |
| IMG-02 | v2-Phase 7 | Pending |
| IMG-03 | v2-Phase 7 | Pending |
| IMG-04 | v2-Phase 7 | Pending |
| REQ-01 | v2-Phase 8 | Pending |
| REQ-02 | v2-Phase 8 | Pending |
| REQ-03 | v2-Phase 8 | Pending |
| REQ-04 | v2-Phase 8 | Pending |
| EXP-01 | v2-Phase 5 | Pending |
| EXP-02 | v2-Phase 5 | Pending |
| EXP-03 | v2-Phase 5 | Pending |
| AUTH-01 | v2-Phase 8 | Pending |
| AUTH-02 | v2-Phase 8 | Pending |
| DOC-01 | v2-Phase 9 | Pending |
| DOC-02 | v2-Phase 9 | Pending |
| DOC-03 | v2-Phase 9 | Pending |
| DOC-04 | v2-Phase 9 | Pending |

**Coverage:**
- v2.0 requirements: 69 total
- Mapped to phases: 69/69 (100%)
- Design System: 42 requirements across v2-Phase 1-4
- Pages: 23 requirements across v2-Phase 5-8
- Documentation: 4 requirements in v2-Phase 9

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-29 after v2-Phase 6 completion*
