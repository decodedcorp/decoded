# Data Models

> Canonical data shapes used across the application.
> **Note:** This document copies stable TypeScript types from source files for spec reference.
> For the latest type definitions, read the source file directly. API response types take
> precedence over Supabase table types for screen consumption.

---

## Type Source Map

| Entity | Source File | Type Name | Domain |
|--------|-------------|-----------|--------|
| Post (API response) | `packages/web/lib/api/types.ts` | `Post` | Content |
| PostsListResponse | `packages/web/lib/api/types.ts` | `PostsListResponse` | Content |
| PostsListParams | `packages/web/lib/api/types.ts` | `PostsListParams` | Content |
| CreatePostRequest | `packages/web/lib/api/types.ts` | `CreatePostRequest` | Content |
| CreatePostWithSolutionRequest | `packages/web/lib/api/types.ts` | `CreatePostWithSolutionRequest` | Content |
| PostRow (DB) | `packages/web/lib/supabase/types.ts` | `PostRow` | Content |
| Spot (API response) | `packages/web/lib/api/types.ts` | `Spot` | Discovery |
| SpotRow (DB) | `packages/web/lib/supabase/types.ts` | `SpotRow` | Discovery |
| CreateSpotDto | `packages/web/lib/api/types.ts` | `CreateSpotDto` | Discovery |
| Solution (API response) | `packages/web/lib/api/types.ts` | `Solution` | Discovery |
| SolutionRow (DB) | `packages/web/lib/supabase/types.ts` | `SolutionRow` | Discovery |
| CreateSolutionDto | `packages/web/lib/api/types.ts` | `CreateSolutionDto` | Discovery |
| Category | `packages/web/lib/api/types.ts` | `Category` | System |
| CategoryRow (DB) | `packages/web/lib/supabase/types.ts` | `CategoryRow` | System |
| UserResponse | `packages/web/lib/api/types.ts` | `UserResponse` | User |
| UserRow (DB) | `packages/web/lib/supabase/types.ts` | `UserRow` | User |
| UserStatsResponse | `packages/web/lib/api/types.ts` | `UserStatsResponse` | User |
| UserActivityItem | `packages/web/lib/api/types.ts` | `UserActivityItem` | User |
| DetectedItem | `packages/web/lib/api/types.ts` | `DetectedItem` | AI |
| AnalyzeResponse | `packages/web/lib/api/types.ts` | `AnalyzeResponse` | AI |
| ItemRow (legacy) | `packages/web/lib/components/detail/types.ts` | `ItemRow` | Legacy |
| NormalizedItem | `packages/web/lib/components/detail/types.ts` | `NormalizedItem` | Legacy |
| UiItem | `packages/web/lib/components/detail/types.ts` | `UiItem` | Legacy |
| BadgeRow (DB) | `packages/web/lib/supabase/types.ts` | `BadgeRow` | System |

> **API vs DB types:** The API layer normalizes DB column names to match. Key differences:
> - DB table is `posts` but API type is `Post` (camelCase fields differ)
> - DB `spots.subcategory_id` → API `Spot.category_id` (abstraction at API layer)
> - DB `solutions` has more fields (accurate_count, purchase_count, etc.) than the API `Solution` shape

---

## Content Domain

### Post (API Response)

**Source:** `packages/web/lib/api/types.ts`
**Relations:** Post → Spot[] → Solution[]

```typescript
export interface PostUser {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string | null;
}

export interface PostMediaSource {
  type: string;
  title: string;
  platform?: string;
  year?: number;
}

export interface Post {
  id: string;
  user: PostUser;
  image_url: string;
  media_source: PostMediaSource | null;
  artist_name: string | null;
  group_name: string | null;
  context: string | null;
  spot_count: number;
  view_count: number;
  comment_count: number;
  created_at: string;
}

export interface PostsListPagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface PostsListResponse {
  data: Post[];
  pagination: PostsListPagination;
}

export interface PostsListParams {
  artist_name?: string;
  group_name?: string;
  context?: string;
  category?: string;
  user_id?: string;
  sort?: "recent" | "popular" | "trending";
  page?: number;
  per_page?: number;
}
```

