# [SCR-DISC-03] 검색 결과 (Search Results)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-DISC-03 |
| **경로** | `/search?q={query}` |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: People, Media, Items를 통합 검색하고 탭별로 결과 분류 표시
- **선행 조건**: 검색어 입력 (최소 2글자)
- **후속 화면**: Cast 페이지, Media 갤러리, 아이템 상세
- **관련 기능 ID**: [D-04](../spec.md#d-04-unified-search)

---

## 2. UI 와이어프레임

### 2.1 검색 입력 (헤더 내)

```
┌─────────────────────────────────────────────────────────────────────┐
│  [INP-SEARCH]                                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ 🔍 │ Search people, shows, items...                      [×]  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ [DROPDOWN-SUGGEST]                                             │  │
│  │                                                                │  │
│  │ Recent Searches                                        [Clear] │  │
│  │   🕐 jisoo                                                     │  │
│  │   🕐 squid game jacket                                         │  │
│  │                                                                │  │
│  │ ─────────────────────────────────────────────────────────────  │  │
│  │                                                                │  │
│  │ Popular                                                        │  │
│  │   🔥 NewJeans                                                  │  │
│  │   🔥 IVE Wonyoung                                              │  │
│  │   🔥 Airport fashion                                           │  │
│  │                                                                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 검색 결과 페이지 - 데스크톱 (≥768px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [CMN-01 Header]                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  [TXT-QUERY]                                                           │  │
│  │  Results for "jisoo"                                                   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [TABS]                                                                 │  │
│  │ ┌────────────┐ ┌────────────────┐ ┌────────────┐ ┌──────────────────┐  │  │
│  │ │ [TAB-ALL]  │ │ [TAB-PEOPLE]   │ │ [TAB-MEDIA]│ │ [TAB-ITEMS]      │  │  │
│  │ │ All        │ │ People (3)     │ │ Media (1)  │ │ Items (47)       │  │  │
│  │ │ (Active)   │ │                │ │            │ │                  │  │  │
│  │ └────────────┘ └────────────────┘ └────────────┘ └──────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [SECTION-PEOPLE]                                                       │  │
│  │ 👤 People                                             [BTN-SEEALL] →   │  │
│  │                                                                        │  │
│  │ ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │ │ [RESULT-PERSON-01]                                                 │ │  │
│  │ │ ┌──────────┐                                                       │ │  │
│  │ │ │ [AVATAR] │  Jisoo (BLACKPINK)                                    │ │  │
│  │ │ │          │  K-POP • 42 items                            [→]     │ │  │
│  │ │ └──────────┘                                                       │ │  │
│  │ ├────────────────────────────────────────────────────────────────────┤ │  │
│  │ │ [RESULT-PERSON-02]                                                 │ │  │
│  │ │ ┌──────────┐                                                       │ │  │
│  │ │ │ [AVATAR] │  Kim Ji-soo (Actor)                                   │ │  │
│  │ │ │          │  K-Drama • 15 items                          [→]     │ │  │
│  │ │ └──────────┘                                                       │ │  │
│  │ └────────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [SECTION-MEDIA]                                                        │  │
│  │ 🎬 Media                                              [BTN-SEEALL] →   │  │
│  │                                                                        │  │
│  │ ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │ │ [RESULT-MEDIA-01]                                                  │ │  │
│  │ │ ┌──────────┐                                                       │ │  │
│  │ │ │ [POSTER] │  Snowdrop (ft. Jisoo)                                 │ │  │
│  │ │ │          │  Drama • 2021 • 28 items                     [→]     │ │  │
│  │ │ └──────────┘                                                       │ │  │
│  │ └────────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ [SECTION-ITEMS]                                                        │  │
│  │ 👗 Items                                              [BTN-SEEALL] →   │  │
│  │                                                                        │  │
│  │ ┌────────────────────────────────────────────────────────────────────┐ │  │
│  │ │ [GRID-ITEMS]                                                       │ │  │
│  │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │ │  │
│  │ │ │ [ITEM]  │ │ [ITEM]  │ │ [ITEM]  │ │ [ITEM]  │ │ [ITEM]  │       │ │  │
│  │ │ │ Thumb   │ │ Thumb   │ │ Thumb   │ │ Thumb   │ │ Thumb   │       │ │  │
│  │ │ │ Brand   │ │ Brand   │ │ Brand   │ │ Brand   │ │ Brand   │       │ │  │
│  │ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │ │  │
│  │ └────────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 검색 결과 페이지 - 모바일 (<768px)

```
┌────────────────────────────────────┐
│  [Header]                          │
│  [←] Results for "jisoo"           │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐  │
│  │[All][People][Media][Items]   │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  👤 People                    [→]  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │[IMG] Jisoo (BLACKPINK)      │  │
│  │      42 items               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │[IMG] Kim Ji-soo (Actor)     │  │
│  │      15 items               │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  🎬 Media                     [→]  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │[POSTER] Snowdrop            │  │
│  │         Drama • 28 items    │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─────────────────────────────────  │
│                                    │
│  👗 Items                     [→]  │
│                                    │
│  ┌────────┐ ┌────────┐            │
│  │ [ITEM] │ │ [ITEM] │            │
│  └────────┘ └────────┘            │
│  ┌────────┐ ┌────────┐            │
│  │ [ITEM] │ │ [ITEM] │            │
│  └────────┘ └────────┘            │
│                                    │
└────────────────────────────────────┘
```

### 2.4 빈 검색 결과

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  [EMPTY-STATE]                                                     │
│                                                                    │
│                        🔍                                          │
│                                                                    │
│              No results for "xyz"                                  │
│                                                                    │
│         Try different keywords or check spelling                   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Popular Searches                                          │   │
│  │                                                            │   │
│  │  [CHIP] NewJeans  [CHIP] BTS  [CHIP] Airport fashion      │   │
│  │  [CHIP] IVE       [CHIP] Squid Game                       │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 검색 입력 (헤더)

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **INP-SEARCH** | 입력 | 검색 입력 | - Placeholder: "Search people, shows, items..."<br>- Debounce: 250ms | **Input**: 디바운스 후 suggestions 표시<br>**Enter**: 검색 결과 페이지 이동 |
| **BTN-CLEAR** | 버튼 | 검색어 지우기 | - Icon: × <br>- Hidden: 검색어 없을 때 | **Click**: 검색어 초기화 |
| **DROPDOWN-SUGGEST** | 드롭다운 | 검색 제안 | - Position: 입력 아래<br>- Max-height: 400px | 포커스 시 표시, 외부 클릭 시 닫힘 |
| **ITEM-RECENT** | 리스트 | 최근 검색 | - Icon: 🕐<br>- Storage: localStorage | **Click**: 해당 검색어로 검색 |
| **ITEM-POPULAR** | 리스트 | 인기 검색어 | - Icon: 🔥 | **Click**: 해당 검색어로 검색 |
| **BTN-CLEAR-RECENT** | 버튼 | 기록 삭제 | - Style: Text Button | **Click**: localStorage 초기화 |

### 검색 결과 페이지

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **TXT-QUERY** | 텍스트 | 검색어 표시 | - Font: H1<br>- Format: `Results for "{query}"` | - |
| **TAB-ALL** | 탭 | 전체 탭 | - Active: Bold + Underline<br>- Badge: 없음 | **Click**: 전체 결과 표시 |
| **TAB-PEOPLE** | 탭 | People 탭 | - Badge: 결과 개수 | **Click**: People만 필터링 |
| **TAB-MEDIA** | 탭 | Media 탭 | - Badge: 결과 개수 | **Click**: Media만 필터링 |
| **TAB-ITEMS** | 탭 | Items 탭 | - Badge: 결과 개수 | **Click**: Items만 필터링 |
| **SECTION-PEOPLE** | 섹션 | People 결과 | - Header: 👤 People | All 탭에서 최대 3개 표시 |
| **SECTION-MEDIA** | 섹션 | Media 결과 | - Header: 🎬 Media | All 탭에서 최대 3개 표시 |
| **SECTION-ITEMS** | 섹션 | Items 결과 | - Header: 👗 Items | All 탭에서 최대 6개 표시 |
| **BTN-SEEALL** | 버튼 | 더보기 | - Style: Text Link<br>- Icon: → | **Click**: 해당 탭으로 전환 |
| **RESULT-PERSON** | 카드 | Person 결과 | - Avatar: 48×48px<br>- Info: 이름, 카테고리, 아이템 수 | **Click**: `/cast/:id`로 이동 |
| **RESULT-MEDIA** | 카드 | Media 결과 | - Poster: 60×80px<br>- Info: 제목, 타입, 연도, 아이템 수 | **Click**: `/media/:id`로 이동 |
| **ITEM-THUMB** | 썸네일 | Item 결과 | - Size: 100×100px<br>- Border-radius: 8px | **Click**: 이미지 상세 모달 |
| **EMPTY-STATE** | 상태 | 빈 결과 | - Icon: 🔍<br>- Message: 대체 검색 안내 | Popular 검색어 칩 표시 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **입력 대기** | 검색어 없음 | suggestions 드롭다운에 Recent/Popular 표시 |
| **입력 중** | 검색어 1글자 | 검색 비활성 상태 유지 |
| **제안 표시** | 검색어 2글자 이상 | 실시간 자동완성 suggestions |
| **로딩** | 검색 API 요청 중 | 스켈레톤 결과 목록 |
| **결과 표시** | 검색 완료 | 탭별 결과 표시 |
| **빈 결과** | 결과 0개 | Empty State + Popular 검색어 |
| **에러** | API 실패 | 에러 메시지 + 재시도 버튼 |

### 검색 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SEARCH FLOW                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [User Types]                                                           │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────┐    < 2 chars    ┌─────────────────┐                   │
│  │ Input Field │ ───────────────▶│ Show Recent/    │                   │
│  └─────────────┘                 │ Popular Only    │                   │
│       │                          └─────────────────┘                   │
│       │ ≥ 2 chars                                                       │
│       ▼                                                                 │
│  ┌─────────────────┐                                                    │
│  │ Debounce 250ms  │                                                    │
│  └─────────────────┘                                                    │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────┐                                                    │
│  │ Fetch Suggestions│                                                   │
│  └─────────────────┘                                                    │
│       │                                                                 │
│       │ [Enter/Click]                                                   │
│       ▼                                                                 │
│  ┌─────────────────┐                                                    │
│  │ Save to Recent  │                                                    │
│  └─────────────────┘                                                    │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────┐                                                    │
│  │ Navigate to     │                                                    │
│  │ /search?q=xxx   │                                                    │
│  └─────────────────┘                                                    │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────┐    Results = 0    ┌─────────────────┐             │
│  │ Fetch All Types │ ─────────────────▶│ Empty State     │             │
│  └─────────────────┘                   └─────────────────┘             │
│       │                                                                 │
│       │ Results > 0                                                     │
│       ▼                                                                 │
│  ┌─────────────────┐                                                    │
│  │ Display Results │                                                    │
│  │ by Tab          │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 검색 제안 | GET | `/api/search/suggestions?q={query}` | 입력 디바운스 후 | `{ suggestions: string[] }` |
| 통합 검색 | GET | `/api/search?q={query}&type=all` | 페이지 로드 | `{ people, media, items, totalCount }` |
| 인기 검색 | GET | `/api/search/popular` | 드롭다운 열릴 때 | `{ terms: string[] }` |

### 5.2 상태 관리

| 스토어 | 키 | 타입 | 설명 |
|:---|:---|:---|:---|
| Zustand | `searchStore.query` | `string` | 현재 검색어 |
| Zustand | `searchStore.debouncedQuery` | `string` | 디바운스된 검색어 |
| React Query | `["search", query, type]` | `QueryKey` | 검색 결과 캐시 |
| React Query | `["search", "suggestions", query]` | `QueryKey` | 자동완성 캐시 |
| localStorage | `recentSearches` | `string[]` | 최근 검색어 (최대 10개) |

### 5.3 데이터 타입

```typescript
interface SearchResults {
  people: Cast[];
  media: Media[];
  items: Item[];
  totalCount: number;
}

interface Cast {
  id: string;
  name: string;
  nameKo?: string;
  profileImageUrl?: string;
  category: CategoryType;
  itemCount: number;
}

interface Media {
  id: string;
  name: string;
  nameKo?: string;
  type: 'group' | 'show' | 'drama' | 'movie';
  year?: number;
  posterUrl?: string;
  itemCount: number;
}

interface SearchItem {
  id: string;
  thumbnailUrl: string;
  brand?: string;
  productName?: string;
}
```

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---:|:---|:---|:---|
| 400 | 검색어 부적절 | "Please enter a valid search term" | 입력 안내 |
| 500 | 서버 오류 | "Search is temporarily unavailable" | 재시도 버튼 |
| Timeout | 타임아웃 | "Search is taking longer than expected" | 재시도 버튼 |
| Empty | 결과 없음 | "No results for '{query}'" | Popular 검색어 제안 |

---

## 7. 접근성 (A11y)

- **키보드 네비게이션**:
  - Tab: 검색 입력 → 탭 → 결과 아이템 순 이동
  - Arrow Up/Down: suggestions 드롭다운 내 이동
  - Enter: 선택된 suggestion 실행 또는 검색 실행
  - Escape: 드롭다운 닫기
- **ARIA**:
  - `role="combobox"` (검색 입력)
  - `role="listbox"` (suggestions)
  - `role="tablist"`, `role="tab"` (결과 탭)
  - `aria-live="polite"` (결과 개수 알림)
- **포커스 관리**: 검색 실행 시 결과 영역으로 포커스 이동

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 페이지 | SearchPage | `packages/web/app/search/page.tsx` |
| 검색 입력 | SearchInput | `packages/web/lib/components/search/SearchInput.tsx` |
| 제안 드롭다운 | SearchSuggestions | `packages/web/lib/components/search/SearchSuggestions.tsx` |
| 결과 탭 | SearchTabs | `packages/web/lib/components/search/SearchTabs.tsx` |
| 통합 결과 | SearchResults | `packages/web/lib/components/search/SearchResults.tsx` |
| People 결과 | PeopleResultSection | `packages/web/lib/components/search/PeopleResultSection.tsx` |
| Media 결과 | MediaResultSection | `packages/web/lib/components/search/MediaResultSection.tsx` |
| Items 결과 | ItemResultSection | `packages/web/lib/components/search/ItemResultSection.tsx` |
| 빈 결과 | EmptySearchState | `packages/web/lib/components/search/EmptySearchState.tsx` |
| 스토어 | searchStore | `packages/shared/stores/searchStore.ts` |
| 훅 | useSearch | `packages/web/lib/hooks/useSearch.ts` |

---

## 9. 구현 체크리스트

- [ ] 검색 입력 컴포넌트
- [ ] 디바운스 로직 (250ms)
- [ ] 자동완성 suggestions
- [ ] 최근 검색 저장/표시
- [ ] 인기 검색어 API 연동
- [ ] 검색 결과 페이지 레이아웃
- [ ] 탭 네비게이션
- [ ] People 결과 섹션
- [ ] Media 결과 섹션
- [ ] Items 결과 섹션
- [ ] 빈 결과 상태
- [ ] 검색어 하이라이팅
- [ ] 반응형 대응
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
