# Codebase Structure

**Analysis Date:** 2026-02-12

## Directory Layout

```
packages/web/
├── app/                      # Next.js App Router pages and API routes
│   ├── @modal/              # Parallel routes for modals (layout slots)
│   ├── api/v1/              # Next.js API proxy routes (/api/v1/posts, /users, etc)
│   ├── debug/               # Debug utilities (supabase debug pages)
│   ├── examples/            # Feature examples (scroll-animation)
│   ├── explore/             # Explore/browse feature
│   ├── feed/                # User feed
│   ├── images/              # Image detail pages ([id])
│   ├── lab/                 # Experimental features (fashion-scan, ascii-text)
│   ├── login/               # Authentication pages
│   ├── posts/               # Post-related pages
│   ├── profile/             # User profile pages
│   ├── request/             # Request submission flow (multi-step form)
│   ├── search/              # Search results page
│   ├── globals.css          # Global styles (Tailwind + custom CSS)
│   ├── layout.tsx           # Root layout wrapping entire app
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # App-level providers (QueryClient, Theme, Auth)
│   └── not-found.tsx        # 404 page
│
├── lib/                      # Shared utilities and components
│   ├── api/                 # API client functions
│   │   ├── client.ts        # Base HTTP client with auth headers
│   │   ├── posts.ts         # POST endpoints (upload, analyze, create post)
│   │   ├── users.ts         # User profile endpoints
│   │   ├── categories.ts    # Category fetching
│   │   ├── types.ts         # API request/response types (DTO)
│   │   └── index.ts         # Public exports
│   │
│   ├── design-system/       # v2.0 Design System primitives (35 components)
│   │   ├── index.ts                    # Barrel exports
│   │   ├── tokens.ts                   # Design tokens
│   │   ├── typography.tsx              # Heading, Text
│   │   ├── input.tsx                   # Input, SearchInput
│   │   ├── card.tsx                    # Card family (Card, Header, Content, Footer, Skeleton)
│   │   ├── product-card.tsx            # ProductCard
│   │   ├── grid-card.tsx               # GridCard
│   │   ├── feed-card.tsx               # FeedCardBase
│   │   ├── profile-header-card.tsx     # ProfileHeaderCard
│   │   ├── artist-card.tsx             # ArtistCard
│   │   ├── spot-card.tsx               # SpotCard
│   │   ├── spot-detail.tsx             # SpotDetail
│   │   ├── shop-carousel-card.tsx      # ShopCarouselCard
│   │   ├── stat-card.tsx               # StatCard
│   │   ├── ranking-item.tsx            # RankingItem
│   │   ├── leader-item.tsx             # LeaderItem
│   │   ├── skeleton-card.tsx           # SkeletonCard
│   │   ├── desktop-header.tsx          # DesktopHeader
│   │   ├── mobile-header.tsx           # MobileHeader
│   │   ├── desktop-footer.tsx          # DesktopFooter
│   │   ├── nav-bar.tsx                 # NavBar
│   │   ├── nav-item.tsx                # NavItem
│   │   ├── section-header.tsx          # SectionHeader
│   │   ├── action-button.tsx           # ActionButton
│   │   ├── oauth-button.tsx            # OAuthButton
│   │   ├── guest-button.tsx            # GuestButton
│   │   ├── tag.tsx                     # Tag
│   │   ├── badge.tsx                   # Badge
│   │   ├── divider.tsx                 # Divider
│   │   ├── tabs.tsx                    # Tabs
│   │   ├── step-indicator.tsx          # StepIndicator
│   │   ├── loading-spinner.tsx         # LoadingSpinner
│   │   ├── login-card.tsx              # LoginCard
│   │   ├── bottom-sheet.tsx            # BottomSheet
│   │   └── hotspot.tsx                 # Hotspot (spot marker with brand color)
│   │
│   ├── components/          # React components organized by feature
│   │   ├── auth/            # Auth components (AuthProvider, LoginCard, OAuthButton)
│   │   ├── detail/          # Image/Post detail components
│   │   │   ├── ImageDetailContent.tsx      # Main image display
│   │   │   ├── ImageDetailModal.tsx        # Modal wrapper
│   │   │   ├── ImageCanvas.tsx             # Interactive image overlay
│   │   │   ├── RelatedImages.tsx           # "More from this" gallery
│   │   │   ├── ShopGrid.tsx                # Product grid
│   │   │   └── ... (18 files total)
│   │   ├── explore/         # Explore page components
│   │   ├── search/          # Search page components
│   │   ├── feed/            # Feed components
│   │   ├── profile/         # Profile page components
│   │   ├── request/         # Multi-step request form
│   │   ├── fashion-scan/    # AI fashion detection
│   │   ├── dome/            # Dome experiment
│   │   ├── shared/          # Shared components
│   │   ├── main/            # Home page sections
│   │   ├── ui/              # Base UI components (buttons, cards, etc)
│   │   ├── ConditionalNav.tsx       # Responsive header/nav
│   │   ├── MobileNavBar.tsx         # Mobile navigation
│   │   ├── FeedCard.tsx             # Card component
│   │   └── index.ts         # Public component exports
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useImages.ts             # Image fetching (infinite scroll)
│   │   ├── usePosts.ts              # Post queries
│   │   ├── useProfile.ts            # User profile data
│   │   ├── useSearch.ts             # Search logic
│   │   ├── useSearchURLSync.ts      # Sync search to URL params
│   │   ├── useImageUpload.ts        # Upload progress tracking
│   │   ├── useCreatePost.ts         # Request submission flow
│   │   ├── useItems.ts              # Item fetching
│   │   ├── useNormalizedItems.ts    # Item normalization
│   │   ├── useSolutions.ts          # Solution queries
│   │   ├── useSpots.ts              # Spot data fetching
│   │   ├── useSpotCardSync.ts       # Spot card selection sync
│   │   ├── useMediaQuery.ts         # Responsive breakpoints
│   │   ├── useScrollAnimation.ts    # GSAP scroll animations
│   │   ├── useDebounce.ts           # Debounce utility
│   │   └── debug/           # Debug hooks
│   │
│   ├── stores/              # Zustand state management
│   │   ├── authStore.ts             # User auth state + OAuth
│   │   ├── requestStore.ts          # Multi-step request form state (1-4)
│   │   ├── profileStore.ts          # User profile state
│   │   ├── filterStore.ts           # Filter/category state
│   │   ├── searchStore.ts           # Search UI state
│   │   ├── transitionStore.ts       # Page transition state
│   │   └── example-store.ts         # Template for new stores
│   │
│   ├── supabase/            # Supabase database & auth
│   │   ├── client.ts                # Browser Supabase client (typed)
│   │   ├── server.ts                # Server Supabase client
│   │   ├── env.ts                   # Environment variable validation
│   │   ├── init.ts                  # Supabase client initialization
│   │   ├── storage.ts               # File storage operations
│   │   ├── types.ts                 # Auto-generated DB schema types
│   │   └── queries/         # Server-side query functions
│   │       ├── main-page.server.ts  # Home page queries
│   │       ├── search.server.ts     # Search queries
│   │       ├── explore.server.ts    # Explore queries
│   │       └── debug/       # Debug utilities
│   │
│   ├── react-query/         # React Query configuration
│   │   └── client.ts                # QueryClient singleton with defaults
│   │
│   ├── utils/               # Utility functions
│   │   ├── validation.ts            # UPLOAD_CONFIG (file size/type limits)
│   │   ├── imageCompression.ts      # Image preview URL creation
│   │   ├── main-page-mapper.ts      # DTO -> UI data transformers
│   │   └── ... (other utilities)
│   │
│   ├── data/                # Static data (constants, enums)
│   │
│   ├── design-system/       # Design tokens & UI primitives
│   │   └── ... (design system components)
│   │
│   └── react-query/         # React Query setup
│
├── public/                  # Static assets
├── .next/                   # Next.js build output (git-ignored)
├── node_modules/            # Dependencies (git-ignored)
│
├── tsconfig.json            # TypeScript config (paths: @/*, @decoded/shared/*)
├── next.config.js           # Next.js config
├── tailwind.config.ts       # Tailwind CSS config
├── package.json             # Dependencies & scripts
├── eslint.config.mjs        # ESLint rules
└── .prettierrc              # Prettier formatting rules
```

