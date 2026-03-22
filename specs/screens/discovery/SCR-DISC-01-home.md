# [SCR-DISC-01] Home
> Route: `/` | Status: implemented | Updated: 2026-03-05

## Purpose

User views a curated editorial home feed with a full-screen hero, artist spotlights, decoded picks, trending content, and style/item discovery sections — all pre-fetched server-side.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page | Home (server component) | `packages/web/app/page.tsx` | async; fetches all data via Supabase server queries |
| Header | Header (mobile+desktop) | `packages/web/lib/components/Header.tsx` | search icon tap → `/search` (SCR-DISC-02) |
| Animated wrapper | HomeAnimatedContent | `packages/web/lib/components/main/HomeAnimatedContent.tsx` | "use client"; receives all SSR data as props; Motion whileInView |
| Hero | HeroSection | `packages/web/lib/components/main/HeroSection.tsx` | data?: HeroData; full-viewport hero with artist name overlay |
| Section | DecodedPickSection | `packages/web/lib/components/main/DecodedPickSection.tsx` | styleData?, items?: ItemCardData[] |
| Section | TodayDecodedSection | `packages/web/lib/components/main/TodayDecodedSection.tsx` | no external props; internal fetch or static |
| Section | ArtistSpotlightSection | `packages/web/lib/components/main/ArtistSpotlightSection.tsx` | data?: StyleCardData[] |
| Section | WhatsNewSection | `packages/web/lib/components/main/WhatsNewSection.tsx` | styles?, items?: ItemCardData[] |
| Section | DiscoverItemsSection | `packages/web/lib/components/main/DiscoverSection.tsx` | itemsByTab?: Record<string, ItemCardData[]>; artist-tabbed items |
| Section | DiscoverProductsSection | `packages/web/lib/components/main/DiscoverSection.tsx` | items?: ItemCardData[]; product grid |
| Section | BestItemSection | `packages/web/lib/components/main/BestSection.tsx` | items?: ItemCardData[] |
| Section | WeeklyBestSection | `packages/web/lib/components/main/BestSection.tsx` | styles?: WeeklyBestStyle[] |
| Section | TrendingNowSection | `packages/web/lib/components/main/TrendingSection.tsx` | keywords?: TrendingKeyword[] |
| Shared card | StyleCard | `packages/web/lib/components/main/StyleCard.tsx` | Used by WhatsNew, ArtistSpotlight, WeeklyBest sections |
| Shared card | ItemCard | `packages/web/lib/components/main/ItemCard.tsx` | Used by Best, DiscoverPick, WhatsNew sections |
| Section header | SectionHeader (main) | `packages/web/lib/components/main/SectionHeader.tsx` | Local component (not DS SectionHeader) |
| Footer | MainFooter | `packages/web/lib/components/main/MainFooter.tsx` | desktop-visible; contains nav links |
| Bottom nav | NavBar | DS: component-registry | mobile-only; active="home" |

> **Stale path corrections:** `lib/components/HomeClient.tsx` moved to `packages/web/app/HomeClient.tsx` — HomeClient is a legacy vertical-feed component NOT used by the current home page. Current home uses `HomeAnimatedContent`. `lib/components/CardCell.tsx` and `lib/components/CardSkeleton.tsx` — ⚠️ NOT-IMPL (missing from filesystem).

## Layout

### Mobile (default)

```
┌─────────────────────────────┐
│ [Header] Logo  [Search] [+] │  ← Header.tsx; search icon → /search
├─────────────────────────────┤
│                             │
│    ARTIST NAME (15vw)       │  ← HeroSection: full-viewport, artist name overlay
│    Featured Narrative       │    motion: scale+opacity on mount
│    "Title text"             │
│    [VIEW EDITORIAL →]       │
│                             │
├─────────────────────────────┤
│ DECODED'S PICK              │  ← DecodedPickSection
│ [StyleCard]                 │    style card + item row
│ [Item][Item][Item]          │
├─────────────────────────────┤
│ TODAY'S DECODED             │  ← TodayDecodedSection
│ [content...]                │    motion whileInView fade-up
├─────────────────────────────┤
│ ARTIST SPOTLIGHT            │  ← ArtistSpotlightSection
│ [StyleCard][StyleCard]      │    horizontal or stacked style cards
├─────────────────────────────┤
│ WHAT'S NEW                  │  ← WhatsNewSection
│ [StyleCard][StyleCard]      │    styles row + items row
│ [Item][Item][Item][Item]    │
├─────────────────────────────┤
│ DISCOVER ITEMS              │  ← DiscoverItemsSection
│ [NewJeans][BlackPink] tabs  │    artist-tab switching
│ [Item][Item][Item][Item]    │
├─────────────────────────────┤
│ DISCOVER PRODUCTS           │  ← DiscoverProductsSection
│ [Item][Item][Item]          │    product grid
├─────────────────────────────┤
│ BEST ITEMS                  │  ← BestItemSection
│ [Item][Item][Item][Item]    │
├─────────────────────────────┤
│ WEEKLY BEST                 │  ← WeeklyBestSection
│ [StyleCard] [StyleCard]     │    style cards grid
├─────────────────────────────┤
│ TRENDING NOW                │  ← TrendingNowSection
│ #keyword1 #keyword2 ...     │    keyword chips (up to 7)
├─────────────────────────────┤
│ [MainFooter]                │  ← MainFooter (desktop shows links)
└─────────────────────────────┘
│ [Home][Search][Feed][+][Me] │  ← NavBar (mobile-only, fixed bottom)
└─────────────────────────────┘
```

