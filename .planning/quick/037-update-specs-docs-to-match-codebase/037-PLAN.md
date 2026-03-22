---
phase: quick-037
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - README.md
  - CLAUDE.md
  - .planning/codebase/STACK.md
  - .planning/codebase/STRUCTURE.md
  - .planning/codebase/CONVENTIONS.md
  - docs/design-system/README.md
  - docs/design-system/components/README.md
autonomous: true

must_haves:
  truths:
    - "All version numbers in README.md and CLAUDE.md match actual package.json values"
    - "Directory structure in README.md reflects actual packages/web/ layout, not legacy src/ paths"
    - "All 35 design system components are listed in CLAUDE.md and docs"
    - "All 18 hooks are documented in CLAUDE.md"
    - "All 7 stores are listed in CLAUDE.md"
    - "All API routes are listed in CLAUDE.md"
    - "v2.0 status shows Shipped (100%) not 78%"
    - "README.md uses node-modules linker description, not PnP"
  artifacts:
    - path: "README.md"
      provides: "Accurate project overview with correct versions and structure"
    - path: "CLAUDE.md"
      provides: "Complete development guidelines reflecting actual codebase"
    - path: ".planning/codebase/STACK.md"
      provides: "Updated design system component count"
    - path: ".planning/codebase/STRUCTURE.md"
      provides: "Updated directory listing with all design-system files"
    - path: "docs/design-system/components/README.md"
      provides: "Complete component index with all 35 components"
  key_links:
    - from: "README.md"
      to: "packages/web/package.json"
      via: "version numbers match"
      pattern: "Next.js 16\\.0\\.7"
    - from: "CLAUDE.md"
      to: "lib/design-system/"
      via: "component list matches actual files"
      pattern: "35 components"
---

<objective>
Sync all documentation files (README.md, CLAUDE.md, .planning/codebase/, docs/design-system/) with the actual codebase state.

Purpose: Documentation has drifted significantly from reality -- wrong versions, wrong directory structure, missing components/hooks/stores. This makes onboarding and AI assistance unreliable.
Output: All documentation files accurately reflect the current codebase.
</objective>

<execution_context>
@/Users/kiyeol/.claude-pers/get-shit-done/workflows/execute-plan.md
@/Users/kiyeol/.claude-pers/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@README.md
@.planning/codebase/STACK.md
@.planning/codebase/STRUCTURE.md
@.planning/codebase/CONVENTIONS.md
@docs/design-system/README.md
@docs/design-system/components/README.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix README.md -- correct versions, structure, and Yarn mode</name>
  <files>README.md</files>
  <action>
  Rewrite README.md to fix all inaccuracies:

  **Tech Stack section** -- Replace ALL version numbers with actuals:
  - Next.js 16.0.7, React 18.3.1, TypeScript 5.9.3
  - Tailwind CSS 3.4.18, Zustand 4.5.7, React Query 5.90.11
  - Playwright 1.58.1
  - Yarn 4.9.2 (node-modules linker)

  **Project Structure section** -- Replace the entire `src/` tree with the actual structure:
  ```
  packages/web/
  ├── app/                    # Next.js App Router pages
  │   ├── @modal/             # Parallel route for modals
  │   ├── api/v1/             # API routes
  │   ├── explore/            # Explore grid view
  │   ├── feed/               # Social feed
  │   ├── images/             # Image discovery & detail
  │   ├── login/              # OAuth authentication
  │   ├── posts/              # Post detail
  │   ├── profile/            # User profile
  │   ├── request/            # Upload & AI detection flow
  │   ├── search/             # Full-screen search overlay
  │   └── lab/                # Experimental features
  ├── lib/
  │   ├── api/                # API client functions
  │   ├── components/         # Feature-based components
  │   ├── design-system/      # v2.0 Design System (35 components)
  │   ├── hooks/              # Custom React hooks
  │   ├── stores/             # Zustand state stores
  │   ├── supabase/           # Supabase client + queries
  │   └── utils/              # Utility functions
  └── __tests__/              # Test files

  packages/shared/            # Shared types, hooks, utilities
  ```

  **Package Management section** -- Replace the entire "Yarn Berry PnP" section:
  - Title: "Package Management: Yarn 4 (node-modules)"
  - Remove all PnP-specific claims (Zero-Install, .pnp.cjs, no node_modules, etc.)
  - State: Uses Yarn 4.9.2 with `nodeLinker: node-modules` in `.yarnrc.yml`
  - Keep: "Never use npm", "Use yarn commands"
  - Remove: ZipFS extension recommendation, "no node_modules directory" claim
  - Remove: PnP mode configuration details, Zero-Install bullet points

  Keep everything else (Quick Start, Remote Development, AI Dev Boilerplate sections) as-is. Do NOT add emojis beyond what already exists.
  </action>
  <verify>
  Grep README.md for:
  - No "src/" directory references
  - No "PnP" references (except possibly in generic Yarn context)
  - "16.0.7" appears for Next.js
  - "18.3.1" appears for React
  - "node-modules" appears for linker
  - No "pnp" in nodeLinker context
  </verify>
  <done>README.md has correct package versions, actual directory structure, and accurate Yarn configuration (node-modules linker, not PnP).</done>
