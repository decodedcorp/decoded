# [SCR-CREA-03] 태그 편집 (Tag & Spot Edit)

| 항목 | 내용 |
|------|------|
| **문서 ID** | SCR-CREA-03 |
| **화면명** | 태그 편집 |
| **경로** | `/create/edit` |
| **작성일** | 2025-01-14 |
| **버전** | v1.0 |
| **상태** | 초안 |

---

## 1. 화면 개요

- **목적**: 미디어/캐스트 태그 선택, 아이템별 구매 링크(Spot) 등록, 최종 게시 전 정보 확인
- **선행 조건**: SCR-CREA-02에서 아이템 검출 완료 (또는 수동 추가)
- **후속 화면**: 게시 완료 → 상세 화면(SCR-VIEW-01) 또는 홈 피드
- **관련 기능 ID**: C-03 Metadata Tagging, C-04 Spot Registration

---

## 2. UI 와이어프레임

### 2.1 데스크톱 (≥768px) - 태그 선택 탭

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 3 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ○ Upload ━━━━ ○ Detect ━━━━ ● Tag ━━━━ ○ Link                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [TAB-TAGS] Tags  │  [TAB-SPOTS] Product Links  │  [TAB-REVIEW] Review ││
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  Where is this from? *  [REQUIRED]                                      ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ 🔍 Search show, drama, or group...                   [INP-MEDIA]│   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │  Popular:                                                               ││
│  │  [BLACKPINK] [NewJeans] [Squid Game] [IVE] [aespa]                     ││
│  │  [CHIP-01]   [CHIP-02]  [CHIP-03]    [CHIP-04] [CHIP-05]              ││
│  │                                                                          ││
│  │  Selected: [✓ BLACKPINK - Group]                                [✕]   ││
│  │            [SELECTED-MEDIA]                                             ││
│  │                                                                          ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                          ││
│  │  Who is wearing this?                                                   ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ 🔍 Search member name...                             [INP-CAST] │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │  Members of BLACKPINK:                                                  ││
│  │  [Jisoo] [Jennie] [Rosé] [Lisa]                                        ││
│  │  [CHIP-CAST-01] [CHIP-CAST-02] [CHIP-CAST-03] [CHIP-CAST-04]          ││
│  │                                                                          ││
│  │  Selected: [✓ Jisoo]                                             [✕]   ││
│  │            [SELECTED-CAST]                                              ││
│  │                                                                          ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                          ││
│  │  What's the context?                                                    ││
│  │  [○ Airport] [○ Stage] [○ MV] [○ Photoshoot] [○ Daily] [○ Event]     ││
│  │  [RADIO-01]  [RADIO-02] [RADIO-03] [RADIO-04]  [RADIO-05] [RADIO-06] ││
│  │                                                                          ││
│  │  Selected: ● Airport                                                    ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [← Back]                              [Next: Add Product Links →]  │   │
│  │  [BTN-BACK]                            [BTN-NEXT]                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 태그 검색 자동완성 드롭다운

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 black                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🎵 BLACKPINK                                    Group     │ │
│  │    K-pop girl group                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📺 Black Mirror                                 Drama     │ │
│  │    British anthology series                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🎵 Black Eyed Peas                              Group     │ │
│  │    American musical group                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Can't find it? [+ Request New Tag]                            │
│                 [BTN-REQUEST-TAG]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 태그 요청 모달

