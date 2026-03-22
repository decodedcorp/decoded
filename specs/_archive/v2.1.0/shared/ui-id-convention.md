# UI ID 명명 규칙

> 버전: v1.0
> 작성일: 2026-01-15

---

## 1. 개요

이 문서는 DECODED 앱의 spec 문서에서 사용하는 UI ID의 명명 규칙을 정의합니다.
일관된 ID 체계는 문서 가독성, 코드 매핑, 테스트 자동화에 도움을 줍니다.

---

## 2. 기본 형식

```
[TYPE]-[SUBTYPE]-[PURPOSE]
```

- **TYPE**: UI 요소의 카테고리 (필수)
- **SUBTYPE**: 하위 분류 또는 대상 (선택)
- **PURPOSE**: 구체적 용도 (선택, 권장)

**예시**:
- `BTN-CLOSE` (버튼 - 닫기)
- `BTN-EDIT-ITEM` (버튼 - 아이템 편집)
- `CARD-IMAGE-FEED` (카드 - 이미지 피드용)

---

## 3. Type 목록

| Type | 설명 | 예시 |
|------|------|------|
| **BTN** | 버튼 | `BTN-SUBMIT`, `BTN-CLOSE`, `BTN-EDIT-ITEM` |
| **IMG** | 이미지 | `IMG-HERO`, `IMG-THUMBNAIL`, `IMG-AVATAR` |
| **CARD** | 카드 컴포넌트 | `CARD-IMAGE`, `CARD-ITEM`, `CARD-PERSON` |
| **INP** | 텍스트 입력 필드 | `INP-SEARCH`, `INP-URL`, `INP-COMMENT` |
| **SEL** | 선택 입력 (드롭다운, 라디오) | `SEL-CATEGORY`, `SEL-FILTER`, `SEL-SORT` |
| **TXT** | 텍스트 표시 | `TXT-TITLE`, `TXT-DESC`, `TXT-PRICE` |
| **LABEL** | 레이블 | `LABEL-ITEM-NAME`, `LABEL-BRAND` |
| **SECTION** | 콘텐츠 섹션 | `SECTION-ITEMS`, `SECTION-COMMENTS` |
| **CONTAINER** | 컨테이너/래퍼 | `CONTAINER-MODAL`, `CONTAINER-SIDEBAR` |
| **GRID** | 그리드 레이아웃 | `GRID-FEED`, `GRID-GALLERY` |
| **MODAL** | 모달 다이얼로그 | `MODAL-LOGIN`, `MODAL-CONFIRM`, `MODAL-REPORT` |
| **POPUP** | 팝업/팝오버 | `POPUP-SPOT-PREVIEW`, `POPUP-MENU` |
| **TAB** | 탭 | `TAB-ITEMS`, `TAB-COMMENTS`, `TAB-TAGS` |
| **NAV** | 네비게이션 | `NAV-HEADER`, `NAV-BOTTOM`, `NAV-BREADCRUMB` |
| **CHART** | 차트/그래프 | `CHART-REVENUE`, `CHART-ACTIVITY` |
| **ICON** | 아이콘 | `ICON-CHECK`, `ICON-ERROR`, `ICON-SEARCH` |
| **BADGE** | 뱃지/태그 | `BADGE-NEW`, `BADGE-COUNT` |
| **ANIM** | 애니메이션 | `ANIM-FLIP-TRANSITION`, `ANIM-FADE-IN` |
| **SPOT** | 스팟 마커 | `SPOT-MARKER`, `SPOT-OVERLAY` |
| **CONNECTOR** | 연결선 | `CONNECTOR-SVG-LINE`, `CONNECTOR-BEZIER` |
| **SKELETON** | 스켈레톤 로딩 | `SKELETON-CARD`, `SKELETON-LIST` |
| **TOAST** | 토스트 알림 | `TOAST-SUCCESS`, `TOAST-ERROR` |

---

## 4. 명명 규칙

### 4.1 버튼 (BTN)

```
BTN-{ACTION}
BTN-{ACTION}-{TARGET}
```

| ID | 설명 |
|----|------|
| `BTN-CLOSE` | 닫기 버튼 |
| `BTN-SUBMIT` | 제출 버튼 |
| `BTN-EDIT` | 편집 버튼 |
| `BTN-DELETE` | 삭제 버튼 |
| `BTN-EDIT-ITEM` | 아이템 편집 버튼 |
| `BTN-BUY-ORIGINAL` | 오리지널 구매 버튼 |
| `BTN-BUY-VIBE` | 바이브 구매 버튼 |
| `BTN-NAV-PREV` | 이전 네비게이션 |
| `BTN-NAV-NEXT` | 다음 네비게이션 |

### 4.2 카드 (CARD)

```
CARD-{TYPE}
CARD-{TYPE}-{VARIANT}
```

| ID | 설명 |
|----|------|
| `CARD-IMAGE` | 이미지 카드 |
| `CARD-ITEM` | 아이템 카드 |
| `CARD-ITEM-ORIGINAL` | 오리지널 아이템 카드 |
| `CARD-ITEM-VIBE` | 바이브 아이템 카드 |
| `CARD-PERSON` | 인물 카드 |
| `CARD-MEDIA` | 미디어 카드 |
| `CARD-STAT` | 통계 카드 |

### 4.3 이미지 (IMG)

```
IMG-{PURPOSE}
```

| ID | 설명 |
|----|------|
| `IMG-HERO` | 히어로/메인 이미지 |
| `IMG-THUMBNAIL` | 썸네일 |
| `IMG-AVATAR` | 프로필 아바타 |
| `IMG-CROP` | 크롭된 이미지 |
| `IMG-PREVIEW` | 미리보기 이미지 |