### Create Post Request

**Source:** `packages/web/lib/api/types.ts`

```typescript
export type MediaSourceType =
  | "drama"
  | "movie"
  | "music_video"
  | "variety"
  | "other";

export interface MediaSource {
  type: MediaSourceType;
  title: string;
  platform?: string;
  year?: number;
}

export type ContextType =
  | "airport"
  | "stage"
  | "drama"
  | "variety"
  | "daily"
  | "photoshoot"
  | "event"
  | "other";

export interface MediaMetadataItem {
  key: string; // e.g., "platform", "season", "episode"
  value: string; // e.g., "Netflix", "2", "3"
}

export interface CreatePostRequest {
  image_url: string;
  media_source: MediaSource;
  spots: SpotRequest[];
  artist_name?: string;
  group_name?: string;
  context?: ContextType;
  description?: string;
  media_metadata?: MediaMetadataItem[];
}

export interface CreatePostResponse {
  id: string;   // Created Post ID
  slug?: string; // Detail page slug
}
```

### Create Post with Solution Request

**Source:** `packages/web/lib/api/types.ts`
**Note:** Used when the submitter already knows the product (has solution info).

```typescript
export interface SpotSolution {
  title: string;
  original_url: string;
  thumbnail_url?: string;
  price_amount?: number;
  price_currency?: string; // default: 'KRW'
  description?: string;
}

export interface SpotWithSolutionRequest {
  position_left: string;  // Percentage string e.g. "45.5%"
  position_top: string;   // Percentage string e.g. "30.2%"
  category_id: string;    // UUID
  solution: SpotSolution;
}

export interface CreatePostWithSolutionRequest {
  image_url: string;
  media_source: MediaSource;
  spots: SpotWithSolutionRequest[];
  artist_name?: string;
  group_name?: string;
  context?: ContextType;
  description?: string;
  media_metadata?: MediaMetadataItem[];
}
```

### PostRow (Database)

**Source:** `packages/web/lib/supabase/types.ts`
**Note:** Raw Supabase table row. Screens consume API `Post` type, not `PostRow`.

```typescript
export type PostRow = {
  id: string;
  user_id: string;
  image_url: string | null;
  media_type: string | null;   // 'event', 'paparazzi', etc.
  media_title: string | null;
  media_metadata: Json;
  group_name: string | null;
  artist_name: string | null;
  context: string | null;      // 'street style', 'street', etc.
  view_count: number;
  status: string;              // 'active' | 'inactive' | 'pending' | 'deleted'
  created_at: string;
  updated_at: string;
  trending_score: number | null;
}
```

---

## Discovery Domain

### Spot (API Response)

**Source:** `packages/web/lib/api/types.ts`
**Relations:** Spot → Solution[]

```typescript
export interface Spot {
  id: string;
  post_id: string;
  position_left: string;  // Percentage string e.g. "45.5%"
  position_top: string;   // Percentage string e.g. "30.2%"
  category_id: string;    // UUID
  category?: Category;    // Populated on GET
  solution_count: number;
  created_at: string;
}

export interface SpotListResponse {
  data: Spot[];
}

export interface CreateSpotDto {
  position_left: string;
  position_top: string;
  category_id: string;
}

export interface UpdateSpotDto {
  position_left?: string;
  position_top?: string;
  category_id?: string;
}
```

> **Coordinate format:** Position fields are percentage strings (e.g., `"45.5%"`). When converting
> for AI analysis, use utility: `apiToStoreCoord(value)` (divides by 100) and
> `storeToApiCoord(value)` (multiplies by 100, adds `%` suffix). See `packages/web/lib/api/types.ts`.

### SpotRow (Database)

**Source:** `packages/web/lib/supabase/types.ts`
**Note:** DB spots use `subcategory_id`, not `category_id` — the API layer abstracts this.

```typescript
export type SpotRow = {
  id: string;
  post_id: string;
  user_id: string;
  position_left: string;    // Percentage number e.g. "26.26788036410923"
  position_top: string;     // Percentage number e.g. "30.54806828391734"
  subcategory_id: string;   // Note: DB uses subcategory_id, API uses category_id
  status: string;           // 'open' | 'solved' | 'closed'
  created_at: string;
  updated_at: string;
}
```