## Directory Purposes

**app/ - Next.js Pages & Routes:**
- Purpose: Server-side page components and API route handlers
- Contains: Page layouts, server-side queries, metadata
- Key files: `layout.tsx`, `providers.tsx`, `page.tsx`, `api/v1/*/route.ts`

**lib/components/ - React Components:**
- Purpose: Reusable UI components organized by feature domain
- Contains: Interactive components, animations, form controls
- Key files: Feature folders (explore/, detail/, search/), ui/ base components
- Organization: Each feature folder is self-contained (explore page owns its components)

**lib/hooks/ - Custom Hooks:**
- Purpose: Business logic encapsulation and state management
- Contains: React Query hooks, Zustand store selectors, DOM interactions
- Key files: useImages.ts (infinite scroll), useSearch.ts, useProfile.ts
- Pattern: Each hook is single-responsibility, can be composed

**lib/stores/ - State Management:**
- Purpose: Client-side state (auth, forms, UI state)
- Contains: Zustand store definitions with actions and selectors
- Key files: authStore.ts, requestStore.ts (complex 4-step form)
- Pattern: Stores export both hooks (useStore) and selectors (selectUser)

**lib/api/ - API Client Functions:**
- Purpose: Typed HTTP communication with backend API
- Contains: Fetch functions, error handling, auth token injection
- Key files: client.ts (base HTTP), posts.ts (upload/analyze), users.ts
- Pattern: Each function handles one API endpoint, returns typed response

