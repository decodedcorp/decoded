# Component Registry

> Design System v2.0 — Complete catalog of all design system components.
> Import path: `@/lib/design-system`
> Source directory: `packages/web/lib/design-system/`
>
> **Note:** This document captures component props and variants for spec reference. For the latest
> prop signatures, read the source file directly.

---

## Summary Table

| Component | File | Category | Role |
|-----------|------|----------|------|
| **tokens** | `tokens.ts` | Primitive | Design token constants (colors, spacing, typography, shadows, z-index) |
| **Heading** | `typography.tsx` | Primitive | Semantic heading text with serif variants (hero, h1–h4) |
| **Text** | `typography.tsx` | Primitive | Body/label text with sans-serif variants (body, small, caption, label, overline) |
| **Input** | `input.tsx` | Primitive | Form input with icon slots, label, helper text, and error state |
| **SearchInput** | `input.tsx` | Primitive | Specialized search input with built-in search icon and clear button |
| **Card** | `card.tsx` | Primitive | Base card container with variant/size/interactive props |
| **CardHeader** | `card.tsx` | Primitive | Card header slot — title/subtitle area |
| **CardContent** | `card.tsx` | Primitive | Card main content slot |
| **CardFooter** | `card.tsx` | Primitive | Card footer slot — actions/metadata area |
| **CardSkeleton** | `card.tsx` | Primitive | Card loading skeleton with configurable sections |
| **Tag** | `tag.tsx` | Primitive | Chip/tag component with style variants |
| **Badge** | `badge.tsx` | Primitive | Achievement or status badge indicator |
| **BadgeSkeleton** | `badge.tsx` | Primitive | Badge loading skeleton |
| **Divider** | `divider.tsx` | Primitive | Horizontal section divider |
| **ActionButton** | `action-button.tsx` | Primitive | Action button with multiple variants (primary, secondary, ghost, destructive) |
| **LoadingSpinner** | `loading-spinner.tsx` | Primitive | Animated loading indicator |
| **SkeletonCard** | `skeleton-card.tsx` | Primitive | Generic skeleton loader for arbitrary card shapes |
| **ProductCard** | `product-card.tsx` | Composite | Product display with image, brand, name, price, and badge |
| **ProductCardSkeleton** | `product-card.tsx` | Composite | ProductCard loading skeleton |
| **GridCard** | `grid-card.tsx` | Composite | Grid layout card for image grid views |
| **GridCardSkeleton** | `grid-card.tsx` | Composite | GridCard loading skeleton |
| **FeedCardBase** | `feed-card.tsx` | Composite | Social feed card base (exported as `FeedCardBase`) |
| **FeedCardBaseSkeleton** | `feed-card.tsx` | Composite | FeedCard loading skeleton |
| **ProfileHeaderCard** | `profile-header-card.tsx` | Composite | User profile header with avatar, stats, bio |
| **ProfileHeaderCardSkeleton** | `profile-header-card.tsx` | Composite | ProfileHeaderCard loading skeleton |
| **ArtistCard** | `artist-card.tsx` | Composite | Artist/celebrity card with portrait image |
| **ArtistCardSkeleton** | `artist-card.tsx` | Composite | ArtistCard loading skeleton |
| **StatCard** | `stat-card.tsx` | Composite | Statistics display card with number and label |
| **StatCardSkeleton** | `stat-card.tsx` | Composite | StatCard loading skeleton |
| **SpotCard** | `spot-card.tsx` | Composite | Product spot card with 3 variants (default/active/compact) |
| **SpotCardSkeleton** | `spot-card.tsx` | Composite | SpotCard loading skeleton |
| **SpotDetail** | `spot-detail.tsx` | Composite | Full spot detail panel with image, shop links, related items |
| **SpotDetailSkeleton** | `spot-detail.tsx` | Composite | SpotDetail loading skeleton |
| **ShopCarouselCard** | `shop-carousel-card.tsx` | Composite | Shop item card for horizontal carousel |
| **ShopCarouselCardSkeleton** | `shop-carousel-card.tsx` | Composite | ShopCarouselCard loading skeleton |
| **LeaderItem** | `leader-item.tsx` | Composite | Leaderboard entry item with rank, avatar, and score |
| **LeaderItemSkeleton** | `leader-item.tsx` | Composite | LeaderItem loading skeleton |
| **RankingItem** | `ranking-item.tsx` | Composite | Ranking list item with position and label |
| **OAuthButton** | `oauth-button.tsx` | Composite | OAuth provider button (Kakao, Google, Apple) |
| **GuestButton** | `guest-button.tsx` | Composite | Guest login/continue button |
| **StepIndicator** | `step-indicator.tsx` | Composite | Multi-step progress indicator |
| **Hotspot** | `hotspot.tsx` | Composite | Interactive image marker with brand color glow |
| **LoginCard** | `login-card.tsx` | Composite | Login card UI container |
| **BottomSheet** | `bottom-sheet.tsx` | Composite | Draggable bottom sheet with snap points |
| **DesktopHeader** | `desktop-header.tsx` | Feature | Full desktop navigation header |
| **MobileHeader** | `mobile-header.tsx` | Feature | Mobile top navigation header |
| **DesktopFooter** | `desktop-footer.tsx` | Feature | Desktop footer |
| **NavBar** | `nav-bar.tsx` | Feature | Mobile bottom navigation bar (fixed, hidden on desktop) |
| **NavItem** | `nav-item.tsx` | Feature | Individual navigation item with icon and label |
| **SectionHeader** | `section-header.tsx` | Feature | Section header with title and optional action |
| **SpotMarker** | `spot-marker.tsx` | Composite | Platform-wide spot marker with index-based accent colors |
| **Tabs** | `tabs.tsx` | Feature | Tab navigation with TabItem children |
| **TabItem** | `tabs.tsx` | Feature | Individual tab in a Tabs container |

