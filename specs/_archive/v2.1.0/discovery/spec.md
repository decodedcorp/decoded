# 디스커버리

> 기능: D-01 ~ D-04
> 상태: 50% 구현됨 (D-01 완료, D-02 UI 70%, D-04 부분)
> 의존성: 데이터베이스 계층 구조

---

## 개요

디스커버리 기능은 몰입형 드릴다운 경험을 통해 사용자가 패션 아이템을 탐색하고 찾을 수 있게 합니다. 목표는 넓은 카테고리에서 특정 아이템까지 딥다이브 탐색을 촉진하는 것입니다.

### 관련 화면
- `/` - 홈 피드
- `/search` - 검색 결과
- `/media/[id]` - 미디어 갤러리 (드라마, 그룹)
- `/cast/[id]` - 출연진 페이지

### 현재 구현
- `app/page.tsx` - 무한 스크롤 피드가 있는 홈
- `app/HomeClient.tsx` - 클라이언트 사이드 피드 로직
- `lib/components/grid/ThiingsGrid.tsx` - Masonry 그리드
- `lib/stores/filterStore.ts` - 기본 필터 상태 (2단계만)

---

## 기능

### D-01 반응형 매거진 피드

- **설명**: 모바일은 세로 스크롤 숏폼; 웹은 Pinterest 스타일 Masonry 그리드
- **우선순위**: P0
- **상태**: **구현됨** ✅
- **의존성**: 없음

#### 현재 구현
- `ThiingsGrid.tsx` - 동적 사이징이 적용된 커스텀 Masonry 그리드
- `CardCell.tsx` - 개별 피드 카드
- `useInfiniteFilteredImages()` - 무한 스크롤 데이터 페칭

#### 인수 조건
- [x] 모바일: 전체 너비 카드로 세로 스크롤
- [x] 웹: 멀티 컬럼 Masonry 레이아웃
- [x] 무한 스크롤 페이지네이션
- [x] 로딩 상태 및 스켈레톤
- [x] 부드러운 스크롤 성능 (60fps)
- [x] 이미지 지연 로딩

#### 관련 파일
- `lib/components/grid/ThiingsGrid.tsx`
- `lib/components/grid/CardCell.tsx`
- `lib/hooks/useInfiniteFilteredImages.ts`
- `app/HomeClient.tsx`

#### 향후 개선사항
- [ ] 스켈레톤 로딩 애니메이션
- [ ] 모바일 당겨서 새로고침
- [ ] 그리드 레이아웃 유지

---

### D-02 계층적 필터 (딥 필터)

- **설명**: Category → Media → Cast → Context 순으로 드릴다운 필터링
- **우선순위**: P0
- **상태**: **부분 구현** (UI 70% 완료, 백엔드 미연결)
- **의존성**: Media/Cast 데이터베이스 테이블

#### 현재 구현 상태
- `hierarchicalFilterStore.ts` - 4단계 상태 관리 구현됨
- `DesktopFilterBar.tsx` - 데스크톱 필터바 UI 구현됨
- `MobileFilterSheet.tsx` - 모바일 바텀시트 UI 구현됨
- `FilterDropdown.tsx`, `FilterBreadcrumb.tsx`, `FilterChip.tsx` - 하위 컴포넌트 구현됨
- `mockFilterData.ts` - Mock 데이터로 동작 중 (실제 DB 연결 필요)

#### 인수 조건
- [x] 레벨 1: 카테고리 선택 (K-POP, K-Drama 등)
- [x] 레벨 2: Media/Group 선택 (카테고리 기반 목록 표시)
- [x] 레벨 3: 출연진 선택 (선택된 미디어의 인물)
- [x] 레벨 4: 컨텍스트 선택 (공항, 무대 등)
- [x] 현재 필터 경로를 보여주는 Breadcrumb 네비게이션
- [x] "전체 초기화"로 필터 없음 상태로 리셋
- [ ] 각 레벨 클릭 시 피드 즉시 업데이트 **(백엔드 연결 필요)**
- [ ] URL이 필터 상태를 반영 (공유 가능한 링크) **(미구현)**
- [x] 모바일: 바텀시트 필터 UI
- [x] 웹: 사이드바 또는 가로 필터바

#### 백엔드 의존성 (미구현)
- `media` 테이블 생성 필요
- `cast` 테이블 생성 필요
- `media_cast` 연결 테이블 필요
- `post.media_id` 외래키 추가 필요
- 필터 → 이미지 쿼리 연결 필요

#### UI/UX 요구사항

**데스크톱 필터바**:
```
┌──────────────────────────────────────────────────────────────────┐
│  Category ▼  │  Media/Group ▼  │  Cast ▼  │  Context ▼  │ ✕ Clear│
└──────────────────────────────────────────────────────────────────┘

Selected: K-POP > BTS > Jungkook > Airport
          ↑ 클릭 가능한 breadcrumb으로 뒤로 이동
```

