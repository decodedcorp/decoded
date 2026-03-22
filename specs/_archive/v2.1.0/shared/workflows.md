# User Workflows & Screen Flows

> Version: 1.0.0
> Last Updated: 2026-01-14
> Purpose: 사용자 여정, 화면 전환, 반응형 분기 문서화

---

## Overview

이 문서는 Decoded 앱의 주요 사용자 워크플로우를 시각화하고 설명합니다. 개발자가 전체 흐름을 빠르게 파악하고, 각 화면 간의 연결 관계를 이해하는 것을 목적으로 합니다.

---

## 1. User Journey Map

### 1.1 Core User Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY MAP                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [진입]       [발견]        [탐색]        [상세]        [액션]                 │
│      │           │            │            │            │                       │
│      ▼           ▼            ▼            ▼            ▼                       │
│  ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐                    │
│  │ 홈    │──▶│ 필터  │──▶│ 그리드 │──▶│ 상세  │──▶│ 구매  │                    │
│  │ 피드  │   │ 적용  │   │ 스크롤 │   │ 뷰    │   │ 링크  │                    │
│  └───────┘   └───────┘   └───────┘   └───────┘   └───────┘                    │
│      │           │            │            │            │                       │
│  무한스크롤   카테고리/      이미지       스팟 시스템   외부 쇼핑몰              │
│  SSR+CSR     미디어/캐스트   탐색         아이템 확인   이동                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Detailed Flow Stages

| Stage | 화면              | 주요 액션                | 다음 단계 트리거         |
| ----- | ----------------- | ------------------------ | ------------------------ |
| 진입  | Home (`/`)        | 피드 스크롤, 이미지 탐색 | 필터 클릭 or 이미지 클릭 |
| 발견  | Home + Filter     | 필터 선택, 검색          | 결과 확인                |
| 탐색  | Grid View         | 이미지 카드 스크롤       | 카드 클릭                |
| 상세  | Detail Modal/Page | 스팟 확인, 아이템 탐색   | 구매 버튼 클릭           |
| 액션  | External          | 구매, 저장, 공유         | 완료 or 돌아가기         |

---

## 2. Screen Transition Diagram

### 2.1 Main Navigation Flow

```
                                    ┌─────────────────┐
                                    │     Header      │
                                    │  (고정, 전역)   │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
      ┌───────────────┐            ┌───────────────┐            ┌───────────────┐
      │     Home      │            │    Search     │            │    Profile    │
      │      /        │            │   /search     │            │   /profile    │
      └───────┬───────┘            └───────┬───────┘            └───────────────┘
              │                            │
              │ 카드 클릭                   │ 결과 클릭
              ▼                            ▼
      ┌───────────────────────────────────────────────────────────────────┐
      │                        Image Detail                                │
      │                                                                    │
      │   Desktop: /@modal/(.)images/[id]  (인터셉션 라우트, 모달)        │
      │   Mobile:  /images/[id]             (풀페이지)                     │
      │   Direct:  /images/[id]             (풀페이지)                     │
      │                                                                    │
      └───────────────────────────────────────────────────────────────────┘
```

### 2.2 Screen Transition Matrix

| From   | To             | Trigger              | Animation    | Route Pattern            |
| ------ | -------------- | -------------------- | ------------ | ------------------------ |
| Home   | Detail (Modal) | Card Click (Desktop) | FLIP + Fade  | `/@modal/(.)images/[id]` |
| Home   | Detail (Page)  | Card Click (Mobile)  | Slide Right  | `/images/[id]`           |
| Detail | Home           | Back/Close           | Reverse FLIP | `/`                      |
| Home   | Filtered Home  | Filter Tab Click     | Fade         | `/?filter=xxx`           |
| Home   | Search         | Search Icon Click    | Slide Down   | `/search?q=xxx`          |
| Search | Detail         | Result Click         | FLIP         | `/images/[id]`           |
| Detail | External       | Buy Button           | New Tab      | External URL             |

