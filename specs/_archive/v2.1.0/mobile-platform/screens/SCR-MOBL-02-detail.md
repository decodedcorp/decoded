# [SCR-MOBL-02] 이미지 상세 화면 (Image Detail Screen)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-MOBL-02 |
| **경로** | `/images/[id]` |
| **작성일** | 2026-01-15 |
| **버전** | v1.1 |
| **상태** | 구현됨 (75%) |

---

## 1. 화면 개요

- **목적**: 선택한 이미지의 상세 정보와 감지된 아이템 목록 표시
- **선행 조건**: 홈 화면에서 이미지 탭
- **후속 화면**: 홈 화면 (뒤로가기)
- **관련 기능 ID**: [M-04](../spec.md#m-04-이미지-상세-화면)

---

## 2. UI 와이어프레임

### 2.1 기본 레이아웃

```
┌────────────────────────────────┐
│  [Status Bar]                  │
├────────────────────────────────┤
│  [← Back]     Image Detail     │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐  │
│  │                          │  │
│  │                          │  │
│  │      [HERO IMAGE]        │  │
│  │      (1:1.25 ratio)      │  │
│  │                          │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  @username               │  │
│  │  2026-01-15              │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  Items                   │  │
│  ├──────────────────────────┤  │
│  │  ┌────────────────────┐  │  │
│  │  │ Product Name       │  │  │
│  │  │ Brand              │  │  │
│  │  │ ₩99,000            │  │  │
│  │  └────────────────────┘  │  │
│  │  ┌────────────────────┐  │  │
│  │  │ Product Name 2     │  │  │
│  │  │ Brand 2            │  │  │
│  │  │ ₩149,000           │  │  │
│  │  └────────────────────┘  │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

### 2.2 스팟 시스템 적용 시 (미구현)

```
┌────────────────────────────────┐
│  ┌──────────────────────────┐  │
│  │       ●1                 │  │
│  │              ●2          │  │
│  │   [HERO IMAGE]           │  │
│  │        ●3                │  │
│  │                          │  │
│  └──────────────────────────┘  │
│                                │
│  Items (3)                     │
│  ┌──────────────────────────┐  │
│  │ ●1 Product Name [→ BUY] │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ ●2 Product Name 2 [→ BUY]│  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## 3. UI 요소 정의

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---|:---|:---|:---|:---|
| MOBL-02-001 | 컨테이너 | ScrollView | flex: 1 | 세로 스크롤 |
| MOBL-02-002 | 이미지 | HeroImage | width: 화면폭, height: 화면폭*1.25 | - |
| MOBL-02-003 | 텍스트 | Account | fontSize: 18, fontWeight: 600 | - |
| MOBL-02-004 | 텍스트 | Date | fontSize: 14, opacity: 0.6 | - |
| MOBL-02-005 | 섹션 | ItemsSection | marginTop: 8 | - |
| MOBL-02-006 | 카드 | ItemCard | padding: 12, borderRadius: 8 | 향후: 탭 → 구매 링크 |
| MOBL-02-007 | 텍스트 | ItemName | fontSize: 15, fontWeight: 500 | - |
| MOBL-02-008 | 텍스트 | ItemBrand | fontSize: 13, opacity: 0.7 | - |
| MOBL-02-009 | 텍스트 | ItemPrice | fontSize: 14, color: #007AFF | - |

---

## 4. 인터랙션 명세

### 4.1 화면 진입

```
홈 화면에서 이미지 카드 탭
    │
    ▼ router.push(`/images/${id}`)
    │
    ▼ useLocalSearchParams() → id 추출
    │
    ▼ useImageById(id) 호출
    │
    ├─ isLoading → 로딩 UI
    │
    ├─ error || !image → 에러 UI
    │
    └─ image → 상세 화면 렌더링
```

### 4.2 아이템 카드 탭 (미구현)

```
사용자가 아이템 카드 탭
    │
    ▼ onItemPress(item)
    │
    ├─ item.purchaseUrl 존재?
    │      │
    │      ├─ Yes: Linking.openURL(item.purchaseUrl)
    │      │
    │      └─ No: Toast "구매 링크가 없습니다"
    │
    ▼
외부 브라우저로 이동
```

### 4.3 스팟 탭 (미구현)

```
사용자가 스팟 마커 탭
    │
    ▼ setSelectedSpotId(spot.id)
    │
    ▼ 해당 아이템 카드로 스크롤
    │
    ▼ 아이템 카드 하이라이트
```

---

## 5. 컴포넌트 Props 명세

### 5.1 HeroImage Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|:---|:---|:---:|:---|:---|
| `uri` | `string \| undefined` | Y | - | 이미지 URL |
| `width` | `number` | Y | - | 화면 너비 |
| `aspectRatio` | `number` | N | 1.25 | 이미지 비율 |
| `onLoad` | `() => void` | N | - | 로드 완료 콜백 |
| `onError` | `() => void` | N | - | 로드 실패 콜백 |

### 5.2 ItemCard Props

| Prop | 타입 | 필수 | 기본값 | 설명 |
|:---|:---|:---:|:---|:---|
| `item` | `ItemRow` | Y | - | 아이템 데이터 |
| `index` | `number` | Y | - | 아이템 순서 (1-based) |
| `isSelected` | `boolean` | N | false | 선택 상태 (스팟 연동용) |
| `onPress` | `() => void` | N | - | 탭 핸들러 |
| `testID` | `string` | N | - | E2E 테스트 식별자 |

### 5.3 SpotMarker Props (미구현)

| Prop | 타입 | 필수 | 기본값 | 설명 |
|:---|:---|:---:|:---|:---|
| `position` | `{ x: number; y: number }` | Y | - | 정규화 좌표 (0-1) |
| `number` | `number` | Y | - | 스팟 번호 |
| `isSelected` | `boolean` | N | false | 선택 상태 |
| `onPress` | `() => void` | Y | - | 탭 핸들러 |

### 5.4 타입 정의

```typescript
interface ImageData {
  id: string;
  image_url: string | null;
  created_at: string;
  postImages?: Array<{
    post?: {
      account: string;
    };
  }>;
  items?: Array<ItemRow>;
}

interface ItemRow {
  id: string;
  product_name: string | null;
  brand: string | null;
  price: string | null;
  position_x?: number | null;
  position_y?: number | null;
  purchase_url?: string | null;
}
```

---

## 6. 디자인 토큰

### 6.1 색상

| 토큰 | Light Mode | Dark Mode | 용도 |
|:---|:---|:---|:---|
| `--background` | `#FFFFFF` | `#000000` | 화면 배경 |
| `--hero-bg` | `#F0F0F0` | `#1C1C1E` | 이미지 플레이스홀더 |
| `--card-bg` | `rgba(0,0,0,0.03)` | `rgba(255,255,255,0.05)` | 아이템 카드 배경 |
| `--text-primary` | `#1A1A1A` | `#FAFAFA` | 기본 텍스트 |
| `--text-muted` | `rgba(0,0,0,0.6)` | `rgba(255,255,255,0.6)` | 날짜, 브랜드 |
| `--price-color` | `#007AFF` | `#0A84FF` | 가격 텍스트 |
| `--spot-bg` | `#007AFF` | `#0A84FF` | 스팟 마커 배경 |
| `--spot-selected` | `#FF3B30` | `#FF453A` | 선택된 스팟 |

### 6.2 타이포그래피

| 요소 | fontSize | fontWeight | 색상 |
|:---|:---:|:---:|:---|
| 계정명 | 18 | 600 | text-primary |
| 날짜 | 14 | 400 | text-muted |
| 섹션 제목 | 16 | 600 | text-primary |
| 아이템명 | 15 | 500 | text-primary |
| 브랜드 | 13 | 400 | text-muted |
| 가격 | 14 | 600 | price-color |
| 스팟 번호 | 12 | 700 | white |

### 6.3 간격

| 요소 | 값 | 설명 |
|:---|:---|:---|
| 콘텐츠 패딩 | 16px | 전체 콘텐츠 여백 |
| 계정-날짜 간격 | 4px | 메타 정보 간격 |
| 섹션 상단 여백 | 24px | 아이템 섹션 구분 |
| 아이템 카드 패딩 | 12px | 내부 여백 |
| 아이템 카드 간격 | 8px | 카드 사이 간격 |
| 카드 border-radius | 8px | 모서리 둥글기 |
| 스팟 마커 크기 | 28px | 지름 |

---

## 7. 상태 관리 상세

### 7.1 React Query 설정

| 쿼리 키 | staleTime | gcTime | enabled |
|:---|:---:|:---:|:---|
| `["images", "detail", id]` | 기본값 | 기본값 | `!!id` |

```typescript
const { data: image, isLoading, error } = useImageById(id ?? "");
```

### 7.2 로컬 상태 (미구현 - 스팟 시스템용)

| 상태 | 타입 | 초기값 | 용도 |
|:---|:---|:---|:---|
| `selectedSpotId` | `string \| null` | `null` | 선택된 스팟/아이템 |
| `isImageLoaded` | `boolean` | `false` | 이미지 로드 완료 여부 |
| `scrollRef` | `RefObject<ScrollView>` | - | 스크롤 제어 |

### 7.3 데이터 흐름

```
useLocalSearchParams() → id
    │
    ▼
useImageById(id)
    │
    ├─ isLoading: true → 로딩 UI
    │
    ├─ error 또는 !image → 에러 UI
    │
    └─ image 존재 → 정상 렌더링
           │
           ├─ image.image_url → HeroImage
           │
           ├─ image.postImages[0]?.post?.account → 계정명
           │
           ├─ image.created_at → 날짜 (포맷팅)
           │
           └─ image.items → ItemCard 목록
```

### 7.4 프리페칭 (권장)

```typescript
// 홈 화면에서 이미지 호버/탭 시 프리페치
queryClient.prefetchQuery({
  queryKey: ["images", "detail", id],
  queryFn: () => fetchImageById(id),
});
```

---

## 8. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 | 처리 방법 |
|:---|:---|:---|:---|
| `PGRST116` | 이미지 없음 (404) | "Image not found" | 에러 UI 표시 |
| `NETWORK_ERROR` | 네트워크 끊김 | "네트워크 연결을 확인해주세요" | 재시도 버튼 |
| `IMAGE_LOAD_ERROR` | 이미지 로드 실패 | 플레이스홀더 표시 | fallback 이미지 |
| `ITEMS_EMPTY` | 아이템 없음 | "No items detected" | 안내 메시지 |
| `INVALID_ID` | 잘못된 ID 형식 | "Invalid image ID" | 홈으로 리다이렉트 |

### 에러 UI 와이어프레임

```
┌────────────────────────────────┐
│  [← Back]                      │
├────────────────────────────────┤
│                                │
│      [Error Icon]              │
│                                │
│     "Image not found"          │
│                                │
│     [← Go Back to Home]        │
│                                │
└────────────────────────────────┘
```

---

## 9. 로딩 상태 상세

### 9.1 상태별 UI

| 상태 | UI | 조건 |
|:---|:---|:---|
| 로딩 중 | ActivityIndicator + "Loading..." | isLoading |
| 에러 | "Image not found" | error \|\| !image |
| 정상 | 이미지 + 아이템 목록 | image 존재 |

### 9.2 전체 화면 로딩

```
┌────────────────────────────────┐
│  [← Back]                      │
├────────────────────────────────┤
│                                │
│     [ActivityIndicator]        │
│     ● ● ● (회전)               │
│                                │
│     "Loading..."               │
│                                │
└────────────────────────────────┘
```

### 9.3 이미지 로딩 (개선 예정)

| 단계 | 현재 | 개선안 |
|:---|:---|:---|
| 1 | 배경색 표시 | 블러 플레이스홀더 (LQIP) |
| 2 | 이미지 로드 | 점진적 로딩 |
| 3 | 완료 | fade-in 애니메이션 |

### 9.4 스켈레톤 로딩 (미구현)

```
┌────────────────────────────────┐
│  ┌──────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  │ ░░░░░░░ SHIMMER ░░░░░░░░ │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│  └──────────────────────────┘  │
│                                │
│  ░░░░░░░░░░░░░░░              │
│  ░░░░░░░                       │
│                                │
│  Items                         │
│  ┌──────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░          │  │
│  │ ░░░░░░░                   │  │
│  │ ░░░░░                     │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

---

## 10. 접근성 (A11y)

### 10.1 VoiceOver/TalkBack 지원

| 요소 | accessibilityLabel | accessibilityRole | accessibilityHint |
|:---|:---|:---|:---|
| 뒤로가기 | "뒤로 가기" | `button` | "홈 화면으로 돌아가기" |
| 히어로 이미지 | "이미지 상세" | `image` | - |
| 계정명 | "@{account}" | `text` | - |
| 아이템 카드 | "{product_name}, {brand}, {price}" | `button` | "탭하여 구매 페이지로 이동" |
| 스팟 마커 (미구현) | "아이템 {number}" | `button` | "탭하여 상세 정보 보기" |

### 10.2 포커스 순서

```
1. 뒤로가기 버튼
2. 히어로 이미지
3. 계정 정보
4. 날짜
5. 아이템 섹션 제목
6. 아이템 카드 1
7. 아이템 카드 2
...
```

### 10.3 터치 타겟

| 요소 | 최소 크기 | 현재 크기 | 상태 |
|:---|:---|:---|:---:|
| 뒤로가기 버튼 | 44×44px | 44×44px | ✅ |
| 아이템 카드 | 44×44px | 전체 너비 × ~60px | ✅ |
| 스팟 마커 (미구현) | 44×44px | 28×28px (터치 영역 44px) | - |

### 10.4 스크린 리더 지원

```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel={`${item.product_name}, ${item.brand}, ${item.price}`}
  accessibilityHint="탭하여 구매 페이지로 이동"
>
  <ItemCard item={item} />
</Pressable>
```

---

## 11. 성능 최적화

### 11.1 이미지 로딩

| 전략 | 현재 상태 | 개선 방안 |
|:---|:---:|:---|
| 이미지 캐싱 | ❌ | `expo-image` 도입 |
| 크기 최적화 | ❌ | 디바이스 해상도에 맞춘 리사이징 |
| 포맷 최적화 | ❌ | WebP 변환 |
| LQIP | ❌ | 저해상도 플레이스홀더 |

### 11.2 렌더링 최적화

| 항목 | 현재 | 개선안 |
|:---|:---:|:---|
| 아이템 목록 | `map` | 10개 이상 시 `FlatList` |
| 컴포넌트 | 일반 | `React.memo` 적용 |
| 이미지 onLoad | ❌ | 로드 완료 후 스팟 표시 |

### 11.3 데이터 프리페칭

```typescript
// 홈 화면에서 이미지 탭 직전 프리페치
const prefetchImage = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ["images", "detail", id],
    queryFn: () => fetchImageById(id),
  });
};

