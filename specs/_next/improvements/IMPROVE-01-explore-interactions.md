> STATUS: NOTED -- enhancement backlog, not yet scheduled

# IMPROVE-01: Explore Section Interaction Enhancements

> Source: Manual review (2026-03-05)
> Affects: SCR-DISC-04 (Explore), SCR-VIEW-01 (Post Detail), SCR-VIEW-02 (Spot Hotspot), SCR-VIEW-03 (Item Solution)
> Priority: High -- current Explore is visually strong but lacks user action depth

## Current State Assessment

Explore (`/explore`) has a solid visual foundation with ThiingsGrid physics canvas and category filtering. However, the experience drops off at the **post-tap moment** -- the transition from discovery to engagement is thin.

### What Works Well
- ThiingsGrid spiral canvas with physics-based drag
- ExploreCardCell 3:4 aspect with GSAP FLIP to detail
- Hierarchical filter UI (Category > Media > Cast > Context)
- Infinite scroll with preload margin

### Gaps Identified

## 1. Explore Grid Scroll & Actions

**Problem:** Grid browsing is passive -- user can only drag/pan and tap cards. No micro-interactions.

**Proposed Enhancements:**
- Long-press card: quick preview overlay (image + spot count + artist name) without full navigation
- Double-tap card: instant save/bookmark with haptic-style animation pulse
- Swipe card left: "Not interested" with GSAP fly-off animation (feeds future recommendation)
- Scroll velocity detection: fast scroll triggers compact mode (smaller cells, more density), slow scroll returns to normal

**Affected Specs:**
- SCR-DISC-04: ExploreCardCell interaction states
- store-map: new `exploreInteractionStore` or extend `filterStore`

## 2. Post Detail Depth After Tap

**Problem:** Tapping a post navigates to SCR-VIEW-01 but the detail view lacks engagement hooks beyond viewing and shopping.

**Proposed Enhancements:**
- Spot markers on hero image should be interactive (currently NOT-IMPL in PostDetailContent -- only visual dots with no tap handler)
- Tap spot marker -> expand inline SpotDetail panel (DS BottomSheet on mobile) with solution cards
- "Similar Looks" carousel at bottom driven by visual similarity (not just same artist)
- Inline voting on solutions (currently UI-only with hardcoded counts -- needs API wiring)
- Share with "Shop the Look" deep link (currently basic Web Share)
- Save/bookmark post with collection assignment

**Affected Specs:**
- SCR-VIEW-01: spot marker tap handler (NOT-IMPL to implement)
- SCR-VIEW-02: BottomSheet spot detail panel (PLANNED, not wired)
- SCR-VIEW-03: voting API integration (NOT-IMPL, UI-only)

## 3. User Actions on Cards

**Problem:** ExploreCardCell only supports tap-to-navigate. No contextual actions.

**Proposed Enhancements:**
- Contextual action menu (long-press or "..." button): Save, Share, Report, "Find Similar"
- Quick-save to collection without leaving Explore grid
- "Find Similar" triggers visual search (connects to NEXT-04 Commerce Bridge Layer 1)
- Artist name badge on card hover/tap-hold for quick artist filter

**Affected Specs:**
- SCR-DISC-04: ExploreCardCell component, new ContextMenu component
- api-contracts: bookmark/save endpoints (not yet defined)
- NEXT-04: "Find Similar" visual search integration point

## 4. Filter -> Data Connection Gap

**Problem:** Hierarchical filter UI exists but does NOT affect data fetching (documented as NOT-IMPL in SCR-DISC-04).

**Proposed Fix:**
- Wire `hierarchicalFilterStore` selections to `useInfinitePosts` query params
- Replace mock data (`getMockCategories` etc.) with real API data
- Wire sort controls to API `sort` param

**Affected Specs:**
- SCR-DISC-04: Requirements section (NOT-IMPL items)
- api-contracts: existing GET /api/v1/posts already supports these params

## 5. Transition Quality

**Problem:** FLIP animation from grid to detail works, but return transition can feel jarring.

**Proposed Enhancements:**
- Shared element transition: card image morphs into hero image (not just FLIP position)
- Background blur on detail entry (hero image bleeds into viewport edges)
- Gesture-driven dismiss: drag down to close detail with progress-based opacity

**Affected Specs:**
- SCR-VIEW-01: FLIP animation section
- transitionStore: gesture dismiss state

---

## Implementation Priority

| # | Enhancement | Impact | Effort | Dependencies |
|---|-------------|--------|--------|--------------|
| 1 | Spot marker tap handler | High | Low | SCR-VIEW-02 DS Hotspot migration |
| 2 | Filter -> data wiring | High | Low | None (API already supports) |
| 3 | Solution voting API | Medium | Medium | Backend voting endpoint |
| 4 | Long-press quick preview | Medium | Medium | New component |
| 5 | Save/bookmark system | High | High | New API endpoints + DB table |
| 6 | "Find Similar" visual search | High | High | NEXT-04 backend |
| 7 | Gesture-driven dismiss | Low | Medium | GSAP Draggable |

---

See: [SCR-DISC-04](../../screens/discovery/SCR-DISC-04-explore.md) -- Current explore spec
See: [SCR-VIEW-01](../../screens/detail/SCR-VIEW-01-post-detail.md) -- Post detail
See: [SCR-VIEW-02](../../screens/detail/SCR-VIEW-02-spot-hotspot.md) -- Spot interaction
See: [SCR-VIEW-03](../../screens/detail/SCR-VIEW-03-item-solution.md) -- Item/solution detail
See: [NEXT-04](../NEXT-04-commerce-bridge.md) -- Commerce bridge (Find Similar)
