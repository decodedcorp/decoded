# [SCR-VIEW-01] Post / Image Detail
> Route: `/posts/[id]` (primary) | `/images/[id]` (redirects → `/posts/[id]`) | Status: implemented | Updated: 2026-03-05

## Purpose

User views a full post with hero image, spot markers, editorial metadata, decoded items, and related content.

See: SCR-VIEW-02 — Hotspot interaction layer (tap → spot-selected state → SpotDetail panel)
See: SCR-VIEW-03 — Item/Solution detail and shopping connection
See: SCR-VIEW-04 — Related content ("More from this Look") grid
See: FLW-02 — Content Detail Flow (navigation contract)

## Route Delta: `/images/[id]`

`/images/[id]` (route: `packages/web/app/images/[id]/page.tsx`) immediately server-redirects to `/posts/[id]`. No content is rendered on the images route. The `/posts/[id]` route (`packages/web/app/posts/[id]/page.tsx`) is the sole content-rendering path.

`ImageDetailPage` (`packages/web/lib/components/detail/ImageDetailPage.tsx`) still exists as the page component for the intercepted parallel modal route (`@modal/(.)images/[id]`). It wraps `PostDetailContent` with a GSAP fade-in and action buttons (Like, Save, Report, Share, Close).

The `/posts/[id]` route (`packages/web/app/posts/[id]/page.tsx`) directly renders `ImageDetailPage` — there is no separate `PostDetailPage` component. `ImageDetailPage` handles both the modal and full-page rendering paths.

## Component Map

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Page wrapper (all paths) | ImageDetailPage | `packages/web/lib/components/detail/ImageDetailPage.tsx` | imageId: string; handles both `/posts/[id]` and `@modal/(.)images/[id]` |
| Scroll | LenisProvider | `packages/web/lib/components/detail/LenisProvider.tsx` | Smooth scroll wrapper |
| Article text | ArticleContent | `packages/web/lib/components/detail/ArticleContent.tsx` | content: string (markdown) |
| Decoded items | DecodedItemsSection | `packages/web/lib/components/detail/DecodedItemsSection.tsx` | spots: SpotRow[], solutions: SolutionRow[] |
| Gallery | GallerySection | `packages/web/lib/components/detail/GallerySection.tsx` | images: {id, image_url}[] |
| Shop carousel | ShopCarouselSection | `packages/web/lib/components/detail/ShopCarouselSection.tsx` | solutions: SolutionRow[] |
| Related looks | RelatedLooksSection | `packages/web/lib/components/detail/RelatedLooksSection.tsx` | images: {id, image_url}[], displayName: string |
| Social | SocialActions | `packages/web/lib/components/shared/SocialActions.tsx` | likeCount, commentCount, showComment |
| Comments | CommentSection | `packages/web/lib/components/shared/CommentSection.tsx` | — |
| Report modal | ReportModal | `packages/web/lib/components/shared/ReportModal.tsx` | open, onClose, targetType="post" |
| Lightbox | Lightbox | `packages/web/lib/components/detail/Lightbox.tsx` | isOpen, onClose, imageUrl, alt |
| Tags (legacy image flow) | MetadataTags | `packages/web/lib/components/detail/MetadataTags.tsx` | tags: string[] |
| DS: Heading/Text | DS: component-registry | — | Used in error state and DecodedItemsSection |
| DS: Card | DS: component-registry | — | Used in error state card |
| DS: ShopCarouselCard | DS: component-registry | — | Used inside ShopCarouselSection |

**Legacy image-based flow** (when accessed via `ImageDetailContent`):

| Region | Component | File | Props/Notes |
|--------|-----------|------|-------------|
| Image content body | ImageDetailContent | `packages/web/lib/components/detail/ImageDetailContent.tsx` | image: ImageDetail, isModal?, activeIndex?, onHeroClick? |
| Image hero | HeroSection | `packages/web/lib/components/detail/HeroSection.tsx` | image: ImageRow, isModal?, onClick? |
| Interactive showcase | InteractiveShowcase | `packages/web/lib/components/detail/InteractiveShowcase.tsx` | image, items: UiItem[], isModal? |
| Canvas with hotspots | ImageCanvas | `packages/web/lib/components/detail/ImageCanvas.tsx` | image, items, activeIndex |
| Connector lines | ConnectorLayer | `packages/web/lib/components/detail/ConnectorLayer.tsx` | items, activeIndex, refs |
| Item detail | ItemDetailCard | `packages/web/lib/components/detail/ItemDetailCard.tsx` | item: UiItem, index, isModal? |
| Shop grid | ShopGrid | `packages/web/lib/components/detail/ShopGrid.tsx` | items: UiItem[], isModal? |
| Related images | RelatedImages | `packages/web/lib/components/detail/RelatedImages.tsx` | currentPostId, account, isModal? |

## Layout

### Mobile (default)

