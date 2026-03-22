# Roadmap: decoded-app v2.1 Design System Expansion

## Overview

This milestone completes the decoded.pen design system implementation by building the remaining 26 components across 6 phases. Starting from core interactive elements (tags, buttons, indicators), through navigation and cards, to specialized profile/detail components, login flows, and comprehensive visual QA automation.

## Milestones

- ✅ **v1.0 Documentation** - Phases 1-5 (shipped 2026-01-29)
- ✅ **v1.1 API Integration** - Phase 6 + Tracks A-D (shipped 2026-01-29)
- ✅ **v2.0 Design Overhaul** - v2-Phase 1-9 (shipped 2026-02-05)
- 🚧 **v2.1 Design System Expansion** - v2.1-Phase 1-6 (in progress)

## Phases

### v2.1-Phase-1: Core Interactive Components

**Goal**: Users can interact with category tags, action buttons, step indicators, and hotspots with decoded.pen styling

**Depends on**: v2.0 Design Overhaul (design system foundation)

**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04

**Success Criteria** (what must be TRUE):
1. User can filter content by clicking category tags (All, Latest, Clothing, Accessories, Shoes, Bags)
2. User sees visual feedback from action buttons in 3 variants (Default, Solid, Outline)
3. User sees current progress through 3-step indicator during upload flow
4. User can click hotspots on images to view item details (Default, Numbered, Inactive states)

**Plans**: 2 plans (1 wave)

Plans:
- [x] v2.1-01-01-PLAN.md — Tag + ActionButton components [Wave 1] ✅
- [x] v2.1-01-02-PLAN.md — StepIndicator + Hotspot components [Wave 1] ✅

---

### v2.1-Phase-2: Navigation Components

**Goal**: Users can navigate the app using mobile bottom nav, section headers, and search result tabs with consistent styling

**Depends on**: v2.1-Phase-1

**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04

**Success Criteria** (what must be TRUE):
1. User sees active page indicator in mobile bottom navigation
2. User can tap nav items to switch between Home, Explore, Upload, Profile
3. User sees section headers that visually separate content areas
4. User can switch between search result tabs (All, Images, Posts, Users)

**Plans**: 2 plans (1 wave - parallel)

Plans:
- [x] v2.1-02-01-PLAN.md — NavBar + NavItem components [Wave 1] ✅
- [x] v2.1-02-02-PLAN.md — SectionHeader + Tabs components [Wave 1] ✅

---

### v2.1-Phase-3: Card Components

**Goal**: Users see consistent card layouts for artists, statistics, spots, and shop items

**Depends on**: v2.1-Phase-1

**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04

**Success Criteria** (what must be TRUE):
1. User can view artist profiles in card format with avatar and follow count
2. User sees statistics displayed in visually consistent stat cards
3. User can interact with spot cards in 3 contexts (Default grid, Active detail, Compact list)
4. User can scroll through shop items in carousel card format

**Plans**: 2 plans

Plans:
- [x] v2.1-03-01-PLAN.md — ArtistCard + StatCard components [Wave 1] ✅
- [x] v2.1-03-02-PLAN.md — SpotCard variants + ShopCarouselCard components [Wave 1] ✅

---

### v2.1-Phase-4: Profile & Detail Components

**Goal**: Users see gamification elements (badges, leaderboard, rankings) and detailed spot information

**Depends on**: v2.1-Phase-3

**Requirements**: PROF-01, PROF-02, PROF-03, DETL-01

**Success Criteria** (what must be TRUE):
1. User sees earned badges displayed on profile with decoded.pen styling
2. User sees top contributors in leaderboard with highlight for podium positions
3. User sees ranking changes visualized (up arrow, down arrow, neutral dash)
4. User can view comprehensive spot details including brand, price, and purchase links

**Plans**: 2 plans (1 wave - parallel)

Plans:
- [x] v2.1-04-01-PLAN.md — Badge + LeaderItem components [Wave 1] ✅
- [x] v2.1-04-02-PLAN.md — RankingItem + SpotDetail components [Wave 1] ✅

---

### v2.1-Phase-5: Login & State Components

**Goal**: Users experience polished login flow with OAuth providers and consistent loading/skeleton states

**Depends on**: v2.1-Phase-2

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, STATE-01, STATE-02, UI-01

**Success Criteria** (what must be TRUE):
1. User can sign in with Kakao, Google, or Apple using branded OAuth buttons
2. User can continue as guest with dedicated guest button
3. User sees clear "or" divider between OAuth and guest options
4. User sees decoded.pen styled loading spinner during async operations
5. User sees skeleton cards while content is loading
6. User interacts with bottom sheet that follows decoded.pen motion design

**Plans**: 3 plans (2 waves)

Plans:
- [x] v2.1-05-01-PLAN.md — OAuthButton + GuestButton + Divider components [Wave 1] ✅
- [x] v2.1-05-02-PLAN.md — LoginCard + LoadingSpinner components [Wave 2] ✅
- [x] v2.1-05-03-PLAN.md — SkeletonCard + BottomSheet components [Wave 1] ✅

---

### v2.1-Phase-6: Visual QA Automation

**Goal**: Automated visual regression testing captures screenshots of all pages across breakpoints for design validation

**Depends on**: v2.1-Phase-5

**Requirements**: QA-01, QA-02, QA-03

**Success Criteria** (what must be TRUE):
1. Playwright automatically captures screenshots of all pages at 4 breakpoints (mobile, tablet, desktop, wide)
2. Screenshots are organized by page and breakpoint for easy comparison
3. Documentation clearly identifies visual differences between implementation and decoded.pen designs
4. CI pipeline can run visual regression tests on PR creation

**Plans**: 2 plans (2 waves)

Plans:
- [ ] v2.1-06-01-PLAN.md — Playwright visual testing setup (infrastructure, page routes, breakpoints) [Wave 1]
- [ ] v2.1-06-02-PLAN.md — Screenshot capture automation + documentation [Wave 2]

---

## Progress

**Execution Order:** v2.1-Phase 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| v2.1-1. Core Interactive | 2/2 | ✅ Complete | 2026-02-05 |
| v2.1-2. Navigation | 2/2 | ✅ Complete | 2026-02-06 |
| v2.1-3. Cards | 2/2 | ✅ Complete | 2026-02-06 |
| v2.1-4. Profile & Detail | 2/2 | ✅ Complete | 2026-02-06 |
| v2.1-5. Login & State | 3/3 | ✅ Complete | 2026-02-06 |
| v2.1-6. Visual QA | 0/2 | 📋 Planned | - |

**Total:** 11/13 plans complete

---

*Created: 2026-02-05*
*Last updated: 2026-02-06 (Phase 6 planned)*
