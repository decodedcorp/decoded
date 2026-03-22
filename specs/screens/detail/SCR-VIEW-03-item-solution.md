# [SCR-VIEW-03] Item / Solution Detail
> Route: section within `/posts/[id]` and `@modal/(.)images/[id]` | Status: implemented (shopping core); partial (voting UI-only) | Updated: 2026-03-05

## Purpose

User views decoded items matched to spot positions, selects an item to see brand/price/description, and taps "Shop Now" to open the product page in a new tab.

See: SCR-VIEW-01 — DecodedItemsSection and ShopCarouselSection placement in page layout
See: SCR-VIEW-02 — Spot hotspot interaction that surfaces the item/solution panel
See: FLW-02 — ShoppingExit state (solution link tap → external tab)

## Component Map

| Component | File | Props / Notes |
|-----------|------|---------------|
| DecodedItemsSection | `packages/web/lib/components/detail/DecodedItemsSection.tsx` | spots: SpotRow[], solutions: SolutionRow[] |
| ShopCarouselSection | `packages/web/lib/components/detail/ShopCarouselSection.tsx` | solutions: SolutionRow[] |
| ItemDetailCard | `packages/web/lib/components/detail/ItemDetailCard.tsx` | item: UiItem, index, isModal? — used in legacy image flow |
| ShopGrid | `packages/web/lib/components/detail/ShopGrid.tsx` | items: UiItem[], isModal? — used in legacy image flow |
| ItemVoting | `packages/web/lib/components/detail/ItemVoting.tsx` | itemId, upvotes?, downvotes? |
| VotingButtons (shared) | `packages/web/lib/components/shared/VotingButtons.tsx` | upvotes, downvotes, onVote? — used by ItemVoting |
| DS: ShopCarouselCard | DS: component-registry | Used inside ShopCarouselSection |
| DS: ProductCard | DS: component-registry | Not used in current flow; available in design system |
| useSolutions | `packages/web/lib/hooks/useSolutions.ts` | useSolutions(spotId) — query key: ["solutions","list", spotId] |
| useConvertAffiliate | `packages/web/lib/hooks/useSolutions.ts` | mutation: POST /api/v1/solutions/convert-affiliate — exists but not wired in UI |
| useItems (legacy) | `packages/web/lib/hooks/useItems.ts` | useItemsByImageId(imageId) — for legacy image flow |
| useNormalizedItems (legacy) | `packages/web/lib/hooks/useNormalizedItems.ts` | normalizes ImageDetail.items with item_locations |

**Stale paths not used:**
- `⚠️ NOT-IMPL` BuyButton, VoteButton, VotingSection, VibeItemCard, VibeVoting, OriginalItemCard, DualMatchSection, AddVibeModal — confirmed missing per STALE-PATHS-AUDIT
- `⚠️ NOT-IMPL` useVote, useTrackClick hooks — deleted

## Layout

### Mobile

```
Post detail page body (scroll):

┌────────────────────────────────────┐
│ DECODED ITEMS  [View All →]        │  DecodedItemsSection header
├────────────────────────────────────┤
│ [●] Celine Jacket  CELINE · ₩2.8M >│  item row (selected → primary bg)
│ [●] Prada Bag      PRADA · ₩1.9M  >│  item row
│ [●] Nike Shoes     NIKE  · ₩180k  >│  item row
├────────────────────────────────────┤
│ EXACT MATCH                        │  matchType badge (primary)
│ ┌────┐  Celine Long Trench Coat    │  ExpandedDetailCard
│ │IMG │  CELINE                     │
│ │    │  ₩2,850,000                 │  price (text-primary)
│ └────┘                             │
│ STYLING TIP                        │
│ Pair with minimal accessories...   │  solution.description
│ ┌─────────────────┐ [♥] [↗]       │
│ │  Shop Now  [🛍] │               │  href: affiliate_url || original_url
│ └─────────────────┘               │  opens _blank
├────────────────────────────────────┤
│ CURATED SELECTION                  │  ShopCarouselSection header
│ Shop the Look                      │
│ [card][card][card][card] →         │  horizontal snap-x scroll
│  brand                             │  each card: thumbnail + brand + title + price
│  title                             │  + "View Details" button
│  ₩price                            │
└────────────────────────────────────┘
```