**모바일 필터 (바텀시트)**:
```
┌─────────────────────────────────┐
│  ═══════════════════           │  ← 드래그 핸들
│                                 │
│  🔥 K-POP                      │
│     └─ BTS                     │
│        └─ Jungkook             │
│           └─ Airport ✓         │
│                                 │
│  Other categories...           │
│                                 │
│  [Apply Filter]                │
└─────────────────────────────────┘
```

**필터 드롭다운 (레벨 2 - Media)**:
```
┌─────────────────────────────────┐
│ Select Media/Group              │
├─────────────────────────────────┤
│ 🎵 BTS                    127   │
│ 🎵 BLACKPINK               89   │
│ 🎵 NewJeans                 65   │
│ 🎵 IVE                      54   │
│ 📺 Squid Game               43   │
│ 📺 Crash Course in Romance  28   │
└─────────────────────────────────┘
   ^ 각 항목의 아이템 개수 표시
```

#### 데이터 요구사항

**새 테이블/컬럼**:
- `media` 테이블 (category 참조)
- `cast` 테이블
- `media_cast` 연결 테이블
- `post.media_id` 외래키
- `post.context_type` enum

**필터 API**:
```
GET /api/filters/categories
  → 카운트와 함께 카테고리 목록 반환

GET /api/filters/media?category=K-POP
  → 카테고리별 필터링된 미디어 목록 반환

GET /api/filters/cast?mediaId=xxx
  → 특정 미디어의 출연진 목록 반환

GET /api/filters/contexts
  → 카운트와 함께 컨텍스트 타입 목록 반환
```

#### 상태 관리

```typescript
// lib/stores/filterStore.ts (업데이트)
interface FilterState {
  // 현재 선택
  category: CategoryType | null;
  mediaId: string | null;
  castId: string | null;
  contextType: ContextType | null;

  // 계산된 breadcrumb
  breadcrumb: FilterBreadcrumb[];

  // 각 레벨의 사용 가능한 옵션
  availableMedia: Media[];
  availableCast: Cast[];

  // 액션
  setCategory: (cat: CategoryType | null) => void;
  setMedia: (id: string | null) => void;
  setCast: (id: string | null) => void;
  setContext: (ctx: ContextType | null) => void;
  clearAll: () => void;
  navigateToBreadcrumb: (level: number) => void;
}
```

#### URL 스키마
```
/?category=K-POP
/?category=K-POP&media=bts-uuid
/?category=K-POP&media=bts-uuid&cast=jungkook-uuid
/?category=K-POP&media=bts-uuid&cast=jungkook-uuid&context=airport
```

#### 구현된 파일
- `packages/shared/stores/hierarchicalFilterStore.ts` - 4단계 상태 관리 ✅
- `lib/components/filter/HierarchicalFilter.tsx` - 래퍼 컴포넌트 ✅
- `lib/components/filter/DesktopFilterBar.tsx` - 데스크톱 UI ✅
- `lib/components/filter/MobileFilterSheet.tsx` - 모바일 바텀시트 ✅
- `lib/components/filter/FilterDropdown.tsx` - 드롭다운 ✅
- `lib/components/filter/FilterBreadcrumb.tsx` - Breadcrumb ✅
- `lib/components/filter/FilterChip.tsx` - 필터 칩 ✅
- `packages/shared/data/mockFilterData.ts` - Mock 데이터 ✅

#### 미구현 파일 (백엔드 연결용)
- `lib/hooks/useFilterOptions.ts` - 실제 DB에서 필터 옵션 페치
- `app/api/filters/` - 필터 API 엔드포인트

---

### D-03 미디어 갤러리

- **설명**: 특정 쇼/드라마/그룹의 관련 콘텐츠를 보여주는 전용 페이지
- **우선순위**: P1
- **상태**: 미시작
- **의존성**: D-02 (계층적 필터), Media 테이블

#### 인수 조건
- [ ] `/media/[id]` 라우트가 미디어 상세 표시
- [ ] 미디어 포스터/로고가 있는 Hero 섹션
- [ ] 멤버 그리드가 있는 "주요 출연진" 섹션
- [ ] 이 미디어로 필터링된 모든 게시물
- [ ] 이 미디어의 인기 아이템
- [ ] 관련 미디어 추천

#### UI/UX 요구사항

