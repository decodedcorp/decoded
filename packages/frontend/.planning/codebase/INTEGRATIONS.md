# External Integrations

**Analysis Date:** 2026-02-05

## APIs & External Services

**AI & Image Analysis:**
- Service: Image Analysis API
- Endpoint: `POST /api/v1/posts/analyze`
- Purpose: AI-powered image detection to identify items, clothing, objects in images
- SDK/Client: Custom `lib/api/posts.ts` via fetch
- Auth: Bearer token (Supabase JWT)
- Response: `AnalyzeResponse` with detected_items array and metadata
- Implementation: Proxy route at `app/api/v1/posts/analyze/route.ts` forwards to `${API_BASE_URL}/api/v1/posts/analyze`

**Metadata Extraction:**
- Service: Metadata Extraction API
- Endpoint: `POST /api/v1/posts/extract-metadata`
- Purpose: Parse descriptions and extract structured metadata (title, season, episode, etc.)
- SDK/Client: Custom `lib/api/posts.ts` via fetch
- Auth: None (public endpoint)
- Response: `ExtractMetadataResponse` with title and media_metadata array
- Implementation: Proxy route at `app/api/v1/posts/extract-metadata/route.ts`

**Image Upload:**
- Service: Image Upload API
- Endpoint: `POST /api/v1/posts/upload`
- Purpose: Upload images to cloud storage and generate URLs
- SDK/Client: Custom `lib/api/posts.ts` with FormData
- Auth: Bearer token (Supabase JWT, required)
- Response: `UploadResponse` with image_url
- Implementation: Proxy route at `app/api/v1/posts/upload/route.ts`
- Features: Progress callback simulation in client, actual progress via XMLHttpRequest possible

**Posts & Content APIs:**
- Endpoint: `GET /api/v1/posts?artist_name=...&category=...&sort=...`
  - Purpose: Fetch curated posts with filtering and pagination
  - Auth: None required
  - Params: artist_name, group_name, context, category, user_id, sort (recent|popular|trending), page, per_page
  - Response: `PostsListResponse` with pagination
  - Clients: `fetchPosts()` (browser), `fetchPostsServer()` (server-side with revalidate: 60)

- Endpoint: `POST /api/v1/posts`
  - Purpose: Create new posts with detected items and metadata
  - Auth: Bearer token (Supabase JWT, required)
  - Body: `CreatePostRequest` with image_url, media_source, spots[], artist_name, group_name, context, description, media_metadata
  - Response: `CreatePostResponse` with id and slug
  - Client: `createPost()`

**User & Profile APIs:**
- Endpoint: `GET /api/v1/users/me` | `PATCH /api/v1/users/me`
  - Purpose: Fetch and update current user profile
  - Auth: Bearer token required
  - Response: `UserResponse` with id, email, username, rank, points, avatar_url, bio, display_name
  - Proxy: `app/api/v1/users/me/route.ts`

- Endpoint: `GET /api/v1/users/me/stats`
  - Purpose: User statistics (posts, comments, likes_received, points, rank)
  - Auth: Bearer token required
  - Response: `UserStatsResponse`
  - Proxy: `app/api/v1/users/me/stats/route.ts`

- Endpoint: `GET /api/v1/users/me/activities`
  - Purpose: User activity timeline (posts, spots, solutions)
  - Auth: Bearer token required
  - Response: `PaginatedActivitiesResponse` with activity type and timestamp
  - Proxy: `app/api/v1/users/me/activities/route.ts`

- Endpoint: `GET /api/v1/users/[userId]`
  - Purpose: Fetch public user profile data
  - Auth: None required
  - Response: `UserResponse` (public fields)
  - Proxy: `app/api/v1/users/[userId]/route.ts`

**Categories API:**
- Endpoint: `GET /api/v1/categories`
- Purpose: Fetch all item categories (fashion, accessories, etc.)
- Auth: None required
- Response: Array of `Category` objects with id, code, name (localized ko/en), color_hex
- Client: `lib/api/categories.ts`
- Proxy: `app/api/v1/categories/route.ts`

## Data Storage

