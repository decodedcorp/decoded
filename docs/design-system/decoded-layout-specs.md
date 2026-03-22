# Decoded App - Layout & Component Specifications

> pencildev 전달용 디자인 레이아웃 및 컴포넌트 명세
> 실제 코드 구현 기반 (2026-01-29)

---

## 1. Explore Page (메인 탐색 페이지)

### 1.1 Page Structure

```
┌─────────────────────────────────────┐
│           Header (Mobile Only)       │  h: 56px (14 * 4)
│  md: hidden                          │
├─────────────────────────────────────┤
│                                      │
│                                      │
│         ThiingsGrid                  │  Full viewport
│      (Infinite Spiral Grid)          │  Drag/Scroll enabled
│                                      │
│                                      │
├─────────────────────────────────────┤
│        Bottom Nav (Mobile Only)      │  h: 64px (16 * 4)
│  md: hidden                          │
└─────────────────────────────────────┘
```

### 1.2 Header Component (Mobile Only)

**Viewport**: `< 768px` only (md:hidden on desktop)

```
┌─────────────────────────────────────────────────┐
│ [DECODED LOGO]              [Search] [Filter]   │
│  w: 192px                     32px    32px      │
│  h: 56px                                        │
└─────────────────────────────────────────────────┘
```

**Styles**:
- Position: `fixed top-0 left-0 right-0`
- Z-index: `9999`
- Background: `bg-background/80 backdrop-blur-md`
- Height: `h-14` (56px)
- Padding: `px-2`

**Components**:
| Component | Position | Size | Description |
|-----------|----------|------|-------------|
| DecodedLogo | Left | w-48 h-14 | 3D animated ASCII logo |
| SearchInput | Right | 32px icon | Search trigger (expandable) |
| SimpleFilterDropdown | Right | 32px icon | Filter dropdown |

### 1.3 ThiingsGrid Component (Core)

**Description**: Pinterest-style infinite spiral masonry grid with physics-based scrolling

**Layout Behavior**:
| Breakpoint | Cell Size | Columns |
|------------|-----------|---------|
| Mobile (< 768px) | 180 x 225 | Auto (viewport-based) |
| Desktop (>= 768px) | 400 x 500 | Auto (viewport-based) |

**Grid Properties**:
- Spiral layout from center outward
- Physics-based drag/scroll with momentum
- Infinite scroll trigger at 50 items before end
- Max 300 DOM nodes rendered (virtualized)
- Viewport buffer: 1.2x for smooth scrolling

**Cell/Card Structure**:
```
┌─────────────────────────────┐
│                             │
│    Image Container          │  aspect-ratio: 3/4
│    (with lazy loading)      │
│                             │
│                             │
├─────────────────────────────┤
│ #id (dev only)              │  Dev footer (optional)
└─────────────────────────────┘
```

**Card Styles**:
- Border: `border border-border`
- Background: `bg-card/60`
- Corner radius: `rounded-xl`
- Shadow on hover: `hover:shadow-lg`
- Inset padding: `inset-1` (4px margin from grid cell)

**States**:
| State | Visual |
|-------|--------|
| Loading | Skeleton with pulse animation |
| Loaded | Image with fade-in (opacity 0 → 1, 150ms) |
| Error | Empty muted background |
| Hover | shadow-lg transition |

### 1.4 Loading States

**Initial Load (Skeleton Grid)**:
- Same grid structure
- Skeleton cards with `animate-pulse`
- Badge placeholder: `h-5 w-20 rounded-full bg-muted-foreground/20`

**Infinite Scroll Loading Indicator**:
```
┌─────────────────────────────────────┐
│  [Spinner] Loading more...          │
└─────────────────────────────────────┘
```
- Position: `fixed bottom-8 left-1/2 -translate-x-1/2`
- Background: `bg-background/80 backdrop-blur-sm`
- Border radius: `rounded-full`
- Padding: `px-4 py-2`

### 1.5 Empty & Error States

**Empty State**:
```
┌─────────────────────────────────────┐
│              📷                     │
│                                     │
│      No images found                │  text-xl font-semibold
│                                     │
│  Try adjusting your filters...      │  text-sm text-muted-foreground
└─────────────────────────────────────┘
```

**Error State**:
```
┌─────────────────────────────────────┐
│              ⚠️                     │
│                                     │
│    Failed to load images            │  text-xl font-semibold text-destructive
│                                     │
│      [Error message]                │  text-sm text-muted-foreground
│                                     │
│         [ Retry ]                   │  Button
└─────────────────────────────────────┘
```

---

## 2. Detail Page (이미지 상세 페이지)

### 2.1 Page Overview

**Route**: `/images/[id]`