### 2.3 FLIP Animation Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                     FLIP Animation Sequence                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  1. FIRST (초기 상태 저장)                                         │
│     └── transitionStore.setSelectedId(imageId)                    │
│     └── Flip.getState(cardElement)                                │
│                                                                    │
│  2. LAST (목표 상태로 DOM 이동)                                    │
│     └── Router navigation to detail                               │
│     └── Detail page render                                        │
│                                                                    │
│  3. INVERT (차이 계산)                                             │
│     └── GSAP Flip.from(state)                                     │
│                                                                    │
│  4. PLAY (애니메이션 실행)                                         │
│     └── duration: 0.5s, ease: "power2.inOut"                      │
│                                                                    │
│  관련 파일:                                                        │
│  • lib/stores/transitionStore.ts                                  │
│  • lib/hooks/useFlipTransition.ts                                 │
│  • lib/components/detail/ImageDetailModal.tsx                     │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 3. Responsive Behavior

### 3.1 Breakpoint Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         Viewport Detection                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              Window Width                                        │
│                                   │                                              │
│                    ┌──────────────┴──────────────┐                              │
│                    │                             │                              │
│               ≤640px                        >640px                              │
│             (Mobile)                       (Desktop)                            │
│                    │                             │                              │
│        ┌───────────┴───────────┐     ┌───────────┴───────────┐                 │
│        │                       │     │                       │                  │
│   Grid Layout              Filter    Grid Layout          Filter               │
│   • 1 column              • Bottom  • 2-4 columns        • Top bar             │
│   • Full width              Sheet   • Masonry            • Dropdowns           │
│   • Card aspect           • Slide   • Variable           • Inline              │
│     ratio 4:5               Up        heights                                   │
│        │                       │     │                       │                  │
│        └───────────┬───────────┘     └───────────┬───────────┘                 │
│                    │                             │                              │
│             Detail View                   Detail View                           │
│             • Full page                   • Modal overlay                       │
│             • Swipe gestures              • Split layout                        │
│             • Bottom sheet                • Image left                          │
│               items                       • Info right                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Behavior by Viewport

| Component   | Mobile (≤640px)      | Desktop (>640px)      | File                   |
| ----------- | -------------------- | --------------------- | ---------------------- |
| Header      | 축소형 로고 + 햄버거 | 풀 로고 + 인라인 메뉴 | `Header.tsx`           |
| FilterTabs  | 하단 고정 탭         | 상단 드롭다운 바      | `FilterTabs.tsx`       |
| ThiingsGrid | 1열 세로 스크롤      | 2-4열 Masonry         | `ThiingsGrid.tsx`      |
| ImageDetail | 풀페이지             | 모달 오버레이         | `ImageDetailModal.tsx` |
| ItemCards   | 스와이프 캐러셀      | 수평 스크롤 그리드    | `ShopGrid.tsx`         |
| SearchInput | 풀스크린 오버레이    | 인라인 확장           | `SearchInput.tsx`      |

---

## 4. Feature-Specific Workflows

### 4.1 Discovery Workflow (D-01 ~ D-04)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DISCOVERY WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    [Start: Home Feed]                                                           │
│            │                                                                     │
│            ▼                                                                     │
│    ┌───────────────┐                                                            │
│    │ D-01: Feed    │◀────────────────────────────┐                             │
│    │ 무한 스크롤   │                             │                              │
│    └───────┬───────┘                             │                              │
│            │                                     │                              │
│    ┌───────┴───────┐                             │                              │
│    │               │                             │                              │
│    ▼               ▼                             │                              │
│ [Filter]      [Search]                           │                              │
│    │               │                             │                              │
│    ▼               ▼                             │                              │
│ ┌───────────────────────┐                        │                              │
│ │ D-02: Hierarchical    │                        │                              │
│ │ Category → Media →    │                        │                              │
│ │ Cast → Context        │                        │                              │
│ └───────────┬───────────┘                        │                              │
│             │                                    │                              │
│             ▼                                    │                              │
│ ┌───────────────────────┐                        │                              │
│ │ D-04: Unified Search  │                        │                              │
│ │ [All][People][Media]  │                        │                              │
│ │ [Items]               │                        │                              │
│ └───────────┬───────────┘                        │                              │
│             │                                    │                              │
│             ▼                                    │                              │
│ ┌───────────────────────┐                        │                              │
│ │ D-03: Media Gallery   │────────────────────────┘                              │
│ │ (개별 미디어 페이지)  │                                                       │
│ └───────────────────────┘                                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