---

## Primitives

### tokens

**File:** `packages/web/lib/design-system/tokens.ts`

Token groups exported from `tokens.ts`:

| Export | Type | Usage |
|--------|------|-------|
| `typography` | object | Font families, sizes (hero/h1–h4/body/small/caption), line heights |
| `responsiveTypography` | object | Tailwind class sets per breakpoint for pageTitle/sectionTitle/cardTitle/body/caption |
| `colors` | object | CSS variable references for background, foreground, primary, secondary, muted, accent, destructive, border, chart1–5, sidebar, main |
| `spacing` | object | 4px-base scale: keys 0–32 → values "0px"–"128px" |
| `breakpoints` | object | sm/md/lg/xl/2xl in px strings |
| `shadows` | object | 2xs/xs/sm/md/lg/xl/2xl (CSS variable references) |
| `borderRadius` | object | none/sm/md/lg/xl/2xl/full/main |
| `zIndex` | object | base(0) / floating(10) / dropdown(20) / header(40) / sidebar(40) / modalBackdrop(50) / modal(60) / toast(70) / tooltip(100) |

```typescript
import { typography, colors, spacing, shadows, borderRadius, zIndex } from "@/lib/design-system"
// or
import { colors } from "@/lib/design-system/tokens"
```

---

### Heading

**File:** `packages/web/lib/design-system/typography.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"hero" \| "h1" \| "h2" \| "h3" \| "h4"` | `"h2"` | Typography scale variant |
| `as` | `"h1"–"h6" \| "p" \| "span"` | auto from variant | Override semantic element |
| `className` | `string` | — | Additional CSS classes |

**Variants:** `hero` (text-5xl→8xl, bold), `h1` (text-4xl→6xl), `h2` (text-3xl→5xl), `h3` (text-2xl→3xl), `h4` (text-xl→2xl). All use `font-serif` (Playfair Display).

```tsx
<Heading variant="h1">Page Title</Heading>
<Heading variant="h2" as="h1">Section (semantic override)</Heading>
```

---

### Text

**File:** `packages/web/lib/design-system/typography.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"body" \| "small" \| "caption" \| "label" \| "overline"` | `"body"` | Text size variant |
| `textColor` | `"default" \| "muted" \| "primary" \| "destructive"` | `"default"` | Semantic color |
| `as` | `"p" \| "span" \| "div" \| "label"` | `"p"` | HTML element |

```tsx
<Text variant="small" textColor="muted">Caption text</Text>
<Text variant="overline">SECTION LABEL</Text>
```

---

### Input