**Desktop Full Page Layout (lg: ≥1024px)**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                              [🚩][📤][✕]     │  fixed right-4 top-4
│                                                                               │
│                                                                               │
│                              HERO SECTION                                     │  h-screen (100vh)
│                              Full-screen Image                                │
│                              with Ken Burns + Parallax                        │
│                                                                               │
│                              "Editorial"                                      │  text-5xl md:text-7xl lg:text-8xl
│                                                               pb-20          │
├───────────────────────────────────────────────────────────────────────────────┤
│                               AS SEEN IN BAR                                  │  max-w-4xl mx-auto
│                     As Seen In    @account1    @account2                      │  px-6 py-4
├───────────────────────────────────────────────────────────────────────────────┤
│  Decorative Vertical Typography (left edge)                                   │
│  "Decoded Editorial Archive — 2026"                                           │  lg:block, writing-mode-vertical
│                                                                               │
│     ABOUT THIS LOOK SECTION                                                   │  max-w-6xl mx-auto
│     ┌─────────────────────────────────────────────────────────────────────┐  │  pt-32 pb-24
│     │                                                                      │  │  px-6
│     │  ┌───────────────────────┐    ┌─────────────────────────────────┐  │  │
│     │  │  LEFT COLUMN          │    │  RIGHT COLUMN                   │  │  │  grid-cols-12
│     │  │  col-span-5           │    │  col-span-7                     │  │  │  gap-16
│     │  │                       │    │                                 │  │  │
│     │  │  EDITORIAL ANALYSIS   │    │  ────                           │  │  │
│     │  │  @account             │    │  The Editorial                  │  │  │  text-5xl md:text-7xl lg:text-8xl
│     │  │  text-3xl md:text-4xl │    │                                 │  │  │
│     │  │                       │    │  [Article with drop cap]        │  │  │  prose-lg, leading-loose
│     │  │  ┌─────────────────┐  │    │  First letter: text-8xl         │  │  │
│     │  │  │ Look Summary Box│  │    │                                 │  │  │
│     │  │  │ - Look Identity │  │    │  > Blockquote styling           │  │  │
│     │  │  │ - Items: 05     │  │    │  > with decorative lines        │  │  │
│     │  │  │ - Decoded date  │  │    │                                 │  │  │
│     │  │  │ - Featured Tags │  │    │                                 │  │  │
│     │  │  │ p-8             │  │    │                                 │  │  │
│     │  │  └─────────────────┘  │    │                                 │  │  │
│     │  │                       │    │                                 │  │  │
│     │  │  [MetadataTags]       │    │  ────●────                      │  │  │  End divider
│     │  │                       │    │                                 │  │  │
│     │  │  " Anchor Quote "     │    │                                 │  │  │
│     │  │  text-2xl md:text-4xl │    │                                 │  │  │
│     │  │                       │    │                                 │  │  │
│     │  │  ─────────────────    │    └─────────────────────────────────┘  │  │
│     │  │  Chromatic Analysis   │                                          │  │
│     │  │  [●][●][●][●]        │                                          │  │  w-10 h-10
│     │  │  Charcoal Ivory ...  │                                          │  │
│     │  │                       │                                          │  │
│     │  │  Style Radar          │                                          │  │
│     │  │  Minimal ────── Strong│                                          │  │
│     │  │  Elegant ────── Strong│                                          │  │
│     │  │                       │                                          │  │
│     │  │  Editor's Tip         │                                          │  │
│     │  └───────────────────────┘                                          │  │
│     └─────────────────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│     INTERACTIVE SHOWCASE (if items with coordinates)                          │  lg:flex-row lg:min-h-screen
│     ┌────────────────────────────┬────────────────────────────────────────┐  │
│     │                            │                                         │  │
│     │  STICKY IMAGE CANVAS       │   ITEM DETAIL CARDS (scrollable)       │  │
│     │  lg:w-1/2                  │   lg:w-1/2 lg:pl-10 lg:pt-20           │  │
│     │  lg:h-screen               │                                         │  │
│     │  sticky top-0              │   ┌─────────────────────────────────┐  │  │
│     │                            │   │  01                             │  │  │  Decorative index: text-[20rem]
│     │  [Image with hotspots]     │   │                                 │  │  │
│     │                            │   │  [Item Image]                   │  │  │  aspect-[3/2]
│     │  ● ← Active hotspot        │   │  aspect-video or 3/2            │  │  │
│     │     pulsing ring           │   │                                 │  │  │
│     │                            │   │  ── 01 ── BRAND NAME            │  │  │  text-[10px] tracking-[0.3em]
│     │                            │   │  Product Name                   │  │  │  text-2xl md:text-3xl lg:text-4xl
│     │                            │   │                                 │  │  │
│     │                            │   │  Price Reference                │  │  │
│     │                            │   │  $199.00                        │  │  │  text-xl md:text-2xl
│     │                            │   │                                 │  │  │
│     │                            │   │  [Description markdown]         │  │  │  prose-md
│     │                            │   │                                 │  │  │
│     │                            │   │  Technical Details              │  │  │
│     │                            │   │  Material: Cotton               │  │  │
│     │                            │   │  Season: SS24                   │  │  │
│     │                            │   │                                 │  │  │
│     │                            │   │  Shop the Look                  │  │  │
│     │                            │   │  [citation links]               │  │  │
│     │                            │   └─────────────────────────────────┘  │  │  mb-12 md:mb-20 lg:mb-24
│     │                            │                                         │  │
│     │                            │   [More cards...]                       │  │
│     └────────────────────────────┴────────────────────────────────────────┘  │
│                                                                               │
│  [Connector Lines SVG Layer]                                                  │  z-50, pointer-events-none
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│     SHOP THE LOOK CAROUSEL                                                    │  py-24, border-t border-border/40
│     ┌─────────────────────────────────────────────────────────────────────┐  │  max-w-7xl mx-auto
│     │                                                                      │  │
│     │                      CURATED SELECTION                               │  │  text-xs tracking-[0.2em]
│     │                      Shop the Look                                   │  │  text-4xl md:text-5xl lg:text-6xl
│     │                                                                      │  │
│     │  [<]  [Card][Card][Card][Card][Card][Card][Card]  [>]               │  │  gap-4 md:gap-6
│     │   ↑    w-[180px] sm:w-[200px] md:w-[220px] lg:w-[260px]             │  │
│     │   Navigation buttons: w-12 h-12                                      │  │
│     │   opacity-0 → group-hover:opacity-100                                │  │
│     │                                                                      │  │
│     └─────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│     RELATED IMAGES                                                            │  py-24, bg-muted/10
│     ┌─────────────────────────────────────────────────────────────────────┐  │  max-w-7xl mx-auto
│     │                                                                      │  │
│     │                        More from                                     │  │  text-xs tracking-[0.2em]
│     │                       @account                                       │  │  text-3xl md:text-4xl lg:text-5xl
│     │                                                                      │  │
│     │   [Image] [Image] [Image] [Image]                                   │  │  grid-cols-2 md:3 lg:4
│     │   [Image] [Image] [Image] [Image]                                   │  │  gap-4 md:gap-6 lg:gap-8
│     │                                                                      │  │  aspect-[3/4]
│     │                    [ Load More ]                                     │  │
│     │                                                                      │  │
│     └─────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Action Buttons (Top Right)

