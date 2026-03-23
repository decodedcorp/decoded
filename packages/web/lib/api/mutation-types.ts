/**
 * Manual types for mutations, uploads, and server-side functions.
 * These have NO generated equivalents — they are used by code paths
 * excluded from Orval generation (binary uploads, server functions,
 * Supabase-direct mutations).
 *
 * Phase 42 will migrate mutations to generated hooks and further
 * reduce this file.
 */

// ============================================================
// Common Types
// ============================================================

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// ============================================================
// Upload API
// POST /api/v1/posts/upload
// ============================================================

export interface UploadResponse {
  image_url: string;
}

// ============================================================
// Analyze API
// POST /api/v1/posts/analyze
// ============================================================

export interface AnalyzeRequest {
  image_url: string;
}

export interface DetectedItem {
  left: number; // 백분율 숫자 (예: 45.5)
  top: number; // 백분율 숫자 (예: 30.2)
  category: string; // 카테고리 코드 (예: "fashion")
  label: string; // 아이템 라벨 (예: "jacket")
  confidence: number; // 신뢰도 (0-1)
}

export interface AnalyzeMetadata {
  artist_name?: string;
  context?: string;
}

export interface AnalyzeResponse {
  detected_items: DetectedItem[];
  metadata: AnalyzeMetadata;
}

// ============================================================
// Create Post API
// POST /api/v1/posts
// ============================================================

export type MediaSourceType =
  | "user_upload"
  | "youtube"
  | "drama"
  | "movie"
  | "music_video"
  | "variety"
  | "event"
  | "other";

export interface MediaSource {
  type: MediaSourceType;
  title: string;
  platform?: string;
  year?: number;
}

export interface SpotRequest {
  position_left: string; // 백분율 문자열 (예: "45.5%")
  position_top: string; // 백분율 문자열 (예: "30.2%")
  category_id: string; // UUID
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
  id: string; // 생성된 Post ID
  slug?: string; // 상세 페이지 접근용 slug
}

// ============================================================
// Create Post with Solution API
// POST /api/v1/posts/with-solution
// ============================================================

/**
 * Solution 정보 (spot과 함께 제출)
 */
export interface SpotSolution {
  title: string;
  original_url: string;
  thumbnail_url?: string;
  price_amount?: number;
  price_currency?: string; // default: 'KRW'
  description?: string;
}

/**
 * Spot with solution request
 */
export interface SpotWithSolutionRequest {
  position_left: string; // 백분율 문자열 (예: "45.5%")
  position_top: string; // 백분율 문자열 (예: "30.2%")
  category_id: string; // UUID
  solution: SpotSolution;
}

/**
 * Create post with solutions request
 * Solution을 아는 유저가 spot과 함께 solution을 제출
 */
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

// ============================================================
// Posts List API
// GET /api/v1/posts
// ============================================================

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
  title: string | null;
  /** 에디토리얼(매거진) 타이틀. post_magazine_id가 있을 때만 반환 */
  post_magazine_title?: string | null;
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
  /** true = 솔루션 있는 post만, false = spot은 있으나 솔루션 없는 post만 */
  has_solutions?: boolean;
  /** true = post_magazine_id가 있는 post만 (editorial) */
  has_magazine?: boolean;
}

// ============================================================
// Post Update/Delete API Types
// PATCH /api/v1/posts/{post_id}
// ============================================================

export interface PostResponse extends Post {
  // Full post response after update (same as Post type)
}

// ============================================================
// Extract Post Metadata API (for post creation)
// POST /api/v1/posts/extract-metadata
// ============================================================

export interface ExtractPostMetadataRequest {
  description: string;
}

export interface ExtractPostMetadataResponse {
  title?: string;
  media_metadata: MediaMetadataItem[];
}

// ============================================================
// Spot API Types (mutation paths)
// POST /api/v1/posts/{post_id}/spots
// PATCH /api/v1/spots/{spot_id}
// DELETE /api/v1/spots/{spot_id}
// ============================================================

export interface Spot {
  id: string;
  post_id: string;
  position_left: string; // e.g., "45.5%"
  position_top: string; // e.g., "30.2%"
  category_id: string;
  category?: unknown; // Populated on GET
  solution_count: number;
  created_at: string;
}

export interface SpotListResponse {
  data: Spot[];
}

// ============================================================
// Solution API Types (mutation paths)
// POST /api/v1/spots/{spot_id}/solutions
// PATCH /api/v1/solutions/{solution_id}
// DELETE /api/v1/solutions/{solution_id}
// ============================================================

