# [SPEC] Decoded Home Page v2.0 (decoded.pen Sync)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SPEC-HOME-01 |
| **관련 화면** | SCR-DISC-01 |
| **작성일** | 2026-02-05 |
| **상태** | 확정 (Leaderboard 제외) |

---

## 1. 개요
`decoded.pen` 디자인 시스템에 기반하여 홈 페이지를 프리미엄 매거진 스타일의 랜딩 페이지로 전환합니다. 기존의 단순 그리드 형태에서 섹션별 인터랙티브 콘텐츠로 구성됩니다.

## 2. 섹션 구조 (Scroll Sequence)

1. **Top Hero (Featured Artist)**
   - 대형 배경 이미지와 타이포그래피 애니메이션
   - 아티스트별 주요 스토리 링크

2. **DECODED'S PICK**
   - **Spotlight Interaction**: 메인 이미지에 아이템 마커(Spot) 표시
   - 추천 코디 스타일과 연관 상품 그리드 결합

3. **ARTIST SPOTLIGHT**
   - 아티스트별 상의/하의/액세서리 매칭 정보
   - **Interactive Spots**: 이미지 위 포인트 클릭 시 상품 정보 표시

4. **WHAT'S NEW**
   - 최신 업로드된 스타일과 신규 상품 소개
   - 2단 카드 레이아웃

5. **ACHIEVEMENT BADGES (New)**
   - 사용자 활동에 따른 획득 배지 그리드
   - 잠금 상태 및 획득 조건 툴팁

6. **BEST ITEM & WEEKLY BEST**
   - 주간 인기 상품 및 스타일 랭킹
   - 가로 슬라이더/캐러셀 및 그리드 혼합

7. **TRENDING NOW**
   - 현재 인기 있는 검색 키워드 및 태그 칩

8. **DISCOVER (Categorized)**
   - 카테고리별(Clothes, Acc 등) 아이템 탐색 그리드

---

## 3. 핵심 기능: Spot & Spotlight

- **Spot Marker**: 이미지 내 특정 좌표에 위치한 원형 마커.
- **Hover/Click Interaction**:
  - 마커 호버 시 상품명/가격 툴팁 표시.
  - 마커 클릭 시 해당 상품 상세 페이지로 이동.
- **Spotlight Effect**: 특정 아이템 강조 시 배경을 어둡게 처리(Grayscale mask)하여 몰입도 향상.

## 4. 데이터 연동 (Supabase)

- **Post Data**: `post` -> `spots` -> `solutions` (products) 연계 페칭.
- **Badge Data**: `badges` 테이블 전체 목록 및 획득 현황.
- **Dynamic Items**: 빈 배열로 반환되던 홈 페이지 아이템 API를 `solutions` 테이블 기반으로 정상화.

---

## 5. 제외 사항
- **Leaderboard**: `decoded.pen` 디자인에서 제외됨에 따라 구현하지 않음.