</task>

<task type="auto">
  <name>Task 2: Update CLAUDE.md -- complete component/hook/store/route inventory</name>
  <files>CLAUDE.md</files>
  <action>
  Update CLAUDE.md with the following specific changes:

  **1. Project Structure tree** -- Fix the wrong path `design-system/` under `components/`:
  - Change `│   │   ├── design-system/  # v2.0 Design System` to remove it from under components/
  - The tree already correctly shows `lib/design-system/` separately, but the components/ subtree incorrectly lists it. Remove that line from the components/ section.
  - Add missing component directories under components/:
    - `dome/` (dome experiment)
    - `fashion-scan/` (AI fashion detection)
    - `shared/` (shared components)

  **2. v2.0 Design Overhaul Status** -- Change:
  - FROM: `### v2.0 Design Overhaul Status (78% Complete)`
  - TO: `### v2.0 Design Overhaul (Shipped)`
  - Update the bullet list to reflect completion, not WIP

  **3. Import Path example** -- Add the missing components to the import example:
  ```typescript
  import {
    // Typography
    Heading, Text,
    // Inputs
    Input, SearchInput,
    // Cards
    Card, CardHeader, CardContent, CardFooter, CardSkeleton,
    ProductCard, GridCard, FeedCardBase, ProfileHeaderCard,
    ArtistCard, SpotCard, SpotDetail, ShopCarouselCard,
    StatCard, RankingItem, LeaderItem, SkeletonCard,
    // Navigation & Layout
    DesktopHeader, MobileHeader, DesktopFooter,
    NavBar, NavItem, SectionHeader,
    // Buttons & Actions
    ActionButton, OAuthButton, GuestButton,
    // Indicators & Feedback
    Tag, Badge, Divider, Tabs, StepIndicator,
    LoadingSpinner, LoginCard, BottomSheet, Hotspot,
    // Tokens
    typography, colors, spacing, shadows, borderRadius, zIndex
  } from "@/lib/design-system"
  ```

  **4. Component List table** -- Replace the existing table with complete 35-component list:

  | Component | File | Purpose |
  |-----------|------|---------|
  | **tokens.ts** | tokens.ts | Design tokens (colors, spacing, typography, shadows) |
  | **Heading, Text** | typography.tsx | Typography with responsive size variants |
  | **Input, SearchInput** | input.tsx | Form inputs with CVA variants |
  | **Card, CardHeader, CardContent, CardFooter, CardSkeleton** | card.tsx | Base card with composable slots |
  | **ProductCard** | product-card.tsx | Product display card |
  | **GridCard** | grid-card.tsx | Grid layout card |
  | **FeedCardBase** | feed-card.tsx | Social feed card |
  | **ProfileHeaderCard** | profile-header-card.tsx | Profile header card |
  | **ArtistCard** | artist-card.tsx | Artist/celebrity card |
  | **SpotCard** | spot-card.tsx | Detected item spot card |
  | **SpotDetail** | spot-detail.tsx | Spot detail panel |
  | **ShopCarouselCard** | shop-carousel-card.tsx | Shop carousel item |
  | **StatCard** | stat-card.tsx | Statistics display card |
  | **RankingItem** | ranking-item.tsx | Ranking list item |
  | **LeaderItem** | leader-item.tsx | Leaderboard item |
  | **SkeletonCard** | skeleton-card.tsx | Generic skeleton loader |
  | **DesktopHeader** | desktop-header.tsx | Desktop navigation header |
  | **MobileHeader** | mobile-header.tsx | Mobile navigation header |
  | **DesktopFooter** | desktop-footer.tsx | Desktop footer |
  | **NavBar** | nav-bar.tsx | Navigation bar |
  | **NavItem** | nav-item.tsx | Navigation item |
  | **SectionHeader** | section-header.tsx | Section header with title |
  | **ActionButton** | action-button.tsx | Action button with variants |
  | **OAuthButton** | oauth-button.tsx | OAuth provider button |
  | **GuestButton** | guest-button.tsx | Guest login button |
  | **Tag** | tag.tsx | Tag/chip component |
  | **Badge** | badge.tsx | Badge/indicator |
  | **Divider** | divider.tsx | Section divider |
  | **Tabs** | tabs.tsx | Tab navigation |
  | **StepIndicator** | step-indicator.tsx | Multi-step progress |
  | **LoadingSpinner** | loading-spinner.tsx | Loading indicator |
  | **LoginCard** | login-card.tsx | Login card UI |
  | **BottomSheet** | bottom-sheet.tsx | Bottom sheet drawer |
  | **Hotspot** | hotspot.tsx | Interactive spot marker with brand colors |

  **5. Custom Hooks section** -- Add missing hooks:
  Under "Data Fetching":
  - `useItems()` - Fetch items for posts
  - `useNormalizedItems()` - Normalize item data structure
  - `useSolutions()` - Fetch solutions for items
  - `useSpots()` - Fetch spot data for images

  Under "UI & Animation":
  - `useSpotCardSync()` - Sync spot selection with card UI
  - `useDebounce()` - Debounce value changes

  **6. Key File Locations table** -- Add missing stores:
  - **Filter State** | `lib/stores/filterStore.ts` | Category and filter state
  - **Transition State** | `lib/stores/transitionStore.ts` | Page transition state

  **7. API Routes section** -- Update `app/api/v1/` description in the Project Structure tree comment to "(posts, solutions, users, categories, spots)" instead of "(posts, users, categories)".

  Also add a new section "### API Routes" after "Key File Locations" with the complete route list:

  | Route | Methods | Description |
  |-------|---------|-------------|
  | `/api/v1/posts` | GET | List posts with pagination |
  | `/api/v1/posts/with-solution` | GET | Posts with solution data |
  | `/api/v1/posts/extract-metadata` | POST | Extract metadata from URL |
  | `/api/v1/posts/analyze` | POST | AI image analysis |
  | `/api/v1/posts/upload` | POST | Upload post image |
  | `/api/v1/posts/[postId]` | GET | Single post detail |
  | `/api/v1/posts/[postId]/spots` | GET/POST | Spots for a post |
  | `/api/v1/solutions/convert-affiliate` | POST | Convert affiliate links |
  | `/api/v1/solutions/[solutionId]` | GET/PATCH | Solution CRUD |
  | `/api/v1/solutions/extract-metadata` | POST | Solution metadata extraction |
  | `/api/v1/users/me` | GET | Current user profile |
  | `/api/v1/users/me/activities` | GET | User activities |
  | `/api/v1/users/me/stats` | GET | User statistics |
  | `/api/v1/users/[userId]` | GET | User by ID |
  | `/api/v1/categories` | GET | Category list |
  | `/api/v1/spots/[spotId]` | GET/PATCH | Spot CRUD |
  | `/api/v1/spots/[spotId]/solutions` | GET/POST | Solutions for spot |

  **8. Update the "Last Updated" comment** at the bottom to `2026-02-12`.
  </action>
  <verify>
  Grep CLAUDE.md for:
  - "Shipped" appears (not "78% Complete")
  - "hotspot.tsx" appears (new component)
  - "useSpots" appears (new hook)
  - "filterStore" appears in Key File Locations
  - "/api/v1/solutions" appears (new route section)
  - "dome/" appears (new component directory)
  - "fashion-scan/" appears (component directory)
  - "shared/" appears (component directory)
  - No "design-system/" listed under `components/` subtree
  - Count of component table rows is 34 (35 files minus index.ts)
  </verify>
  <done>CLAUDE.md has complete inventory: 35 design system components, 18 hooks, 7 stores, 17 API routes, all component directories, and "Shipped" status.</done>
