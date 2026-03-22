# [SCR-MOBL-01] 홈 화면 (Home Screen)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-MOBL-01 |
| **경로** | `/(tabs)/` |
| **작성일** | 2026-01-15 |
| **버전** | v1.1 |
| **상태** | 구현됨 (80%) |

---

## 1. 화면 개요

- **목적**: 이미지 피드를 2열 그리드로 탐색, 무한 스크롤 지원
- **선행 조건**: Supabase 초기화 완료
- **후속 화면**: 이미지 상세 (SCR-MOBL-02)
- **관련 기능 ID**: [M-03](../spec.md#m-03-홈-화면-이미지-그리드)

---

## 2. UI 와이어프레임

```
┌────────────────────────────────┐
│  [Status Bar]                  │
├────────────────────────────────┤
│  [Tab Bar - Home 활성화]       │
├────────────────────────────────┤
│                                │
│  ┌────────────┐ ┌────────────┐ │
│  │ [CARD-01]  │ │ [CARD-02]  │ │
│  │            │ │            │ │
│  │    IMG     │ │    IMG     │ │
│  │   (1:1.25) │ │   (1:1.25) │ │
│  │            │ │            │ │
│  └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ │
│  │ [CARD-03]  │ │ [CARD-04]  │ │
│  │            │ │            │ │
│  │    IMG     │ │    IMG     │ │
│  │            │ │            │ │
│  └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ │
│  │ [CARD-05]  │ │ [CARD-06]  │ │
│  │    ...     │ │    ...     │ │
│  └────────────┘ └────────────┘ │
│                                │
│  ... (Infinite Scroll)         │
│                                │
│  ┌──────────────────────────┐  │
│  │   [ActivityIndicator]    │  │
│  │   Loading more...        │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---|:---|:---|:---|:---|
| MOBL-01-001 | 컨테이너 | FlatList | flex: 1, numColumns: 2 | 무한 스크롤 |
| MOBL-01-002 | 카드 | ImageCard | width: (화면폭-12)/2, height: width*1.25 | 탭 → 상세 이동 |
| MOBL-01-003 | 이미지 | Image | resizeMode: cover, borderRadius: 8 | - |
| MOBL-01-004 | 로딩 | ActivityIndicator | 초기 로딩, 추가 로딩 | - |
| MOBL-01-005 | 빈 상태 | EmptyView | "No images found" | - |

---

## 4. 인터랙션 명세

### 4.1 무한 스크롤
```
사용자가 스크롤
    │
    ▼ onEndReached (threshold: 0.5)
    │
    ├─ hasNextPage && !isFetchingNextPage?
    │      │
    │      ├─ Yes: fetchNextPage()
    │      │        └─ 40개 추가 로드
    │      │
    │      └─ No: 대기
    │
    ▼
다음 페이지 렌더링
```

### 4.2 이미지 탭
```
사용자가 카드 탭
    │
    ▼ Link href={`/images/${item.id}`}
    │
    ▼
SCR-MOBL-02 상세 화면으로 이동
```

---

## 5. 컴포넌트 Props 명세

### 5.1 ImageCard Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|:---|:---|:---:|:---|:---|
| `item` | `ImageWithPostId` | Y | - | 이미지 데이터 객체 |
| `width` | `number` | Y | - | 카드 너비 (픽셀) |
| `height` | `number` | Y | - | 카드 높이 (픽셀) |
| `onPress` | `() => void` | N | - | 탭 이벤트 핸들러 |
| `testID` | `string` | N | - | E2E 테스트 식별자 |

### 5.2 FilterTab Props (미구현)

| Prop | 타입 | 필수 | 기본값 | 설명 |
|:---|:---|:---:|:---|:---|
| `filters` | `FilterKey[]` | Y | - | 필터 옵션 배열 |
| `activeFilter` | `FilterKey` | Y | - | 현재 선택된 필터 |
| `onFilterChange` | `(filter: FilterKey) => void` | Y | - | 필터 변경 핸들러 |

### 5.3 타입 정의

```typescript
interface ImageWithPostId {
  id: string;
  image_url: string | null;
  created_at: string;
  postImages?: Array<{
    post?: { account: string };
  }>;
}

type FilterKey = "all" | "newjeans" | "blackpink" | "ive" | string;
```

---

## 6. 디자인 토큰

### 6.1 색상

| 토큰 | Light Mode | Dark Mode | 용도 |
|:---|:---|:---|:---|
| `--background` | `#FFFFFF` | `#000000` | 화면 배경 |
| `--card-bg` | `#F0F0F0` | `#1C1C1E` | 카드 플레이스홀더 |
| `--text-primary` | `#1A1A1A` | `#FAFAFA` | 기본 텍스트 |
| `--text-muted` | `rgba(0,0,0,0.5)` | `rgba(255,255,255,0.5)` | 보조 텍스트 |
| `--border` | `rgba(0,0,0,0.1)` | `rgba(255,255,255,0.1)` | 구분선 |

### 6.2 타이포그래피

| 요소 | fontSize | fontWeight | lineHeight |
|:---|:---:|:---:|:---:|
| 로딩 텍스트 | 14 | 400 | 20 |
| 빈 상태 텍스트 | 16 | 400 | 22 |
| 필터 탭 (미구현) | 14 | 600 | 20 |

### 6.3 간격 (4px 기준)

| 요소 | 값 | 설명 |
|:---|:---|:---|
| 그리드 갭 | 4px | 카드 사이 간격 |
| 리스트 패딩 | 4px | FlatList 내부 여백 |
| 카드 border-radius | 8px | 모서리 둥글기 |
| 푸터 패딩 | 20px | 로딩 인디케이터 여백 |

---

## 7. 상태 관리 상세

### 7.1 React Query 설정

| 키 | 쿼리 키 구조 | staleTime | gcTime |
|:---|:---|:---:|:---:|
| 이미지 목록 | `["images", "infinite", { filter, search, limit, deduplicateByImageId }]` | 60초 | 5분 |

```typescript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
  useInfiniteFilteredImages({
    limit: 40,
    filter: activeFilter,
    search: "",
    deduplicateByImageId: true,
  });
```

### 7.2 Zustand 스토어

**filterStore**:
```typescript
interface FilterStore {
  activeFilter: FilterKey;
  setFilter: (f: FilterKey) => void;
}

const { activeFilter } = useFilterStore();
```

### 7.3 로컬 상태

| 상태 | 타입 | 초기값 | 용도 |
|:---|:---|:---|:---|
| `items` | `ImageWithPostId[]` | `[]` | 평탄화된 이미지 배열 |
| `isInitialized` | `boolean` | `false` | Supabase 초기화 상태 |

### 7.4 데이터 흐름

```
useSupabase() → isInitialized
    │
    ├─ false → 초기화 UI
    │
    └─ true → useInfiniteFilteredImages()
                   │
                   ├─ isLoading → 로딩 UI
                   │
                   └─ data → FlatList 렌더링
                              │
                              └─ items = data.pages.flatMap(p => p.items)
```

---

## 8. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---|:---|:---|:---|
| `NETWORK_ERROR` | 네트워크 끊김 | "네트워크 연결을 확인해주세요" | 재시도 버튼 표시 |
| `SUPABASE_ERROR` | Supabase 쿼리 실패 | "이미지를 불러올 수 없습니다" | 에러 바운더리 + 재시도 |
| `TIMEOUT` | 요청 타임아웃 | "로딩이 지연되고 있습니다" | 자동 재시도 (3회) |
| `NOT_INITIALIZED` | Supabase 미초기화 | "Initializing..." | 로딩 UI 유지 |

### 에러 UI 와이어프레임

```
┌────────────────────────────────┐
│                                │
│      [Error Icon]              │
│                                │
│   "이미지를 불러올 수 없습니다"  │
│                                │
│      [재시도 버튼]              │
│                                │
└────────────────────────────────┘
```

---

## 9. 로딩 상태 상세

### 9.1 상태별 UI

| 상태 | UI | 조건 |
|:---|:---|:---|
| 초기화 중 | ActivityIndicator + "Initializing..." | !isInitialized |
| 로딩 중 | ActivityIndicator + "Loading images..." | isLoading |
| 추가 로딩 | Footer ActivityIndicator | isFetchingNextPage |
| 빈 상태 | "No images found" | items.length === 0 |

### 9.2 초기 로딩 와이어프레임

```
┌────────────────────────────────┐
│                                │
│     [ActivityIndicator]        │
│     ● ● ● (회전)               │
│                                │
│     "Loading images..."        │
│                                │
└────────────────────────────────┘
```

### 9.3 스켈레톤 로딩 (미구현)

**구현 계획**:
- `react-native-skeleton-placeholder` 사용
- 카드 형태의 shimmer 효과
- 2열 그리드 유지

```
┌────────────────────────────────┐
│  ┌────────────┐ ┌────────────┐ │
│  │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │
│  │ ░ SHIMMER ░│ │ ░ SHIMMER ░│ │
│  │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │
│  └────────────┘ └────────────┘ │
│  ┌────────────┐ ┌────────────┐ │
│  │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │
│  │ ░░░░░░░░░░ │ │ ░░░░░░░░░░ │ │
│  └────────────┘ └────────────┘ │
└────────────────────────────────┘
```

---

## 10. 접근성 (A11y)

### 10.1 VoiceOver/TalkBack 지원

| 요소 | accessibilityLabel | accessibilityRole | accessibilityHint |
|:---|:---|:---|:---|
| 이미지 카드 | "이미지, 상세 보기" | `button` | "탭하여 상세 화면으로 이동" |
| 로딩 상태 | "로딩 중" | `progressbar` | - |
| 빈 상태 | "검색 결과 없음" | `text` | - |
| 필터 탭 (미구현) | "{필터명} 필터" | `tab` | "탭하여 필터 적용" |

### 10.2 터치 타겟

| 요소 | 최소 크기 | 현재 크기 | 상태 |
|:---|:---|:---|:---:|
| 이미지 카드 | 44×44px | 동적 (화면 너비 기반) | ✅ |
| 필터 탭 (미구현) | 44×44px | - | - |

### 10.3 모션 감소 (미구현)

```typescript
// Reduced Motion 지원 예정
import { useReducedMotion } from 'react-native-reanimated';

const reduceMotion = useReducedMotion();
// shimmer 애니메이션 비활성화
```

---

## 11. 성능 최적화

### 11.1 FlatList 최적화

| 설정 | 값 | 이유 |
|:---|:---|:---|
| `removeClippedSubviews` | `true` (Android) | 화면 밖 뷰 언마운트 |
| `maxToRenderPerBatch` | `10` | 배치당 렌더링 제한 |
| `windowSize` | `5` | 가상화 윈도우 크기 |
| `initialNumToRender` | `10` | 초기 렌더링 수 |
| `getItemLayout` | 정의됨 | 스크롤 성능 향상 |

```typescript
const getItemLayout = useCallback(
  (_: any, index: number) => ({
    length: CARD_HEIGHT + GAP,
    offset: (CARD_HEIGHT + GAP) * Math.floor(index / 2),
    index,
  }),
  [CARD_HEIGHT]
);
```

### 11.2 이미지 최적화

| 전략 | 현재 상태 | 개선 방안 |
|:---|:---:|:---|
| 이미지 캐싱 | ❌ | `expo-image` 또는 `react-native-fast-image` 도입 |
| 썸네일 사용 | ❌ | 그리드에서 저해상도 이미지 사용 |
| 점진적 로딩 | ❌ | 블러 플레이스홀더 → 풀 이미지 |

### 11.3 메모이제이션

| 항목 | 현재 | 방법 |
|:---|:---:|:---|
| renderItem | ✅ | `useCallback` |
| keyExtractor | ✅ | `useCallback` |
| 레이아웃 계산 | ✅ | `useMemo` |

---

## 12. 미구현 항목 상세

### 12.1 필터 UI (P1)

**구현 방안**:
- 상단 고정 탭 바 (`react-native-tab-view` 또는 커스텀)
- 선택된 필터 하이라이트
- 애니메이션 인디케이터

**와이어프레임**:
```
┌────────────────────────────────┐
│  [ALL] [newjeans] [blackpink] →│
│  ~~~~~ (active indicator)      │
└────────────────────────────────┘
```

**Props**:
```typescript
interface FilterTabProps {
  filters: FilterKey[];
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
}
```

### 12.2 검색 UI (P1)

**구현 방안**:
- 상단 검색바 (아이콘 + 텍스트 입력)
- 디바운스 적용 (300ms)
- 검색 결과 하이라이트

**와이어프레임**:
```
┌────────────────────────────────┐
│  🔍 [Search images...]         │
└────────────────────────────────┘
```

**훅 사용**:
```typescript
const { searchQuery, setSearchQuery } = useSearchStore();
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 12.3 Pull-to-refresh (P2)

**구현 방안**:
```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor="#007AFF"
    />
  }