**미디어 갤러리 레이아웃**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Hero Image]                                               │
│                                                             │
│  🎬 Squid Game                                              │
│  Drama • 2021 • Netflix                                     │
│                                                             │
│  456 items found • 23 contributors                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Featured Cast                                              │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│  │Jung │ │Lee  │ │Park │ │Wi   │                          │
│  │Ho-  │ │Jung-│ │Hae- │ │Ha-  │                          │
│  │yeon │ │jae  │ │soo  │ │joon │                          │
│  │(67) │ │(45) │ │(32) │ │(28) │ ← 아이템 개수             │
│  └─────┘ └─────┘ └─────┘ └─────┘                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  All Items                                    [Filter ▼]    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Masonry Grid of Posts]                             │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- 미디어 상세 (이름, 타입, 연도, 플랫폼, 이미지)
- 미디어 관련 출연진
- media_id로 필터링된 게시물
- 집계 통계

#### API 엔드포인트
```
GET /api/media/:id
  → 출연진 목록과 함께 미디어 상세

GET /api/media/:id/posts?page=1
  → 이 미디어의 페이지네이션된 게시물

GET /api/media/:id/stats
  → 아이템 개수, 기여자 수
```

#### 생성/수정할 파일
- `app/media/[id]/page.tsx` - 미디어 갤러리 페이지
- `lib/components/media/MediaHero.tsx`
- `lib/components/media/CastGrid.tsx`
- `lib/hooks/useMediaDetail.ts`

---

### D-04 통합 검색

- **설명**: 인물, 미디어, 아이템을 탭 결과로 통합 검색
- **우선순위**: P0
- **상태**: 부분 구현 (키워드 검색 존재, 탭 없음)
- **의존성**: 없음

#### 현재 구현
- `lib/stores/searchStore.ts` - 검색 쿼리 상태
- `lib/components/header/SearchInput.tsx` - 검색 입력

#### 인수 조건
- [ ] 헤더에 단일 검색 입력
- [ ] 탭이 있는 결과 페이지: [전체] [인물] [미디어] [아이템]
- [ ] "전체" 탭은 섹션 헤더와 함께 혼합 결과 표시
- [ ] 각 탭은 필터링된 결과 표시
- [ ] 매칭 텍스트 검색 하이라이트
- [ ] 최근 검색 로컬 저장
- [ ] 타이핑 중 검색 제안
- [ ] 인기 검색어가 있는 빈 상태

#### UI/UX 요구사항

**검색 입력 (헤더)**:
```
┌─────────────────────────────────────┐
│ 🔍 Search people, shows, items...  │
└─────────────────────────────────────┘
```

**검색 제안 드롭다운**:
```
┌─────────────────────────────────────┐
│ Recent Searches                     │
│   ji-su                             │
│   squid game jacket                 │
│                                     │
│ Popular                             │
│   NewJeans                          │
│   IVE Wonyoung                     │
│   Airport fashion                   │
└─────────────────────────────────────┘
```

**검색 결과 페이지**:
```
┌─────────────────────────────────────────────────────────────┐
│ Results for "jisoo"                                         │
│                                                             │
│ [All] [People (3)] [Media (1)] [Items (47)]                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👤 People                              [See all →]          │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ [Photo] Jisoo (BLACKPINK) - 42 items               │    │
│ │ [Photo] Kim Ji-soo (Actor) - 15 items              │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ 🎬 Media                               [See all →]          │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ [Poster] Snowdrop (ft. Jisoo) - 28 items           │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ 👗 Items                               [See all →]          │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ [Grid of item thumbnails]                           │    │
│ └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### 데이터 요구사항
- 전문 검색 대상: `cast.name`, `cast.name_ko`, `media.name`, `media.name_ko`, `item.product_name`, `item.brand`
- 성능을 위한 검색 인덱스

#### API 엔드포인트
```
GET /api/search?q=jisoo&type=all
  → 혼합 결과 반환: { people: [], media: [], items: [] }

GET /api/search?q=jisoo&type=people
  → 인물 결과만 반환

GET /api/search/suggestions?q=ji
  → 자동완성 제안 반환

GET /api/search/popular
  → 트렌딩 검색어 반환