**Position**: `fixed right-4 top-4 z-50`

```
┌────┐ ┌────┐ ┌────┐
│ 🚩 │ │ 📤 │ │ ✕  │
└────┘ └────┘ └────┘
 Report  Share  Close
```

**Button Styles**:
- Size: `h-10 w-10`
- Shape: `rounded-full`
- Background: `bg-background/80 backdrop-blur-sm`
- Hover: `hover:bg-background/90`
- Icon size: `h-5 w-5`
- Gap between buttons: `gap-2`

### 2.3 Hero Section

**Layout**:
| Mode | Height | Title Size | Image Behavior |
|------|--------|------------|----------------|
| Full Page | `h-screen` (100vh) | `text-5xl md:text-7xl lg:text-8xl` | Ken Burns + Parallax |
| Modal | `h-[45vh] min-h-[250px]` | `text-4xl md:text-5xl` | Ken Burns only |

**Structure**:
```
┌─────────────────────────────────────┐
│                                     │
│         Full-width Image            │  object-cover
│         with scale animation        │  will-change-transform
│                                     │
├─────────────────────────────────────┤ Gradient overlay
│         "Editorial"                 │  font-serif font-bold
│                                     │  text-white tracking-tight
│                              pb-20  │  Full page padding
│                              pb-8   │  Modal padding
└─────────────────────────────────────┘
```

**Gradient Overlay**:
```css
background: linear-gradient(
  to top,
  rgba(0,0,0,0.8) 0%,
  rgba(0,0,0,0.4) 50%,
  transparent 100%
);
```

**Animations**:
1. Ken Burns entrance: `scale 1.15 → 1.0` (2s, power2.out)
2. Title reveal: `y 60% → 0`, `opacity 0 → 1` (1.5s delay 0.5s, expo.out)
3. Scroll parallax (full page only):
   - Title: `y: -150` scrub
   - Image: `y: 100, scale: 1.1` scrub

### 2.4 As Seen In Bar

**Layout**: Horizontal centered bar with account links

```
┌─────────────────────────────────────────────────────────────┐
│  As Seen In    @newjeanscloset    @kpopfashion    @stylist  │
└─────────────────────────────────────────────────────────────┘
```

**Styles**:
- Border: `border-b border-border/40`
- Max width: `max-w-4xl mx-auto`
- Padding: `px-6 py-4`
- Layout: `flex items-center justify-center gap-6`
- Label: `font-serif text-xs uppercase tracking-widest text-muted-foreground/60`
- Account link: `font-medium underline decoration-border/50 underline-offset-4`
- Hover: `group-hover:decoration-foreground/50`

### 2.5 About This Look Section

**Container**:
| Mode | Max Width | Padding |
|------|-----------|---------|
| Full Page | `max-w-6xl` | `pt-32 pb-24 px-6` |
| Modal | `max-w-5xl` | `pt-12 pb-10 px-6` |

**Grid Layout**:
| Mode | Columns | Gap |
|------|---------|-----|
| Mobile | 1 column | `gap-10` |
| Desktop (Full) | 12 columns (5:7 ratio) | `gap-16` |
| Desktop (Modal) | 11 columns (4:7 ratio) | `gap-10` |

**Decorative Vertical Typography** (Desktop only):
- Position: `absolute left-4 top-1/2 -translate-y-1/2`
- Visibility: `hidden lg:block`
- Font: `font-serif text-[10px] uppercase tracking-[1em] text-primary/5`
- Style: `writing-mode-vertical-rl rotate-180 opacity-50`
- Content: "Decoded Editorial Archive — {year}"