```
┌─────────────────────────────────────────────────────────────────┐
│  Request New Tag                                         [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Can't find what you're looking for?                           │
│  Request a new tag to be added to our database.                │
│                                                                 │
│  Tag Type                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [Media ▼]                                  [SEL-TYPE]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Name (English) *                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Name (Korean)                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Media Type (for Media tags)                                    │
│  [○ Group] [○ Drama] [○ Movie] [○ Variety]                    │
│                                                                 │
│  Additional Notes                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                         [Submit Request]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 데스크톱 - 제품 링크 탭 (Spot Registration)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Step 4 of 4        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ○ Upload ━━━━ ○ Detect ━━━━ ○ Tag ━━━━ ● Link                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [TAB-TAGS] Tags  │  [TAB-SPOTS] Product Links  │  [TAB-REVIEW] Review ││
│  │                      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                          ││
│  │  ╔═══════════════════════════════════════════════════════════════════╗  ││
│  │  ║  Item 1: Top                                                       ║  ││
│  │  ║  ┌────────┐                                                        ║  ││
│  │  ║  │ [crop] │  Category: Top • Confidence: 93%                      ║  ││
│  │  ║  └────────┘                                                        ║  ││
│  │  ╚═══════════════════════════════════════════════════════════════════╝  ││
│  │                                                                          ││
│  │  THE ORIGINAL (Exact Match)                                             ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ 🔗 Paste shopping URL...                           [INP-URL-01] │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │  [SPINNER] Fetching product info...                             │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │  [PARSING-STATE]                                                        ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │  ┌────────┐                                                      │   ││
│  │  │  │[product│  Brand: Celine                         [Edit]       │   ││
│  │  │  │ image] │  Name: Triomphe Jacket                [Edit]       │   ││
│  │  │  │        │  Price: ₩2,850,000                    [Edit]       │   ││
│  │  │  └────────┘  URL: celine.com/...               ✓ Valid        │   ││
│  │  │                                                                      │   ││
│  │  │                                               [Remove]  [✓ Saved] │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │  [PARSED-PRODUCT-01]                                                    ││
│  │                                                                          ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │                                                                          ││
│  │  THE VIBE (Similar Alternative)                        [+ Add Vibe]    ││
│  │                                                        [BTN-ADD-VIBE]  ││
│  │                                                                          ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │  ┌────────┐                                                      │   ││
│  │  │  │[product│  Brand: Zara                           [Edit]       │   ││
│  │  │  │ image] │  Name: Structured Blazer              [Edit]       │   ││
│  │  │  │        │  Price: ₩139,000                      [Edit]       │   ││
│  │  │  └────────┘  URL: zara.com/...                 ✓ Valid        │   ││
│  │  │                                               [Remove]          │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │  [VIBE-PRODUCT-01]                                                      ││
│  │                                                                          ││
│  │  ═══════════════════════════════════════════════════════════════════   ││
│  │                                                                          ││
│  │  ╔═══════════════════════════════════════════════════════════════════╗  ││
│  │  ║  Item 2: Bag                                                       ║  ││
│  │  ║  ┌────────┐                                                        ║  ││
│  │  ║  │ [crop] │  Category: Bag • Confidence: 87%                      ║  ││
│  │  ║  └────────┘                                                        ║  ││
│  │  ╚═══════════════════════════════════════════════════════════════════╝  ││
│  │                                                                          ││
│  │  THE ORIGINAL (Exact Match)                                             ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │ 🔗 Paste shopping URL...                           [INP-URL-02] │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                          ││
│  │  [or enter manually]   [BTN-MANUAL]                                     ││
│  │                                                                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [← Back to Tags]                              [Publish Post →]     │   │
│  │  [BTN-BACK]                                    [BTN-PUBLISH]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 수동 입력 폼 (파싱 실패 시)

```
┌─────────────────────────────────────────────────────────────────┐
│  Enter Product Details Manually                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Brand *                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔍 Search or enter brand...                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Suggestions: [Chanel] [Gucci] [Prada] [Celine]               │
│                                                                 │
│  Product Name *                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Price                                                          │
│  ┌────────────┐ ┌───────────────────────────────────────────┐ │
│  │ [KRW ▼]    │ │                                            │ │
│  └────────────┘ └───────────────────────────────────────────┘ │
│                                                                 │
│  Purchase URL                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://                                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Product Image                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [📷 Upload Image]  or  paste image URL                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  [Cancel]                                   [Save]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 모바일 (<768px)

