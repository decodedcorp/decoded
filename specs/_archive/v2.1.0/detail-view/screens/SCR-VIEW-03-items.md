# [SCR-VIEW-03] 아이템 목록 (Item List)

| 항목 | 내용 |
|:---|:---|
| **문서 ID** | SCR-VIEW-03 |
| **경로** | (이미지 상세 내 컴포넌트) |
| **작성일** | 2026-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 검출된 아이템을 Original/Vibe 듀얼 매치 형태로 표시, 구매 링크 및 투표 제공
- **선행 조건**: 이미지 상세 페이지 진입, 아이템 데이터 존재
- **후속 화면**: 구매 페이지 (외부), Vibe 추가 모달
- **관련 기능 ID**: [V-03](../spec.md#v-03-dual-match-list), [V-05](../spec.md#v-05-purchase-link)

---

## 2. UI 와이어프레임

### 2.1 듀얼 매치 레이아웃

```
┌────────────────────────────────────────────────────────────────────────────┐
│ DualMatchSection.tsx                                                        │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ 👗 Item #1: Jacket                                         [Spot #1]  │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ THE ORIGINAL                                                       ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ [ORIGINAL-CARD]                                                │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌──────────┐                                                   │││ │
│ │ │ │ │          │  Celine Triomphe Jacket                           │││ │
│ │ │ │ │  [IMG]   │  Brand: CELINE                                    │││ │
│ │ │ │ │          │  Price: $2,850                                    │││ │
│ │ │ │ └──────────┘                                                   │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌────────────────────────────────────────────────────────────┐│││ │
│ │ │ │ │ [VOTING-SECTION]                                           ││││ │
│ │ │ │ │ Is this accurate?                                          ││││ │
│ │ │ │ │ [👍 Accurate (47)]    [👎 Inaccurate (3)]                 ││││ │
│ │ │ │ │ ████████████████████░░ 94% accuracy                       ││││ │
│ │ │ │ └────────────────────────────────────────────────────────────┘│││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌─────────────────────────────────────────────────────────────┐││ │
│ │ │ │ │ [BUY-BTN]                                                   │││ │
│ │ │ │ │             [Buy Original →]                                │││ │
│ │ │ │ └─────────────────────────────────────────────────────────────┘││ │
│ │ │ │                                                                │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ THE VIBE                                         [+ Add Vibe]     ││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ [VIBE-CARD] #1 (sorted by vote score)                          │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌──────────┐                                                   │││ │
│ │ │ │ │          │  Zara Structured Blazer                           │││ │
│ │ │ │ │  [IMG]   │  Price: $129                                      │││ │
│ │ │ │ │          │  ─────────────────────────                        │││ │
│ │ │ │ └──────────┘  💰 Save: $2,721 (95%)                           │││ │
│ │ │ │                                                                │││ │
│ │ │ │               [▲ 12]  [▼ 2]   [Buy Vibe →]                    │││ │
│ │ │ │                                                                │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ ┌────────────────────────────────────────────────────────────────┐││ │
│ │ │ │ [VIBE-CARD] #2                                                 │││ │
│ │ │ │                                                                │││ │
│ │ │ │ ┌──────────┐  H&M Premium Jacket                              │││ │
│ │ │ │ │  [IMG]   │  $89         [▲ 8]  [▼ 1]                       │││ │
│ │ │ │ └──────────┘                                                   │││ │
│ │ │ └────────────────────────────────────────────────────────────────┘││ │
│ │ │                                                                    ││ │
│ │ │ [Show 2 more vibes ▼]                                             ││ │
│ │ │                                                                    ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 구매 버튼 상태

```
┌────────────────────────────────────────────────────────────────────────────┐
│ BuyButton STATES                                                            │
│                                                                            │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│ │ STATE: default       │  │ STATE: loading       │  │ STATE: disabled  │  │
│ │                      │  │                      │  │                  │  │
│ │ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────────┐ │  │
│ │ │  [Buy Now →]     │ │  │ │ [⟳] Opening...  │ │  │ │ [No Link]    │ │  │
│ │ └──────────────────┘ │  │ └──────────────────┘ │  │ └──────────────┘ │  │
│ │                      │  │                      │  │                  │  │
│ │ bg: primary          │  │ bg: primary-dark     │  │ bg: gray-300     │  │
│ │ cursor: pointer      │  │ cursor: wait         │  │ cursor: not-allowed│
│ │                      │  │                      │  │                  │  │
│ └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │ 가격 표시 형식                                                        │  │
│ │                                                                      │  │
│ │ 단일 통화:    $299.00                                                │  │
│ │ 이중 통화:    ₩ 299,000                                              │  │
│ │              $299.00 USD                                             │  │
│ │                                                                      │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Vibe 투표 UI

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Vibe Voting                                                                 │
│                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────┐  │
│ │ [VIBE-VOTING]                                                        │  │
│ │                                                                      │  │
│ │ ┌─────────────┐  ┌─────────────┐                                    │  │
│ │ │ [▲ Upvote]  │  │ [▼ Downvote]│                                    │  │
│ │ │    (12)     │  │    (2)      │                                    │  │
│ │ └─────────────┘  └─────────────┘                                    │  │
│ │                                                                      │  │
│ │ States:                                                              │  │
│ │ - Default: gray outline                                              │  │
│ │ - Upvoted: green fill, ▲ icon                                        │  │
│ │ - Downvoted: red fill, ▼ icon                                        │  │
│ │                                                                      │  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Add Vibe 모달

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [MODAL] Add a Vibe                                                   [X]   │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │ Found a similar item at a better price?                                │ │
│ │ Share it with the community!                                           │ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ [INP-URL]                                                          ││ │
│ │ │ 🔗 Paste product URL...                                            ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ [PREVIEW] (자동 스크래핑)                                          ││ │
│ │ │                                                                    ││ │
│ │ │ ┌──────────┐  Product Name                                        ││ │
│ │ │ │  [IMG]   │  Brand                                               ││ │
│ │ │ │          │  $XXX                                                ││ │
│ │ │ └──────────┘                                                      ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌────────────────────────────────────────────────────────────────────┐│ │
│ │ │ [INP-NOTE]                                                         ││ │
│ │ │ Why is this a good vibe? (optional)                                ││ │
│ │ └────────────────────────────────────────────────────────────────────┘│ │
│ │                                                                        │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐  │ │
│ │ │                     [Submit Vibe]                                │  │ │
│ │ └─────────────────────────────────────────────────────────────────┘  │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### Original 카드

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **ORIGINAL-CARD** | 카드 | Original 아이템 | - BG: `surface-primary`<br>- Border: 1px `border-muted` | 스팟과 연동 하이라이트 |
| **ITEM-IMG** | 이미지 | 아이템 썸네일 | - Size: 80×80px<br>- Border-radius: 8px | **Click**: 이미지 확대 (선택적) |
| **ITEM-NAME** | 텍스트 | 상품명 | - Font: Body Bold (16px)<br>- Max: 2줄 ellipsis | - |
| **ITEM-BRAND** | 텍스트 | 브랜드 | - Font: Caption<br>- Color: `text-muted` | - |
| **ITEM-PRICE** | 텍스트 | 가격 | - Font: H3 Bold<br>- Color: `text-primary` | - |
| **VOTING** | 컴포넌트 | 정확도 투표 | - Buttons: 👍/👎<br>- Progress: 정확도 바 | **Click**: 투표 (로그인 필요) |
| **BTN-BUY** | 버튼 | 구매 | - Style: Primary<br>- Icon: → | **Click**: affiliate 링크 열기 |

### Vibe 섹션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **VIBE-HEADER** | 헤더 | THE VIBE | - Label + [+ Add Vibe] 버튼 | - |
| **BTN-ADD-VIBE** | 버튼 | Vibe 추가 | - Style: Text Button<br>- Icon: + | **Click**: Add Vibe 모달 |
| **VIBE-CARD** | 카드 | Vibe 아이템 | - Sorted by: vote score DESC<br>- 최대 3개 표시 | - |
| **SAVINGS** | 텍스트 | 절약 금액 | - Format: 💰 Save: $X,XXX (XX%)<br>- Color: green | 원본 대비 절약 금액 |
| **VIBE-VOTE** | 컴포넌트 | Vibe 투표 | - ▲ Upvote / ▼ Downvote | **Click**: 투표 (로그인 필요) |
| **BTN-MORE** | 버튼 | 더보기 | - Style: Text Link<br>- Hidden: ≤3개 | **Click**: 전체 Vibe 표시 |

### Add Vibe 모달

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---|:---|:---|
| **INP-URL** | 입력 | URL 입력 | - Placeholder: "Paste product URL..."<br>- Validation: URL 형식 | **Blur**: 자동 스크래핑 |
| **PREVIEW** | 컴포넌트 | 미리보기 | - 로딩: Skeleton<br>- 성공: 상품 정보 | URL 입력 후 자동 표시 |
| **INP-NOTE** | 입력 | 메모 | - Optional<br>- Max: 200자 | - |
| **BTN-SUBMIT** | 버튼 | 제출 | - Disabled: URL 없거나 로딩 중 | **Click**: Vibe 추가 API 호출 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|:---|:---|:---|
| **기본** | 아이템 표시 | Original + Vibe 목록 |
| **선택됨** | 스팟/카드 클릭 | 해당 카드 ring 하이라이트 |
| **투표 완료** | 사용자 투표 | 버튼에 ✓ 표시, 카운트 업데이트 |
| **구매 로딩** | Buy 클릭 | 버튼 "Opening..." + 스피너 |
| **Vibe 추가 중** | 모달 제출 | 로딩 상태 → 목록에 추가 |
| **비로그인** | 투표/Vibe 시도 | 로그인 모달 표시 |
| **빈 Vibe** | Vibe 0개 | "Be the first to add a vibe!" |

### 구매 링크 이벤트 흐름

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PURCHASE LINK EVENT FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BuyButton onClick                                                       │
│       │                                                                 │
│       ▼                                                                 │
│  [1. 로딩 상태]                                                          │
│       │                                                                 │
│       ├─── setIsLoading(true)                                           │
│       │    └─── 버튼: "Opening..." + Spinner                            │
│       │                                                                 │
│       ▼                                                                 │
│  [2. Affiliate 링크 생성]                                                │
│       │                                                                 │
│       ├─── generateAffiliateLink(item, userId)                          │
│       │         │                                                       │
│       │         ▼                                                       │
│       │    trackingParams = {                                           │
│       │      utm_source: 'decoded',                                     │
│       │      utm_medium: 'affiliate',                                   │
│       │      item_id: item.id,                                          │
│       │      user_id: userId                                            │
│       │    }                                                            │
│       │                                                                 │
│       ▼                                                                 │
│  [3. 클릭 로깅]                                                          │
│       │                                                                 │
│       ├─── POST /api/track/click (fire-and-forget)                      │
│       │                                                                 │
│       ▼                                                                 │
│  [4. 새 탭 열기]                                                         │
│       │                                                                 │
│       ├─── window.open(affiliateUrl, '_blank', 'noopener')              │
│       │                                                                 │
│       ▼                                                                 │
│  [5. 완료]                                                               │
│       │                                                                 │
│       └─── setIsLoading(false)                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 | 응답 |
|:---|:---:|:---|:---|:---|
| 아이템 그룹 | GET | `/api/images/:id/items` | SSR/클라이언트 | `{ itemGroups: ItemGroup[] }` |
| 투표 | POST | `/api/items/:id/vote` | 버튼 클릭 | `{ success, newCount }` |
| Vibe 추가 | POST | `/api/items/:id/vibes` | 모달 제출 | `{ vibe: Item }` |
| URL 스크래핑 | POST | `/api/scrape` | URL 입력 | `{ name, brand, price, image }` |
| 클릭 추적 | POST | `/api/track/click` | Buy 클릭 | `{ success }` |

### 5.2 데이터 타입

```typescript
interface ItemGroup {
  original: ItemWithVotes;
  vibes: ItemWithVotes[];
}

interface ItemWithVotes {
  id: string;
  matchType: 'original' | 'vibe';
  originalItemId?: string;  // vibe인 경우 참조
  name: string;
  brand?: string;
  price?: number;
  currency?: string;
  thumbnailUrl?: string;
  purchaseUrl?: string;
  center?: { x: number; y: number };
  votes: {
    accurateCount: number;      // original용
    inaccurateCount: number;    // original용
    upvoteCount: number;        // vibe용
    downvoteCount: number;      // vibe용
    userVote?: VoteType;
  };
}

type VoteType = 'accurate' | 'inaccurate' | 'up' | 'down';

// 절약 금액 계산
function calculateSavings(original: Item, vibe: Item) {
  const diff = (original.price || 0) - (vibe.price || 0);
  const percent = Math.round((diff / (original.price || 1)) * 100);
  return { amount: diff, percent };
}
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|:---|:---|:---|
| URL 스크래핑 실패 | "Couldn't fetch product info" | 수동 입력 옵션 제공 |
| 투표 실패 | "Vote failed, try again" | 롤백 + 재시도 |
| 팝업 차단 | "Please allow popups" | Toast 알림 |
| 비로그인 액션 | "Login required" | 로그인 모달 표시 |
| 네트워크 오류 | "Network error" | 재시도 버튼 |

---

## 7. 접근성 (A11y)

- **투표 버튼**: `aria-pressed` 상태, 키보드 Enter/Space
- **가격 정보**: `aria-label="Price: $2,850"`
- **Vibe 목록**: `role="list"`, 각 항목 `role="listitem"`
- **모달**: focus trap, Escape로 닫기

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|:---|:---|:---|
| 듀얼 매치 래퍼 | DualMatchSection | `packages/web/lib/components/detail/DualMatchSection.tsx` |
| Original 카드 | OriginalItemCard | `packages/web/lib/components/detail/OriginalItemCard.tsx` |
| Vibe 카드 | VibeItemCard | `packages/web/lib/components/detail/VibeItemCard.tsx` |
| 투표 섹션 | VotingSection | `packages/web/lib/components/detail/VotingSection.tsx` |
| 투표 버튼 | VoteButton | `packages/web/lib/components/detail/VoteButton.tsx` |
| Vibe 투표 | VibeVoting | `packages/web/lib/components/detail/VibeVoting.tsx` |
| 구매 버튼 | BuyButton | `packages/web/lib/components/detail/BuyButton.tsx` |
| Vibe 추가 모달 | AddVibeModal | `packages/web/lib/components/detail/AddVibeModal.tsx` |
| 훅 | useVote | `packages/web/lib/hooks/useVote.ts` |
| 훅 | useTrackClick | `packages/web/lib/hooks/useTrackClick.ts` |

---

## 9. 구현 체크리스트

- [ ] DualMatchSection 레이아웃
- [ ] OriginalItemCard 컴포넌트
- [ ] VibeItemCard 컴포넌트
- [ ] 투표 UI (Accurate/Inaccurate)
- [ ] 투표 UI (Upvote/Downvote for Vibe)
- [ ] BuyButton + affiliate 링크 생성
- [ ] 클릭 트래킹 API
- [ ] Add Vibe 모달
- [ ] URL 스크래핑
- [ ] 절약 금액 계산/표시
- [ ] 로그인 필요 액션 처리
- [ ] 접근성 테스트

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| v1.0 | 2026-01-14 | PM | 초기 작성 |