**Left Column Content** (`lg:col-span-5` / `lg:col-span-4`):

1. **Editorial Analysis Header**
```
EDITORIAL ANALYSIS          text-[9px] md:text-[10px] uppercase tracking-[0.3em] text-primary/60 font-bold
@account                    font-serif font-bold text-3xl md:text-4xl (full) / text-xl md:text-2xl (modal)
```
- Margin bottom: `mb-8` (full) / `mb-6` (modal)

2. **Look Summary Box**
```
┌─────────────────────────────────────────────────┐
│  [Corner decoration: ID suffix]     opacity-[0.03]
│                                     font-serif text-8xl (full) / text-5xl (modal)
│  Look Identity
│  [category]                         font-serif italic text-lg (full) / text-sm md:text-base (modal)
│
│  ┌──────────────┬──────────────┐   grid grid-cols-2 gap-6 (full) / gap-4 (modal)
│  │ Items        │ Decoded      │
│  │ 05           │ JAN 15, 2026 │   font-serif text-xl (full) / text-base md:text-lg (modal)
│  └──────────────┴──────────────┘
│
│  Featured Labels (full page only)
│  #tag1, #tag2, #tag3                font-serif text-[11px] italic text-primary/70
└─────────────────────────────────────────────────┘
```
- Border: `border border-border/40 rounded-sm`
- Background: `bg-muted/5`
- Padding: `p-8` (full) / `p-5` (modal)
- Margin bottom: `mb-12` (full) / `mb-8` (modal)

3. **Metadata Tags** (MetadataTags component)
- Margin bottom: `mb-12` (full) / `mb-8` (modal)

4. **Anchor Quote**
```
"                         text-8xl (full) / text-4xl (modal) font-serif text-primary/10
  [Quote text here]       font-serif italic leading-tight text-foreground/90
                          text-2xl md:text-3xl lg:text-4xl (full) / text-lg md:text-xl (modal)
                      "
```
- Margin bottom: `mb-10`

5. **Chromatic Analysis** (Color Palette)
```
CHROMATIC ANALYSIS        text-[9px] uppercase tracking-[0.3em] text-primary/60 font-bold mb-6

[●] Charcoal    [●] Ivory    [●] Azure    [●] Gold
#2C2C2C         #FFFFF0      #007FFF      #FFD700
```
- Swatch size: `w-10 h-10` (full) / `w-8 h-8` (modal)
- Swatch style: `rounded-full border border-border/20 shadow-inner`
- Animation: `scale 0 → 1` stagger 0.1s, back.out(1.7)
- Color name: `font-serif text-[10px] italic text-foreground/70`
- Hex code: `font-mono text-[8px] uppercase text-muted-foreground/50`

6. **Style Radar**
```
STYLE RADAR               text-[9px] uppercase tracking-[0.3em] text-primary/60 font-bold mb-6

Minimal      ──────────── Strong
             [progress bar 85%]
Elegant      ────────     Strong
             [progress bar 70%]
Structured   ──────       Strong
             [progress bar 55%]
```
- Bar: `h-[1px] bg-border/20`, fill: `bg-primary/40`

7. **Editor's Tip**
```
— Tip: The charcoal base provides a perfect canvas...
   font-serif text-[11px] italic text-muted-foreground/60

   Curated by Decoded Editorial Team
   font-sans text-[8px] uppercase tracking-[0.2em] text-muted-foreground/30
```
- Border: `border-t border-dashed border-border/20`
- Margin top: `mt-10 pt-6`

**Right Column Content** (`lg:col-span-7`):

1. **Section Title**
```
────                      w-12 h-0.5 bg-primary/40 (desktop only) mb-8 (full) / mb-6 (modal)

The Editorial             font-serif font-medium tracking-tight leading-[1.0]
                          text-5xl md:text-7xl lg:text-8xl (full) / text-3xl md:text-4xl (modal)
```
- Margin bottom: `mb-8 md:mb-12` (full) / `mb-6` (modal)

2. **Article Body**
- Font: `font-serif leading-loose text-muted-foreground/90`
- Size: `prose-lg` (full) / `prose-base` (modal)
- First-letter drop cap:
  - Size: `text-8xl` (full) / `text-6xl` (modal)
  - Style: `font-bold float-left mr-4 mt-2 leading-[0.8] text-foreground`
- Blockquote:
  - Style: `border-none italic font-serif text-foreground/80`
  - Size: `text-2xl` (full) / `text-xl` (modal)
  - Decorative lines: `before/after w-16 h-px bg-primary/20`
  - Padding: `py-8 my-12`

3. **End Divider**
```
────●────                 h-px w-16 bg-border/40 + w-2 h-2 rounded-full
```
- Margin top: `mt-16`

### 2.6 Interactive Showcase Section

**Layout Behavior**:
| Breakpoint | Layout | Min Height |
|------------|--------|------------|
| Mobile | Stack (column) | Auto |
| Desktop (lg) | Split row | `lg:min-h-screen` |

**Container**: `flex flex-col lg:flex-row`