**lib/supabase/ - Database Access:**
- Purpose: Supabase client initialization and server-side queries
- Contains: Typed Supabase client, query functions, RLS-secured data access
- Key files: client.ts (browser), server.ts (SSR), queries/* (feature queries)
- Pattern: Queries return typed rows, used in both server components and React Query

**lib/utils/ - Utilities:**
- Purpose: Pure functions and constants
- Contains: Validators, formatters, mappers, helpers
- Key files: validation.ts (upload rules), main-page-mapper.ts (data transform)
- Pattern: Utilities are imported as needed, no state mutations

**lib/design-system/ - v2.0 Design System:**
- Purpose: Primitive UI components with centralized design tokens
- Contains: 35 components total including tokens and barrel exports
- Component categories:
  - Typography: `Heading`, `Text` with responsive size variants
  - Inputs: `Input`, `SearchInput` with CVA variants
  - Card family: Base `Card` + composable parts (Header, Content, Footer, Skeleton) + specialized cards (ProductCard, GridCard, FeedCardBase, ProfileHeaderCard, ArtistCard, SpotCard, SpotDetail, ShopCarouselCard, StatCard, RankingItem, LeaderItem, SkeletonCard)
  - Navigation: `NavBar`, `NavItem`, `SectionHeader`, `DesktopHeader`, `MobileHeader`, `DesktopFooter`
  - Buttons: `ActionButton`, `OAuthButton`, `GuestButton`
  - Feedback: `Tag`, `Badge`, `Divider`, `Tabs`, `StepIndicator`, `LoadingSpinner`, `LoginCard`, `BottomSheet`, `Hotspot`
- Pattern:
  - CVA (Class Variance Authority) for variant management
  - Barrel exports from `index.ts` → `import { Card } from "@/lib/design-system"`
  - Props naming: `ComponentNameProps` (e.g., `ProductCardProps`)
  - Skeleton naming: `ComponentNameSkeleton` (e.g., `CardSkeleton`)
  - Brand color utility: `brandToColor` for deterministic color via string hash
- Relationship with `lib/components/ui/`:
  - Design system = primitive tokens + base components
  - UI folder = feature-agnostic reusable components (may compose design-system)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout wrapping entire app with providers
- `app/providers.tsx`: App-level provider initialization (React Query, Theme, Auth)
- `app/page.tsx`: Home page entry point
- `app/providers.tsx`: Client providers configuration

**Authentication:**
- `lib/stores/authStore.ts`: Zustand store for user state
- `lib/components/auth/AuthProvider.tsx`: Subscribes to auth changes
- `lib/components/auth/OAuthButton.tsx`: OAuth login UI
- `lib/api/client.ts`: Injects auth token in API requests

**Data Fetching:**
- `lib/hooks/useImages.ts`: Infinite scroll for images
- `lib/hooks/usePosts.ts`: Post queries with React Query
- `lib/api/posts.ts`: Upload, analyze, create POST endpoints
- `lib/supabase/queries/main-page.server.ts`: SSR data loading

**Request Submission (4-Step):**
- `lib/stores/requestStore.ts`: State machine for 4-step workflow
- `lib/hooks/useImageUpload.ts`: Upload progress tracking
- `lib/hooks/useCreatePost.ts`: Form submission + API calls
- `app/request/`: Request form pages

**Image Detail View:**
- `app/images/[id]/page.tsx`: Full-screen detail page
- `app/@modal/(.)images/[id]/page.tsx`: Modal intercepted route
- `lib/components/detail/ImageDetailContent.tsx`: Main detail view
- `lib/components/detail/RelatedImages.tsx`: Related items gallery

**Search:**
- `app/search/page.tsx`: Server page component (parse URL params)
- `app/search/SearchPageClient.tsx`: Client component (infinite scroll, filters)
- `lib/hooks/useSearch.ts`: Search logic and state
- `lib/hooks/useInfiniteFilteredImages`: Cursor-based pagination

**Profile:**
- `app/profile/page.tsx`: User profile page
- `lib/stores/profileStore.ts`: Profile state
- `lib/hooks/useProfile.ts`: Profile data fetching

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `ImageDetailContent.tsx`, `AuthProvider.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useImages.ts`, `useSearch.ts`)
- Utils/Functions: camelCase (e.g., `imageCompression.ts`, `validation.ts`)
- Stores: camelCase with `Store` suffix (e.g., `authStore.ts`, `requestStore.ts`)
- API functions: camelCase with `api` in module (e.g., `posts.ts`, `users.ts`)

**Directories:**
- Feature folders: lowercase (e.g., `explore/`, `detail/`, `search/`, `profile/`)
- Nested components: PascalCase in component names only
- Utilities: lowercase (e.g., `utils/`, `hooks/`, `stores/`)

**Variables & Functions:**
- Store hooks: `useAuthStore`, `useRequestStore` (Zustand naming)
- Selectors: `selectUser`, `selectIsLoading` (select prefix)
- React Query hooks: `useInfiniteFilteredImages`, `useImageById`
- Constants: SCREAMING_SNAKE_CASE (e.g., `UPLOAD_CONFIG`, `API_BASE_URL`)
- Event handlers: `handleClick`, `handleChange`, `onSubmit`

**Types & Interfaces:**
- PascalCase (e.g., `User`, `ImageDetail`, `UploadResponse`)
- Prefix for enums: `RequestStep`, `UploadStatus`
- Interfaces ending in `State` for Zustand (e.g., `AuthState`, `RequestState`)

## Where to Add New Code

**New Feature (e.g., "Wishlist"):**
- Primary code: `lib/components/wishlist/` (components for the feature)
- State: `lib/stores/wishlistStore.ts` (Zustand store)
- Hooks: `lib/hooks/useWishlist.ts` (data fetching/logic)
- API: `lib/api/wishlist.ts` (endpoint functions)
- Pages: `app/wishlist/page.tsx` (routes for the feature)
- Tests: `./__tests__/wishlist/` (feature tests)

**New Component/Module (e.g., "WishlistCard"):**
- Location: `lib/components/[feature]/WishlistCard.tsx`
- If shared across features: `lib/components/ui/WishlistCard.tsx`
- Props file: Same file as component (inline interface definition)

**Utilities:**
- Shared helpers: `lib/utils/[name].ts`
- If logic-heavy: Create dedicated utils file, import in hooks
- Data mappers: `lib/utils/[feature]-mapper.ts`

**API Endpoints:**
- Client functions: `lib/api/[feature].ts`
- Types: `lib/api/types.ts` (all API types in one file)
- New route: `app/api/v1/[feature]/route.ts` (if proxy needed)

**Server Queries:**
- Location: `lib/supabase/queries/[feature].server.ts`
- Used by: Server components in `app/[feature]/page.tsx`
- Pattern: Export async functions returning typed rows

**Stores:**
- Location: `lib/stores/[feature]Store.ts`
- Template: Copy from `lib/stores/example-store.ts`
- Exports: Both hook (useFeatureStore) and selectors (selectX)

## Special Directories

**@modal/ (Parallel Routes):**
- Purpose: Modal/intercepted routes for full-screen overlays
- Generated: No (hand-written)
- Committed: Yes
- Pattern: `@modal/(.)path/` intercepts `/path/` from child routes

**.next/ (Build Output):**
- Purpose: Next.js build artifacts
- Generated: Yes (yarn build)
- Committed: No (.gitignore)

**node_modules/ (Dependencies):**
- Purpose: Installed packages
- Generated: Yes (yarn install)
- Committed: No (.gitignore)

**lib/design-system/ (Design System):**
- Purpose: Reusable UI primitives from design spec
- Generated: Partially (shadcn/ui generators create base, then customized)
- Committed: Yes

---

*Structure analysis: 2026-02-05*