```

#### 구현 노트
```typescript
// lib/hooks/useSearch.ts
export function useSearch(query: string, type: 'all' | 'people' | 'media' | 'items') {
  return useQuery({
    queryKey: ['search', query, type],
    queryFn: () => searchApi(query, type),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
}
```

#### 생성/수정할 파일
- `app/search/page.tsx` - 검색 결과 페이지
- `lib/components/search/SearchResults.tsx`
- `lib/components/search/SearchTabs.tsx`
- `lib/components/search/SearchSuggestions.tsx`
- `lib/components/search/PeopleResult.tsx`
- `lib/components/search/MediaResult.tsx`
- `lib/components/search/ItemResult.tsx`
- `lib/hooks/useSearch.ts`

---

## 데이터 모델

전체 타입 정의는 [data-models.md](./data-models.md) 참조.

### 디스커버리 핵심 타입

```typescript
type CategoryType = 'K-POP' | 'K-Drama' | 'K-Movie' | 'K-Variety' | 'K-Fashion';

interface Media {
  id: string;
  type: 'group' | 'show' | 'drama' | 'movie';
  name: string;
  nameKo: string;
  category: CategoryType;
  imageUrl?: string;
}

interface Cast {
  id: string;
  name: string;
  nameKo: string;
  profileImageUrl?: string;
}

interface FilterState {
  category: CategoryType | null;
  mediaId: string | null;
  castId: string | null;
  contextType: ContextType | null;
  breadcrumb: FilterBreadcrumb[];
}

interface SearchResults {
  people: Cast[];
  media: Media[];
  items: Item[];
  totalCount: number;
}
```

---

## 마이그레이션 경로

### 1단계: 데이터베이스 설정
1. 시드 데이터와 함께 `media` 테이블 생성
2. 시드 데이터와 함께 `cast` 테이블 생성
3. `media_cast` 연결 테이블 생성
4. 기존 게시물에 `media_id` 추가
5. 기존 데이터 백필

### 2단계: 필터 UI
1. filterStore를 4단계로 업데이트
2. 필터 컴포넌트 빌드
3. 필터 API 엔드포인트 구현
4. 피드에 연결

### 3단계: 검색
1. 전문 검색이 포함된 검색 API 생성
2. 검색 결과 페이지 빌드
3. 제안 기능 추가

### 4단계: 미디어 갤러리
1. 미디어 상세 페이지 생성
2. 출연진 그리드 컴포넌트 빌드
3. 관련 미디어 로직 추가

---

## 성능 고려사항

- 필터 카운트는 캐시/구체화되어야 함
- 검색은 PostgreSQL 전문 인덱스 사용해야 함
- 무한 스크롤은 커서 페이지네이션 사용해야 함
- 이미지는 블러 placeholder와 함께 지연 로딩되어야 함

---

## 컴포넌트 매핑 (상세 구현 참조)

> 이 섹션은 각 UI 요소가 실제 코드에서 어떻게 구현되는지 매핑합니다.

### D-01 매거진 피드 - 컴포넌트 매핑

#### UI 다이어그램 + 컴포넌트 매핑

```
┌────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ [Logo]                              [🔍]  [♡]  [👤]                    │ │
│ │   └─ Link to /                       │     │     └─ AuthButton.tsx     │ │
│ │                                      │     └─ WishlistButton (미구현)  │ │
│ │                                      └─ SearchInput.tsx                │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ 컴포넌트: packages/web/lib/components/layout/Header.tsx                    │
│ 상태: 없음 (stateless)                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│ FILTER BAR (Desktop)                                                        │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ [All ▼] [Media ▼] [Cast ▼] [Context ▼]              [🔍 Search...]    │ │
│ │    │        │         │         │                         │            │ │
│ │    │        │         │         │                         └─ 검색 입력 │ │
│ │    │        │         │         └─ contextType 필터                    │ │
│ │    │        │         └─ castId 필터                                   │ │
│ │    │        └─ mediaId 필터                                            │ │
│ │    └─ category 필터                                                    │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ 컴포넌트: packages/web/lib/components/filter/DesktopFilterBar.tsx (예정)   │
│ 현재구현: packages/web/lib/components/filter/FilterTabs.tsx (2-level)      │
│ 상태: filterStore (Zustand)                                                │
├────────────────────────────────────────────────────────────────────────────┤
│ MASONRY GRID                                                                │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ ┌─────────┐ ┌─────────────┐ ┌─────────┐                               │ │
│ │ │ CardCell│ │  CardCell   │ │ CardCell│  ← 개별 이미지 카드           │ │
│ │ │ (이미지)│ │  (긴 이미지) │ │ (이미지)│     onClick → 상세 모달      │ │
│ │ │ ┌─────┐ │ │  ┌───────┐  │ │ ┌─────┐ │                               │ │
│ │ │ │아이템│ │ │  │아이템 │  │ │ │아이템│ │  ← 아이템 개수 배지          │ │
│ │ │ │개수 │ │ │  │개수   │  │ │ │개수 │ │                               │ │
│ │ │ └─────┘ │ │  └───────┘  │ │ └─────┘ │                               │ │
│ │ └─────────┘ └─────────────┘ └─────────┘                               │ │
│ │                                                                        │ │
│ │ ┌─────────────┐ ┌─────────┐ ┌─────────────┐                           │ │
│ │ │  CardCell   │ │ CardCell│ │  CardCell   │                           │ │
│ │ │             │ │         │ │             │                           │ │
│ │ └─────────────┘ └─────────┘ └─────────────┘                           │ │
│ │                                                                        │ │
│ │        ↓ 스크롤 하단 50px 접근 시 자동 로딩                            │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐ │ │
│ │ │              [Loading Spinner / Skeleton]                          │ │ │
│ │ └────────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ 컴포넌트: packages/web/lib/components/grid/ThiingsGrid.tsx                 │
│ 자식: packages/web/lib/components/grid/CardCell.tsx                        │
│ 훅: packages/web/lib/hooks/useInfiniteFilteredImages.ts                    │
│ 상태: React Query (images cache), filterStore (필터)                       │
└────────────────────────────────────────────────────────────────────────────┘
```

#### ThiingsGrid 컴포넌트 상세

| 속성 | 타입 | 설명 |
|------|------|------|
| `columnCount` | `number` | 컬럼 수 (반응형: 2-5) |
| `gap` | `number` | 카드 간격 (px) |
| `observerMargin` | `string` | IntersectionObserver 마진 |

#### CardCell 컴포넌트 상세

| 요소 | 동작 | 상태 변경 | 파일 |
|------|------|----------|------|
| 이미지 영역 | 클릭 시 상세 모달 | `transitionStore.prepare()` | CardCell.tsx:45 |
| 아이템 배지 | 아이템 개수 표시 | - | CardCell.tsx:72 |
| 호버 효과 | 이미지 확대 | CSS transform | CardCell.tsx:23 |

#### 이벤트 흐름 다이어그램

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        D-01 피드 이벤트 흐름                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [페이지 로드]                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  HomeClient.tsx                                                          │
│       │                                                                  │
│       ├─── useInfiniteFilteredImages() ────────────────────┐             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    queryKey: ["images", "infinite",                │             │
│       │              { accountId, limit, search }]         │             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    fetchUnifiedImages()                            │             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    Supabase RPC ──► PostgreSQL                     │             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    normalizeImage() → UiImage[]                    │             │
│       │                                          캐시 저장 │             │
│       │                                          (5분 gcTime)            │
│       ▼                                                                  │
│  ThiingsGrid.tsx                                                         │
│       │                                                                  │
│       ├─── IntersectionObserver ───────────────────────────┐             │
│       │         │                                          │             │
│       │    하단 50px 접근?                                 │             │
│       │         │                                          │             │
│       │    YES  ▼                                          │             │
│       │    fetchNextPage() ─────────────────────────────►  │             │
│       │                                        다음 페이지 로드          │
│       │                                                                  │
│       ▼                                                                  │
│  CardCell.tsx (각 이미지)                                                │
│       │                                                                  │
│       ├─── onClick ────────────────────────────────────────┐             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    transitionStore.prepare(rect, imageId)          │             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    router.push(`/(.)images/${id}`, { scroll: false })            │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    GSAP FLIP 애니메이션 시작                       │             │
│       │         │                                          │             │
│       │         ▼                                          │             │
│       │    DetailModal 렌더링                              │             │
│       │                                                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

#### 상태 동기화 패턴

```typescript
// 필터 변경 시 데이터 갱신 흐름
filterStore.setFilter({ accountId: 'xxx' })
    ↓
// React Query queryKey 변경 감지
queryKey: ["images", "infinite", { accountId: 'xxx', ... }]
    ↓
// 캐시 미스 → 새로운 데이터 fetch
fetchUnifiedImages({ accountId: 'xxx', cursor: null })
    ↓
// 그리드 자동 리렌더링
ThiingsGrid → CardCell[] 업데이트
```

---

### D-02 계층적 필터 - 컴포넌트 매핑

#### 데스크톱 필터바 상세

```
┌────────────────────────────────────────────────────────────────────────────┐
│ DESKTOP FILTER BAR                                                         │
│                                                                            │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│ │ All ▼   │  │ Media ▼  │  │ Cast ▼   │  │Context ▼ │  │🔍 Search...  │  │
│ └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│      │             │             │             │                │          │
│      ▼             ▼             ▼             ▼                ▼          │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │ 드롭다운 메뉴 (FilterDropdown.tsx)                                   │  │
│ │ ┌────────────────────────────────────────────────────────────────┐  │  │
│ │ │ ○ K-POP                                                  127  │  │  │
│ │ │ ○ K-Drama                                                 89  │  │  │
│ │ │ ● K-Variety (선택됨)                                      65  │  │  │
│ │ │ ○ K-Movie                                                 43  │  │  │
│ │ └────────────────────────────────────────────────────────────────┘  │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│ 컴포넌트 구조:                                                             │
│ ├─ DesktopFilterBar.tsx (예정)                                            │
│ │   ├─ FilterDropdown.tsx (Level 1: Category)                             │
│ │   │   └─ FilterOption.tsx (각 옵션)                                     │
│ │   ├─ FilterDropdown.tsx (Level 2: Media)                                │
│ │   ├─ FilterDropdown.tsx (Level 3: Cast)                                 │
│ │   ├─ FilterDropdown.tsx (Level 4: Context)                              │
│ │   └─ SearchInput.tsx                                                    │
│ └─ FilterBreadcrumb.tsx (선택된 필터 경로 표시)                            │
│                                                                            │
│ 상태 관리: filterStore (Zustand)                                           │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 모바일 필터 바텀시트 상세

```
┌─────────────────────────────────────────┐
│ MOBILE FILTER BOTTOM SHEET              │
│                                         │
│  ═══════════════════                    │  ← 드래그 핸들
│  ┌───────────────────────────────────┐  │     onDragEnd → 닫기/열기
│  │ Select Category                   │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ 🔥 K-POP                 127│  │  │  ← 터치 시 선택
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ 🎬 K-Drama               89 │  │  │
│  │  └─────────────────────────────┘  │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ 📺 K-Variety        ✓    65 │  │  │  ← 선택된 항목
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  다음 레벨로 이동 →               │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │        [Apply Filter]             │  │  ← 터치 시 필터 적용
│  └───────────────────────────────────┘  │     filterStore.apply()
│                                         │
│ 컴포넌트: MobileFilterSheet.tsx (예정)  │
│ 애니메이션: Motion (spring transition) │
│ 상태: filterStore + 로컬 임시 상태     │
└─────────────────────────────────────────┘
```

#### 필터 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    D-02 필터 이벤트 흐름                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [사용자 액션: 필터 드롭다운 클릭]                                        │
│       │                                                                  │
│       ▼                                                                  │
│  FilterDropdown.tsx                                                      │
│       │                                                                  │
│       ├─── onClick (드롭다운 열기) ───────────────────────┐              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    setOpen(true)                                  │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    useFilterOptions() 호출                        │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    Supabase 쿼리 (필터 옵션 + 카운트)             │              │
│       │                                                   │              │
│       ▼                                                   │              │
│  FilterOption.tsx (옵션 선택)                             │              │
│       │                                                   │              │
│       ├─── onClick (옵션 선택) ───────────────────────────┤              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    filterStore.setCategory('K-POP')               │              │
│       │         │                                         │              │
│       │         ├─── 하위 레벨 초기화                      │              │
│       │         │    filterStore.setMedia(null)           │              │
│       │         │    filterStore.setCast(null)            │              │
│       │         │                                         │              │
│       │         ├─── Breadcrumb 업데이트                   │              │
│       │         │    breadcrumb: [{ level: 'category',    │              │
│       │         │                   value: 'K-POP' }]     │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    URL 업데이트                                   │              │
│       │    router.push('/?category=K-POP')                │              │
│       │                                                   │              │
│       ▼                                                   │              │
│  React Query 자동 갱신                                    │              │
│       │                                                   │              │
│       ├─── queryKey 변경 감지 ────────────────────────────┤              │
│       │    ["images", "infinite", { category: 'K-POP' }]  │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    fetchUnifiedImages({ category: 'K-POP' })      │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    그리드 리렌더링                                 │              │
│       │                                                   │              │
└──────────────────────────────────────────────────────────────────────────┘
```

#### filterStore 상태 전이

```
┌────────────────────────────────────────────────────────────────────────┐
│                    filterStore 상태 전이                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [초기 상태]                                                           │
│  {                                                                     │
│    category: null,                                                     │
│    mediaId: null,                                                      │
│    castId: null,                                                       │
│    contextType: null,                                                  │
│    breadcrumb: []                                                      │
│  }                                                                     │
│       │                                                                │
│       │ setCategory('K-POP')                                           │
│       ▼                                                                │
│  [Level 1 선택]                                                        │
│  {                                                                     │
│    category: 'K-POP',                                                  │
│    mediaId: null,      ← 하위 레벨 자동 초기화                         │
│    castId: null,                                                       │
│    contextType: null,                                                  │
│    breadcrumb: [{ level: 0, label: 'K-POP', type: 'category' }]       │
│  }                                                                     │
│       │                                                                │
│       │ setMedia('bts-uuid')                                           │
│       ▼                                                                │
│  [Level 2 선택]                                                        │
│  {                                                                     │
│    category: 'K-POP',                                                  │
│    mediaId: 'bts-uuid',                                                │
│    castId: null,       ← 하위 레벨 자동 초기화                         │
│    contextType: null,                                                  │
│    breadcrumb: [                                                       │
│      { level: 0, label: 'K-POP', type: 'category' },                  │
│      { level: 1, label: 'BTS', type: 'media' }                        │
│    ]                                                                   │
│  }                                                                     │
│       │                                                                │
│       │ navigateToBreadcrumb(0)  ← Breadcrumb 클릭                     │
│       ▼                                                                │
│  [Level 1로 복귀]                                                      │
│  {                                                                     │
│    category: 'K-POP',                                                  │
│    mediaId: null,      ← 해당 레벨 이하 초기화                         │
│    castId: null,                                                       │
│    contextType: null,                                                  │
│    breadcrumb: [{ level: 0, label: 'K-POP', type: 'category' }]       │
│  }                                                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### D-04 통합 검색 - 컴포넌트 매핑

#### 검색 UI 컴포넌트 상세

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SEARCH INPUT (Header)                                                       │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔍 │ Search people, shows, items...                              [×]  │ │
│ └──┬───────────────────────────────────────────────────────────────┬────┘ │
│    │                                                               │      │
│    │ ┌─────────────────────────────────────────────────────────────┴────┐ │
│    │ │ SUGGESTIONS DROPDOWN (SearchSuggestions.tsx)                     │ │
│    │ │ ┌────────────────────────────────────────────────────────────┐  │ │
│    │ │ │ Recent Searches                                    [Clear] │  │ │
│    │ │ │   🕐 jisoo                                      ← 클릭 시  │  │ │
│    │ │ │   🕐 squid game                                   검색 실행│  │ │
│    │ │ ├────────────────────────────────────────────────────────────┤  │ │
│    │ │ │ Popular                                                    │  │ │
│    │ │ │   🔥 NewJeans                                              │  │ │
│    │ │ │   🔥 IVE Wonyoung                                          │  │ │
│    │ │ └────────────────────────────────────────────────────────────┘  │ │
│    │ └──────────────────────────────────────────────────────────────────┘ │
│    │                                                                      │
│    └─ 입력값 변경 (250ms debounce) → searchStore.setQuery()               │
│                                                                            │
│ 컴포넌트: packages/web/lib/components/header/SearchInput.tsx               │
│ 훅: useDebounce(query, 250)                                               │
│ 상태: searchStore (Zustand)                                               │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 검색 결과 페이지 상세

```
┌────────────────────────────────────────────────────────────────────────────┐
│ SEARCH RESULTS PAGE (/search?q=jisoo)                                       │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ Results for "jisoo"                                                    │ │
│ │                                                                        │ │
│ │ ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────────┐           │ │
│ │ │   All    │ │ People (3)   │ │ Media(1) │ │  Items (47)  │           │ │
│ │ │ (active) │ │              │ │          │ │              │           │ │
│ │ └────┬─────┘ └──────────────┘ └──────────┘ └──────────────┘           │ │
│ │      │                                                                 │ │
│ │      └─ onClick → setActiveTab('all' | 'people' | 'media' | 'items') │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ 컴포넌트: SearchTabs.tsx                                                   │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ 👤 People                                              [See all →]    │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐  │ │
│ │ │ ┌─────────────────────────────────────────────────────────────┐ │  │ │
│ │ │ │ [Photo] │ Jisoo (BLACKPINK)                                 │ │  │ │
│ │ │ │         │ 42 items                              [→]        │ │  │ │
│ │ │ └─────────────────────────────────────────────────────────────┘ │  │ │
│ │ │ ┌─────────────────────────────────────────────────────────────┐ │  │ │
│ │ │ │ [Photo] │ Kim Ji-soo (Actor)                                │ │  │ │
│ │ │ │         │ 15 items                              [→]        │ │  │ │
│ │ │ └─────────────────────────────────────────────────────────────┘ │  │ │
│ │ └──────────────────────────────────────────────────────────────────┘  │ │
│ │ 컴포넌트: PeopleResultSection.tsx                                     │ │
│ │ 자식: PeopleResultItem.tsx                                           │ │
│ │ onClick → router.push(`/cast/${castId}`)                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ 🎬 Media                                               [See all →]    │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐  │ │
│ │ │ [Poster] │ Snowdrop (ft. Jisoo)                                  │  │ │
│ │ │          │ Drama • 2021 • 28 items                   [→]        │  │ │
│ │ └──────────────────────────────────────────────────────────────────┘  │ │
│ │ 컴포넌트: MediaResultSection.tsx                                      │ │
│ │ onClick → router.push(`/media/${mediaId}`)                           │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ 👗 Items                                               [See all →]    │ │
│ │ ┌──────────────────────────────────────────────────────────────────┐  │ │
│ │ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │  │ │
│ │ │ │Item │ │Item │ │Item │ │Item │ │Item │  ← 그리드 형태         │  │ │
│ │ │ │Thumb│ │Thumb│ │Thumb│ │Thumb│ │Thumb│                        │  │ │
│ │ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                        │  │ │
│ │ └──────────────────────────────────────────────────────────────────┘  │ │
│ │ 컴포넌트: ItemResultSection.tsx                                       │ │
│ │ 자식: ItemThumbnail.tsx                                              │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│ 페이지: packages/web/app/search/page.tsx                                   │
│ 훅: useSearch(query, activeTab)                                           │
│ 상태: searchStore (query), 로컬 state (activeTab)                         │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 검색 이벤트 흐름

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    D-04 검색 이벤트 흐름                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [사용자 입력: 검색어 타이핑]                                            │
│       │                                                                  │
│       ▼                                                                  │
│  SearchInput.tsx                                                         │
│       │                                                                  │
│       ├─── onChange ──────────────────────────────────────┐              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    setLocalQuery(value)                           │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    useDebounce(localQuery, 250ms)                 │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    debouncedQuery 변경 감지                        │              │
│       │         │                                         │              │
│       │         ├── 길이 >= 2?                            │              │
│       │         │      │                                  │              │
│       │         │  YES ▼                                  │              │
│       │         │  searchStore.setQuery(debouncedQuery)   │              │
│       │         │      │                                  │              │
│       │         │      ▼                                  │              │
│       │         │  useSuggestions() 호출                  │              │
│       │         │      │                                  │              │
│       │         │      ▼                                  │              │
│       │         │  드롭다운에 suggestions 표시            │              │
│       │         │                                         │              │
│       ▼         │                                         │              │
│  [Enter 키 또는 검색 버튼 클릭]                            │              │
│       │                                                   │              │
│       ├─── onSubmit ──────────────────────────────────────┤              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    addToRecentSearches(query)                     │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    router.push(`/search?q=${query}`)              │              │
│       │                                                   │              │
│       ▼                                                   │              │
│  /search/page.tsx                                         │              │
│       │                                                   │              │
│       ├─── useSearch(query, 'all') ──────────────────────┤              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    Supabase full-text search                      │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    {                                              │              │
│       │      people: Cast[],                              │              │
│       │      media: Media[],                              │              │
│       │      items: Item[]                                │              │
│       │    }                                              │              │
│       │         │                                         │              │
│       │         ▼                                         │              │
│       │    SearchResults 렌더링                           │              │
│       │                                                   │              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 엣지 케이스 및 에러 처리

### D-01 매거진 피드

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 이미지 0개 | EmptyState 컴포넌트 표시 | ThiingsGrid.tsx:89 |
| 네트워크 오류 | ErrorBoundary + 재시도 버튼 | HomeClient.tsx:45 |
| 이미지 로드 실패 | placeholder 이미지 표시 | CardCell.tsx:112 |
| 무한 스크롤 끝 | "No more items" 표시 | ThiingsGrid.tsx:134 |

### D-02 계층적 필터

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 필터 결과 0개 | "No items match" + 필터 초기화 버튼 | FilterResults.tsx |
| 옵션 로딩 지연 | 스피너 표시 | FilterDropdown.tsx |
| URL 파라미터 무효 | 기본값으로 fallback | useFilterFromURL.ts |

### D-04 통합 검색

| 상황 | 처리 방법 | 구현 위치 |
|------|----------|----------|
| 검색어 2글자 미만 | 검색 비활성화 | useSearch.ts:12 |
| 검색 결과 0개 | EmptySearchState 표시 | SearchResults.tsx |
| 검색 타임아웃 | 재시도 옵션 | useSearch.ts:34 |

---

## 구현 상태 체크리스트

### D-01 매거진 피드
- [x] 기본 그리드 렌더링
- [x] 무한 스크롤
- [x] 이미지 lazy loading
- [x] 반응형 컬럼 조정
- [ ] Pull-to-refresh (모바일)
- [ ] 스켈레톤 애니메이션

### D-02 계층적 필터
- [x] 4-level 필터 UI (`hierarchicalFilterStore.ts`)
- [x] 드롭다운 컴포넌트 (`FilterDropdown.tsx`)
- [x] Breadcrumb 네비게이션 (`FilterBreadcrumb.tsx`)
- [x] 모바일 바텀시트 (`MobileFilterSheet.tsx`)
- [ ] URL 상태 동기화 **(미구현)**
- [~] 필터 카운트 표시 (Mock 데이터만)
- [ ] 백엔드 연결 (DB 테이블 + API)
- [ ] 피드 쿼리 연동

### D-03 미디어 갤러리
- [ ] 미디어 상세 페이지
- [ ] Hero 섹션
- [ ] Cast 그리드
- [ ] 관련 미디어

### D-04 통합 검색
- [x] 기본 검색 입력
- [x] 검색 쿼리 상태
- [ ] 탭 기반 결과 분류
- [ ] 자동완성 suggestions
- [ ] 최근 검색 기록
- [ ] Full-text 검색 인덱스