### Solution (API Response)

**Source:** `packages/web/lib/api/types.ts`

```typescript
export interface Solution {
  id: string;
  spot_id: string;
  user_id: string;
  user?: PostUser;           // Populated on GET
  product_url: string;
  affiliate_url: string | null;
  product_name: string | null;
  brand: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  vote_count: number;
  is_adopted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SolutionListResponse {
  data: Solution[];
}

export interface CreateSolutionDto {
  product_url: string;
  product_name?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}

export interface UpdateSolutionDto {
  product_url?: string;
  product_name?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}
```

### SolutionRow (Database)

**Source:** `packages/web/lib/supabase/types.ts`
**Note:** DB has more fields than API `Solution` — vote tracking, engagement, qna, keywords.

```typescript
export type SolutionRow = {
  id: string;
  spot_id: string;
  user_id: string;
  match_type: string | null;
  title: string;
  price_amount: number | null;
  price_currency: string;       // 'KRW', 'USD', etc.
  original_url: string;
  affiliate_url: string | null;
  thumbnail_url: string | null;
  description: string;
  accurate_count: number;
  different_count: number;
  is_verified: boolean;
  is_adopted: boolean;
  adopted_at: string | null;
  click_count: number;
  purchase_count: number;
  status: string;               // 'active' | 'inactive' | 'pending' | 'deleted'
  created_at: string;
  updated_at: string;
  metadata: Json | null;
  comment: string | null;
  qna: Json | null;
  keywords: string[] | null;
}
```

---

## User Domain

### UserResponse (API)

**Source:** `packages/web/lib/api/types.ts`

```typescript
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  rank: string | null;
  total_points: number;
  is_admin: boolean;
  avatar_url: string | null;
  bio: string | null;
  display_name: string | null;
}

export interface UpdateUserDto {
  avatar_url?: string;
  bio?: string;
  display_name?: string;
}
```

### UserStatsResponse (API)

**Source:** `packages/web/lib/api/types.ts`

```typescript
export interface UserStatsResponse {
  total_posts: number;
  total_comments: number;
  total_likes_received: number;
  total_points: number;
  rank: string | null;
}
```

### UserActivityItem (API)

**Source:** `packages/web/lib/api/types.ts`

```typescript
export type UserActivityType = "post" | "spot" | "solution";

export interface UserActivityItem {
  id: string;
  type: UserActivityType;
  title: string;
  created_at: string;
}

export interface PaginatedActivitiesResponse {
  data: UserActivityItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ActivitiesListParams {
  type?: UserActivityType;
  page?: number;
  per_page?: number;
}
```

### UserRow (Database)

**Source:** `packages/web/lib/supabase/types.ts`

```typescript
export type UserRow = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rank: string | null;      // 'Member', etc.
  total_points: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## System Domain

### Category (API)

**Source:** `packages/web/lib/api/types.ts`
**DB values (5 records):** wearables, accessories, beauty, lifestyle, other

```typescript
export interface LocalizedName {
  ko: string;
  en: string;
}

export interface Category {
  id: string;        // UUID
  code: string;      // e.g., "fashion", "wearables"
  name: LocalizedName;
  color_hex: string; // e.g., "#FF5733"
}