// FlatList onViewableItemsChanged에서 호출
```

### 11.4 메모리 관리

| 항목 | 현재 | 방법 |
|:---|:---:|:---|
| 이미지 캐시 제한 | ❌ | expo-image 캐시 정책 |
| 컴포넌트 언마운트 | ✅ | 화면 이탈 시 자동 |

---

## 12. 미구현 항목 상세

### 12.1 스팟 시스템 (P1)

**구현 방안**:
- 이미지 위 절대 위치 오버레이
- 정규화 좌표 (0-1)를 픽셀 좌표로 변환
- 탭 시 해당 아이템 카드 스크롤/하이라이트

**와이어프레임**:
```
┌──────────────────────────────┐
│                              │
│       ●1                     │
│              ●2              │
│   ●3                         │
│                              │
└──────────────────────────────┘
```

**좌표 변환**:
```typescript
const spotStyle = {
  position: 'absolute',
  left: position.x * imageWidth - SPOT_SIZE / 2,
  top: position.y * imageHeight - SPOT_SIZE / 2,
};
```

**Props**:
```typescript
interface SpotMarkerProps {
  position: { x: number; y: number };
  number: number;
  isSelected: boolean;
  onPress: () => void;
}
```

### 12.2 구매 링크 (P1)

**구현 방안**:
- 아이템 카드에 "구매" 버튼 추가
- `Linking.openURL(item.purchaseUrl)`
- 외부 브라우저로 열기

**와이어프레임**:
```
┌──────────────────────────────┐
│ Product Name           [→]  │
│ Brand                        │
│ ₩99,000                      │
└──────────────────────────────┘
```

**코드**:
```typescript
const handlePurchase = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "Cannot open this link");
  }
};
```

### 12.3 공유 기능 (P2)

**구현 방안**:
```typescript
import { Share } from 'react-native';