```
┌─────────────────────────────────┐
│  [←]  Add Details         [✕]  │
├─────────────────────────────────┤
│                                 │
│   ○ ━━━ ○ ━━━ ● ━━━ ○          │
│   1     2     3     4          │
│                                 │
│  [Tags] [Links] [Review]       │
│   ━━━━━━                        │
│                                 │
│  Where is this from? *         │
│  ┌─────────────────────────┐   │
│  │ 🔍 Search...             │   │
│  └─────────────────────────┘   │
│                                 │
│  Popular                       │
│  [BLACKPINK] [NewJeans]        │
│  [Squid Game] [IVE]            │
│                                 │
│  Selected:                     │
│  ┌─────────────────────────┐   │
│  │ ✓ BLACKPINK        [✕]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Who is wearing this?          │
│  ┌─────────────────────────┐   │
│  │ 🔍 Search...             │   │
│  └─────────────────────────┘   │
│                                 │
│  Members of BLACKPINK          │
│  [Jisoo] [Jennie]              │
│  [Rosé] [Lisa]                 │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Context                       │
│  [Airport] [Stage] [MV]        │
│  [Photoshoot] [Daily]          │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [← Back] [Next →]       │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 2.7 리뷰 탭 (게시 전 확인)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [←] Create New Post                                    Ready to Publish   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  [TAB-TAGS] Tags  │  [TAB-SPOTS] Product Links  │  [TAB-REVIEW] Review ││
│  │                                                    ━━━━━━━━━━━━━━━━━━━━ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │   Preview                                                             │ │
│  │   ┌────────────────────────────────────────────────────────────────┐  │ │
│  │   │                                                                │  │ │
│  │   │              [Image with spot markers]                          │  │ │
│  │   │                                                                │  │ │
│  │   │                    ●① Top                                      │  │ │
│  │   │                                                                │  │ │
│  │   │                         ●② Bag                                 │  │ │
│  │   │                                                                │  │ │
│  │   └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │   Tags                                                                │ │
│  │   ┌────────────────────────────────────────────────────────────────┐  │ │
│  │   │  Media: BLACKPINK                                              │  │ │
│  │   │  Cast: Jisoo                                                   │  │ │
│  │   │  Context: Airport                                              │  │ │
│  │   │                                                    [Edit Tags] │  │ │
│  │   └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  │   Items (2)                                                           │ │
│  │   ┌────────────────────────────────────────────────────────────────┐  │ │
│  │   │  ①  Top                                                        │  │ │
│  │   │      Original: Celine Triomphe Jacket (₩2,850,000)            │  │ │
│  │   │      Vibe: Zara Structured Blazer (₩139,000)                  │  │ │
│  │   │                                                                │  │ │
│  │   │  ②  Bag                                                        │  │ │
│  │   │      Original: Not added                                       │  │ │
│  │   │      Vibe: Not added                                           │  │ │
│  │   │                                                   [Edit Items] │  │ │
│  │   └────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Save as Draft]                               [🚀 Publish Post]    │   │
│  │  [BTN-DRAFT]                                   [BTN-PUBLISH]        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. UI 요소 정의

### 3.1 탭 네비게이션

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| TAB-TAGS | 탭 | 태그 탭 | "Tags" | 태그 선택 섹션 표시 |
| TAB-SPOTS | 탭 | 제품 링크 탭 | "Product Links" | Spot 등록 섹션 표시 |
| TAB-REVIEW | 탭 | 리뷰 탭 | "Review" | 최종 확인 섹션 표시 |

### 3.2 미디어 선택

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| INP-MEDIA | 입력 | 미디어 검색 | placeholder: "Search show, drama, or group..." | 검색어 입력 시 자동완성 |
| CHIP-01~n | 칩 | 인기 미디어 | 클릭 가능, 목록에서 상위 태그 | 클릭 시 선택 |
| SELECTED-MEDIA | 선택됨 | 선택된 미디어 | bg-primary/10, border-primary | X 클릭 시 선택 해제 |
| BTN-REQUEST-TAG | 버튼 | 태그 요청 | variant: ghost, "+ Request New Tag" | 태그 요청 모달 열기 |
| DROPDOWN-MEDIA | 드롭다운 | 검색 결과 | 최대 5개 결과 + "Request" 옵션 | 결과 클릭 시 선택 |

### 3.3 캐스트 선택

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| INP-CAST | 입력 | 캐스트 검색 | placeholder: "Search member name..." | 선택된 미디어 기반 필터링 |
| CHIP-CAST-01~n | 칩 | 멤버 칩 | 선택된 미디어의 멤버 자동 표시 | 다중 선택 가능 |
| SELECTED-CAST | 선택됨 | 선택된 캐스트 | 다중 선택, 각각 X 버튼 | 개별 해제 가능 |

### 3.4 컨텍스트 선택

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| RADIO-01~06 | 라디오 | 컨텍스트 옵션 | Airport, Stage, MV, Photoshoot, Daily, Event | 단일 선택 |

### 3.5 제품 링크 (Spot)

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| ITEM-SECTION-01~n | 섹션 | 아이템 섹션 | 각 검출 아이템별 분리 | - |
| INP-URL-01~n | 입력 | URL 입력 | placeholder: "Paste shopping URL..." | 붙여넣기 시 자동 파싱 시작 |
| PARSING-STATE | 상태 | 파싱 상태 | 스피너 + "Fetching product info..." | 로딩 중 표시 |
| PARSED-PRODUCT | 카드 | 파싱된 제품 | 이미지, 브랜드, 이름, 가격, URL | 각 필드 Edit 버튼 |
| BTN-EDIT | 버튼 | 편집 | variant: ghost, "Edit" | 해당 필드 인라인 편집 |
| BTN-REMOVE | 버튼 | 삭제 | variant: ghost, "Remove" | 제품 정보 삭제 |
| BTN-ADD-VIBE | 버튼 | Vibe 추가 | variant: outline, "+ Add Vibe" | 대안 제품 추가 |
| BTN-MANUAL | 링크 | 수동 입력 | "or enter manually" | 수동 입력 폼 열기 |

### 3.6 수동 입력 폼

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| INP-BRAND | 입력 | 브랜드 | 자동완성, required | 브랜드 DB 검색 |
| INP-NAME | 입력 | 제품명 | required | - |
| SEL-CURRENCY | 선택 | 통화 | KRW, USD, EUR, JPY, CNY | - |
| INP-PRICE | 입력 | 가격 | type: number | - |
| INP-PURCHASE-URL | 입력 | 구매 URL | type: url | URL 유효성 검사 |
| INP-PRODUCT-IMAGE | 입력 | 제품 이미지 | 파일 업로드 또는 URL | - |

### 3.7 리뷰/게시

| UI ID | 구분 | 요소명 | 속성/상태 | 인터랙션/로직 |
|:---:|:---:|:---:|:---|:---|
| PREVIEW-IMAGE | 이미지 | 프리뷰 | 스팟 마커 오버레이 | 각 아이템 위치 표시 |
| SUMMARY-TAGS | 요약 | 태그 요약 | Media, Cast, Context | Edit Tags 클릭 시 탭 이동 |
| SUMMARY-ITEMS | 요약 | 아이템 요약 | 각 아이템별 Original/Vibe 정보 | Edit Items 클릭 시 탭 이동 |
| BTN-DRAFT | 버튼 | 임시 저장 | variant: outline | 임시 저장 후 내 활동으로 |
| BTN-PUBLISH | 버튼 | 게시 | variant: primary, Icon: Rocket | 최소 조건 충족 시 활성화 |

---

## 4. 상태 정의

| 상태 | 조건 | UI 변화 |
|------|------|--------|
| 태그 미선택 | mediaId === null | Next 버튼 비활성화, 필수 표시 강조 |
| 태그 선택됨 | mediaId !== null | Next 버튼 활성화 |
| URL 파싱 중 | scraping === true | 스피너 + 로딩 메시지 |
| 파싱 성공 | parsed data 있음 | 제품 카드 표시 |
| 파싱 실패 | error 있음 | 에러 메시지 + 수동 입력 안내 |
| 게시 가능 | mediaId + 최소 1개 아이템 | Publish 버튼 활성화 |
| 게시 불가 | 조건 미충족 | Publish 버튼 비활성화 + 안내 |

---

## 5. 데이터 요구사항

### 5.1 API 호출

| API | Method | Endpoint | 호출 시점 |
|-----|--------|----------|----------|
| 미디어 검색 | GET | `/api/tags/media/search?q={query}` | 검색어 입력 시 (debounce 300ms) |
| 캐스트 검색 | GET | `/api/tags/cast/search?q={query}&mediaId={id}` | 미디어 선택 후 검색 시 |
| 인기 태그 | GET | `/api/tags/popular` | 페이지 로드 시 |
| 태그 요청 | POST | `/api/tags/request` | 요청 폼 제출 시 |
| URL 스크래핑 | POST | `/api/scrape` | URL 붙여넣기 시 |
| 게시물 생성 | POST | `/api/posts` | Publish 버튼 클릭 시 |

### 5.2 스크래핑 지원 사이트

| 사이트 | 도메인 | 지원 여부 |
|--------|--------|:---:|
| Musinsa | musinsa.com | ✓ |
| 29CM | 29cm.co.kr | ✓ |
| W Concept | wconcept.co.kr | ✓ |
| SSF Shop | ssfshop.com | ✓ |
| Farfetch | farfetch.com | ✓ |
| SSENSE | ssense.com | ✓ |
| Net-a-Porter | net-a-porter.com | ✓ |
| Amazon | amazon.* | ✓ |
| Coupang | coupang.com | ✓ |

### 5.3 상태 관리 (Zustand)

```typescript
interface CreateState {
  // Tags
  tags: {
    mediaId: string | null;
    castIds: string[];
    contextType: ContextType | null;
  };
  setMedia: (mediaId: string | null) => void;
  toggleCast: (castId: string) => void;
  setContext: (contextType: ContextType | null) => void;

