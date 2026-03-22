# [SCR-VIEW-04] Related Content
> Route: sections within `/posts/[id]` and `@modal/(.)images/[id]` | Status: partially implemented | Updated: 2026-03-05

## Purpose

User discovers related content ("More from this Look", "Related Looks", gallery images) below the main detail sections. Three separate components render related content depending on which data is available. SmartTagsBreadcrumb provides contextual breadcrumb navigation.

See: SCR-VIEW-01 — Page layout containing GallerySection, RelatedLooksSection, RelatedImages, CommentSection
See: FLW-01 — Discovery flow (related content creates re-entry into the discovery loop)

## Component Map

| Component | File | Props / Notes |
|-----------|------|---------------|
| GallerySection | `packages/web/lib/components/detail/GallerySection.tsx` | images: {id, image_url}[] — pre-fetched; links to /posts/[id] |
| RelatedLooksSection | `packages/web/lib/components/detail/RelatedLooksSection.tsx` | images: {id, image_url}[], displayName: string — masonry 2-col, 4 images max |
| RelatedImages | `packages/web/lib/components/detail/RelatedImages.tsx` | currentPostId, account, isModal? — fetches its own data |
| SmartTagsBreadcrumb | `packages/web/lib/components/detail/SmartTagsBreadcrumb.tsx` | tags: {label, href?}[] — breadcrumb nav, no data fetching |
| ArticleContent | `packages/web/lib/components/detail/ArticleContent.tsx` | content: string (markdown) — no data fetching |
| CommentSection (shared) | `packages/web/lib/components/shared/CommentSection.tsx` | comments?, title? — exists but uses MOCK_COMMENTS |
| ReportModal (shared) | `packages/web/lib/components/shared/ReportModal.tsx` | open, onClose, targetType="post" |
| DS: GridCard | DS: component-registry | Not used in current related content flow |
| DS: SectionHeader | DS: component-registry | Not used; sections use inline header markup |

**Stale paths confirmed missing (STALE-PATHS-AUDIT):**
- `⚠️ NOT-IMPL` detail/CommentForm, detail/CommentItem, detail/CommentList, detail/CommentSection — no detail-specific comment components
- `⚠️ NOT-IMPL` detail/TagBreadcrumb — replaced by SmartTagsBreadcrumb
- `⚠️ NOT-IMPL` detail/OriginalItemCard — missing; original item comparison not implemented
- `⚠️ NOT-IMPL` detail/ReportModal — exists in shared/, not detail/

## Recommendation Logic (researched from code)

**GallerySection:** Receives `images` prop from `PostDetailContent`, which builds the array from `post.related_posts` or similar relation in `usePostById` response. Does NOT fetch its own data. `✅` (component renders; data source is parent)

**RelatedLooksSection:** Receives `images` prop (same source as GallerySection). Shows up to 4 images in masonry layout. `✅` (component renders; data source is parent)

**RelatedImages:** Self-contained fetcher using `useInfinitePosts({ perPage: 12, artistName: account })`. Filters out `currentPostId` client-side. Groups by same artist — NOT by category or tag. Expand/collapse with "View All" / "Show Less". `✅`

**SmartTagsBreadcrumb:** Purely presentational. Tags passed from parent (e.g., `[{ label: "Drama", href: "/explore?context=drama" }]`). Clicking a tag navigates to href via `<a>` — no client-side state mutation. `✅`

**CommentSection:** Uses `MOCK_COMMENTS` array; no API call for comment data. `⚠️ NOT-IMPL` (UI shell exists, no backend)

## Layout

### Mobile

```
Post detail page body (below shop sections):

┌────────────────────────────────────┐
│ MORE FROM THIS LOOK                │  GallerySection header (mobile label)
│ Gallery                            │  font-serif heading
│ ┌──────┬──────┬──────┐             │  row 1: up to 3 images (h-140px)
│ │ IMG  │ IMG  │ IMG  │             │
│ └──────┴──────┴──────┘             │
│ ┌──────┬──────┐                   │  row 2: remaining images
│ │ IMG  │ IMG  │                   │
│ └──────┴──────┘                   │
├────────────────────────────────────┤
│ MORE FROM @ARTIST                  │  RelatedLooksSection header
│ Related Looks                      │
│ ┌──────┬──────┐                   │  masonry 2-col (col1: tall+short)
│ │ IMG  │ IMG  │                   │
│ │(200) │(140) │                   │
│ ├──────┼──────┤                   │
│ │ IMG  │ IMG  │                   │
│ │(140) │(200) │                   │
│ └──────┴──────┘                   │
├────────────────────────────────────┤
│ More from this look                │  RelatedImages header
│ From @account                      │
│ ┌──────┬──────┐                   │  grid-cols-2
│ │ IMG  │ IMG  │                   │
│ │ IMG  │ IMG  │                   │
│ └──────┴──────┘                   │
│ [View All ↓]                       │  expand toggle (>9 posts)
├────────────────────────────────────┤
│ tag > tag > context                │  SmartTagsBreadcrumb (breadcrumb nav)
├────────────────────────────────────┤
│ [Comments]                         │  CommentSection (mock data)
└────────────────────────────────────┘
```