### Desktop (>=768px)

DesktopHeader replaces mobile header. NavBar hidden. MainFooter visible with nav links. Content areas use wider max-width containers.

```
┌──────────────────────────────────────────────────────────────┐
│ [DesktopHeader]  Logo   Nav links    [SearchBar]   [User]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│         ARTIST NAME (12vw)                                   │  ← HeroSection full-viewport
│         "Featured Narrative"                                 │
│         [VIEW EDITORIAL →]          [Discover More ↓]       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ DECODED'S PICK                                               │
│  [StyleCard (large)]   [Item][Item][Item]                    │  ← wider side-by-side layout
├──────────────────────────────────────────────────────────────┤
│ ARTIST SPOTLIGHT                                             │
│  [StyleCard] [StyleCard] [StyleCard]                         │  ← 3-col grid
├──────────────────────────────────────────────────────────────┤
│ WHAT'S NEW                                                   │
│  [StyleCard][StyleCard]   [Item][Item][Item][Item]           │
├──────────────────────────────────────────────────────────────┤
│ DISCOVER ITEMS   [NewJeans] [BlackPink]                      │
│  [Item][Item][Item][Item][Item][Item]                        │
├──────────────────────────────────────────────────────────────┤
│ WEEKLY BEST                                                  │
│  [Style][Style][Style][Style]                                │  ← 4-col grid
├──────────────────────────────────────────────────────────────┤
│ [DesktopFooter / MainFooter]                                 │
└──────────────────────────────────────────────────────────────┘
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | `Header` (mobile variant) | `Header` (desktop DesktopHeader inside) |
| Bottom nav | NavBar visible (fixed) | NavBar hidden (`md:hidden`) |
| Hero name size | 15vw | 12vw / 10vw / 14rem |
| Section layout | Single column | 2–4 column grids |
| Footer | MainFooter (minimal) | MainFooter (full links) |

## Requirements

### Data Loading

- ✅ When home page loads, the system shall pre-fetch all section data server-side in parallel via `Promise.all` (10 queries: hero, weekly best, best items, what's new styles/items, decoded pick, artist spotlight, artist items, trending keywords).
- ✅ When server data is empty for a section, the system shall fall back to component-internal sample/default data (orUndef pattern in HomeAnimatedContent).
- ⚠️ NOT-IMPL When data fetch fails at server-side, the system shall display per-section error state; currently no per-section SSR error boundary.

### Animations

- ✅ When user scrolls into a section, the system shall trigger Motion `whileInView` fade-up animation (opacity 0→1, y 50→0, duration 0.8s, easeOut, `once: true`).
- ✅ When home page mounts, the system shall animate the hero image (scale 1.1→1, opacity 0→1, duration 1.8s) and artist name (opacity/y, delay 0.2s).

### Hero Interaction

- ✅ When user taps "VIEW EDITORIAL", the system shall navigate to the hero's linked route (e.g., `/feed`).
- ⚠️ NOT-IMPL HeroCarousel swipeable carousel — `HeroCarousel.tsx` exists as legacy export but is NOT rendered in the current home page; only single `HeroSection` is used.

### Navigation

- ✅ When user taps search icon in Header, the system shall navigate to `/search` (SCR-DISC-02).
- ✅ When user taps a content card (style/item), the system shall navigate to `/posts/[id]` detail view.
- ✅ When user taps a bottom nav item, the system shall navigate to the corresponding route (`/explore`, `/feed`, `/images`).

### Trending Keywords

- ✅ When trending keywords are loaded, the system shall display up to 7 keyword chips in TrendingNowSection.

## State

Home page is primarily server-rendered. No Zustand store is read by `page.tsx`. `HomeAnimatedContent` is client-only for Motion animations.

| Store | Usage |
|-------|-------|
| None | Home page state is SSR props passed to sections |

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Search icon tap | `/search` (SCR-DISC-02) | `searchStore.resetAll()` on entry |
| Explore nav item | `/explore` (SCR-DISC-03) | filterStore unaffected |
| Feed nav item | `/feed` (SCR-DISC-03) | auth-conditional |
| Images nav item | `/images` (SCR-DISC-04) | paginated grid |
| Hero / card tap | `/posts/[id]` | transitionStore.setTransition() for FLIP |

See: [FLW-01 — Discovery Flow](../../flows/FLW-01-discovery.md) (full navigation contract)

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | None — page is SSR; no client loading state | — |
| Section empty | API returns empty array | Component shows internal sample data (orUndef fallback) |
| API error (SSR) | Supabase query throws | Next.js error boundary (no per-section recovery) ⚠️ |
| Hero missing | `fetchFeaturedImageServer` returns null | Default hero data (hardcoded NEWJEANS example) |

## Animations

| Trigger | Type | Library |
|---------|------|---------|
| Page mount (hero) | Scale + fade in | Motion (1.8s, custom ease) |
| Scroll into section | Fade up (`whileInView`) | Motion (0.8s, easeOut, once) |
| Hero CTA arrow | Horizontal bounce loop | Motion (1.5s repeat) |

---

See: [SCR-DISC-02](SCR-DISC-02-search.md) — Search overlay (search icon tap from header)
See: SCR-DISC-03 — Explore (bottom nav tab)
See: SCR-DISC-04 — Image Grid (bottom nav tab)
See: [FLW-01](../../flows/FLW-01-discovery.md) — Discovery Flow (navigation contract)