  // Spots
  items: Map<string, ItemDraft>;
  setItemProduct: (
    detectionId: string,
    type: 'original' | 'vibe',
    data: ProductData
  ) => void;
  removeItemProduct: (detectionId: string, type: string) => void;
}

interface ItemDraft {
  detectionId: string;
  original?: ProductData;
  vibes: ProductData[];
}

interface ProductData {
  productName: string;
  brand: string;
  price?: number;
  currency?: string;
  purchaseUrl: string;
  imageUrl?: string;
}

type ContextType = 'airport' | 'stage' | 'mv' | 'photoshoot' | 'daily' | 'event';
```

---

## 6. 에러 처리

| 에러 상황 | 사용자 메시지 | 처리 방법 |
|----------|-------------|----------|
| 미디어 검색 실패 | "Search failed. Please try again." | 재시도 버튼 |
| 미지원 URL | "This site is not supported. Please enter details manually." | 수동 입력 폼 표시 |
| 스크래핑 실패 | "Could not fetch product info. Please enter manually." | 수동 입력 폼 표시 |
| 스크래핑 부분 실패 | 누락 필드만 수동 입력 요청 | 부분 데이터 + 편집 UI |
| 게시 실패 | "Failed to publish. Please try again." | 재시도 버튼 + 임시 저장 안내 |
| 필수 필드 누락 | 필드별 에러 메시지 | 인라인 에러 표시 |

---

## 7. 접근성 (A11y)

### 7.1 키보드 네비게이션
- `Tab`: 입력 필드 → 칩들 → 버튼 순서
- `Arrow Keys`: 검색 결과 목록 탐색
- `Enter`: 검색 결과 선택
- `Escape`: 드롭다운 닫기
- `Backspace`: 선택된 태그 삭제 (포커스 시)

### 7.2 스크린 리더
- 검색 입력: `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`
- 검색 결과: `role="listbox"`, 각 항목 `role="option"`
- 선택된 태그: `role="button"`, `aria-label="Remove [태그명]"`
- 필수 필드: `aria-required="true"`, `aria-invalid` (에러 시)

### 7.3 포커스 관리
- 태그 선택 시: 선택된 태그로 포커스
- 태그 삭제 시: 검색 입력으로 포커스
- 탭 전환 시: 해당 탭 첫 번째 요소로 포커스

---

## 8. 컴포넌트 매핑

| UI 영역 | 컴포넌트 | 파일 경로 |
|--------|---------|----------|
| 페이지 | CreateEditPage | `app/create/edit/page.tsx` |
| 탭 컨테이너 | EditTabs | `lib/components/create/EditTabs.tsx` |
| 미디어 선택 | MediaSelector | `lib/components/create/MediaSelector.tsx` |
| 캐스트 선택 | CastSelector | `lib/components/create/CastSelector.tsx` |
| 컨텍스트 선택 | ContextSelector | `lib/components/create/ContextSelector.tsx` |
| 자동완성 | TagAutocomplete | `lib/components/create/TagAutocomplete.tsx` |
| 태그 칩 | TagChip | `lib/components/create/TagChip.tsx` |
| 태그 요청 모달 | TagRequestModal | `lib/components/create/TagRequestModal.tsx` |
| URL 입력 | UrlInput | `lib/components/create/UrlInput.tsx` |
| 제품 카드 | ParsedProductCard | `lib/components/create/ParsedProductCard.tsx` |
| 수동 입력 폼 | ManualProductForm | `lib/components/create/ManualProductForm.tsx` |
| 리뷰 프리뷰 | ReviewPreview | `lib/components/create/ReviewPreview.tsx` |
| 훅: 태그 검색 | useTagSearch | `lib/hooks/useTagSearch.ts` |
| 훅: URL 스크래핑 | useScrapeUrl | `lib/hooks/useScrapeUrl.ts` |
| 훅: 게시 | usePublishPost | `lib/hooks/usePublishPost.ts` |

---

## 9. 구현 체크리스트

- [ ] EditTabs 컴포넌트 (Tags / Links / Review)
- [ ] MediaSelector + 자동완성
- [ ] CastSelector (미디어 선택 후 활성화)
- [ ] ContextSelector (라디오 버튼)
- [ ] TagRequestModal (새 태그 요청)
- [ ] UrlInput (붙여넣기 감지)
- [ ] useScrapeUrl 훅 (스크래핑 API 연동)
- [ ] ParsedProductCard (파싱 결과 표시)
- [ ] ManualProductForm (수동 입력 폼)
- [ ] Vibe 제품 추가 기능
- [ ] ReviewPreview (스팟 마커 + 요약)
- [ ] 게시/임시저장 기능
- [ ] 에러 처리 및 재시도 UI
- [ ] 반응형 레이아웃
- [ ] 접근성 테스트

---

## 10. 참고 사항

### 10.1 게시 최소 조건
```typescript
const canPublish = () => {
  const { tags, detections, items } = createStore.getState();

  // 필수: 미디어 태그 선택
  if (!tags.mediaId) return false;

  // 필수: 최소 1개 아이템 검출
  if (detections.length === 0) return false;

  // 선택: 아이템에 Original 또는 Vibe 하나 이상 (권장)
  // → 없어도 게시 가능, 경고만 표시

  return true;
};
```

### 10.2 컨텍스트 타입
```typescript
const CONTEXT_TYPES = [
  { value: 'airport', label: 'Airport (공항)' },
  { value: 'stage', label: 'Stage (무대)' },
  { value: 'mv', label: 'MV (뮤직비디오)' },
  { value: 'photoshoot', label: 'Photoshoot (화보)' },
  { value: 'daily', label: 'Daily (일상)' },
  { value: 'event', label: 'Event (행사)' },
];
```

### 10.3 스크래핑 타임아웃
```typescript
const SCRAPE_TIMEOUT = 15000; // 15초

// 타임아웃 시 자동으로 수동 입력 폼 표시
```