### 4.4 입력 필드 (INP, SEL)

```
INP-{TARGET}
SEL-{TARGET}
```

| ID | 설명 |
|----|------|
| `INP-SEARCH` | 검색 입력 |
| `INP-URL` | URL 입력 |
| `INP-COMMENT` | 댓글 입력 |
| `INP-BRAND` | 브랜드 입력 |
| `SEL-CATEGORY` | 카테고리 선택 |
| `SEL-FILTER` | 필터 선택 |
| `SEL-SORT` | 정렬 선택 |
| `SEL-CURRENCY` | 통화 선택 |

### 4.5 섹션 및 컨테이너

```
SECTION-{CONTENT}
CONTAINER-{TYPE}
```

| ID | 설명 |
|----|------|
| `SECTION-ITEMS` | 아이템 섹션 |
| `SECTION-COMMENTS` | 댓글 섹션 |
| `SECTION-RELATED` | 관련 콘텐츠 섹션 |
| `CONTAINER-MODAL` | 모달 컨테이너 |
| `CONTAINER-SIDEBAR` | 사이드바 컨테이너 |

---

## 5. 인덱스 기반 ID

반복되는 요소에는 인덱스를 사용할 수 있습니다:

```
{TYPE}-{N}        (권장하지 않음)
{TYPE}-{PURPOSE}-{N}  (권장)
```

| 권장하지 않음 | 권장 |
|--------------|------|
| `CARD-01` | `CARD-ITEM-01` |
| `BTN-01` | `BTN-FILTER-01` |
| `LABEL-01` | `LABEL-ITEM-NAME-01` |

**바운딩 박스 예외**:
```
BBOX-{INDEX}  (검출된 아이템 영역)
예: BBOX-01, BBOX-02, BBOX-03
```

---

## 6. 금지 패턴

다음 패턴은 사용하지 마세요:

| 금지 패턴 | 문제점 | 개선 |
|----------|--------|------|
| `CARD` | 너무 모호함 | `CARD-IMAGE`, `CARD-ITEM` |
| `IMAGE` | 너무 모호함 | `IMG-HERO`, `IMG-THUMBNAIL` |
| `BUTTON-01` | 의미 불명확 | `BTN-SUBMIT`, `BTN-FILTER-01` |
| `BTN-X` | X의 의미 불명확 | `BTN-CLOSE` |
| `CONNECTOR` | 타입 불명확 | `CONNECTOR-SVG-LINE` |
| `FLIP-ANIMATION` | 타입 누락 | `ANIM-FLIP-TRANSITION` |

---

## 7. 화면별 ID Prefix (선택사항)

복잡한 화면에서는 화면 ID를 prefix로 사용할 수 있습니다:

```
{SCREEN}-{TYPE}-{PURPOSE}
```

| ID | 설명 |
|----|------|
| `VIEW-BTN-CLOSE` | 상세뷰의 닫기 버튼 |
| `DISC-CARD-IMAGE` | 디스커버리의 이미지 카드 |
| `CREA-INP-URL` | 생성 화면의 URL 입력 |

> 참고: 일반적으로 화면 prefix 없이도 충분히 구분 가능하면 사용하지 않습니다.

---

## 8. 마이그레이션 가이드

기존 ID를 새 규칙으로 변경할 때 참고하세요:

| 기존 ID | 새 ID | 변경 이유 |
|---------|-------|----------|
| `CARD` | `CARD-IMAGE` | 타입 명확화 |
| `IMAGE` | `IMG-HERO` | 용도 명확화 |
| `BTN-X` | `BTN-CLOSE` | 의미 명확화 |
| `CONNECTOR` | `CONNECTOR-SVG-LINE` | 구현 명확화 |
| `BOX-01` | `BBOX-01` | 바운딩박스 구분 |
| `ORIGINAL-CARD` | `CARD-ITEM-ORIGINAL` | 타입 표준화 |
| `VIBE-CARD` | `CARD-ITEM-VIBE` | 타입 표준화 |
| `FLIP-ANIMATION` | `ANIM-FLIP-TRANSITION` | 타입 추가 |

---

## 9. TypeScript 상수 (권장)

코드에서 ID를 사용할 때는 상수로 관리하는 것을 권장합니다:

```typescript
// packages/web/lib/constants/ui-ids.ts

export const UI_IDS = {
  // Buttons
  BTN_CLOSE: 'btn-close',
  BTN_SUBMIT: 'btn-submit',
  BTN_EDIT_ITEM: 'btn-edit-item',
  BTN_BUY_ORIGINAL: 'btn-buy-original',
  BTN_BUY_VIBE: 'btn-buy-vibe',

  // Cards
  CARD_IMAGE: 'card-image',
  CARD_ITEM: 'card-item',
  CARD_ITEM_ORIGINAL: 'card-item-original',
  CARD_ITEM_VIBE: 'card-item-vibe',

  // Images
  IMG_HERO: 'img-hero',
  IMG_THUMBNAIL: 'img-thumbnail',

  // Forms
  INP_SEARCH: 'inp-search',
  INP_URL: 'inp-url',
  SEL_CATEGORY: 'sel-category',
  SEL_FILTER: 'sel-filter',

  // Spots
  SPOT_MARKER: 'spot-marker',
  SPOT_OVERLAY: 'spot-overlay',
  CONNECTOR_SVG_LINE: 'connector-svg-line',
} as const;

export type UIId = typeof UI_IDS[keyof typeof UI_IDS];
```

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-15 | PM | 초기 작성 |
