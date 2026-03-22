# [SCR-VIEW-02] Spot / Hotspot Interaction Layer
> Route: overlay within `/posts/[id]` and legacy `/images/[id]` | Status: partially implemented | Updated: 2026-03-05

## Purpose

User explores detected item spots on the post image, selects them to view product details and solution links in a panel.

See: SCR-VIEW-01 — Page layout containing this interaction layer
See: SCR-VIEW-03 — Item/Solution detail when solution link tapped
See: FLW-02 — Interaction states and transition table

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Spot markers (post flow) | Inline div elements | `packages/web/lib/components/detail/ImageDetailPage.tsx` | Custom pulse dots; DS Hotspot NOT used in post flow |
| Spot markers (image flow) | DS: Hotspot | DS: component-registry | variant="numbered", position={x,y}, color=brandToColor(), glow, selected |
| Item showcase | InteractiveShowcase | `packages/web/lib/components/detail/InteractiveShowcase.tsx` | image, items: UiItem[], ScrollTrigger-driven active index |
| Image with spots | ImageCanvas | `packages/web/lib/components/detail/ImageCanvas.tsx` | image, items: UiItem[], activeIndex |
| Connector lines | ConnectorLayer | `packages/web/lib/components/detail/ConnectorLayer.tsx` | items, activeIndex, imageContainerRef, cardsContainerRef |
| Item detail card | ItemDetailCard | `packages/web/lib/components/detail/ItemDetailCard.tsx` | item: UiItem, index, isModal?, onActivate, onDeactivate |
| Decoded items (post flow) | DecodedItemsSection | `packages/web/lib/components/detail/DecodedItemsSection.tsx` | spots: SpotRow[], solutions: SolutionRow[] |
| DS: SpotCard | DS: component-registry | — | variant: "default"/"active"/"compact" |
| DS: SpotDetail | DS: component-registry | — | brand, name, shopLinks, imageUrl, relatedItems |
| DS: BottomSheet | DS: component-registry | — | isOpen, onClose, snapPoints, title |
| Spot-card scroll sync (request flow) | useSpotCardSync | `packages/web/lib/hooks/useSpotCardSync.ts` | For request/detect flow only; NOT used in detail view |

## Layout

### Mobile (default)

**Idle state — no spot selected:**
```
┌────────────────────────────────┐
│  [Hero Image]                  │
│  ● ① ② (spot markers)          │  pulse dots or numbered Hotspot
│                                │
│                                │
│  [hero content]                │
└────────────────────────────────┘
│  [DecodedItemsSection]         │  scrollable list below hero
│   ├─ [item 1 row]              │
│   ├─ [item 2 row]              │
│   └─ [item 3 row]              │
└────────────────────────────────┘
```

**Spot selected (image flow / InteractiveShowcase):**
```
┌────────────────────────────────┐
│  [ImageCanvas - sticky]        │  top-0 sticky, h-[40vh]
│   ① ②● (active marker glow)   │  DS Hotspot selected=true
│   ╌╌╌ [ConnectorLayer line]    │  SVG line to active item
└────────────────────────────────┘
│  [ItemDetailCard 1] ← active   │  ScrollTrigger: center
│  [ItemDetailCard 2]            │
│  [ItemDetailCard 3]            │
└────────────────────────────────┘

[DS BottomSheet - not used in current post flow]
[⚠️ NOT-IMPL: BottomSheet for post spot selection]
```

### Desktop (>=768px)

**InteractiveShowcase desktop (image flow):**
```
┌────────────────────────────────────────────────┐
│ [ImageCanvas - sticky h-screen, lg:w-1/2]      │ [ItemDetailCard scrollable, lg:w-1/2]
│  ① ②● (active: scale-125, glow)               │ [ItemDetailCard 1] ← ScrollTrigger active
│  [ConnectorLayer SVG lines]                     │ [ItemDetailCard 2]
│                                                 │ [ItemDetailCard 3]
└────────────────────────────────────────────────┘
```

| Element | Mobile | Desktop |
|---------|--------|---------|
| ImageCanvas / spot layer | top sticky, h-[40vh], full width | sticky h-screen, lg:w-1/2 |
| Item cards | scrollable below image | scrollable right column, lg:w-1/2 |
| SpotDetail panel | BottomSheet (📋 PLANNED for post flow) | Side panel right (📋 PLANNED) |
| Hotspot marker | compact pulse dot | DS Hotspot with glow + scale on select |
| ConnectorLayer | hidden (SVG only on lg) | SVG lines image → card |

