# Phase v2-07: Search & Image Detail - Context

**Gathered:** 2026-01-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement Search and Image Detail pages with decoded.pen design. Users can search content via full-screen overlay with tabs (All, People, Media, Items), and view detailed image pages with hero, tags, gallery, and shop sections. Scroll-triggered animations enhance the image detail experience.

</domain>

<decisions>
## Implementation Decisions

### Search UX
- Full-screen overlay on tap (both mobile and desktop)
- Slides in from top with back button + tap-outside to close
- Recent searches shown before typing (max 5-10 items)
- Manual clear only (X per item + "Clear all")
- Live results with debounced keystroke updates
- Minimal "No results found" message (no suggestions)

### Search Tabs
- Use decoded.pen tabs: All, People, Media, Items
- Active underline slides horizontally between tabs
- Show result counts on all tabs (e.g., "Items (24)")
- Grid layout for all tab content types

### Image Detail Layout
- Full page route at /images/[id]
- Same vertical layout on desktop (just wider, centered container)
- Close button (X) triggers browser back navigation
- Hero image with fixed aspect ratio, max height limit on desktop
- Hero tap opens fullscreen lightbox (zoomable)
- Tags row + article section (drop cap) shown only when content exists
- "More from this look" gallery shows related posts
- Shop carousel shows spotted items first, then related suggestions

### Scroll Animations
- GSAP ScrollTrigger for all scroll-triggered animations
- Hero parallax effect (image moves slower than scroll)
- Hero title fades out as user scrolls past
- Action buttons (report, share, close) fixed at top while scrolling

### Claude's Discretion
- Exact parallax speed/ratio for hero
- Debounce timing for live search results
- Gallery grid columns (2 or 3)
- Shop carousel item count and scroll behavior
- Lightbox implementation details (pinch zoom, swipe gestures)

</decisions>

<specifics>
## Specific Ideas

- decoded.pen "Page 5: Image Detail" as reference: hero 426px mobile, gradient overlay, Playfair Display 64px title
- SearchInput component from v2-02: width 361px, height 48px, rounded-12, gap-12, padding 0/16
- SearchTabs: border-bottom 1px #3D3D3D, active tab has 2px primary underline
- Article drop cap: Playfair Display 72px, line-height 0.85

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: v2-07-search-image-detail*
*Context gathered: 2026-01-29*