**File:** `packages/web/lib/design-system/input.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "error" \| "search"` | `"default"` | Visual style |
| `leftIcon` | `ReactNode` | — | Icon rendered at left edge |
| `rightIcon` | `ReactNode` | — | Icon rendered at right edge |
| `label` | `string` | — | Label above input |
| `helperText` | `string` | — | Helper text below input |
| `error` | `string` | — | Error message (auto-applies "error" variant) |

---

### SearchInput

**File:** `packages/web/lib/design-system/input.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Controlled value |
| `onClear` | `() => void` | — | Called when clear (X) button clicked |
| `placeholder` | `string` | `"Search..."` | Placeholder text |

Built-in: search icon left, X clear button right (auto-shown when value present). Uses `variant="search"` (rounded-full).

---

### Card / CardHeader / CardContent / CardFooter

**File:** `packages/web/lib/design-system/card.tsx`

**Card props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "elevated" \| "outline" \| "ghost"` | `"default"` | Shadow/border style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Padding (p-3/p-4/p-6) |
| `interactive` | `boolean` | `false` | Adds cursor-pointer + hover:shadow-lg |

`CardHeader`, `CardContent`, `CardFooter` — layout slots; accept `className` + HTML div props.

```tsx
<Card variant="elevated" size="lg" interactive>
  <CardHeader><Heading variant="h4">Title</Heading></CardHeader>
  <CardContent>Body</CardContent>
  <CardFooter><ActionButton>Action</ActionButton></CardFooter>
</Card>
```

---

### CardSkeleton

**File:** `packages/web/lib/design-system/card.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | card variant | `"default"` | Card style |
| `size` | card size | `"md"` | Card padding |
| `showHeader` | `boolean` | `true` | Show header shimmer |
| `showContent` | `boolean` | `true` | Show content shimmer |
| `showFooter` | `boolean` | `true` | Show footer shimmer |
| `aspectRatio` | `"4/5" \| "1/1" \| "16/9"` | — | Image placeholder aspect ratio |

---

### Tag

**File:** `packages/web/lib/design-system/tag.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "outline" \| "filled"` | `"default"` | Style variant |
| `size` | `"sm" \| "md"` | `"md"` | Tag size |
| `onRemove` | `() => void` | — | Shows X button when provided |

---

### Badge / BadgeSkeleton

**File:** `packages/web/lib/design-system/badge.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"common" \| "rare" \| "epic" \| "legendary"` | `"common"` | Rarity style (matches DB badge_rarity enum) |
| `icon` | `ReactNode` | — | Badge icon |
| `label` | `string` | — | Badge label text |

---

### Divider

**File:** `packages/web/lib/design-system/divider.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Line direction |
| `className` | `string` | — | Additional classes |

---

### ActionButton

**File:** `packages/web/lib/design-system/action-button.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "secondary" \| "ghost" \| "destructive" \| "outline"` | `"primary"` | Button style |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| `loading` | `boolean` | `false` | Shows spinner, disables button |
| `leftIcon` | `ReactNode` | — | Icon before label |
| `rightIcon` | `ReactNode` | — | Icon after label |

---

### LoadingSpinner

**File:** `packages/web/lib/design-system/loading-spinner.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Spinner size |
| `className` | `string` | — | Additional classes |

---

### SkeletonCard

**File:** `packages/web/lib/design-system/skeleton-card.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "compact" \| "list"` | `"default"` | Layout shape |
| `aspectRatio` | `"1/1" \| "4/5" \| "3/4"` | — | Image area ratio |
| `className` | `string` | — | Additional classes |

---

## Composites

### ProductCard / ProductCardSkeleton

**File:** `packages/web/lib/design-system/product-card.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `brand` | `string` | yes | Brand name |
| `name` | `string` | yes | Product name |
| `link` | `string` | yes | Navigation href (wraps in `<Link>`) |
| `imageUrl` | `string` | no | Product image URL |
| `price` | `string \| number` | no | Current price |
| `originalPrice` | `string \| number` | no | Strikethrough price |
| `badge` | `"TOP" \| "NEW" \| "BEST" \| "SALE"` | no | Overlay badge |
| `aspectRatio` | `"1/1" \| "3/4" \| "4/5"` | no (default `"1/1"`) | Image aspect ratio |
| `onClick` | `() => void` | no | Modal trigger (use instead of link) |

`ProductCardSkeleton` props: `aspectRatio` (same options), `className`.

