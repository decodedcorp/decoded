# Quick Task 001: Fix Header & Mobile Nav Design

## Problem Statement

현재 구현이 decoded.pen 디자인과 다름:

### Desktop Header 차이점
| 항목 | decoded.pen | 현재 구현 |
|------|-------------|-----------|
| 높이 | 72px | 64px |
| 메뉴 | Home, Feed, Explore, Request | Home, Discover, Create |
| 중앙 정렬 | 명확히 가운데 | container 기본 정렬 |

### Mobile Nav Bar 차이점
| 항목 | decoded.pen | 현재 구현 |
|------|-------------|-----------|
| 높이 | 64px | 56px (h-14) |
| 구조 | 아이콘 + 라벨 | 아이콘만 |
| 메뉴 | Home, Search, Request, Feed, Profile | Home, Explore, Request, Profile |
| 배경 | $--card | bg-background/95 |
| padding | 8px 24px | 없음 (justify-around) |

---

## Tasks

### Task 1: Update Desktop Header
**File:** `packages/web/lib/design-system/desktop-header.tsx`

Changes:
1. 높이: 64px → 72px
2. NAV_ITEMS 수정:
   - Home (/)
   - Feed (/feed)
   - Explore (/explore)
   - Request (/request)
3. Navigation을 absolute 가운데 정렬 또는 flex 구조 변경

### Task 2: Update Mobile Nav Bar
**File:** `packages/web/lib/components/MobileNavBar.tsx`

Changes:
1. 높이: h-14 → h-16 (64px)
2. 5개 아이템으로 변경:
   - Home (house) - /
   - Search (search) - /search
   - Request (circle-plus) - modal
   - Feed (layout-grid) - /feed
   - Profile (user) - /profile
3. 각 아이템에 라벨 추가 (10px, font-medium)
4. 배경색: bg-card
5. padding: py-2 px-6 (8px 24px)
6. 아이콘 크기: h-[22px] w-[22px]

### Task 3: Update MainContentWrapper padding
**File:** `packages/web/lib/components/ConditionalNav.tsx`

Changes:
1. Desktop top padding: pt-16 → pt-[72px] (18 in tailwind = 72px)
2. Mobile bottom padding: pb-14 → pb-16 (64px)

---

## Verification

```bash
npm run dev
```

1. Desktop: 헤더 72px 높이, 메뉴 4개 (Home, Feed, Explore, Request), 가운데 정렬
2. Mobile: 하단 nav 64px, 메뉴 5개 (아이콘+라벨), card 배경색