### Desktop (>=768px)

```
┌───────────────────────────────────────────────────────┐
│  DECODED ITEMS                                        │
│  ┌──────────────────────┬──────────────────────────┐  │
│  │ Item list (400px)    │ ExpandedDetailCard (flex) │  │
│  │ [item row]           │ [IMG] Brand / Title / ₩   │  │
│  │ [item row selected]  │ Styling Tip               │  │
│  │ [item row]           │ [Shop Now] [♥] [↗]       │  │
│  └──────────────────────┴──────────────────────────┘  │
│  SHOP THE LOOK                                        │
│  [←]  [card][card][card][card][card]  [→]            │
└───────────────────────────────────────────────────────┘
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| Item list + detail | stacked vertical | side-by-side (400px + flex-1) |
| Shop carousel | snap-x scroll | snap-x scroll + arrow buttons visible |
| Share button | hidden | visible (md:flex) |

## Requirements

### Data Loading

- When `ImageDetailPage` mounts, the system shall pass `spots` and `solutions` from `usePostById` result to `DecodedItemsSection` and `ShopCarouselSection`. `✅`
- When solutions are loaded, the system shall display brand, title, price, and thumbnail for each solution via `SolutionRow` fields. `✅`
- When `spots.length === 0`, the system shall not render `DecodedItemsSection` (component returns null). `✅`
- When `solutions.length === 0`, the system shall not render `ShopCarouselSection` (component returns null). `✅`

### Shopping Connection

- When the user taps "Shop Now" in `ExpandedDetailCard`, the system shall open `solution.affiliate_url || solution.original_url` in a new tab. `✅`
- When the user taps a card in `ShopCarouselSection`, the system shall open `solution.affiliate_url || solution.original_url` in a new tab. `✅`
- **Affiliate conversion note:** `POST /api/v1/solutions/convert-affiliate` and `useConvertAffiliate` hook exist and are wired for mutation, but are **not called at tap time** in the current UI. Affiliate URLs are pre-stored in `SolutionRow.affiliate_url` at solution-creation time. `⚠️ NOT-IMPL`: runtime affiliate conversion on tap is designed (FLW-02 ShoppingExit) but not wired.

### Voting

- When the user taps thumbs-up/down in `ItemVoting`, the system shall update local UI state (percentage bar) via `VotingButtons` local state. `⚠️ NOT-IMPL` (no API persistence; `itemId` prop is unused `_itemId`; hardcoded defaults 24/3)

### Stale Features (designed, not implemented)

- `⚠️ NOT-IMPL` Vibe matching (VibeItemCard, DualMatchSection): show original vs. vibe-match side-by-side
- `⚠️ NOT-IMPL` "Add Vibe" modal (AddVibeModal): user submits alternate matching item
- `⚠️ NOT-IMPL` Similar options in ExpandedDetailCard: SimilarOptions component exists as stub returning null

## Shopping Connection Flow

```
User taps "Shop Now" or carousel card
         │
         ▼
href = solution.affiliate_url || solution.original_url
         │
         ▼
<a target="_blank" rel="noopener noreferrer">
         │
         ▼
External product page opens in new tab
```

For planned runtime conversion flow, see: FLW-02 — ShoppingExit state (POST /api/v1/solutions/convert-affiliate).
Client function: `convertAffiliate(url)` in `packages/web/lib/api/solutions.ts`.

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Spot tap (SCR-VIEW-02) | Item panel opens within page | Solutions loaded via `useSolutions(spotId)` |
| "Shop Now" / carousel tap | External product page | `_blank` tab; no navigation away from detail page |
| Item row tap | ExpandedDetailCard updates | `selectedIndex` local state in DecodedItemsSection |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| No spots | `spots.length === 0` | DecodedItemsSection hidden `✅` |
| No solutions | `solutions.length === 0` | ShopCarouselSection hidden; ExpandedDetailCard shows "Unavailable" `✅` |
| No shop URL | `affiliate_url === null && original_url === null` | Shop Now button disabled (bg-primary/50, cursor-not-allowed) `✅` |
| No thumbnail | `solution.thumbnail_url === null` | Placeholder div with "No Image" text `✅` |