const handleShare = async () => {
  try {
    await Share.share({
      message: `Check out this look on Decoded!`,
      url: `https://decoded.app/images/${id}`,
    });
  } catch (error) {
    console.error(error);
  }
};
```

**UI 위치**: 헤더 우측 공유 아이콘

### 12.4 좋아요/북마크 (P2)

**구현 방안**:
- Supabase `user_favorites` 테이블 필요
- 인증 필요 (로그인 유도)
- 낙관적 업데이트

**상태 관리**:
```typescript
const { data: isFavorited, mutate: toggleFavorite } = useFavorite(imageId);
```

**UI 위치**: 히어로 이미지 우하단 하트 아이콘

### 12.5 관련 이미지 (P3)

**구현 방안**:
- `useRelatedImagesByAccount` 훅 사용
- 하단 수평 스크롤 섹션
- 같은 계정의 다른 이미지 표시

**와이어프레임**:
```
┌──────────────────────────────┐
│  More from @username         │
│  ┌─────┐ ┌─────┐ ┌─────┐ →  │
│  │ IMG │ │ IMG │ │ IMG │    │
│  └─────┘ └─────┘ └─────┘    │
└──────────────────────────────┘
```

**훅**:
```typescript
const { data: relatedImages } = useRelatedImagesByAccount(
  image?.postImages?.[0]?.post?.account,
  { exclude: id, limit: 10 }
);
```

---

## 13. 레이아웃 계산

```typescript
const { width } = Dimensions.get("window");