export type CategoriesResponse = Category[];
```

### CategoryRow (Database)

**Source:** `packages/web/lib/supabase/types.ts`

```typescript
export type CategoryRow = {
  id: string;
  code: string;            // 'wearables', 'accessories', 'beauty', 'lifestyle', 'other'
  name: I18nText;          // { ko: '패션 아이템', en: 'Wearables' }
  icon_url: string | null;
  color_hex: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### BadgeRow (Database)

**Source:** `packages/web/lib/supabase/types.ts`
**Note:** No dedicated API badge type — `BadgeRow` used directly. 20 badge records.

```typescript
export type BadgeRow = {
  id: string;
  type: string;        // 'achievement', etc.
  name: string;
  description: string;
  icon_url: string | null;
  criteria: Json;      // { type: 'count', threshold: 1 }
  rarity: string;      // 'common' | 'rare' | 'epic' | 'legendary'
  created_at: string;
  updated_at: string;
}
```

---

## AI Domain

### AnalyzeResponse (AI Detection)

**Source:** `packages/web/lib/api/types.ts`
**Used by:** `POST /api/v1/posts/analyze` — AI image analysis response

```typescript
export interface DetectedItem {
  left: number;       // Percentage number (e.g., 45.5)
  top: number;        // Percentage number (e.g., 30.2)
  category: string;   // Category code (e.g., "fashion")
  label: string;      // Item label (e.g., "jacket")
  confidence: number; // Confidence score (0–1)
}

export interface AnalyzeMetadata {
  artist_name?: string;
  context?: string;
}

export interface AnalyzeResponse {
  detected_items: DetectedItem[];
  metadata: AnalyzeMetadata;
}
```

### Upload / Metadata Extraction Types

**Source:** `packages/web/lib/api/types.ts`

```typescript
export interface UploadResponse {
  image_url: string;
}

export interface ExtractPostMetadataRequest {
  description: string;
}

export interface ExtractPostMetadataResponse {
  title?: string;
  media_metadata: MediaMetadataItem[];
}

export interface ExtractMetadataRequest {
  url: string;
}

export interface ExtractMetadataResponse {
  product_name: string | null;
  brand: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  description: string | null;
}

export interface ConvertAffiliateRequest {
  url: string;
}

export interface ConvertAffiliateResponse {
  affiliate_url: string;
  original_url: string;
}
```

---

## Social Domain (Proposed)

> STATUS: Frontend proposal — types not yet in codebase. Target file: `packages/web/lib/api/types.ts`

### SocialConnection (API Response)

```typescript
type SocialProvider = 'pinterest' | 'instagram';

interface SocialConnection {
  provider: SocialProvider;
  provider_username: string;
  connected_at: string;
  last_synced_at: string | null;
  is_active: boolean;
  reference_count: number;       // number of images collected
}

interface SocialConnectionsResponse {
  data: SocialConnection[];
}
```

### StyleProfile (API Response)

```typescript
interface StyleProfile {
  persona_keywords: string[];          // ['Minimal', 'Cyberpunk', 'StreetCore']
  color_palette: string[];             // hex colors ['#1a1a1a', '#eafd67']
  brand_affinities: Record<string, number>; // { "Nike": 0.8, "Zara": 0.6 }
  source_count: number;                // total images analyzed
  last_analyzed_at: string | null;
}
```

### SyncRequest / SyncStatus (API)

```typescript
interface SocialSyncRequest {
  provider: SocialProvider;
  board_ids?: string[];                // Pinterest: selected board IDs
  username?: string;                   // Instagram crawling: IG username
  consent?: boolean;                   // Instagram crawling: explicit consent flag
}

type SyncStatusType = 'idle' | 'syncing' | 'analyzing' | 'complete' | 'error';

interface SocialSyncStatus {
  status: SyncStatusType;
  progress: number;                    // 0-100
  fetched_count: number;
  total_count: number;
  message: string;                     // "Fetching pin images..."
}
```

### PinterestBoard (API Response)

```typescript
interface PinterestBoard {
  id: string;
  name: string;
  description: string | null;
  pin_count: number;
  thumbnail_url: string | null;
}

interface PinterestBoardsResponse {
  data: PinterestBoard[];
}
```

### StyleReference (Internal)

```typescript
type StyleReferenceSource = 'pinterest' | 'instagram' | 'upload';

interface StyleReference {
  id: string;
  source: StyleReferenceSource;
  image_url: string;
  caption: string | null;
  tags: string[];
  ai_analyzed: boolean;
  ai_keywords: string[] | null;
  created_at: string;
}
```

### Database Tables

```typescript
// user_social_tokens (encrypted at rest)
type UserSocialTokenRow = {
  id: string;
  user_id: string;
  provider: string;              // 'pinterest' | 'instagram'
  access_token: string;          // AES-256 encrypted
  refresh_token: string | null;  // AES-256 encrypted
  token_expires_at: string | null;
  scopes: string[];
  provider_user_id: string | null;
  provider_username: string | null;
  connected_at: string;
  last_synced_at: string | null;
  is_active: boolean;
}

// user_style_references
type UserStyleReferenceRow = {
  id: string;
  user_id: string;
  source: string;                // 'pinterest' | 'instagram' | 'upload'
  source_id: string | null;      // original platform ID
  image_url: string;
  caption: string | null;
  tags: string[] | null;
  ai_analyzed: boolean;
  ai_keywords: string[] | null;
  created_at: string;
}

// user_style_profiles
type UserStyleProfileRow = {
  id: string;
  user_id: string;               // UNIQUE
  persona_keywords: string[];
  style_vector: number[];        // 768-dim embedding
  color_palette: string[];
  brand_affinities: Json;
  source_count: number;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## Magazine Domain (Proposed)

> STATUS: Frontend proposal — types not yet in codebase. Target file: `packages/web/lib/api/types.ts`

### MagazineIssue (API Response)

```typescript
interface LayoutComponent {
  type: 'hero-image' | 'text-block' | 'item-card' | 'divider' | 'quote' | 'grid-gallery';
  x: number;           // 0-100, percentage from left
  y: number;           // 0-100, percentage from top
  w: number;           // percentage width
  h: number;           // percentage height
  animation_type: 'fade-up' | 'scale-in' | 'slide-left' | 'parallax' | 'none';
  animation_delay?: number; // seconds
  data: Record<string, unknown>;
}

interface LayoutJSON {
  version: 1;
  viewport: 'mobile' | 'desktop';
  components: LayoutComponent[];
}

interface ThemePalette {
  primary: string;     // hex color
  accent: string;
  background: string;
  text: string;
}

interface MagazineIssue {
  id: string;
  issue_number: number;
  title: string;
  theme_palette: ThemePalette;
  layout_json: LayoutJSON;
  is_personal?: boolean;
  published_at: string;
  created_at: string;
}
```

### CreditBalance (API Response)

```typescript
interface CreditBalance {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

type CreditActionType = 'magazine_generate' | 'vton_apply' | 'magazine_regenerate';

interface CreditTransaction {
  id: string;
  amount: number;
  action_type: CreditActionType;
  created_at: string;
}
```

---

## Legacy / Detail View Types

> These types exist for backward compatibility in the detail view. New code should use API types.

**Source:** `packages/web/lib/components/detail/types.ts`

```typescript
export interface ItemRow {
  id: number;
  image_id: string;
  brand: string | null;
  product_name: string | null;
  cropped_image_path: string | null;
  price: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
  // Legacy spatial data (may be null)
  bboxes: Json | null;
  center: Json | null;
  scores: Json | null;
  ambiguity: boolean | null;
  citations: string[] | null;
  metadata: string[] | null;
  sam_prompt: string | null;
}

export type NormalizedCoord = {
  x: number; // 0.0 (left) ~ 1.0 (right)
  y: number; // 0.0 (top) ~ 1.0 (bottom)
};

export type BoundingBox = {
  top: number;    // 0.0 ~ 1.0
  left: number;   // 0.0 ~ 1.0
  width: number;  // 0.0 ~ 1.0
  height: number; // 0.0 ~ 1.0
};

export type NormalizedItem = ItemRow & {
  normalizedBox: BoundingBox | null;
  normalizedCenter: NormalizedCoord | null;
};

export type UiItem = NormalizedItem & {
  imageUrl: string | null;  // cropped_image_path mapped to camelCase
  bboxSource: "override" | "item" | "center";
};
```

**Conversion utility:**

```typescript
// Convert SpotRow + SolutionRow → ItemRow (for legacy compatibility)
export function spotToItemRow(spot: SpotRow, solution?: SolutionRow): ItemRow
```

---

## Database Enums

**Source:** `packages/web/lib/supabase/types.ts`
**Note:** Inferred from data — not actual DB enum types.

```typescript
type post_status    = "active" | "inactive" | "pending" | "deleted"
type spot_status    = "open" | "solved" | "closed"
type solution_status = "active" | "inactive" | "pending" | "deleted"
type badge_rarity   = "common" | "rare" | "epic" | "legendary"
```
