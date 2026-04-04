# Key file locations & custom hooks

Paths below are under `packages/web/` unless absolute from repo root.

## Key file locations

| Area               | Location                            | Description                                                  |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| **Auth**           | `lib/stores/authStore.ts`           | OAuth (Kakao, Google, Apple) + session                       |
| **Search State**   | `lib/stores/searchStore.ts`         | Search query, debouncedQuery, filters (category/mediaType/context/sort), page; re-exported from `@decoded/shared` |
| **Filter**         | `lib/stores/filterStore.ts`         | Category filter key (all/fashion/beauty/…); re-exported from `@decoded/shared` |
| **Behavior**       | `lib/stores/behaviorStore.ts`       | Behavioral tracking state                                    |
| **VTON**           | `lib/stores/vtonStore.ts`           | Virtual try-on state                                         |
| **Collection**     | `lib/stores/collectionStore.ts`     | Collection/studio state                                      |
| **Magazine**       | `lib/stores/magazineStore.ts`       | Magazine/editorial state                                     |
| **Active Spot**    | `lib/stores/activeSpotStore.ts`     | Currently selected spot on image canvas                      |
| **Studio**         | `lib/stores/studioStore.ts`         | Studio/collage creation state                                |
| **Request**        | `lib/stores/requestStore.ts`        | Post request/upload flow state                               |
| **Transition**     | `lib/stores/transitionStore.ts`     | Page transition animation state                              |
| **API Client**     | `lib/api/`                          | Backend API calls                                            |
| **API Routes**     | `app/api/v1/`                       | Next.js API proxy & server logic                             |
| **Supabase**       | `lib/supabase/queries/`             | DB queries (events, images, posts, profile, personalization) |
| **Shared Queries** | `packages/shared/supabase/queries/` | Cross-package queries (images, items)                        |
| **Design System**  | `lib/design-system/`                | v2.0 components & tokens                                     |
| **Components**     | `lib/components/`                   | Feature components                                           |
| **Hooks**          | `lib/hooks/`                        | Custom hooks                                                 |
| **Admin Hooks**    | `lib/hooks/admin/`                  | Admin dashboard hooks                                        |
| **Stores**         | `lib/stores/`                       | Zustand stores                                               |
| **Rust API**       | `packages/api-server/`              | Axum REST API, gRPC client to ai-server                      |
| **AI / gRPC**      | `packages/ai-server/`               | Inference, metadata, gRPC (Python)                           |
| **Frontend CI**    | `packages/web/scripts/pre-push.sh`  | ESLint, Prettier, TypeScript checks                          |
| **Git workflow**   | `docs/GIT-WORKFLOW.md`              | Branch, commit, PR conventions                             |
| **Code reviewer**  | `.claude/agents/code-reviewer.md`   | Repository code-review agent notes                           |

## Custom hooks

### Data fetching

- `useImages()` / `useInfinitePosts()` - Fetch and paginate images/posts with filters
- `usePosts()` - Fetch and manage posts
- `useProfile()` - Fetch user profile data
- `useCategories()` - Fetch category list
- `useItems()` - Fetch items for posts
- `useNormalizedItems()` - Normalize item data structure
- `useSolutions()` - Fetch solutions for items
- `useSpots()` - Fetch spot data for images
- `useComments()` - Fetch and manage comments
- `useTries()` - Fetch try-on results
- `useTrendingArtists()` - Fetch trending artist list
- `useExploreData()` - Unified explore hook: switches between browse mode (Supabase) and search mode (Meilisearch via `/api/v1/search`); exposes `mode`, artist/context facets, multi-select artist filter, sort, and pagination

### Social actions

- `usePostLike()` - Like/unlike posts
- `useSavedPost()` - Save/unsave posts
- `useReport()` - Submit content reports
- `useAdoptDropdown()` - Adopt a solution from dropdown

### Behavioral tracking

- `useTrackEvent()` - Track custom behavior events
- `useTrackDwellTime()` - Track time spent on content
- `useTrackScrollDepth()` - Track scroll depth on pages

### Form & input

- `useCreatePost()` - Multi-step post creation flow
- `useImageUpload()` - Image uploads with compression
- `useSearch()` - Search with debouncing
- `useSearchURLSync()` - URL-based search state sync
- `usePretext()` - Pretext/context text generation

### UI & animation

- `useResponsiveGridSize()` - Calculate grid columns
- `useScrollAnimation()` - Scroll-triggered animations
- `useFlipTransition()` - Flip card animations
- `useMediaQuery()` - Responsive breakpoint detection
- `useSpotCardSync()` - Sync spot selection with card UI
- `useDebounce()` - Debounce value changes
- `useItemCardGSAP()` - GSAP animation for item cards
- `useImageDimensions()` - Get image natural dimensions
- `useImageModalAnimation()` - Lightbox/modal open-close animation

### VTON

- `useVtonTryOn()` - Submit and poll VTON job
- `useVtonItemFetch()` - Fetch items compatible with VTON
- `useVtonScrollLock()` - Lock scroll while VTON modal is open

### Admin

- `useAiCost()` - AI cost tracking data
- `useAudit()` - Audit log data
- `useDashboard()` - Dashboard statistics
- `usePipeline()` - Pipeline monitoring
- `useServerLogs()` - Server log streaming
- `useAdminPosts()` / `useAdminPostEdit()` - Admin post list and metadata editing
- `useAdminReports()` - Admin content report list
- `useEditorialCandidates()` - Posts eligible for editorial promotion
- `useAdminPickList()` / `useCreatePick()` / `useUpdatePick()` / `useDeletePick()` - Decoded Pick CRUD (from `lib/hooks/admin/useAdminPicks.ts`)