// Hero Image
const heroImageStyle = {
  width: width,
  height: width * 1.25,
  backgroundColor: "#f0f0f0",
};

// Content Padding
const CONTENT_PADDING = 16;

// Item Card
const itemCardStyle = {
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
};

// Spot Marker
const SPOT_SIZE = 28;
```

---

## 14. 웹 vs 모바일 비교

| 기능 | 웹 (SCR-VIEW-01) | 모바일 (SCR-MOBL-02) |
|:---|:---|:---|
| 레이아웃 | 50/50 Split (Sticky) | 세로 ScrollView |
| 스팟 시스템 | ✅ 구현됨 | ❌ 미구현 |
| 연결선 | ✅ SVG Bezier | ❌ 미구현 (불필요) |
| 아이템 카드 | 상세 정보 + 인터랙션 | 기본 정보만 |
| 구매 링크 | ❌ 미구현 | ❌ 미구현 |
| 공유 기능 | ❌ 미구현 | ❌ 미구현 |
| 좋아요 | ❌ 미구현 | ❌ 미구현 |
| 관련 이미지 | ✅ 구현됨 | ❌ 미구현 |

---

## 15. 구현 파일

| 파일 | 설명 |
|:---|:---|
| `packages/mobile/app/images/[id].tsx` | 상세 화면 컴포넌트 |
| `packages/shared/hooks/useImages.ts` | useImageById 훅 |
| `packages/mobile/components/ItemCard.tsx` | 아이템 카드 (예정) |
| `packages/mobile/components/SpotMarker.tsx` | 스팟 마커 (예정) |

---

## 16. 관련 문서

- [M-04 기능 명세](../spec.md#m-04-이미지-상세-화면)
- [웹 상세 화면 (SCR-VIEW-01)](../../detail-view/screens/SCR-VIEW-01-detail.md)
- [스팟 시스템 (SCR-VIEW-02)](../../detail-view/screens/SCR-VIEW-02-spots.md)
- [모바일 홈 화면 (SCR-MOBL-01)](./SCR-MOBL-01-home.md)