/>

const handleRefresh = async () => {
  setIsRefreshing(true);
  await queryClient.invalidateQueries({ queryKey: ["images"] });
  setIsRefreshing(false);
};
```

### 12.4 스켈레톤 로딩 (P3)

**구현 방안**:
- `react-native-skeleton-placeholder` 패키지
- 카드 크기와 동일한 플레이스홀더
- shimmer 애니메이션

```typescript
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

<SkeletonPlaceholder>
  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
    {[...Array(6)].map((_, i) => (
      <View key={i} style={{ width: CARD_WIDTH, height: CARD_HEIGHT, margin: GAP/2 }} />
    ))}
  </View>
</SkeletonPlaceholder>
```

---

## 13. 레이아웃 계산

```typescript
const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 4;
const CARD_WIDTH = (width - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const CARD_HEIGHT = CARD_WIDTH * 1.25;
```

---

## 14. 구현 파일

| 파일 | 설명 |
|:---|:---|
| `packages/mobile/app/(tabs)/index.tsx` | 홈 화면 컴포넌트 |
| `packages/shared/hooks/useImages.ts` | 이미지 쿼리 훅 |
| `packages/shared/stores/filterStore.ts` | 필터 상태 |
| `packages/shared/stores/searchStore.ts` | 검색 상태 |

---

## 15. 관련 문서

- [M-03 기능 명세](../spec.md#m-03-홈-화면-이미지-그리드)
- [웹 홈 화면 (SCR-DISC-01)](../../discovery/screens/SCR-DISC-01-home.md)
- [모바일 상세 화면 (SCR-MOBL-02)](./SCR-MOBL-02-detail.md)