---

### GridCard / GridCardSkeleton

**File:** `packages/web/lib/design-system/grid-card.tsx`

Card optimized for image grid layouts. Used in explore and images pages.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `imageUrl` | `string` | — | Grid image |
| `aspectRatio` | `"1/1" \| "4/5" \| "3/4"` | `"4/5"` | Image proportion |
| `title` | `string` | — | Optional overlay title |
| `onClick` | `() => void` | — | Click handler |

---

### FeedCardBase / FeedCardBaseSkeleton

**File:** `packages/web/lib/design-system/feed-card.tsx`
**Export alias:** `FeedCard` in source, exported as `FeedCardBase` from index.

Social feed card with user attribution and engagement metadata.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `imageUrl` | `string` | no | Post image |
| `username` | `string` | yes | Author username |
| `avatarUrl` | `string` | no | Author avatar |
| `artistName` | `string` | no | Featured artist |
| `spotCount` | `number` | no | Number of spots |
| `viewCount` | `number` | no | View count |
| `createdAt` | `string` | no | ISO date string |
| `onClick` | `() => void` | no | Card click handler |

---

### ProfileHeaderCard / ProfileHeaderCardSkeleton

**File:** `packages/web/lib/design-system/profile-header-card.tsx`

User profile header with avatar, display name, bio, rank, and stat counts.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `username` | `string` | yes | Username handle |
| `displayName` | `string` | no | Display name |
| `avatarUrl` | `string` | no | Avatar image URL |
| `bio` | `string` | no | Profile bio text |
| `rank` | `string` | no | User rank label |
| `totalPoints` | `number` | no | Points total |
| `postCount` | `number` | no | Post count stat |

---

### ArtistCard / ArtistCardSkeleton

**File:** `packages/web/lib/design-system/artist-card.tsx`

Celebrity/artist portrait card used in trending and celebrity grid sections.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `imageUrl` | `string` | no | Portrait image URL |
| `name` | `string` | yes | Artist name |
| `groupName` | `string` | no | Group/agency name |
| `onClick` | `() => void` | no | Click handler |

---

### StatCard / StatCardSkeleton

**File:** `packages/web/lib/design-system/stat-card.tsx`

Statistics display card for profile and dashboard stats.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | yes | Stat label (e.g., "Posts") |
| `value` | `string \| number` | yes | Stat value |
| `icon` | `ReactNode` | no | Icon |
| `trend` | `"up" \| "down" \| "neutral"` | no | Trend indicator |

---

### SpotCard / SpotCardSkeleton

**File:** `packages/web/lib/design-system/spot-card.tsx`

Product spot card for interactive item spotting. NOT a navigation component — uses `onClick` for modal trigger.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `brand` | `string` | yes | Brand name |
| `name` | `string` | yes | Product name |
| `price` | `string` | yes | Formatted price |
| `imageUrl` | `string` | no | Product image URL |
| `variant` | `"default" \| "active" \| "compact"` | no (`"default"`) | Display context |
| `onClick` | `() => void` | no | Modal trigger handler |

**Variants:** `default` (square grid), `active` (4/5 ratio with primary ring), `compact` (horizontal row with 64px thumbnail).

---

### SpotDetail / SpotDetailSkeleton

**File:** `packages/web/lib/design-system/spot-detail.tsx`

Full spot detail panel: hero image with gradient overlay, shop links list, optional related items horizontal scroll.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `brand` | `string` | yes | Brand name |
| `name` | `string` | yes | Product name |
| `shopLinks` | `SpotDetailShopLink[]` | yes | Shop entries with price |
| `imageUrl` | `string` | no | Hero image URL |
| `description` | `string` | no | Product description |
| `relatedItems` | `SpotDetailRelatedItem[]` | no | Horizontal related items |
| `onShopClick` | `(link: SpotDetailShopLink) => void` | no | Shop link click callback |

**SpotDetailShopLink:** `{ shopName: string; url: string; price: string; logoUrl?: string }`
**SpotDetailRelatedItem:** `{ brand: string; name: string; price: string; imageUrl?: string; onClick?: () => void }`

```tsx
<SpotDetail
  brand="Nike"
  name="Air Max 90"
  imageUrl="/product.jpg"
  shopLinks={[
    { shopName: "Musinsa", url: "https://...", price: "₩129,000" },
  ]}
/>
```

