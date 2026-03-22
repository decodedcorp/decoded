# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** Layered Full-Stack Next.js Application with Feature-Based Component Organization

**Key Characteristics:**
- **Client-Server Separation**: Next.js App Router with server-side page components and client-side interactive features
- **Multi-Layer State Management**: Zustand for client state, React Query for server state with Supabase as primary data source
- **Feature-Based Component Organization**: Components grouped by feature domains (explore, search, detail, profile, etc.)
- **Monorepo Structure**: Shared packages (`@decoded/shared`) for cross-platform code, with web-specific implementations in `packages/web`
- **API Proxy Pattern**: Next.js API routes proxy external backend APIs to avoid CORS issues

## Layers

**UI/Presentation Layer:**
- Purpose: React components for user interaction and display
- Location: `lib/components/` (feature-based folders: explore, search, detail, profile, auth, etc.)
- Contains: React components, hooks for UI state, animation logic (GSAP, Motion, Lenis)
- Depends on: Zustand stores, React Query hooks, custom hooks, design system
- Used by: Page components in `app/`

**Component Hierarchy:**
- **Level 1: Design System** (`lib/design-system/`) - Primitive UI components with design tokens
  - Tokens: `tokens.ts` defines spacing, colors, typography, shadows, borderRadius, zIndex
  - Typography: `Heading`, `Text` with responsive variants
  - Inputs: `Input`, `SearchInput` with CVA pattern
  - Cards: Base `Card` + specialized variants (`ProductCard`, `GridCard`, `FeedCardBase`)
  - Layout: `DesktopHeader`, `MobileHeader`, `DesktopFooter`

- **Level 2: Base UI** (`lib/components/ui/`) - Feature-agnostic reusable components
  - Examples: `Button`, `BottomSheet`, modal wrappers
  - May compose design system primitives

- **Level 3: Feature Components** (`lib/components/[feature]/`) - Page-specific implementations
  - Examples: `explore/`, `search/`, `detail/`, `profile/`
  - Compose both design system and base UI components

**Design Token Flow:**
```
tokens.ts → Tailwind config → globals.css → components
```
- `tokens.ts` exports TypeScript constants
- Tailwind config reads tokens for theme customization
- `globals.css` defines CSS variables for runtime theming
- Components reference via Tailwind utility classes

**State Management Layer:**
- Purpose: Client state (user auth, form state) and server state (cached API responses)
- Location: `lib/stores/` (Zustand) and React Query client (`lib/react-query/`)
- Contains:
  - `authStore.ts`: User authentication and OAuth session
  - `requestStore.ts`: Multi-step request flow (image upload → AI detection → details → submit)
  - `profileStore.ts`: User profile state
  - `filterStore.ts`: Filter/search state
  - `searchStore.ts`: Search UI state
- Depends on: Supabase browser client, API client functions
- Used by: Components, hooks, pages

**Data Fetching/API Layer:**
- Purpose: Centralized API communication
- Location: `lib/api/` (client functions) and `app/api/v1/` (Next.js proxy routes)
- Contains:
  - `client.ts`: HTTP client with auth header injection
  - `posts.ts`: Post/image upload, analysis, metadata extraction
  - `users.ts`: User profile and activity queries
  - `categories.ts`: Category/taxonomy fetching
- Depends on: Supabase browser client, auth tokens
- Used by: React Query hooks, server-side queries

**Database/Query Layer:**
- Purpose: Direct Supabase queries for server-side rendering and data loading
- Location: `lib/supabase/queries/` (feature: main-page, search, explore, etc.)
- Contains:
  - Server query functions with RLS row-level security
  - Cursor-based pagination for infinite scroll
  - Type-safe queries using generated TypeScript types from `types.ts`
- Depends on: Supabase server client
- Used by: Server-side page components, server functions

**Infrastructure Layer:**
- Purpose: External service clients and configuration
- Location: `lib/supabase/` and `lib/react-query/`
- Contains:
  - `client.ts`: Supabase browser client with typed Database schema
  - `server.ts`: Supabase server client for SSR/SSG
  - React Query client singleton with default caching strategy
  - Theme provider (next-themes)
- Depends on: Environment variables
- Used by: All layers

## Data Flow

**User Authentication Flow:**