</task>

<task type="auto">
  <name>Task 3: Update .planning/codebase/ and docs/design-system/ component docs</name>
  <files>
    .planning/codebase/STACK.md
    .planning/codebase/STRUCTURE.md
    .planning/codebase/CONVENTIONS.md
    docs/design-system/README.md
    docs/design-system/components/README.md
  </files>
  <action>
  **STACK.md** -- Update the Design System section:
  - Change component library listing to include ALL component categories (not just the original 8):
    - Typography: Heading, Text
    - Inputs: Input, SearchInput
    - Card family: Card+slots, ProductCard, GridCard, FeedCardBase, ProfileHeaderCard, ArtistCard, SpotCard, SpotDetail, ShopCarouselCard, StatCard, RankingItem, LeaderItem, SkeletonCard
    - Navigation: NavBar, NavItem, SectionHeader, DesktopHeader, MobileHeader, DesktopFooter
    - Buttons: ActionButton, OAuthButton, GuestButton
    - Feedback: Tag, Badge, Divider, Tabs, StepIndicator, LoadingSpinner, LoginCard, BottomSheet, Hotspot
  - Add note: "35 components total (including tokens.ts and index.ts)"
  - Update analysis date to 2026-02-12

  **STRUCTURE.md** -- Update the design-system directory listing:
  - Replace the 12-file listing under `lib/design-system/` with ALL 36 files (35 components + index.ts):
    ```
    ├── index.ts                    # Barrel exports
    ├── tokens.ts                   # Design tokens
    ├── typography.tsx              # Heading, Text
    ├── input.tsx                   # Input, SearchInput
    ├── card.tsx                    # Card family (Card, Header, Content, Footer, Skeleton)
    ├── product-card.tsx            # ProductCard
    ├── grid-card.tsx               # GridCard
    ├── feed-card.tsx               # FeedCardBase
    ├── profile-header-card.tsx     # ProfileHeaderCard
    ├── artist-card.tsx             # ArtistCard
    ├── spot-card.tsx               # SpotCard
    ├── spot-detail.tsx             # SpotDetail
    ├── shop-carousel-card.tsx      # ShopCarouselCard
    ├── stat-card.tsx               # StatCard
    ├── ranking-item.tsx            # RankingItem
    ├── leader-item.tsx             # LeaderItem
    ├── skeleton-card.tsx           # SkeletonCard
    ├── desktop-header.tsx          # DesktopHeader
    ├── mobile-header.tsx           # MobileHeader
    ├── desktop-footer.tsx          # DesktopFooter
    ├── nav-bar.tsx                 # NavBar
    ├── nav-item.tsx                # NavItem
    ├── section-header.tsx          # SectionHeader
    ├── action-button.tsx           # ActionButton
    ├── oauth-button.tsx            # OAuthButton
    ├── guest-button.tsx            # GuestButton
    ├── tag.tsx                     # Tag
    ├── badge.tsx                   # Badge
    ├── divider.tsx                 # Divider
    ├── tabs.tsx                    # Tabs
    ├── step-indicator.tsx          # StepIndicator
    ├── loading-spinner.tsx         # LoadingSpinner
    ├── login-card.tsx              # LoginCard
    ├── bottom-sheet.tsx            # BottomSheet
    └── hotspot.tsx                 # Hotspot (spot marker with brand color)
    ```
  - Add missing component directories to `lib/components/`:
    - `dome/` (dome experiment components)
    - `fashion-scan/` (AI fashion detection -- already listed)
    - `shared/` (shared feature components)
  - Add missing hooks to `lib/hooks/` listing:
    - `useItems.ts`, `useNormalizedItems.ts`, `useSolutions.ts`, `useSpots.ts`, `useSpotCardSync.ts`
    - (useDebounce.ts is already listed)
  - Update the Key files section for design-system to reference "35 components" instead of listing only the originals
  - Update analysis date to 2026-02-12

  **CONVENTIONS.md** -- Add to "Design System Component Conventions" section:
  - Add the `brandToColor` utility pattern:
    ```typescript
    // Brand color utility (shared across design system)
    import { brandToColor } from "@/lib/utils/brandToColor"
    // Returns deterministic CSS color for brand name via string hash
    ```
  - Add Hotspot component pattern note:
    ```typescript
    // Hotspot absorbs SpotMarker functionality (single source of truth)
    // SpotMarker is deprecated re-export for backward compatibility
    // Glow effects use CSS custom property --hotspot-color
    ```
  - Update date to 2026-02-12

  **docs/design-system/README.md** -- Update version and add note about v2.1 completion:
  - Change `> Version: 2.0.0` to `> Version: 2.1.0`
  - Change `> Last Updated: 2026-02-05` to `> Last Updated: 2026-02-12`
  - In the overview, add: "v2.1 추가 변경사항: 35개 컴포넌트 라이브러리 완성, Hotspot/SpotCard/ArtistCard 등 도메인 특화 컴포넌트 추가"
  - Add a "v2.1 Components" section to the Components table with links:
    - Navigation: nav-bar.tsx, nav-item.tsx, section-header.tsx
    - Buttons: action-button.tsx, oauth-button.tsx, guest-button.tsx
    - Cards: artist-card.tsx, spot-card.tsx, spot-detail.tsx, shop-carousel-card.tsx, stat-card.tsx, ranking-item.tsx, leader-item.tsx, skeleton-card.tsx
    - Feedback: tag.tsx, badge.tsx, divider.tsx, tabs.tsx, step-indicator.tsx, loading-spinner.tsx, login-card.tsx, bottom-sheet.tsx, hotspot.tsx

  **docs/design-system/components/README.md** -- Add new component categories:
  - Add "### Navigation Components" section with NavBar, NavItem, SectionHeader
  - Add "### Button Components" section with ActionButton, OAuthButton, GuestButton
  - Add "### Domain Cards" section with ArtistCard, SpotCard, SpotDetail, ShopCarouselCard, StatCard, RankingItem, LeaderItem, SkeletonCard
  - Add "### Feedback & Utility" section with Tag, Badge, Divider, Tabs, StepIndicator, LoadingSpinner, LoginCard, BottomSheet, Hotspot
  - Update the "Component File Locations" tree at the bottom to list all 35 files
  - Change version to 2.1.0 and date to 2026-02-12
  </action>
  <verify>
  Check each file:
  - STACK.md: grep for "35 components" and "2026-02-12"
  - STRUCTURE.md: grep for "hotspot.tsx" and "nav-bar.tsx" in design-system listing
  - CONVENTIONS.md: grep for "brandToColor" and "Hotspot"
  - docs/design-system/README.md: grep for "2.1.0" and "Hotspot"
  - docs/design-system/components/README.md: grep for "NavBar" and "Hotspot" and "ActionButton"
  </verify>
  <done>.planning/codebase/ docs reflect 35 design-system components, all hooks, complete directory structure. docs/design-system/ has full component index with all v2.1 additions.</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. `grep -c "src/" README.md` returns 0 (no legacy paths)