---

### ShopCarouselCard / ShopCarouselCardSkeleton

**File:** `packages/web/lib/design-system/shop-carousel-card.tsx`

Compact card for horizontal shop carousels on the images detail page.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `imageUrl` | `string` | no | Product image |
| `brand` | `string` | yes | Brand name |
| `name` | `string` | yes | Product name |
| `price` | `string` | no | Formatted price |
| `shopUrl` | `string` | no | External shop link |
| `onClick` | `() => void` | no | Click handler |

---

### LeaderItem / LeaderItemSkeleton

**File:** `packages/web/lib/design-system/leader-item.tsx`

Leaderboard entry with rank position, user avatar, and score.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `rank` | `number` | yes | Numeric rank position |
| `username` | `string` | yes | User handle |
| `avatarUrl` | `string` | no | Avatar image |
| `points` | `number` | yes | Score/points |
| `badge` | `string` | no | Rank badge label |
| `onClick` | `() => void` | no | Click handler |

---

### RankingItem

**File:** `packages/web/lib/design-system/ranking-item.tsx`

Simple ranking list item with position indicator.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rank` | `number` | — | Position number |
| `label` | `string` | — | Item label |
| `variant` | `"default" \| "gold" \| "silver" \| "bronze"` | `"default"` | Position highlight |
| `onClick` | `() => void` | — | Click handler |

---

### OAuthButton

**File:** `packages/web/lib/design-system/oauth-button.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `provider` | `"kakao" \| "google" \| "apple"` | yes | OAuth provider |
| `onClick` | `() => void` | yes | Auth trigger |
| `loading` | `boolean` | no | Loading state |
| `disabled` | `boolean` | no | Disabled state |

---

### GuestButton

**File:** `packages/web/lib/design-system/guest-button.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onClick` | `() => void` | yes | Guest continue handler |
| `label` | `string` | no | Button label (default: "Continue as Guest") |

---

### StepIndicator

**File:** `packages/web/lib/design-system/step-indicator.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `steps` | `number` | yes | Total step count |
| `currentStep` | `number` | yes | Active step (1-indexed) |
| `variant` | `"dots" \| "numbers" \| "progress"` | no (`"dots"`) | Display style |

---

### Hotspot

**File:** `packages/web/lib/design-system/hotspot.tsx`

Interactive image marker for item spotting. Parent must have `position: relative`.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `{ x: number; y: number }` | yes | Percentage coordinates (0–100) |
| `variant` | `"default" \| "numbered" \| "inactive"` | no (`"default"`) | Marker style |
| `number` | `number` | no | Display number (numbered variant, 1–99) |
| `label` | `string` | no | Accessibility label |
| `color` | `string` | no | CSS color override (use `brandToColor()`) |
| `selected` | `boolean` | no | Scale-125 + enhanced glow |
| `revealing` | `boolean` | no | Entry animation |
| `revealDelay` | `number` | no | Animation delay (ms) for stagger |
| `glow` | `boolean` | no | Box-shadow glow effect |

**Utility:** `brandToColor(brand: string): string` — deterministic HSL color from brand name string.

```tsx
import { Hotspot, brandToColor } from "@/lib/design-system"

<div className="relative">
  <img src="..." alt="..." />
  <Hotspot
    variant="numbered"
    number={1}
    position={{ x: 35, y: 60 }}
    color={brandToColor("Nike")}
    glow={true}
    selected={isSelected}
    label="Nike Air Max 90"
    onClick={() => handleItemClick(id)}
  />
</div>
```

---

### LoginCard

**File:** `packages/web/lib/design-system/login-card.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | no | Card headline |
| `description` | `string` | no | Subtitle/body text |
| `children` | `ReactNode` | yes | OAuth buttons and form content |

---

### BottomSheet

**File:** `packages/web/lib/design-system/bottom-sheet.tsx`

