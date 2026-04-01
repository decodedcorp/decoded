# Requirements: decoded-monorepo v11.0

**Defined:** 2026-04-01
**Core Value:** 완전한 사용자 경험 — Explore/Editorial 콘텐츠 탐색에서 상세 뷰까지 실제 데이터로 동작

## v11.0 Requirements

Requirements for Explore & Editorial Data Integration. 기존 UI/디자인은 유지하며 데이터 연결과 버그 수정에 집중.

### Data Validation

- [ ] **DATA-01**: Editorial post가 DB에 존재하는지 검증 (post_magazine_title IS NOT NULL 행 확인, 없으면 #38 에스컬레이션)

### Editorial Filter

- [ ] **FILT-01**: hasMagazine 필터가 Supabase 쿼리에서 실제로 동작하여 Editorial 페이지에 매거진 post만 표시
- [ ] **FILT-02**: OpenAPI spec에 has_magazine 파라미터 추가 및 Orval 재생성으로 타입 안전한 필터링

### Detail Connection

- [ ] **DETL-01**: usePostDetailForImage를 REST getPost로 마이그레이션하여 매거진 메타데이터, AI summary, SpotDot solution 썸네일 표시
- [ ] **DETL-02**: Maximize 버튼이 router.push + GSAP exit 애니메이션으로 동작 (window.location.href hard reload 제거)

### Card Enrichment

- [ ] **CARD-01**: Explore 카드에 spot_count 배지 표시 (하드코딩 0 → 실제 데이터)
- [ ] **CARD-02**: Editorial 카드에 매거진 타이틀 오버레이 표시

## v12+ Requirements

다음 마일스톤으로 미루기. 현재 스코프 외.

### Explore UI Enhancement

- **EXUI-01**: 아티스트 프로필 카드 추가 (아티스트 탭/섹션)
- **EXUI-02**: 트렌딩 아티스트 섹션
- **EXUI-03**: 카드 호버 시 아이템 프리뷰

### Editorial Layout

- **EDLT-01**: 매거진 스타일 전용 레이아웃 (현재 masonry와 차별화)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 새 라이브러리/패키지 추가 | 기존 스택으로 충분 — 리서치 확인 |
| Editorial 중첩 라우트 (/editorial/[magazineId]) | 인터셉팅 라우트 depth 제약, v12+ 검토 |
| 카드별 solution 썸네일 fetch | N+1 쿼리 위험 — spot_count 배지로 한정 |
| REST API 전면 마이그레이션 | 상세 뷰만 마이그레이션, 리스트는 Supabase 유지 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | — | Pending |
| FILT-01 | — | Pending |
| FILT-02 | — | Pending |
| DETL-01 | — | Pending |
| DETL-02 | — | Pending |
| CARD-01 | — | Pending |
| CARD-02 | — | Pending |

**Coverage:**
- v11.0 requirements: 7 total
- Mapped to phases: 0
- Unmapped: 7 (pending roadmap)

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