## Interaction States

| State | Description | Active UI | Triggered By |
|-------|-------------|-----------|--------------|
| idle | Page loaded, no spot focused | Spot markers visible on image | Page mount |
| spot-scrolled | User scrolls past item card | ImageCanvas marker highlights; ConnectorLayer line active | ScrollTrigger onEnter |
| spot-deselected | Scrolled past card boundary | Marker returns to default | ScrollTrigger onLeave |
| solution-loading | Spot selected, solutions fetching | Panel shows skeleton | `GET /api/v1/spots/[spotId]/solutions` |
| solution-ready | Solutions loaded | SpotDetail panel with shop links | React Query cache populated |
| shopping-exit | Solution link tapped | New tab with affiliate URL | `POST /api/v1/solutions/convert-affiliate` |

*Note: The `idle → spot-selected → solution panel` flow via DS BottomSheet is `⚠️ NOT-IMPL` in PostDetailContent. The current implementation drives interaction via ScrollTrigger in the InteractiveShowcase (image flow) or an expandable card list in DecodedItemsSection (post flow).*

## Requirements

- When user scrolls past an item card in InteractiveShowcase, the system shall highlight the corresponding marker in ImageCanvas and draw a ConnectorLayer line. `✅` (image flow only)
- When user taps a Hotspot marker (DS Hotspot), the system shall set `selected=true` on that marker, activate the corresponding ItemDetailCard, and update `activeIndex`. `✅` (image flow via ImageCanvas)
- When SpotDetail opens with solutions, the system shall display shop links via `GET /api/v1/spots/[spotId]/solutions`. `✅`
- When solutions are loading, the system shall show DS SpotDetailSkeleton placeholders in the panel. `⚠️ NOT-IMPL` (DecodedItemsSection has its own skeleton; SpotDetailSkeleton not used)
- When user taps outside an active area, the system shall deselect the spot and close the panel. `⚠️ NOT-IMPL` (no explicit outside-tap handler; ScrollTrigger onLeave handles it)
- When user selects a different item while a panel is open, the system shall switch to the new item's solutions via `onEnter` ScrollTrigger or `onActivate` handler. `✅`
- When user taps a solution shop link, the system shall open the affiliate-converted URL in a new tab. `✅`
- When user arrives from a grid card, the system shall read `originState` from `transitionStore` and play FLIP enter animation via `useFlipEnter`. `✅` (ImageDetailModal)
- When FLIP animation completes, the system shall call `transitionStore.reset()` via `gsap.set(element, { clearProps: "all" })`. `✅`

### DS Hotspot Usage

The DS `Hotspot` component (`DS: component-registry`) is used in `ImageCanvas` (image flow). In `PostDetailContent` (post flow), spot markers are rendered as custom `div` elements with Tailwind `animate-ping` classes. Migrating post flow to DS Hotspot is `📋 PLANNED`.

## State

- `transitionStore` (`packages/web/lib/stores/transitionStore.ts`)
  - `selectedId`: ID of image/post being FLIP-transitioned (not per-spot selection)
  - `originState`: GSAP Flip.getState() snapshot from grid item
  - `originRect`: DOMRect for FLIP source position
  - `reset()`: called after animation completes
- Per-spot active state: local `activeIndex` (number | null) in `InteractiveShowcase` — not persisted in global store
- React Query cache: spot solutions keyed by spotId

## FLIP Animation Sequence

```
Grid card tap
  → transitionStore.setTransition(id, state, rect, imgSrc)
  → router.push("/posts/[id]") (or intercepted modal)
  → ImageDetailModal mounts → useFlipEnter(targetRef, imageId)
  → originState + originRect present → Flip.from(originState) plays (0.6s)
  → onComplete: gsap.set(clearProps:"all") + transitionStore state remains

Browser back / Close button
  → useFlipExit(targetRef) called → Flip.to(state) plays back (0.5s)
  → onComplete: transitionStore.reset() → navigate back

Fallback (direct URL access, no originState)
  → useFlipEnter sees originState=null → GSAP fromTo(opacity:0→1, scale:0.95→1, 0.4s)
```

See: FLW-02 transition table for full navigation contract.

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Solution shop link tap | External URL (new tab) | Affiliate-converted via POST /api/v1/solutions/convert-affiliate |
| Close / X button | FLW-01 entry screen | router.back(); FLIP exit animation plays if originState |
| Browser back | FLW-01 entry screen | popstate → transitionStore.reset() |