**Databases:**
- PostgreSQL via Supabase
  - Project URL: `NEXT_PUBLIC_SUPABASE_URL` (https://fvxchskblyhuswzlcmql.supabase.co)
  - Public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (limited permissions)
  - Admin key: `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - Client: @supabase/supabase-js 2.86.0
  - Tables: posts, users, spots, solutions, categories (inferred from API types)
  - Type definitions: `lib/supabase/types.ts` (generated Database types)

**Query Patterns:**
- Server: `lib/supabase/queries/*.server.ts` using `createSupabaseServerClient()`
- Client: `lib/supabase/queries/*.ts` using `supabaseBrowserClient`
- Files: posts.ts, items.ts, images.ts, main-page.server.ts, debug/* subfolder

**File Storage:**
- Cloudflare R2 (S3-compatible object storage)
  - Domain pattern: `**.r2.dev` (allowed in `next.config.js`)
  - Purpose: Store images and media assets
  - Used for post images, user uploads

**Caching:**
- React Query: Server state caching for API responses
- Next.js Built-in:
  - Fetch API caching with `revalidate: 60` in server-side queries (e.g., fetchPostsServer)
  - ISR (Incremental Static Regeneration) support

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (PostgreSQL-backed)
- Location: `lib/stores/authStore.ts` (Zustand store)
- OAuth Providers: Google, Apple, Kakao (configured in Supabase)

**Auth Implementation:**
- Store: `useAuthStore` in `lib/stores/authStore.ts`
- Browser client: `supabaseBrowserClient` from `lib/supabase/client.ts`
- Server client: `createSupabaseServerClient()` from `lib/supabase/server.ts`
- Helper: @supabase/auth-helpers-nextjs for cookie management
- JWT Extraction: Via `getAuthToken()` in `lib/api/client.ts`
- Token Injection: As `Authorization: Bearer {token}` header in API calls

**Session Management:**
- Cookie-based authentication (managed by auth-helpers-nextjs)
- Session persistence across page reloads
- OAuth callback handling via Supabase redirect flow

## Monitoring & Observability

**Error Tracking:**
- Not configured

**Logs:**
- Console logging for development (NODE_ENV === "development" checks)
- Server-side error logging in API proxy routes via console.error()
- No centralized logging service

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Next.js App Router usage)
- Alternative: Any Node.js 18+ runtime supporting Next.js 16

**CI Pipeline:**
- Not detected in repository (no GitHub Actions, GitLab CI, etc.)

## Environment Configuration

**Public Variables (Browser-Accessible):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (limited permissions)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Secondary publishable key (if needed)
- `NEXT_PUBLIC_API_BASE_URL` - Optional client API override (defaults to empty for proxy mode)
- `NEXT_PUBLIC_USE_MOCK_SEARCH` - Enable mock search data (boolean, defaults false)

**Server-Only Variables:**
- `API_BASE_URL` - Backend API base URL (required for Next.js API proxies)
  - Example: `https://dev.decoded.style`
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (never expose to browser)

**Secrets Location:**
- Development: `.env.local` (gitignored, see `.env.local.example`)
- Production: Environment variables in hosting platform (Vercel dashboard, etc.)

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Supabase Auth Callback: OAuth redirect URL auto-configured by auth-helpers-nextjs
- API Responses: Standard JSON with error handling

## External Image Services (Testing & Mock Data)

**Development/Mock Data:**
- picsum.photos - Placeholder images for UI testing
  - Hostname: `picsum.photos` (allowed in `next.config.js`)
  - Usage: Test image URLs in mock data

- DiceBear Avatars - Generated profile avatars for mock users
  - Hostname: `api.dicebear.com` (allowed in `next.config.js`)
  - Style: Avataaars (configurable)
  - Usage: Default user avatars in mock data

## API Architecture

**Proxy Pattern:**
All external backend APIs are proxied through Next.js API routes to avoid CORS:

```
Browser → Next.js API Route (app/api/v1/*)
        ↓
        Backend Server (${API_BASE_URL})
        ↓
Response
```

**Proxy Routes:**
- `app/api/v1/posts/route.ts` - Posts listing (GET) and creation (POST)
- `app/api/v1/posts/analyze/route.ts` - Image analysis (POST)
- `app/api/v1/posts/extract-metadata/route.ts` - Metadata extraction (POST)
- `app/api/v1/posts/upload/route.ts` - Image upload (POST)
- `app/api/v1/users/me/route.ts` - Current user profile (GET, PATCH)
- `app/api/v1/users/me/stats/route.ts` - User stats (GET)
- `app/api/v1/users/me/activities/route.ts` - User activities (GET)
- `app/api/v1/users/[userId]/route.ts` - Public user profile (GET)
- `app/api/v1/categories/route.ts` - Categories listing (GET)

**Error Handling:**
- Server-side validation of `API_BASE_URL` environment variable
- Graceful 500 responses on proxy errors
- Client-side error recovery via React Query or manual try-catch

## API Client Implementation

**Location:** `lib/api/client.ts`

```typescript
export async function apiClient<T>(options: ApiClientOptions): Promise<T> {
  // Automatic JWT injection for requiresAuth: true
  // Content-Type handling for JSON and FormData
  // Standardized error handling and response parsing
}
```

**Features:**
- Automatic JWT token injection from Supabase session
- FormData support for file uploads
- Typed responses with generics
- Unified error handling

---

*Integration audit: 2026-02-05*