**Left: Sticky Image Canvas**
```
┌─────────────────────────────────┐
│                                 │
│    Image with Hotspot Markers   │
│    [●] Active item highlight    │
│                                 │
└─────────────────────────────────┘
```
- Position: `sticky top-0 z-10`
- Width: `w-full lg:w-1/2`
- Height: `h-[40vh] lg:h-screen`

**Hotspot Markers**:
- Base: `absolute rounded-full bg-primary/60 border-2 border-white`
- Active: Pulsing ring animation
- Size: Based on item bounding box

**Right: Item Detail Cards**
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  01                           (Decorative) text-[10rem] md:text-[15rem] lg:text-[20rem]
│                                            text-foreground/[0.04]
│  ┌────────────────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  [Item Image]                                           │ │  aspect-[4/3] md:aspect-video lg:aspect-[3/2]
│  │  Layered collage style with ambient blur               │ │  rounded-2xl
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ── 01 ──  BRAND NAME         text-[10px] md:text-xs tracking-[0.3em] uppercase
│                                text-muted-foreground/60
│                                                              │
│  Product Name                  font-serif text-2xl md:text-3xl lg:text-4xl font-bold
│                                leading-tight tracking-tight max-w-[90%]
│                                                              │
│  Price Reference               text-[9px] uppercase tracking-widest text-muted-foreground/40
│  $199.00                       font-serif text-xl md:text-2xl font-medium
│                                                              │
│  ────────────────────────────  h-px bg-gradient-to-r from-border/60 via-border/20 to-transparent
│                                my-8 md:my-10
│                                                              │
│  [Description markdown]        prose prose-md dark:prose-invert
│                                font-serif text-muted-foreground/80
│                                                              │
│  TECHNICAL DETAILS             text-[10px] md:text-xs uppercase tracking-[0.2em] text-primary/60
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Material      │ Season       │ Collection            │  │  flex flex-wrap gap-x-12 gap-y-6
│  │ Cotton        │ SS24         │ Main Line             │  │  font-serif text-base
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  SHOP THE LOOK                 text-[10px] uppercase tracking-[0.2em] text-primary/60
│  ┌───────────────────────────────────────────────────────┐  │
│  │ musinsacom   →   29cm   →   ssense   →               │  │  font-serif italic text-base
│  │ (with hover underline effect)                         │  │  underline decoration-primary/20
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Ref. 12345                    font-mono text-[9px] opacity-20 hover:opacity-100
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Card Container**:
- Width: `w-full lg:w-1/2`
- Padding: `px-5 py-10 lg:pl-10 lg:pt-20`
- Background: `bg-background`
- Z-index: `z-20`

**Card Spacing**:
- Margin bottom: `mb-12 md:mb-20 lg:mb-24`
- Min height: `min-h-[50vh]` (desktop)
- Vertical padding: `py-6 md:py-12`

**Connector Lines** (ConnectorLayer):
- SVG overlay connecting hotspots to cards
- Only visible when item is active
- Animated opacity transition
- Z-index: `z-50`
- Pointer events: `none`

### 2.7 Shop Grid Section (Carousel)

**Container**:
- Border: `border-t border-border/40`
- Padding: `py-24` (full) / `py-12 md:py-16` (modal)
- Max width: `max-w-7xl` (full) / `max-w-full` (modal)

**Header**:
```
CURATED SELECTION              text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground
                               mb-3 md:mb-4

Shop the Look                  font-serif text-center tracking-tight
                               text-4xl md:text-5xl lg:text-6xl (full) / text-3xl md:text-4xl (modal)
```
- Margin bottom: `mb-8 md:mb-12`

**Carousel Container**:
```
┌─────────────────────────────────────────────────────────────┐
│ [<]  [Card] [Card] [Card] [Card] [Card] [Card] ...  [>]    │
└─────────────────────────────────────────────────────────────┘
```
- Layout: `flex overflow-x-auto snap-x snap-mandatory`
- Gap: `gap-4 md:gap-6` (full) / `gap-3 md:gap-4` (modal)
- Padding: `px-6 md:px-8 pb-12 pt-4` (full) / `px-4 md:px-6 pb-8 md:pb-10 pt-2 md:pt-4` (modal)
- Scrollbar: Hidden (`scrollbar-hide`)

**Navigation Buttons**:
- Position: `absolute top-1/2 -translate-y-1/2`
- Left button: `left-4 md:left-8`
- Right button: `right-4 md:right-8`
- Size: `w-12 h-12 rounded-full`
- Background: `bg-background/80 backdrop-blur-sm border border-border`
- Shadow: `shadow-lg`
- Visibility: `opacity-0 group-hover/carousel:opacity-100`
- Hover: `hover:bg-background hover:scale-110`
- Disabled state: `opacity-0 pointer-events-none`

**Card Dimensions**:
| Mode | Width |
|------|-------|
| Modal Mobile | `w-[160px]` |
| Modal Tablet | `sm:w-[180px] md:w-[200px]` |
| Full Mobile | `w-[180px]` |
| Full Tablet | `sm:w-[200px] md:w-[220px]` |
| Full Desktop | `lg:w-[260px]` |

