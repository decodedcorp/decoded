# Roadmap: decoded-app v2.0 Design Overhaul

## Overview

v2.0 transforms the decoded-app UI by implementing the decoded.pen design system. Using Pencil MCP, we convert Figma-style designs into React components while preserving all existing functionality. This milestone focuses exclusively on design and layout, running parallel to v1.1 API Integration.

## Milestones

- ✅ **v1.0 Documentation Optimization** - Phases 1-5 (shipped 2026-01-29)
- 🚧 **v1.1 Full API Integration** - Phase 6 + Tracks A-D (in progress)
- 📋 **v2.0 Design Overhaul** - v2-Phases 1-9 (planned, this document)

## Phases

**Phase Numbering:**
- v2.0 uses prefix `v2-Phase-N` to distinguish from v1.1 milestone
- Runs in parallel with v1.1 on separate branch
- Integer phases only (no decimal insertions planned)

### v2.0 Design Overhaul

**Milestone Goal:** Implement decoded.pen design system across all pages while maintaining existing functionality

- [x] **v2-Phase 1: Design System Foundation** - Typography, design tokens, base styles
- [x] **v2-Phase 2: Core Interactive Components** - Buttons, inputs, tags, action buttons
- [x] **v2-Phase 3: Card Components** - All card variants from simple to complex
- [x] **v2-Phase 4: Desktop Infrastructure** - Header, footer, navigation, layouts
- [x] **v2-Phase 5: Home & Explore Pages** - Landing and discovery experiences
- [x] **v2-Phase 6: Feed & Profile Pages** - Content streams and user profiles
- [x] **v2-Phase 7: Search & Image Detail** - Discovery and detailed views
- [x] **v2-Phase 8: Request Flow & Login** - Multi-step flows and authentication
- [x] **v2-Phase 9: Documentation & Polish** - Design system docs, final adjustments (Visual QA deferred)

## Phase Details

### v2-Phase 1: Design System Foundation
**Goal**: Establish design tokens, typography system, and base styling that all components inherit
**Depends on**: Nothing (first phase)
**Requirements**: TYPO-01, TYPO-02, TYPO-03, TYPO-04
**Success Criteria** (what must be TRUE):
  1. All text styles (Hero, H1-H4, Body, Small, Caption) render consistently across the app
  2. Design tokens file exists with color palette, spacing scale, and breakpoints from decoded.pen
  3. Typography components can be imported and used in any page or component
  4. Base Tailwind configuration extends with custom design tokens
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-01-01-PLAN.md - Extract design tokens from decoded.pen [Wave 1]
- [x] v2-01-02-PLAN.md - Implement typography components (Heading, Text) [Wave 2]
- [x] v2-01-03-PLAN.md - Configure Tailwind with design system tokens [Wave 2]

### v2-Phase 2: Core Interactive Components
**Goal**: Users can interact with all basic UI elements (buttons, inputs, tags) using consistent design system patterns
**Depends on**: v2-Phase 1
**Requirements**: BTN-01, BTN-02, BTN-03, BTN-04, BTN-05, BTN-06, BTN-07, BTN-08, BTN-09, INP-01, INP-02, INP-03, TAG-01, TAG-02, TAG-03, TAG-04, TAG-05, TAG-06, ACT-01, ACT-02, ACT-03
**Success Criteria** (what must be TRUE):
  1. User can click buttons with 9 style variants (Primary, Secondary, Outline, Ghost, Destructive) and 3 sizes (Small, Default, Large)
  2. User can type into input fields with icons, placeholders, labels, and search functionality
  3. User can see and interact with category tags (All, Latest, Clothing, Accessories, Shoes, Bags)
  4. User can trigger actions via ActionButton variants (Default, Solid, Outline)
  5. All interactive states (hover, active, disabled, focus) work correctly
**Plans:** 3 plans (1 wave)