1. **App Boot**: `AppProviders` (in `app/providers.tsx`) initializes Supabase client and establishes auth subscription
2. **AuthProvider**: `AuthProvider` component (in `lib/components/auth/`) calls `useAuthStore.initialize()`
3. **Session Check**: `authStore.initialize()` calls `supabaseBrowserClient.auth.getSession()`
4. **Subscription**: `AuthProvider` subscribes to `onAuthStateChange` events
5. **State Update**: OAuth login triggers `SIGNED_IN` event → `setUser()` → store state updated
6. **Redirect**: OAuth flow redirects back to home after successful login

**Image Discovery Flow (Infinite Scroll):**

1. **Page Load**: `SearchPageClient` or explore page mounts with `useInfiniteFilteredImages` hook
2. **Query Execution**: React Query calls `fetchUnifiedImages()` with cursor and filter parameters
3. **Supabase Fetch**: Query fetches from `images` + `posts` tables with cursor-based pagination
4. **Cache**: React Query caches result with staleTime=60s, gcTime=5min
5. **User Scroll**: IntersectionObserver triggers `fetchNextPage()`
6. **Page Load**: Next cursor fetched, previous results merged with new results (deduplicatedByImageId)

**Request (Detection) Flow:**

1. **Step 1 - Upload**: User selects images → added to `requestStore.images` with preview URLs
2. **Step 2 - Detection**: `useCreatePost()` hook calls `analyzeImage()` API
3. **AI Response**: Backend returns detected items/spots → stored in `requestStore.detectedSpots`
4. **Step 3 - Details**: User edits metadata → stored in `requestStore` state
5. **Step 4 - Submit**: `createPost()` API called with collected data
6. **Confirmation**: Success updates user's profile via invalidation of related queries

**Modal/Detail Page Flow:**

1. **Modal Route**: App uses parallel routes (`@modal/(.)images/[id]`) for image detail modal
2. **Modal Query**: `useImageById()` React Query hook fetches `ImageDetail` from Supabase
3. **Related Images**: `useRelatedImagesByAccount()` fetches related items from same account
4. **Full Page**: User can click through to full `/images/[id]` page (different route)
5. **Context Retention**: Query cache preserves data when toggling between modal and full page

**State Management:**

**Zustand Stores**: Synchronous client-side state
- `authStore`: OAuth session, user identity
- `requestStore`: Multi-step form progression
- `profileStore`: Cached user profile/preferences

**React Query**: Asynchronous server-state caching
- Query keys: `["images", "infinite", {...params}]` for structured cache invalidation
- Stale time: 1 minute for most queries (data considered fresh)
- GC time: 5 minutes (cached data deleted after 5min of inactivity)
- Manual invalidation: After create/update operations to refetch affected queries

## Key Abstractions

**Request Store (Multi-Step Form State):**
- Purpose: Encapsulate complex request creation workflow
- Examples: `lib/stores/requestStore.ts`
- Pattern: Single Zustand store manages all 4 request steps, prevents invalid state transitions
- Actions: `addImage()`, `detectItems()`, `updateMetadata()`, `submitRequest()`

**API Client Functions:**
- Purpose: Typed, error-handled API communication
- Examples: `lib/api/posts.ts`, `lib/api/users.ts`, `lib/api/categories.ts`
- Pattern: Each function handles auth token injection, FormData serialization, error parsing
- Returns: Typed DTO objects (UploadResponse, CreatePostResponse, etc.)

**React Query Hooks:**
- Purpose: Declarative data fetching with caching and background refetching
- Examples: `lib/hooks/useImages.ts`, `lib/hooks/usePosts.ts`
- Pattern: Hooks map query params to cache keys, pass to query functions from shared package
- State: Provides `isLoading`, `isPending`, `isError`, `data` tuple

**Mapper Functions (DTO → UI Data):**
- Purpose: Transform API/DB responses to component-friendly shapes
- Examples: `lib/utils/main-page-mapper.ts` (imageWithPostToWeeklyBestStyle)
- Pattern: Pure functions that enrich raw data (add computed fields, format dates)
- Usage: Applied in SSR page components before passing to client components

**Component Organization by Feature:**
- Purpose: Logical grouping of UI, hooks, and state related to a feature
- Examples: `lib/components/explore/`, `lib/components/search/`, `lib/components/detail/`
- Pattern: Each feature folder contains related components (no service files)

## Entry Points

**App Root Layout:**
- Location: `app/layout.tsx`
- Triggers: All page navigation
- Responsibilities:
  - Wraps app with `AppProviders` (React Query, Theme, Auth)
  - Renders modal slot for parallel routes
  - Wraps content with `MainContentWrapper` for header/nav spacing
  - Renders footer

