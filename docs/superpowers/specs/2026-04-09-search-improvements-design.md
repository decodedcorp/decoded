# 한글 검색 개선 (#75)

## 목표
한글→영문 synonym 매핑을 보완하고, 검색 결과 0건 시 Fallback UI를 추가하여 검색 UX를 개선한다.

## 현재 상태
- Meilisearch 기반 검색 동작 중 (한글 기본 검색 완료 — PR #102)
- synonyms 테이블 존재: BLACKPINK 4명, BTS, ICN/LAX, Chanel
- synonym_manager.rs로 DB→Meilisearch 자동 동기화
- NewJeans 5명 (포스트 300개) synonym 누락
- 결과 0건 시 빈 화면만 표시

## 변경 사항

### 1. Synonym 데이터 보완
**Supabase `synonyms` 테이블 INSERT**

추가할 데이터:
| type | canonical | synonyms |
|------|-----------|----------|
| group | NewJeans | 뉴진스, newjeans, NJ |
| artist | Minji | 민지, minji, 김민지 |
| artist | Danielle | 다니엘, danielle, DANIELLE |
| artist | Hanni | 하니, hanni, HANNI, 팜하니 |
| artist | Haerin | 해린, haerin, HAERIN, 강해린 |
| artist | Hyein | 혜인, hyein, HYEIN, 이혜인 |
| artist | G-Dragon | 지드래곤, GD, 권지용, 지디 |
| artist | Karina | 카리나, karina, 유지민 |
| category | tops | 상의, 탑스 |
| category | bottoms | 하의, 바텀스 |
| category | outerwear | 아우터, 외투, 자켓 |
| category | shoes | 신발, 슈즈 |
| category | bags | 가방, 백 |
| context | airport | 공항, 공항패션 |
| context | stage | 무대, 스테이지 |
| context | mv | 뮤비, 뮤직비디오, music video |

### 2. Fallback UI (검색 결과 0건)
**파일**: `packages/web/app/explore/ExploreClient.tsx`

결과 0건일 때 표시:
- "'{검색어}'에 대한 결과가 없습니다" 메시지
- "이런 검색은 어떨까요?" 섹션: 인기 아티스트 태그 칩 (BLACKPINK, NewJeans 등)
- "검색어 지우기" 버튼 → searchStore.reset()

### 3. Typo Tolerance 확인
Meilisearch 기본 typo tolerance 상태 확인. 필요 시 `minWordSizeForTypos` 조정 (한글은 2글자부터 typo 허용).

## QA 기준
- [ ] "리사" 검색 → Lisa/BLACKPINK 포스트 표시
- [ ] "뉴진스" 검색 → NewJeans 멤버 포스트 표시
- [ ] "민지" 검색 → Minji/NewJeans 포스트 표시
- [ ] "상의" 검색 → tops 카테고리 결과 표시
- [ ] 존재하지 않는 검색어 → Fallback UI 표시
- [ ] Fallback 칩 클릭 → 해당 아티스트 검색 실행

## 브랜치
- `feat/75-search-improvements` (dev 기반, 워크트리)