**Card Structure** (SpotlightCard wrapper):
```
┌─────────────────────────┐
│                         │
│    [Product Image]      │  aspect-ratio: 3/4
│    rounded-lg bg-muted  │  object-cover
│                         │  hover:scale-105 (700ms)
├─────────────────────────┤
│     BRAND               │  text-[9px] (modal) / text-[10px] uppercase tracking-widest
│                         │  text-muted-foreground
│   Product Name          │  font-serif font-medium
│                         │  text-sm md:text-base (modal) / text-base md:text-lg
│     $199.00             │  font-medium text-primary font-mono
│                         │  text-xs (modal) / text-sm
│   [ View Details ]      │  Full-width button
│                         │  border border-border/50 bg-background/50
│                         │  hover:bg-foreground hover:text-background
│                         │  text-[9px] md:text-[10px] uppercase tracking-widest
└─────────────────────────┘
```
- Card background: `bg-card/50 backdrop-blur-sm`
- Padding: `p-3` (modal) / `p-3 md:p-4`
- Snap: `snap-center`

### 2.8 Related Images Section

**Container**:
- Background: `bg-muted/10`
- Border: `border-t border-border/40`
- Padding: `py-24 px-6 md:px-8` (full) / `py-12 md:py-16 px-4 md:px-6` (modal)
- Max width: `max-w-7xl` (full) / `max-w-full` (modal)

**Header**:
```
More from                      text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground
                               mb-3 md:mb-4

@account                       font-serif text-center tracking-tight
                               text-3xl md:text-4xl lg:text-5xl (full) / text-2xl md:text-3xl (modal)
```
- Margin bottom: `mb-12` (full) / `mb-8 md:mb-10` (modal)

**Grid Layout**:
| Mode | Columns | Gap |
|------|---------|-----|
| Full Mobile | 2 | `gap-4` |
| Full Tablet | 3 | `md:gap-6` |
| Full Desktop | 4 | `lg:gap-8` |
| Modal Mobile | 2 | `gap-3` |
| Modal Tablet | 3 | `md:gap-4` |

**Image Card**:
- Aspect ratio: `aspect-[3/4]`
- Background: `bg-muted`
- Image: `object-cover`
- Hover: `scale-105` (700ms)
- Overlay: `bg-black/0 → group-hover:bg-black/10` (300ms)

**Load More Button**:
- Layout: `flex items-center gap-2`
- Padding: `px-8 py-3`
- Border: `border border-border`
- Background: `bg-background`
- Hover: `hover:bg-foreground hover:text-background`
- Font: `text-xs uppercase tracking-widest`
- Icon: ChevronDown / ChevronUp (`w-4 h-4`)

---

## 3. Responsive Breakpoints

| Token | Value | Description |
|-------|-------|-------------|
| sm | 640px | Small devices |
| md | 768px | Medium devices (tablet) |
| lg | 1024px | Large devices (desktop) |
| xl | 1280px | Extra large |
| 2xl | 1536px | 2X Extra large |

---

## 4. Animation Specifications

### GSAP Animations

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Hero Ken Burns | 2s | power2.out | On mount |
| Hero Title Reveal | 1.5s | expo.out | On mount (delay 0.5s) |
| Card Stagger | 0.8s | power2.out | ScrollTrigger top 80% |
| Color Swatch | 0.6s | back.out(1.7) | On colors loaded |
| Page Fade In | 0.4s | power2.out | On mount (direct access) |

### CSS Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| Shadow (hover) | default | ease |
| Image scale (hover) | 700ms | ease |
| Button background | 300ms | ease |
| Opacity | 150ms | ease-out |

### Intersection Observer

**Card Visibility**:
- Entry threshold: 0.15
- Exit threshold: 0.05
- Root margin: `20% 0px -20% 0px`
- Stagger delay: `min((tick % 6) * 40, 240)ms`

---

## 5. Color Tokens (Reference)

```css
/* Background */
--background: hsl(var(--background));
--card: hsl(var(--card));
--muted: hsl(var(--muted));

/* Foreground */
--foreground: hsl(var(--foreground));
--muted-foreground: hsl(var(--muted-foreground));
--primary: hsl(var(--primary));
--primary-foreground: hsl(var(--primary-foreground));

/* Borders */
--border: hsl(var(--border));

/* Semantic */
--destructive: hsl(var(--destructive));
```

---

## 6. Typography Scale

| Element | Font | Size (Mobile) | Size (Desktop) |
|---------|------|---------------|----------------|
| Hero Title | serif | text-5xl | text-8xl |
| Section Title | serif | text-3xl | text-6xl |
| Account Name | serif | text-xl | text-4xl |
| Body | serif | prose-base | prose-lg |
| Label | sans | text-[9px] | text-[10px] |
| Caption | mono | text-[8px] | text-[8px] |

---

## 7. Icon Set (Lucide)

| Usage | Icon | Size |
|-------|------|------|
| Close | X | h-5 w-5 |
| Share | Share2 | h-5 w-5 |
| Carousel Left | ChevronLeft | w-6 h-6 |
| Carousel Right | ChevronRight | w-6 h-6 |
| Search | Search | h-4 w-4 |
| Filter | Filter | h-4 w-4 |