```
┌────────────────────────────────┐
│ [Action Buttons: Report Share X]│  fixed top-right, z-50
├────────────────────────────────┤
│                                │
│   [Hero Image]                 │  h-[426px], object-contain, bg-black
│   ● ● (spot markers)           │  inline pulse dots at % coords
│   [gradient overlay]           │  from-black/80 via-black/40
│   [@artist badge pill]         │  bottom-left, rounded-full glass
│   [H1: Media Title]            │  font-serif text-4xl white
│   [N items featured · Date]    │  text-sm white/60
│   [Follow button]              │
├────────────────────────────────┤
│ [#tag] [#tag] [#tag]           │  metadata pills, flex-wrap
│ [ArticleContent]               │  magazine drop-cap, prose
├────────────────────────────────┤
│ DECODED ITEMS                  │
│ [DecodedItemsSection]          │  spot list → expandable detail
├────────────────────────────────┤
│ GALLERY                        │
│ [GallerySection]               │  "More from this Look" grid
├────────────────────────────────┤
│ SHOP THE LOOK                  │
│ [ShopCarouselSection] →        │  horizontal scroll carousel
├────────────────────────────────┤
│ RELATED LOOKS                  │
│ [RelatedLooksSection]          │  masonry grid
├────────────────────────────────┤
│ [@name] [N items decoded]      │
│ [SocialActions: Like Comment]  │
│ [CommentSection]               │
└────────────────────────────────┘
│ [NavBar - fixed bottom]        │  DS: NavBar
└────────────────────────────────┘
```

### Desktop (>=768px)

Content centered `max-w-4xl` with increased padding. Action buttons scale up (h-12 w-12). Hero height expands to `md:h-[60vh] max-h-[600px]`. NavBar hidden; DesktopHeader visible.

| Element | Mobile | Desktop |
|---------|--------|---------|
| Hero height | 426px | 60vh (max 600px) |
| Action buttons | 40×40px | 48×48px |
| Padding | px-6 | px-10 |
| Top offset | -mt-14 | -mt-[72px] |
| NavBar | visible | hidden (md:hidden) |
| DesktopHeader | hidden | visible |

## Requirements

### Data Loading

- When `ImageDetailPage` mounts, the system shall call `usePostById(postId)` to fetch `GET /api/v1/posts/[postId]` with spots and solutions. `✅`
- When data is loading, the system shall display a full-page skeleton (hero placeholder + content blocks). `✅`
- When the fetch fails or returns no data, the system shall show a DS Card error state with a "Go Back" button. `✅`
- When spots exist, the system shall fetch related posts via `useInfinitePosts({ artistName })` for gallery and related looks sections. `✅`

### User Interactions

- When the user taps the hero image, the system shall open `Lightbox` with the post image URL. `✅` (ImageDetailPage)
- When the user taps a spot marker on the hero image, the system shall — `⚠️ NOT-IMPL` (current spot markers are not interactive in the post detail view)
- When the user taps the Report button, the system shall open `ReportModal`. `✅`
- When the user taps Share, the system shall invoke Web Share API with fallback to clipboard copy. `✅`
- When the user taps Close/X, the system shall call `router.back()`. `✅`

### FLIP Animation

- When user arrives at `/posts/[id]` via intercepted modal route, the system shall read `originState` and `originRect` from `transitionStore` and play FLIP enter animation via `useFlipEnter`. `✅` (ImageDetailModal uses useFlipEnter)
- When no `originState` exists (direct URL access), the system shall fade in via GSAP `fromTo(opacity: 0 → 1)` as fallback. `✅`
- When FLIP or fade-in animation completes, the system shall clear inline styles via `gsap.set(element, { clearProps: "all" })`. `✅`
- When the user navigates back, the system shall play FLIP exit animation via `useFlipExit` if `originState` exists. `✅`

### State

- `transitionStore` (`packages/web/lib/stores/transitionStore.ts`) — `selectedId`, `originState`, `originRect`, `imgSrc` for FLIP
- React Query — `usePostById` caches post data; `useInfinitePosts` caches related posts

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Card tap from FLW-01 | `/posts/[id]` | transitionStore.setTransition() called before navigation |
| Direct URL | `/posts/[id]` | No transitionStore state; fade-in fallback |
| `/images/[id]` request | `/posts/[id]` | Server-side redirect (see Route Delta) |
| Close / browser back | FLW-01 entry screen | transitionStore.reset() on popstate |
| Solution link tap | External shop | New tab, affiliate URL (see FLW-02) |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading | `isLoading: true` | Full-page skeleton (hero + content blocks) `✅` |
| Error | `error` or `!postDetail` | DS Card with AlertCircle, error message, "Go Back" button `✅` |
| No items | `spots.length === 0 && solutions.length === 0` | Empty state with Package icon, "No Items Yet" heading `✅` |
| No gallery | `relatedPosts.length < 1` | GallerySection hidden (conditional render) `✅` |
