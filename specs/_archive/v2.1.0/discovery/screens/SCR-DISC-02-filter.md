# [SCR-DISC-02] 필터 시스템 (Filter System)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-DISC-02 |
| **경로** | (컴포넌트 - 헤더 내 위치) |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 4단계 계층형 필터(Category → Media → Cast → Context)로 이미지 필터링
- **선행 조건**: 없음 (메인 화면에 포함)
- **후속 화면**: 필터링된 결과가 홈 피드에 표시
- **관련 기능 ID**: [D-02](../spec.md#d-02-계층형-필터)

---

## 2. UI 와이어프레임

### 2.1 데스크톱 필터바 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [FILTER-BAR]                                                                │
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ [SEL-01]    │ │ [SEL-02]    │ │ [SEL-03]    │ │ [SEL-04]    │            │
│  │ Category ▼  │ │ Media ▼    │ │ Cast ▼      │ │ Context ▼   │            │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │  [BREADCRUMB]                                                            ││
│  │  K-POP > NewJeans > Minji > Stage                    [BTN-CLEAR] Clear  ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 드롭다운 펼침 상태

```
┌─────────────────────────────────────────────────────────────────┐
│  [SEL-01 OPEN]                                                  │
│  ┌─────────────┐                                                │
│  │ Category ▲  │                                                │
│  └─────────────┘                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [DROPDOWN]                                                   ││
│  │                                                              ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ [INP-SEARCH] 🔍 Search...                              │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │ ┌───────────────────────────────────────────────────────┐   ││
│  │ │ [OPT-01] K-POP                               (128)    │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ [OPT-02] K-Drama                              (45)    │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ [OPT-03] K-Movie                              (23)    │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ [OPT-04] K-Variety                            (67)    │   ││
│  │ ├───────────────────────────────────────────────────────┤   ││
│  │ │ [OPT-05] K-Fashion                            (34)    │   ││
│  │ └───────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 모바일 필터 시트 (<768px)

```
┌────────────────────────────────┐
│  [HEADER]                      │
│        [FILTER-BTN] ☰         │
└────────────────────────────────┘

         ↓ FILTER-BTN 클릭

┌────────────────────────────────┐
│  ▬▬▬▬▬▬▬▬ (Drag Handle)        │
├────────────────────────────────┤
│                                │
│  [SHEET-HEADER]                │
│  Filters              [CLEAR]  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Category                 │  │
│  │ ┌──────────────────────┐ │  │
│  │ │ K-POP        ✓       │ │  │
│  │ │ K-Drama              │ │  │
│  │ │ K-Movie              │ │  │
│  │ │ K-Variety            │ │  │
│  │ │ K-Fashion            │ │  │
│  │ └──────────────────────┘ │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Media                    │  │
│  │ ┌──────────────────────┐ │  │
│  │ │ NewJeans      ✓      │ │  │
│  │ │ BLACKPINK            │ │  │
│  │ │ IVE                  │ │  │
│  │ │ aespa                │ │  │
│  │ └──────────────────────┘ │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │   [BTN-APPLY] Apply (3)  │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 데스크톱 필터바

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **SEL-01** | 셀렉트 | Category 드롭다운 | - Placeholder: "Category"<br>- Options: K-POP, K-Drama, etc | **Click**: 드롭다운 열기/닫기<br>**Select**: 상위 필터 → 하위 옵션 갱신 |
| **SEL-02** | 셀렉트 | Media 드롭다운 | - Disabled: Category 미선택 시<br>- Dynamic Options | Category 선택 후 활성화<br>그룹/쇼/드라마 등 표시 |
| **SEL-03** | 셀렉트 | Cast 드롭다운 | - Disabled: Media 미선택 시<br>- Dynamic Options | Media 선택 후 활성화<br>멤버/배우 등 표시 |
| **SEL-04** | 셀렉트 | Context 드롭다운 | - Always Enabled<br>- Options: Stage, Airport, MV, etc | 상황/컨텍스트 필터<br>독립적으로 선택 가능 |
| **INP-SEARCH** | 입력 | 드롭다운 내 검색 | - Placeholder: "Search..."<br>- Debounce: 150ms | 옵션 목록 실시간 필터링 |
| **OPT** | 옵션 | 필터 옵션 | - Hover: 배경색 변경<br>- Selected: 체크마크 | **Click**: 해당 필터 선택 |
| **BREADCRUMB** | 경로 | 선택된 필터 경로 | - Click: 해당 레벨로 복귀 | 상위 레벨 클릭 시 하위 초기화 |
| **BTN-CLEAR** | 버튼 | 전체 초기화 | - Hidden: 필터 없을 때 | **Click**: 모든 필터 초기화 |

### 모바일 필터 시트

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **FILTER-BTN** | 버튼 | 필터 열기 | - Badge: 활성 필터 개수 | **Click**: 바텀시트 열기 |
| **SHEET** | 시트 | 바텀시트 | - Height: 70vh max<br>- Drag: 닫기 제스처 | **Drag Down**: 100px 이상 드래그 시 닫기 |
| **CHIP** | 칩 | 필터 옵션 | - Selected: 채워진 배경<br>- Unselected: 테두리만 | **Tap**: 토글 선택 |
| **BTN-APPLY** | 버튼 | 적용 | - Badge: 선택된 개수 | **Click**: 필터 적용 + 시트 닫기 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **초기** | 필터 없음 | 모든 드롭다운 기본값, Breadcrumb 숨김 |
| **레벨 1 선택** | Category 선택 | Media 활성화, Breadcrumb 1단계 |
| **레벨 2 선택** | Media 선택 | Cast 활성화, Breadcrumb 2단계 |
| **레벨 3 선택** | Cast 선택 | Breadcrumb 3단계 |
| **컨텍스트 선택** | Context 선택 | 독립적으로 추가 |
| **로딩** | 옵션 로드 중 | 드롭다운 내 스피너 |

### 필터 상태 전이 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FILTER STATE MACHINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐  Select Category  ┌─────────┐  Select Media  ┌─────────┐  │
│  │ INITIAL │ ─────────────────▶│ LEVEL_1 │ ──────────────▶│ LEVEL_2 │  │
│  └─────────┘                   └─────────┘                └─────────┘  │
│       ▲                             │                          │       │
│       │                             │ Clear/Change             │       │
│       │                             ▼                          │       │
│       │                        ┌─────────┐                     │       │
│       └────────────────────────│ RESET   │◄────────────────────┘       │
│                                └─────────┘                             │
│                                                                         │
│  [상위 레벨 변경 시 하위 자동 초기화]                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 필터 계층 구조

```typescript
interface FilterHierarchy {
  categories: FilterOption[];  // Level 0: K-POP, K-Drama, etc
  media: Record<string, FilterOption[]>;  // Level 1: categoryId → media[]
  cast: Record<string, FilterOption[]>;   // Level 2: mediaId → cast[]
  context: FilterOption[];     // Independent: Stage, Airport, etc
}

interface FilterOption {
  id: string;
  name: string;
  count: number;  // 해당 필터의 이미지 개수
  icon?: string;
}
```

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| Zustand | `hierarchicalFilterStore.category` | `string \| null` | 선택된 카테고리 |
| Zustand | `hierarchicalFilterStore.media` | `string \| null` | 선택된 미디어 |
| Zustand | `hierarchicalFilterStore.cast` | `string \| null` | 선택된 캐스트 |
| Zustand | `hierarchicalFilterStore.context` | `string[]` | 선택된 컨텍스트 (복수) |
| React Query | `["filters", "options"]` | `QueryKey` | 필터 옵션 캐시 |

### 5.3 이벤트 흐름

```
User Click (Category: K-POP)
    ↓
hierarchicalFilterStore.setCategory('kpop')
    ↓
하위 필터(Media, Cast) 자동 초기화
    ↓
React Query queryKey 변경: ["images", "infinite", { category: 'kpop' }]
    ↓
캐시 미스 → fetchUnifiedImages({ category: 'kpop' }) 호출
    ↓
ThiingsGrid 자동 리렌더링
```

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 500 | 필터 옵션 로드 실패 | "필터를 불러올 수 없습니다" | 재시도 버튼 |
| Empty | 결과 없음 | "해당하는 이미지가 없습니다" | 필터 조정 안내 |

---

## 7. 접근성 (A11y)

### 데스크톱
- **키보드 네비게이션**:
  - Tab: 드롭다운 간 이동
  - Enter/Space: 드롭다운 열기
  - Arrow Up/Down: 옵션 간 이동
  - Escape: 드롭다운 닫기
- **ARIA**: `role="listbox"`, `aria-expanded`, `aria-selected`

### 모바일
- **터치 제스처**: 드래그로 시트 닫기
- **VoiceOver/TalkBack**: 적절한 레이블 제공

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 반응형 래퍼 | HierarchicalFilter | `packages/web/lib/components/filter/HierarchicalFilter.tsx` |
| 데스크톱 | DesktopFilterBar | `packages/web/lib/components/filter/DesktopFilterBar.tsx` |
| 모바일 | MobileFilterSheet | `packages/web/lib/components/filter/MobileFilterSheet.tsx` |
| 드롭다운 | FilterDropdown | `packages/web/lib/components/filter/FilterDropdown.tsx` |
| 옵션 | FilterOption | `packages/web/lib/components/filter/FilterOption.tsx` |
| 브레드크럼 | FilterBreadcrumb | `packages/web/lib/components/filter/FilterBreadcrumb.tsx` |
| 칩 | FilterChip | `packages/web/lib/components/filter/FilterChip.tsx` |
| 스토어 | hierarchicalFilterStore | `packages/shared/stores/hierarchicalFilterStore.ts` |

---

## 9. 구현 체크리스트

- [ ] 데스크톱 드롭다운 필터바
- [ ] 모바일 바텀시트
- [ ] 계층형 필터 로직
- [ ] 상위 변경 시 하위 초기화
- [ ] 브레드크럼 네비게이션
- [ ] 드롭다운 내 검색
- [ ] 옵션별 카운트 표시
- [ ] React Query 연동
- [ ] 반응형 대응
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