**App Providers:**
- Location: `app/providers.tsx` (client component)
- Triggers: Rendered once at app startup
- Responsibilities:
  - Initializes `QueryClientProvider` with default cache settings
  - Initializes `ThemeProvider` (dark/light mode)
  - Initializes `AuthProvider` which subscribes to Supabase auth changes

**Auth Provider:**
- Location: `lib/components/auth/AuthProvider.tsx` (client component)
- Triggers: App boot, auth state changes
- Responsibilities:
  - Calls `useAuthStore.initialize()` to check session on startup
  - Subscribes to `supabaseBrowserClient.auth.onAuthStateChange()`
  - Updates `authStore` when user logs in/out/refreshes token

**Search Page:**
- Location: `app/search/page.tsx` (server) + `SearchPageClient.tsx` (client)
- Triggers: User navigates to `/search?q=...&tab=...`
- Responsibilities:
  - Server: Parses `searchParams`, sets metadata
  - Client: Manages active tab, infinite scroll, filter state
  - Calls `useInfiniteFilteredImages()` for infinite scroll results

**Image Detail Modal:**
- Location: `app/@modal/(.)images/[id]/page.tsx`
- Triggers: User clicks image on any page
- Responsibilities:
  - Intercepts image ID from URL
  - Fetches image detail via `useImageById()`
  - Renders modal overlay with full image and related items

**Image Detail Full Page:**
- Location: `app/images/[id]/page.tsx`
- Triggers: User clicks "View Full" from modal or direct URL
- Responsibilities:
  - Renders full-screen image detail page
  - Fetches related images from same account
  - Renders shop grid, metadata, article content

## Error Handling

**Strategy:** Layered error handling with user-facing toast notifications and console logging

**Patterns:**

**API Layer Errors:**
- Location: `lib/api/` functions
- Pattern: Try-catch wrapping fetch calls, custom error parsing
- Example (from `posts.ts`):
  ```typescript
  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP ${response.status}` };
    }
    throw new Error(errorData.message);
  }
  ```
- Result: Errors propagated to calling code (hooks, components)

**Hook-Level Errors:**
- Location: `lib/hooks/` files
- Pattern: React Query's `useQuery`/`useInfiniteQuery` automatically capture errors
- Usage: Components check `error` property, render fallback UI
- Example: `if (error) return <ErrorBoundary />`

**Store-Level Errors:**
- Location: `lib/stores/` (especially `requestStore.ts`, `authStore.ts`)
- Pattern: Store methods catch errors, set error state, expose `error` selector
- Example: `authStore.logout()` catches sign-out errors → sets `error` state
- Clearing: `authStore.clearError()` called by components after showing toast

**Toast Notifications:**
- Library: `sonner` toast library
- Usage: Called from store actions or component event handlers
- Example: `toast.error("Upload failed")` after image upload error

## Cross-Cutting Concerns

**Logging:**
- Approach: Console.log for development, structured logging deferred
- Patterns:
  - Auth events: `console.log("Auth state changed:", event, session?.user?.email)`
  - API errors: `console.error("Posts GET proxy error:", error)`
  - No production logging provider currently in place

**Validation:**
- Approach: Client-side validation in components/stores, server-side on API routes
- Files:
  - `lib/utils/validation.ts`: UPLOAD_CONFIG constants (file size, type limits)
  - API routes: Validate request body format before processing
- Pattern: Early validation in hooks/stores prevents invalid submissions

**Authentication:**
- Approach: Supabase OAuth (Kakao, Google, Apple) with session-based auth
- Token Injection: `getAuthToken()` in `lib/api/client.ts` retrieves JWT from session
- RLS: Supabase RLS policies on tables (users, posts, items) enforce authorization
- Guest Mode: `authStore.guestLogin()` allows browsing without authentication

**Loading States:**
- UI: Skeleton screens during page load (SearchPageSkeleton in search/page.tsx)
- React Query: `isPending` / `isLoading` used for loading indicators
- Store: `isDetecting`, `isUploading`, `isSubmitting` flags for multi-step workflows
- Animation: Motion library used to animate loading state transitions

**Type Safety:**
- TypeScript strict mode enabled
- Database types: Auto-generated from Supabase schema in `lib/supabase/types.ts`
- API types: Manual DTOs in `lib/api/types.ts` (UploadResponse, CreatePostRequest, etc.)
- Component props: Fully typed with interfaces/generics

---

*Architecture analysis: 2026-02-05*