상태 관리:
• filterStore: activeFilter, category, mediaId, castId, contextType
• searchStore: query, debouncedQuery
• React Query: ["images", "infinite", { filter, search, limit }]
```

### 4.2 Detail Interaction Workflow (V-01 ~ V-06)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      DETAIL INTERACTION WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    [Card Click]                                                                 │
│         │                                                                        │
│         ▼                                                                        │
│    ┌───────────────────────────────────────────────────────────────────┐        │
│    │ V-01: Detail View                                                  │        │
│    │                                                                    │        │
│    │  ┌────────────────────┬────────────────────────────────────────┐ │        │
│    │  │                    │                                        │ │        │
│    │  │    Hero Image      │    V-04: Smart Tags                   │ │        │
│    │  │    (Ken Burns)     │    🎬 Media > 👤 Cast > 🏃 Context    │ │        │
│    │  │                    │                                        │ │        │
│    │  │    ●1 ●2 ●3       │    V-02: Spot Interaction              │ │        │
│    │  │    (스팟 오버레이)  │    • 스팟 클릭 → 아이템 하이라이트     │ │        │
│    │  │                    │    • 아이템 클릭 → 스팟 하이라이트     │ │        │
│    │  │                    │                                        │ │        │
│    │  └────────────────────┼────────────────────────────────────────┘ │        │
│    │                       │                                          │        │
│    │                       ▼                                          │        │
│    │  ┌──────────────────────────────────────────────────────────┐   │        │
│    │  │ V-03: Dual Match                                          │   │        │
│    │  │                                                           │   │        │
│    │  │ THE ORIGINAL                    THE VIBE                  │   │        │
│    │  │ ┌─────────────────┐            ┌─────────────────┐       │   │        │
│    │  │ │ Celine Jacket   │            │ Zara Blazer     │       │   │        │
│    │  │ │ ₩2,850,000      │            │ ₩129,000  ▲12  │       │   │        │
│    │  │ │ [Buy Original]  │            │ [Buy Vibe]      │       │   │        │
│    │  │ └─────────────────┘            └─────────────────┘       │   │        │
│    │  │                                                           │   │        │
│    │  │ V-05: Purchase Link ──────────────────────────────────▶ │   │        │
│    │  │ • 클릭 추적                                              │   │        │
│    │  │ • 제휴 링크 생성                                         │   │        │
│    │  │ • 새 탭에서 열기                                         │   │        │
│    │  └──────────────────────────────────────────────────────────┘   │        │
│    │                                                                  │        │
│    │  ┌──────────────────────────────────────────────────────────┐   │        │
│    │  │ V-06: Voting & Comments                                   │   │        │
│    │  │                                                           │   │        │
│    │  │ Is this accurate?  [👍 47] [👎 3]  94%                   │   │        │
│    │  │                                                           │   │        │
│    │  │ 💬 Comments (12)                                          │   │        │
│    │  │ ├── user123: Great find!                                 │   │        │
│    │  │ └── fashionista: Where can I get this?                   │   │        │
│    │  └──────────────────────────────────────────────────────────┘   │        │
│    └───────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Creation Workflow (C-01 ~ C-04)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CREATION WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    [Create Button Click]                                                        │
│            │                                                                     │
│            ▼                                                                     │
│    ┌───────────────────────────────────────────────────────────────────┐        │
│    │ C-01: Image Upload                                                 │        │
│    │ /create/upload                                                     │        │
│    │                                                                    │        │
│    │   ┌─────────────────────────────────────────────────────────┐    │        │
│    │   │  📷 Drag & drop or click to upload                      │    │        │
│    │   │  Supports: JPG, PNG, WebP (max 10MB)                    │    │        │
│    │   └─────────────────────────────────────────────────────────┘    │        │
│    │                                                                    │        │
│    │   Selected: [img1] [img2] [+]                                     │        │
│    │                                                                    │        │
│    │   Action: useImageUpload() → Supabase Storage                     │        │
│    └───────────────────────────────┬───────────────────────────────────┘        │
│                                    │ [Next]                                      │
│                                    ▼                                             │
│    ┌───────────────────────────────────────────────────────────────────┐        │
│    │ C-02: AI Object Recognition                                        │        │
│    │ /create/detect                                                     │        │
│    │                                                                    │        │
│    │   ┌─────────────────────────────────────────────────────────┐    │        │
│    │   │ [Image with bounding boxes]                              │    │        │
│    │   │   ┌──────┐                                               │    │        │
│    │   │   │Item 1│ 93%                                           │    │        │
│    │   │   └──────┘        ┌──────┐                              │    │        │
│    │   │                   │Item 2│ 87%                           │    │        │
│    │   │                   └──────┘                              │    │        │
│    │   └─────────────────────────────────────────────────────────┘    │        │
│    │                                                                    │        │
│    │   [Edit Box] [Remove] [+ Add Manual]                              │        │
│    │                                                                    │        │
│    │   Action: POST /api/ai/detect → Vision API                        │        │
│    └───────────────────────────────┬───────────────────────────────────┘        │
│                                    │ [Next]                                      │
│                                    ▼                                             │
│    ┌───────────────────────────────────────────────────────────────────┐        │
│    │ C-03: Metadata Tagging                                             │        │
│    │ /create/tag                                                        │        │
│    │                                                                    │        │
│    │   Media: [🔍 Search...] → 🎵 BLACKPINK                            │        │
│    │   Cast:  [Jisoo ✓] [Jennie] [Rosé] [Lisa]                        │        │
│    │   Context: [✓ Airport] [ Stage] [ MV]                             │        │
│    │                                                                    │        │
│    │   Action: filterStore / hierarchicalFilterStore                   │        │
│    └───────────────────────────────┬───────────────────────────────────┘        │
│                                    │ [Next]                                      │
│                                    ▼                                             │
│    ┌───────────────────────────────────────────────────────────────────┐        │
│    │ C-04: Spot Registration                                            │        │
│    │ /create/spot                                                       │        │
│    │                                                                    │        │
│    │   Item 1: Top                                                      │        │
│    │   THE ORIGINAL: [🔗 Paste URL...] → Parsed ✓                      │        │
│    │   │ Celine Triomphe Jacket                                        │        │
│    │   │ ₩2,850,000                                                    │        │
│    │   THE VIBE: [+ Add alternative]                                   │        │
│    │                                                                    │        │
│    │   Action: POST /api/scrape → useScrapeUrl()                       │        │
│    └───────────────────────────────┬───────────────────────────────────┘        │
│                                    │ [Publish]                                   │
│                                    ▼                                             │
│    ┌───────────────────────────────────────────────────────────────────┐        │
│    │ [Published!] → Redirect to Post Detail                             │        │
│    └───────────────────────────────────────────────────────────────────┘        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. State Synchronization

### 5.1 Global State Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STATE SYNCHRONIZATION                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                           USER ACTION                                    │   │
│   │            (Click, Scroll, Input, Navigation)                           │   │
│   └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         ZUSTAND STORES                                   │   │
│   │                                                                          │   │
│   │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │   │
│   │   │  filterStore   │  │  searchStore   │  │transitionStore │           │   │
│   │   │                │  │                │  │                │           │   │
│   │   │ activeFilter   │  │ query          │  │ selectedId     │           │   │
│   │   │ category       │  │ debouncedQuery │  │ originState    │           │   │
│   │   │ mediaId        │  │                │  │ rect           │           │   │
│   │   │ castId         │  │                │  │                │           │   │
│   │   └───────┬────────┘  └───────┬────────┘  └───────┬────────┘           │   │
│   │           │                   │                   │                      │   │
│   └───────────┼───────────────────┼───────────────────┼──────────────────────┘   │
│               │                   │                   │                          │
│               └───────────────────┼───────────────────┘                          │
│                                   │                                              │
│                                   ▼                                              │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         REACT QUERY                                      │   │
│   │                                                                          │   │
│   │   queryKey: ["images", "infinite", { filter, search, limit }]           │   │
│   │                                                                          │   │
│   │   Store 변경 → Query Key 변경 → 자동 Refetch                           │   │
│   │                                                                          │   │
│   │   Cache Settings:                                                        │   │
│   │   • staleTime: 60s                                                      │   │
│   │   • gcTime: 5min                                                        │   │
│   │   • keepPreviousData: true                                              │   │
│   └─────────────────────────────────┬───────────────────────────────────────┘   │
│                                     │                                            │
│                                     ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                           SUPABASE                                       │   │
│   │                                                                          │   │
│   │   fetchUnifiedImages() → post_image + image + item JOIN                 │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Query Key Dependencies

| Query Key                       | 의존 Store               | 트리거 액션            |
| ------------------------------- | ------------------------ | ---------------------- |
| `["images", "infinite", {...}]` | filterStore, searchStore | 필터 변경, 검색어 입력 |
| `["image", id]`                 | -                        | 상세 페이지 진입       |
| `["related", account]`          | -                        | 관련 이미지 로드       |

---

## 6. Error & Edge Case Flows

### 6.1 Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ERROR HANDLING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   [API 호출 실패]                                                               │
│         │                                                                        │
│         ├──▶ 네트워크 오류 ──▶ [ErrorState.tsx] ──▶ "연결 확인" + [재시도]      │
│         │                                                                        │
│         ├──▶ 404 Not Found ──▶ [EmptyState.tsx] ──▶ "결과 없음" 메시지         │
│         │                                                                        │
│         ├──▶ 500 Server ──▶ [ErrorState.tsx] ──▶ "잠시 후 다시" + [재시도]     │
│         │                                                                        │
│         └──▶ 401 Unauthorized ──▶ [Login Redirect] ──▶ /login                  │
│                                                                                  │
│   관련 컴포넌트:                                                                │
│   • app/images/ErrorState.tsx                                                   │
│   • app/images/EmptyState.tsx                                                   │
│   • React Query retry: 1회                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Edge Cases

| 상황              | 처리 방법                  | 관련 파일                 |
| ----------------- | -------------------------- | ------------------------- |
| 이미지 0개        | EmptyState 표시            | `EmptyState.tsx`          |
| 아이템 0개 (상세) | "No items detected" 메시지 | `InteractiveShowcase.tsx` |
| 좌표 없는 아이템  | 기본 위치 (center) 사용    | `useNormalizedItems.ts`   |
| 매우 긴 스크롤    | 300 DOM 노드 제한          | `ThiingsGrid.tsx`         |
| 오프라인          | 캐시된 데이터 표시         | React Query gcTime        |

---

## 7. Navigation Quick Reference

### 7.1 Route Map

```
/                           # Home (무한 스크롤 피드)
├── ?filter=xxx             # 필터 적용된 홈
├── ?q=xxx                  # 검색 결과
│
/posts/[id]                 # 포스트 상세 (이미지 중심 UI)
/@modal/(.)posts/[id]       # 포스트 상세 (인터셉션 모달)
│
/images/[id]                # [legacy] /posts/[id]로 리다이렉트
│
/search                     # 검색 결과 페이지 (미구현)
│
/media/[id]                 # 미디어 갤러리 (미구현)
/cast/[id]                  # 캐스트 페이지 (미구현)
│
/profile                    # 프로필 대시보드 (미구현)
├── /activity               # 활동 내역
├── /earnings               # 수익 대시보드
└── /settings               # 설정
│
/create                     # 포스트 생성 (미구현)
├── /upload                 # Step 1: 업로드
├── /detect                 # Step 2: AI 감지
├── /tag                    # Step 3: 태깅
└── /spot                   # Step 4: 상품 등록
│
/login                      # 로그인 (미구현)
/auth/callback              # OAuth 콜백
│
/lab                        # 실험 기능
├── /fashion-scan           # AI 패션 스캔
└── /ascii-text             # ASCII 텍스트
│
/debug/supabase/posts       # 디버그용
```

### 7.2 Component → Route Mapping

| Component              | Route                   | 비고          |
| ---------------------- | ----------------------- | ------------- |
| `HomeClient.tsx`       | `/`                     | 메인 피드     |
| `ThiingsGrid.tsx`      | `/`                     | 그리드 렌더링 |
| `ImageDetailPage.tsx`  | `/posts/[id]`           | 풀페이지 상세 |
| `ImageDetailModal.tsx` | `/@modal/(.)posts/[id]` | 모달 상세     |
| `Header.tsx`           | 전역                    | 고정 헤더     |
| `FilterTabs.tsx`       | `/`                     | 필터 UI       |

---

## Related Documents

- [02-discovery.md](./02-discovery.md) - Discovery 기능 상세
- [03-detail-interaction.md](./03-detail-interaction.md) - Detail 기능 상세
- [04-creation-ai.md](./04-creation-ai.md) - Creation 기능 상세
- [../architecture/README.md](../../docs/architecture/README.md) - 시스템 아키텍처
- [../architecture/state-management.md](../../docs/architecture/state-management.md) - 상태 관리