Plans:
- [x] v2-02-01-PLAN.md - Extend Button with icon sizes and loading state [Wave 1]
- [x] v2-02-02-PLAN.md - Create Input and SearchInput components [Wave 1]
- [x] v2-02-03-PLAN.md - Create Tag and TagGroup components [Wave 1]

### v2-Phase 3: Card Components
**Goal**: All content card types render with decoded.pen styling and maintain existing data bindings
**Depends on**: v2-Phase 2
**Requirements**: CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06
**Success Criteria** (what must be TRUE):
  1. User sees product cards displaying items with correct image, title, price, and metadata
  2. User sees feed cards showing posts with engagement actions (like, comment, share)
  3. User sees profile header card with avatar, username, stats, and actions
  4. User sees grid cards in gallery layouts maintaining decoded.pen spacing and proportions
  5. All card hover/press states match design system specifications
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-03-01-PLAN.md - Base Card component with cva variants, slots, and skeleton [Wave 1]
- [x] v2-03-02-PLAN.md - ProductCard, ItemCard, and GridCard [Wave 2]
- [x] v2-03-03-PLAN.md - FeedCard and ProfileHeaderCard [Wave 2]

### v2-Phase 4: Desktop Infrastructure
**Goal**: Desktop users see responsive layouts with top header navigation and footer (sidebar removed per v2-04-CONTEXT decisions)
**Depends on**: v2-Phase 3
**Requirements**: DSK-01, DSK-02, DSK-03 (header/footer focus; sidebar requirements deferred)
**Success Criteria** (what must be TRUE):
  1. User on desktop sees persistent header with navigation items and search
  2. User on desktop sees footer with links and branding
  3. User can navigate between pages via desktop header navigation with active state indicators
  4. Mobile users see MobileHeader at top and MobileNavBar at bottom
  5. Footer displays 4-column layout on desktop, accordion on mobile
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-04-01-PLAN.md - DesktopHeader and MobileHeader components [Wave 1]
- [x] v2-04-02-PLAN.md - DesktopFooter with responsive layout [Wave 1]
- [x] v2-04-03-PLAN.md - Layout integration (replace Sidebar with header navigation) [Wave 2]

### v2-Phase 5: Home & Explore Pages
**Goal**: Landing and discovery pages display with decoded.pen design on mobile and desktop
**Depends on**: v2-Phase 4
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, EXP-01, EXP-02, EXP-03
**Success Criteria** (what must be TRUE):
  1. User visiting home page sees DomGallery and Discover Items sections with decoded.pen styling
  2. User on mobile sees single-column home layout, user on desktop sees multi-column layout
  3. User on explore page sees category-filtered grid of items
  4. Category filters on explore page work and maintain design system styling
  5. All images, cards, and spacing match decoded.pen specifications
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-05-01-PLAN.md — Home page mobile/desktop layouts with decoded.pen styling [Wave 1]
- [x] v2-05-02-PLAN.md — Explore page with category filters and fade transitions [Wave 1]
- [x] v2-05-03-PLAN.md — Card integration for Home and Explore pages [Wave 2]

### v2-Phase 6: Feed & Profile Pages
**Goal**: Content streams and user profiles render with decoded.pen design, maintaining all existing functionality
**Depends on**: v2-Phase 5
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria** (what must be TRUE):
  1. User sees feed page with Things Grid displaying posts in decoded.pen card style
  2. User on desktop sees feed in multi-column layout, mobile sees single column
  3. User viewing profile sees ProfileHeaderCard with stats, avatar, and actions
  4. User can switch between profile activity tabs (Posts, Spots, Solutions, Saved)
  5. Feed cards support engagement actions (like, comment, share) with design system styling
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-06-01-PLAN.md — Feed page with responsive grid and decoded.pen card styling [Wave 1]
- [x] v2-06-02-PLAN.md — Profile page with 2-column desktop layout and ProfileHeaderCard [Wave 1]
- [x] v2-06-03-PLAN.md — Activity tabs with fade transitions and engagement actions [Wave 2]