2. `grep "16.0.7" README.md` finds Next.js version
3. `grep "Shipped" CLAUDE.md` confirms v2.0 status
4. `grep "hotspot.tsx" CLAUDE.md .planning/codebase/STRUCTURE.md docs/design-system/components/README.md` finds all three
5. `grep "useSpots" CLAUDE.md` confirms hook documented
6. `grep "filterStore" CLAUDE.md` confirms store documented
7. `grep "node-modules" README.md` confirms correct Yarn mode
8. No references to "PnP" in package management context of README.md
</verification>

<success_criteria>
- README.md: Correct versions (Next.js 16.0.7, React 18.3.1), actual directory structure (packages/web/), node-modules linker (not PnP)
- CLAUDE.md: 35 design system components listed, 18 hooks documented, 7 stores listed, 17 API routes documented, v2.0 status "Shipped"
- .planning/codebase/STACK.md: "35 components" noted in design system section
- .planning/codebase/STRUCTURE.md: All 35 design-system files listed, missing component dirs added
- .planning/codebase/CONVENTIONS.md: brandToColor and Hotspot patterns documented
- docs/design-system/: Complete component index with all v2.1 additions
</success_criteria>

<output>
After completion, create `.planning/quick/037-update-specs-docs-to-match-codebase/037-SUMMARY.md`
</output>
