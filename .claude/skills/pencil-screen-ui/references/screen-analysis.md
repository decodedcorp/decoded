# Pencil Screen 이미지 분석

## 1. Home Desktop (decoded_home_desktop.png)

### 전체 레이아웃
- 배경: 다크 테마 (`bg-background`)
- 최대 너비: `max-w-7xl`
- Header 높이: 64px

### 섹션 상세

#### Header
```
위치: 상단 고정
구성: Logo | Navigation Links | Search Icon | Profile Avatar
스타일: bg-background/80 backdrop-blur
```

#### Hero Banner
```
위치: Header 아래
높이: ~400px
구성: 대형 이미지 + 오버레이 텍스트
스타일: relative, image cover, gradient overlay
```

#### Decoded's Pick
```
배경: bg-card
레이아웃: 수평 스크롤 캐러셀
카드 크기: ~280px width
카드 스타일: rounded-lg, image + title + price
헤더: "Decoded's Pick" + "View All" 버튼
```

#### Today's Decoded
```
배경: bg-background
레이아웃: 3열 그리드 (lg)
카드 타입: 프로필 + 이미지 조합
왼쪽: 프로필 정보 카드
오른쪽: 2x2 이미지 그리드
헤더: "Today's Decoded" + "View Solution" 버튼
```

#### Artist Spotlight
```
배경: bg-card
레이아웃: 2열 그리드
카드: 대형 이미지 + 이름 + 부제목
헤더: "Artist Spotlight" + "View All"
```

#### What's New
```
배경: bg-background
레이아웃: 3열 그리드
카드: 이미지 + 제목 + 날짜
```

#### Discover Items
```
배경: bg-card
레이아웃: 탭 + 그리드
탭: Fashion | Beauty | Lifestyle | Accessories
그리드: 4열, 작은 아이템 카드
```

#### Best/Weekly/Trending (3단 섹션)
```
배경: bg-background
레이아웃: 3열 (각 섹션)
- Best Items: 순위 + 이미지 + 가격
- Weekly Best: 큰 이미지 + 제목
- Trending Now: 태그 버튼 그리드
```

#### Footer
```
배경: bg-card
레이아웃: 4열 링크 그룹
구성: Brand | Company | Support | Connect
하단: Copyright + Social Links
```

---

## 2. Home Mobile (decoded_home_mobile.png)

### 반응형 변경사항

| 섹션 | Desktop | Mobile |
|------|---------|--------|
| Navigation | 수평 링크 | 햄버거 메뉴 |
| Hero | 400px | 280px |
| Decoded's Pick | 수평 스크롤 | 유지 (작은 카드) |
| Today's Decoded | 3열 | 1열 스택 |
| Artist Spotlight | 2열 | 1열 |
| What's New | 3열 | 2열 |
| Discover Items | 4열 | 2열 |
| Best/Weekly/Trending | 3열 | 1열 스택 |
| Footer | 4열 | 1열 아코디언 |

### 패딩 변경
- `px-4` (모바일) vs `px-6 lg:px-8` (데스크톱)
- `py-8` (모바일) vs `py-10 md:py-16` (데스크톱)

---

## 3. Post Detail Desktop (decoded_post_detail_desktop.png)

### 섹션 상세

#### Hero Image
```
높이: 60vh, max 600px
스타일: 전체 너비, object-cover
오버레이: 그라디언트 (아래에서 위로)
```

#### Tag Bar
```
위치: Hero 아래
구성: 카테고리 태그들 (pill buttons)
스타일: gap-2, bg-muted rounded-full px-3 py-1
```

#### Content Section
```
레이아웃: max-w-3xl mx-auto
Typography:
- 제목: text-4xl font-bold
- 본문: text-lg leading-relaxed
- Dropcap: float-left text-5xl
```

#### Detected Items
```
배경: bg-card
헤더: "Detected Items" + "View All"
레이아웃: 리스트 (이미지 + 제목 + 가격)
아이템: flex items-center gap-4
```

#### Gallery
```
배경: bg-background
레이아웃: 3열 그리드
이미지: aspect-square rounded-lg
호버: scale-105 transition
```

#### Shop the Look
```
배경: bg-card
레이아웃: 수평 스크롤 캐러셀
카드: ProductCard 컴포넌트
```

#### Related Looks
```
배경: bg-background
레이아웃: 4열 그리드
카드: 이미지 + 오버레이 정보
```

---

## 4. Post Detail Mobile (decoded_post_detail_mobile.png)

### 반응형 변경사항

| 섹션 | Desktop | Mobile |
|------|---------|--------|
| Hero | 60vh | 426px (고정) |
| Tags | 수평 스크롤 | 유지 |
| Content | max-w-3xl | full width |
| Detected Items | 3열 | 2열 |
| Gallery | 3열 | 2열 |
| Shop the Look | 캐러셀 | 수평 스크롤 |
| Related | 4열 | 2열 |

### 모바일 전용 UI
- 상단 뒤로가기 버튼
- 하단 액션 바 (Like, Share, Bookmark)
- 스와이프 제스처 지원

---

## 5. 공통 컴포넌트 패턴

### Section Header
```tsx
<div className="flex items-center justify-between mb-6">
  <Heading variant="h2">{title}</Heading>
  <button className="text-sm text-primary hover:underline">
    View All
  </button>
</div>
```

### Card Grid
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  {items.map(item => (
    <Card key={item.id}>{/* ... */}</Card>
  ))}
</div>
```

### Horizontal Scroll
```tsx
<div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 -mx-4 px-4">
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 w-64 snap-start">
      <Card>{/* ... */}</Card>
    </div>
  ))}
</div>
```

### Section Wrapper
```tsx
<section className="py-10 md:py-16 px-4 md:px-6 lg:px-8 bg-card">
  <div className="max-w-7xl mx-auto">
    {/* Section Header */}
    {/* Content */}
  </div>
</section>
```

### Responsive Grid
```tsx
// 2열 (모바일 1열)
className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"

// 3열 (모바일 2열)
className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"

// 4열 (모바일 2열)
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
```