Draggable bottom sheet with snap points. Per decoded.pen: dark background (#242424), 40×4px handle (#3D3D3D), 20px top radius.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | — | Visibility |
| `onClose` | `() => void` | — | Close callback |
| `snapPoints` | `number[]` | `[0.3, 0.6, 0.9]` | Viewport height fractions |
| `defaultSnapPoint` | `number` | `0.3` | Initial snap height |
| `title` | `string` | — | Header title (use `header` for custom) |
| `header` | `ReactNode` | — | Custom header content |
| `onSnapChange` | `(snap: number) => void` | — | Snap point change callback |

Closes on backdrop click or Escape key. Supports touch drag and mouse drag.

```tsx
<BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Filter">
  <FilterContent />
</BottomSheet>
```

---

### SpotMarker

**File:** `packages/web/lib/design-system/spot-marker.tsx`

Platform-wide spot marker with index-based accent colors (emerald, blue, amber, rose, violet, teal). Used in DetectionView, DecodedSolutionsSection, ImageDetailContent.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `position` | `SpotPosition` | yes | Coordinates: `{ x, y }` (0-1) or `{ position_left, position_top }` (% strings) |
| `index` | `number` | yes | Display number (1-based); determines accent color |
| `isSelected` | `boolean` | no (`false`) | Glow animation + primary bg when selected |
| `onClick` | `(e?: MouseEvent) => void` | no | Click handler; renders as `<button>` when provided |
| `isRevealing` | `boolean` | no (`false`) | Entry animation (for DetectionView reveal) |
| `revealDelay` | `number` | no | Animation delay in ms for stagger |
| `size` | `"sm" \| "md" \| "lg"` | no (`"sm"`) | Marker size (10px / 24px / 32px) |
| `showIndex` | `boolean` | no (`true`) | Show index number inside marker |
| `label` | `string` | no | aria-label override |

**SpotPosition type:** `{ x: number; y: number }` (0-1 normalized) or `{ position_left: string; position_top: string }` (percentage strings).

---

## Feature Components

### DesktopHeader

**File:** `packages/web/lib/design-system/desktop-header.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "transparent" \| "blur"` | `"default"` | Header background |
| `showSearch` | `boolean` | `true` | Show search input |
| `logoHref` | `string` | `"/"` | Logo link destination |

---

### MobileHeader

**File:** `packages/web/lib/design-system/mobile-header.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "transparent"` | `"default"` | Background style |
| `title` | `string` | — | Center title |
| `showBack` | `boolean` | `false` | Show back button |
| `onBack` | `() => void` | — | Back navigation handler |
| `rightContent` | `ReactNode` | — | Right slot content |

---

### DesktopFooter

**File:** `packages/web/lib/design-system/desktop-footer.tsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showLinks` | `boolean` | `true` | Show navigation links |
| `className` | `string` | — | Additional classes |

---

### NavBar

**File:** `packages/web/lib/design-system/nav-bar.tsx`

Mobile bottom navigation bar. Fixed at bottom, hidden on desktop (`md:hidden`). Height: 64px. Includes safe-area inset support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `"fixed" \| "static"` | `"fixed"` | Positioning mode |
| `children` | `ReactNode` | — | `NavItem` children |

```tsx
<NavBar>
  <NavItem icon={<Home />} label="Home" href="/" />
  <NavItem icon={<Search />} label="Search" href="/search" />
  <NavItem icon={<User />} label="Profile" href="/profile" />
</NavBar>
```

---

### NavItem

**File:** `packages/web/lib/design-system/nav-item.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `icon` | `ReactNode` | yes | Navigation icon |
| `label` | `string` | yes | Navigation label |
| `href` | `string` | yes | Destination path |
| `active` | `boolean` | no | Active state style |

---

### SectionHeader

**File:** `packages/web/lib/design-system/section-header.tsx`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `title` | `string` | yes | Section title |
| `action` | `ReactNode` | no | Right-side action (e.g., "View all" link) |
| `subtitle` | `string` | no | Subtitle below title |

---

### Tabs / TabItem

**File:** `packages/web/lib/design-system/tabs.tsx`

| Tabs Prop | Type | Default | Description |
|-----------|------|---------|-------------|
| `defaultTab` | `string` | — | Initially active tab id |
| `onChange` | `(tabId: string) => void` | — | Tab change callback |
| `variant` | `"underline" \| "pills"` | `"underline"` | Tab style |

| TabItem Prop | Type | Required | Description |
|--------------|------|----------|-------------|
| `id` | `string` | yes | Tab identifier |
| `label` | `string` | yes | Tab label |
| `count` | `number` | no | Badge count |
| `disabled` | `boolean` | no | Disable tab |