### v2-Phase 7: Search & Image Detail
**Goal**: Search and detailed content views match decoded.pen design with functional interactions
**Depends on**: v2-Phase 6
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, IMG-01, IMG-02, IMG-03, IMG-04
**Success Criteria** (what must be TRUE):
  1. User can search via SearchInput component with decoded.pen styling
  2. User sees search results filtered by SearchTabs (All, Posts, Items, Users)
  3. User viewing image detail sees full-size image with metadata and related items
  4. Scroll actions trigger animations matching decoded.pen specifications
  5. Desktop and mobile layouts adapt correctly for both search and image detail pages
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-07-01-PLAN.md — Search overlay with recent searches and sliding tab underline [Wave 1]
- [x] v2-07-02-PLAN.md — Image Detail with decoded.pen hero, parallax, and lightbox [Wave 1]
- [x] v2-07-03-PLAN.md — Item Cards and related content grid integration [Wave 2]

### v2-Phase 8: Request Flow & Login
**Goal**: Multi-step request flow and authentication pages render with decoded.pen design
**Depends on**: v2-Phase 7
**Requirements**: REQ-01, REQ-02, REQ-03, REQ-04, AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):
  1. User can upload image in Request Upload page with decoded.pen form styling
  2. User sees AI detection results in Request Detection page
  3. User can fill item details in Request Details page
  4. Page transitions between request flow steps use smooth animations
  5. Login page (mobile and desktop) matches decoded.pen auth screen design
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-08-01-PLAN.md — Request flow UI updates (3-step indicator, header, DropZone, Submit in Details) [Wave 1]
- [x] v2-08-02-PLAN.md — Page transition animations for request flow [Wave 2]
- [x] v2-08-03-PLAN.md — Login page OAuth simplification (Google only) [Wave 1]

### v2-Phase 9: Documentation & Polish
**Goal**: Design system is fully documented and all visual issues are resolved
**Depends on**: v2-Phase 8
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04
**Success Criteria** (what must be TRUE):
  1. docs/design-system/ contains design tokens documentation with usage examples
  2. specs/ component spec files are updated with v2.0 design implementation notes
  3. .planning/codebase/ analysis reflects new design system structure
  4. CLAUDE.md includes design system import paths and usage guidelines
  5. All pages display consistently with decoded.pen on mobile and desktop breakpoints
**Plans:** 3 plans (2 waves)

Plans:
- [x] v2-09-01-PLAN.md — Design system documentation (tokens, components, patterns) [Wave 1]
- [x] v2-09-02-PLAN.md — Codebase docs, CLAUDE.md, and specs update [Wave 1]
- [ ] v2-09-03-PLAN.md — Visual QA with Playwright screenshots and polish [Wave 2] ⏸️ Deferred to v2.1

## Progress

**Execution Order:**
v2-Phases execute sequentially: v2-Phase 1 → v2-Phase 2 → ... → v2-Phase 9

**Branch Strategy:**
- v2.0 work happens on `feature/v2-design-overhaul` branch
- Parallel to v1.1 milestone (separate branch)
- Merge to main after v1.1 complete or coordinate merge strategy

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| v2-1. Design System Foundation | 3/3 | **Complete** | 2026-01-29 |
| v2-2. Core Interactive Components | 3/3 | **Complete** | 2026-01-29 |
| v2-3. Card Components | 3/3 | **Complete** | 2026-01-29 |
| v2-4. Desktop Infrastructure | 3/3 | **Complete** | 2026-01-29 |
| v2-5. Home & Explore Pages | 3/3 | **Complete** | 2026-01-29 |
| v2-6. Feed & Profile Pages | 3/3 | **Complete** | 2026-01-29 |
| v2-7. Search & Image Detail | 3/3 | **Complete** | 2026-02-05 |
| v2-8. Request Flow & Login | 3/3 | **Complete** | 2026-02-05 |
| v2-9. Documentation & Polish | 2/3 | **Complete** | 2026-02-05 |

---

*Created: 2026-01-29*
*Last updated: 2026-02-05 (Phase v2-9 planned)*