### Desktop (>=768px)

GallerySection: row 1 images expand to `md:h-[400px]`, row 2 to `md:h-[300px]`. Container padding `md:py-12 md:px-16`.

RelatedImages: grid changes to `md:grid-cols-3`.

| Element | Mobile | Desktop |
|---------|--------|---------|
| GallerySection img height (row 1) | 140px | 400px |
| GallerySection img height (row 2) | 140px | 300px |
| RelatedImages grid | 2 columns | 3 columns |
| RelatedLooksSection | 2-col masonry | 2-col masonry (unchanged) |

## Requirements

### Data Loading

- When `ImageDetailPage` mounts and `relatedPosts` from `usePostById` has images, the system shall render `GallerySection` with those images. `✅`
- When `RelatedImages` mounts, the system shall call `useInfinitePosts({ perPage: 12, artistName: account })` via `GET /api/v1/posts?artist_name=...&per_page=12`. `✅`
- When `RelatedImages` loads, the system shall filter out `currentPostId` client-side and display up to 9 posts initially. `✅`
- When related posts count exceeds 9, the system shall show a "View All" expand button. `✅`
- When `images.length === 0`, the system shall hide `GallerySection` (returns null). `✅`
- When `images.length === 0`, the system shall hide `RelatedLooksSection` (returns null). `✅`

### Recommendation Logic

- Related content is scoped by **same artist** (`artistName` filter). `✅`
- There is **no** category-based, tag-based, or ML-based recommendation. `⚠️ NOT-IMPL`
- `SmartTagsBreadcrumb` tags are hardcoded at call site in parent; no dynamic tag recommendation. `⚠️ NOT-IMPL` (tags don't drive recommendation queries)

### User Interactions

- When user taps a GallerySection image, the system shall navigate to `/posts/[imageId]`. `✅`
- When user taps a RelatedLooksSection card, the system shall navigate to `/posts/[imageId]`. `✅`
- When user taps a RelatedImages card, the system shall navigate to `/posts/[postId]`. `✅`
- When user taps "View All" in RelatedImages, the system shall expand to show all loaded posts. `✅`
- When user taps a SmartTagsBreadcrumb tag with an href, the system shall follow the href link. `✅`
- When user submits a comment via CommentSection, the system shall — `⚠️ NOT-IMPL` (no API call; mock data only)

### Comment System

- `⚠️ NOT-IMPL` Full comment system: CommentForm, CommentItem, CommentList as separate components are missing
- Current `CommentSection` (shared) renders MOCK_COMMENTS with no backend persistence
- No `useComments` hook exists (deleted per STALE-PATHS-AUDIT)

## Data Requirements

| Component | Input | Source | API Endpoint |
|-----------|-------|--------|--------------|
| GallerySection | images[] from post data | `usePostById` response | None (SSR/RSC) |
| RelatedLooksSection | images[] from post data | `usePostById` response | None (SSR/RSC) |
| RelatedImages | `account` (artist name) | prop from parent | `GET /api/v1/posts?artist_name=...` |
| SmartTagsBreadcrumb | tags[] | prop from parent | None |

## Navigation

| Trigger | Destination | Notes |
|---------|-------------|-------|
| Gallery image tap | `/posts/[id]` | Navigates to new detail page (SCR-VIEW-01) |
| Related looks card tap | `/posts/[id]` | Navigates to new detail page (SCR-VIEW-01) |
| RelatedImages card tap | `/posts/[id]` | Link href, creates re-entry to FLW-01 |
| SmartTag tap (with href) | tag href (e.g., `/explore?context=drama`) | `<a>` navigation |

## Error & Empty States

| State | Condition | UI |
|-------|-----------|-----|
| Loading (RelatedImages) | `isLoading: true` | Skeleton grid (2-3 col, animate-pulse divs) `✅` |
| No related images | `posts.length === 0` | "No related content yet" text message `✅` |
| No gallery images | `images.length === 0` | GallerySection hidden (null render) `✅` |
| No related looks | `images.length === 0` | RelatedLooksSection hidden (null render) `✅` |