---

## 8. Profile Page (프로필 페이지)

### 8.1 Page Structure

**Route**: `/profile`

```
┌─────────────────────────────────────────────────────────────┐
│                    Header                                    │  h: 56px (md:64px)
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Profile Header Card                     │   │  Avatar + Info + Actions
│   │  [Avatar]  Name / @username                          │   │
│   │            Bio (optional)           [⚙️] [🚪]        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│   │  Posts   │ │ Accepted │ │ Earnings │                   │  Stats Cards (3 columns)
│   │   42     │ │   85%    │ │  $1,234  │                   │
│   └──────────┘ └──────────┘ └──────────┘                   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  🏆 My Badges              [View All]                │   │  Badge Grid
│   │  [🏅][⭐][💎][+5]                                    │   │  3 cols (mobile) / 4 cols (desktop)
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  📊 Rankings                                         │   │  Ranking List
│   │  Global: #123 this week                  ↑ +5        │   │
│   │  Global: #45 this month                  ↓ -2        │   │
│   │  Global: #789 overall                    —           │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   [ View All Activity ]                                     │  Action Button
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              Bottom Nav (Mobile Only)                        │  h: 64px
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Container & Spacing

**Layout**:
- Max width: `max-w-4xl mx-auto`
- Padding: `px-4 md:px-8`
- Content spacing: `space-y-4 md:space-y-6`
- Page padding: `pt-16 md:pt-20 pb-16 md:pb-0`

### 8.3 Profile Header Card

**Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│  [Avatar]  Display Name                    [⚙️] [🚪]        │
│   60x60    @username                        24x24  24x24   │
│   (md:80)  Bio text line-clamp-2...                        │
└─────────────────────────────────────────────────────────────┘
```

**Avatar**:
| Breakpoint | Size |
|------------|------|
| Mobile | 60px × 60px |
| Desktop | 80px × 80px |

**Avatar Fallback**:
- Shape: `rounded-full`
- Background: `bg-primary`
- Text: `text-primary-foreground`
- Font: `text-xl md:text-2xl font-bold`
- Content: First letter of display name

**Card Styles**:
- Background: `bg-card`
- Border: `border border-border`
- Radius: `rounded-xl`
- Padding: `p-4 md:p-6`

**Action Buttons**:
| Button | Icon | Size | Hover |
|--------|------|------|-------|
| Settings | Settings | w-5 h-5 (md:w-6 h-6) | `hover:bg-accent` |
| Logout | LogOut | w-5 h-5 (md:w-6 h-6) | `hover:bg-accent` |

**Typography**:
| Element | Class |
|---------|-------|
| Name | `text-lg md:text-xl font-bold text-foreground truncate` |
| Username | `text-sm text-muted-foreground` |
| Bio | `text-sm text-muted-foreground line-clamp-2` |

### 8.4 Stats Cards

**Grid**: `grid grid-cols-3 gap-3 md:gap-4`

**Single Card**:
```
┌─────────────────────┐
│         42          │  text-2xl md:text-3xl font-bold
│        Posts        │  text-xs md:text-sm text-muted-foreground
└─────────────────────┘
```

**Card Styles**:
- Background: `bg-card`
- Border: `border border-border`
- Radius: `rounded-xl`
- Padding: `p-4 md:p-6`
- Text align: `text-center`
- Interactive: `cursor-pointer hover:bg-accent/50` (if clickable)

**Animation**:
- Entry: `opacity 0 → 1`, `y 20 → 0`
- Duration: `0.4s`
- Stagger delay: `0.1s, 0.2s, 0.3s`

### 8.5 Badge Grid

**Layout**:
| Breakpoint | Columns | Max Display |
|------------|---------|-------------|
| Mobile | 3 | 2 badges + "more" button |
| Desktop | 4 | 3 badges + "more" button |

**Badge Item**:
```
┌─────────────────┐
│       🏆        │  Icon: w-7 h-7 (md:w-8 h-8)
│   Badge Name    │  text-xs font-medium
└─────────────────┘
```

**Badge Styles**:
- Background: `bg-accent/30`
- Hover: `hover:bg-accent`
- Radius: `rounded-xl`
- Padding: `p-3`
- Icon color: `text-primary`

**"More" Button**:
```
┌─────────────────┐
│       +5        │  text-lg md:text-xl font-bold text-primary
│      more       │  text-xs font-medium text-primary
└─────────────────┘
```
- Background: `bg-primary/10`
- Hover: `hover:bg-primary/20`

### 8.6 Ranking List

**Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Rankings                                                 │
├─────────────────────────────────────────────────────────────┤
│  Global: #123 this week                           ↑ +5      │
│  ─────────────────────────────────────────────────────────  │
│  Global: #45 this month                           ↓ -2      │
│  ─────────────────────────────────────────────────────────  │
│  Global: #789 overall                             —         │
└─────────────────────────────────────────────────────────────┘
```

**Change Indicators**:
| Change | Icon | Color |
|--------|------|-------|
| Positive | TrendingUp | `text-green-500` |
| Negative | TrendingDown | `text-red-500` |
| No change | Minus | `text-muted-foreground` |

**List Styles**:
- Item padding: `py-2`
- Divider: `divide-y divide-border`

### 8.7 View All Activity Button

**Styles**:
- Width: `w-full md:w-auto`
- Padding: `px-6 py-3`
- Radius: `rounded-xl`
- Border: `border border-border`
- Background: `bg-card hover:bg-accent`
- Font: `text-sm font-medium text-foreground`

---

## 9. Login Page (로그인 페이지)

### 9.1 Page Structure

**Route**: `/login`

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                  DomeGallery Background                      │  Full viewport
│                  (3D image carousel)                         │  z-index: 0
│                                                              │
│            ┌───────────────────────────┐                    │
│            │                           │                    │
│            │        Login Card         │                    │  max-w-sm
│            │                           │                    │  z-index: 20
│            │      decoded              │                    │
│            │  Welcome to Decoded       │                    │
│            │                           │                    │
│            │  [ Continue with Kakao ]  │                    │
│            │  [ Continue with Google ] │                    │
│            │  [ Continue with Apple ]  │                    │
│            │                           │                    │
│            │  ──────── or ────────    │                    │
│            │                           │                    │
│            │  [ Continue as Guest ]    │                    │
│            │                           │                    │
│            │  Terms & Privacy links    │                    │
│            │                           │                    │
│            └───────────────────────────┘                    │
│                                                              │
│                  Dark Overlay                                │  z-index: 10
│                  bg-black/30                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Background Layer

**DomeGallery**:
- Full viewport coverage
- 3D rotating image carousel
- Position: `absolute inset-0`
- Z-index: `0`

**Dark Overlay**:
- Position: `absolute inset-0`
- Background: `bg-black/30`
- Z-index: `10`
- Purpose: Better card readability

### 9.3 Login Card

**Container**:
- Position: `relative z-20`
- Layout: `flex min-h-screen flex-col items-center justify-center`
- Padding: `px-4`

**Card Styles**:
- Max width: `max-w-sm w-full`
- Background: `bg-white/5`
- Backdrop: `backdrop-blur-xl`
- Border: `border-0`
- Shadow: `shadow-2xl`

### 9.4 Card Content

**Logo & Title Section**:
```
┌─────────────────────────────┐
│         decoded             │  text-3xl font-bold text-[#d9fc69]
│    Welcome to Decoded       │  text-lg font-medium text-white/90
│  Discover what they're...   │  text-sm text-white/60
└─────────────────────────────┘
```

**Error Message** (conditional):
- Background: `bg-red-500/10`
- Border: `border border-red-500/20`
- Padding: `p-3`
- Radius: `rounded-lg`
- Text: `text-sm text-red-400 text-center`

### 9.5 OAuth Buttons

**Button Structure**:
```
┌────────────────────────────────────────────┐
│  [Provider Icon]  Continue with Provider   │
└────────────────────────────────────────────┘
```

**Provider-specific Colors**:
| Provider | Background | Text | Icon |
|----------|------------|------|------|
| Kakao | `#FEE500` | `#191919` | Kakao icon |
| Google | `#FFFFFF` | `#1F1F1F` | Google icon |
| Apple | `#000000` | `#FFFFFF` | Apple icon |

**Button Styles**:
- Width: `w-full`
- Height: `h-12` (48px)
- Radius: `rounded-xl`
- Padding: `px-4`
- Gap: `gap-3`
- Font: `text-sm font-medium`

**States**:
| State | Visual |
|-------|--------|
| Default | Provider colors |
| Hover | Slight brightness change |
| Loading | Spinner replaces icon |
| Disabled | `opacity-50 cursor-not-allowed` |

### 9.6 Divider

```
────────────── or ──────────────
```

**Styles**:
- Line: `border-t border-white/20`
- Text: `text-xs text-white/40`
- Background: `bg-transparent`

### 9.7 Guest Button

**Styles**:
- Background: `bg-transparent`
- Border: `border border-white/20`
- Text: `text-white/70`
- Hover: `hover:bg-white/10 hover:text-white`
- Radius: `rounded-xl`
- Height: `h-12` (48px)
- Font: `text-sm font-medium`

### 9.8 Footer Links

**Styles**:
- Font: `text-xs text-white/40`
- Link: `underline underline-offset-2 hover:text-white/60`
- Padding: `pb-8`

---

## 10. Shared Components

### 10.1 Header (Mobile)

**Viewport**: `< 768px`

**Styles**:
- Position: `fixed top-0 left-0 right-0`
- Height: `h-14` (56px)
- Z-index: `9999`
- Background: `bg-background/80 backdrop-blur-md`

### 10.2 Bottom Navigation (Mobile)

**Viewport**: `< 768px`

**Styles**:
- Position: `fixed bottom-0 left-0 right-0`
- Height: `h-16` (64px)
- Z-index: `50`
- Background: `bg-background/95 backdrop-blur-md`
- Border: `border-t border-border`

**Items**: 5 tabs (equal width)
- Icon size: `w-5 h-5`
- Label: `text-[10px]`
- Active state: `text-primary`

---

*Last Updated: 2026-01-29*
*Based on actual implementation in `/packages/web/`*