export interface Solution {
  id: string;
  spot_id: string;
  user_id: string;
  user?: PostUser; // Populated on GET
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

/** GET /api/v1/spots/{spot_id}/solutions - Backend returns array directly */
export interface SolutionListItem {
  id: string;
  user: PostUser;
  match_type?: string | null;
  link_type?: string | null;
  title: string;
  metadata?: Record<string, unknown> | null;
  thumbnail_url?: string | null;
  original_url?: string | null;
  affiliate_url?: string | null;
  vote_stats: { accurate: number; different: number };
  is_verified: boolean;
  is_adopted: boolean;
  created_at: string;
}

/** Backend CreateSolutionDto - original_url, affiliate_url, title, metadata, description, thumbnail_url */
export interface CreateSolutionDto {
  original_url: string;
  affiliate_url?: string | null;
  title?: string | null;
  metadata?: Record<string, unknown> | null;
  description?: string | null;
  comment?: string | null;
  thumbnail_url?: string | null;
}

/** Manual UpdateSolutionDto — Phase 42 will replace with generated mutation */
export interface ManualUpdateSolutionDto {
  product_url?: string;
  product_name?: string;
  brand?: string;
  price?: number;
  currency?: string;
  image_url?: string;
}

// Solution metadata extraction
export interface ExtractMetadataRequest {
  url: string;
}

export interface ExtractMetadataResponse {
  url?: string;
  title?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  image?: string | null;
  site_name?: string | null;
  /** 제휴 링크 지원 여부 (백엔드 MetadataResponse) */
  is_affiliate_supported?: boolean;
  extra_metadata?: { price?: string; currency?: string; brand?: string } | null;
  /** @deprecated use title */
  product_name?: string | null;
  /** @deprecated use title */
  brand?: string | null;
  /** @deprecated use extra_metadata.price */
  price?: number | null;
  /** @deprecated use extra_metadata.currency */
  currency?: string | null;
  /** @deprecated use thumbnail_url */
  image_url?: string | null;
}

// Affiliate link conversion
export interface ConvertAffiliateRequest {
  url: string;
}

export interface ConvertAffiliateResponse {
  affiliate_url: string;
  original_url: string;
}

// ============================================================
// Post Magazine API Types
// GET /api/v1/post-magazines/{id}
// ============================================================

export interface PostMagazineDesignSpec {
  accent_color: string;
  primary_color?: string;
  secondary_color?: string;
  bg_color?: string;
  font_heading?: string;
  font_body?: string;
  style_tags?: string[];
}

export interface PostMagazineEditorialSection {
  paragraphs: string[];
  pull_quote: string | null;
}

export interface PostMagazineCelebWithItem {
  celeb_name: string;
  celeb_image_url: string | null;
  post_id: string;
  item_name: string;
  item_brand: string | null;
  relevance_score: number;
}

export interface PostMagazineSpotItem {
  spot_id: string;
  solution_id: string | null;
  title: string;
  brand: string | null;
  image_url: string | null;
  original_url: string | null;
  metadata: Record<string, unknown>;
  editorial_paragraphs: string[];
}

export interface PostMagazineRelatedItem {
  title: string;
  brand: string | null;
  image_url: string | null;
  original_url: string | null;
  relevance_reason: string | null;
  source: "internal" | "external";
  for_spot_id?: string | null;
}

export interface RelatedEditorialItem {
  post_id: string;
  title: string;
  image_url?: string | null;
  bg_color?: string | null;
}

export interface PostMagazineLayout {
  schema_version: string;
  title: string;
  subtitle: string | null;
  editorial: PostMagazineEditorialSection;
  celeb_list: PostMagazineCelebWithItem[];
  items: PostMagazineSpotItem[];
  related_items: PostMagazineRelatedItem[];
  design_spec: PostMagazineDesignSpec;
}

export interface PostMagazineResponse {
  id: string;
  title: string;
  subtitle: string | null;
  keyword: string | null;
  layout_json: PostMagazineLayout | null;
  status: string;
  review_summary: string | null;
  error_log: unknown | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  related_editorials?: RelatedEditorialItem[];
}

// ============================================================
// Coordinate Conversion Utilities
// ============================================================

/**
 * API 좌표 (백분율 숫자) → Store 좌표 (0-1 비율)
 */
export function apiToStoreCoord(value: number): number {
  return value / 100;
}

/**
 * Store 좌표 (0-1 비율) → API 좌표 (백분율 문자열)
 */
export function storeToApiCoord(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
