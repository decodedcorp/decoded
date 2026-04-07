/**
 * Manual types for mutations, uploads, and server-side functions.
 * These have NO generated equivalents — they are used by code paths
 * excluded from Orval generation (binary uploads, server functions,
 * Supabase-direct mutations).
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
  | "brand_campaign"
  | "sns"
  | "street"
  | "fan_meeting"
  | "interview"
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

export interface PostMagazineNewsReference {
  title: string;
  url: string;
  source: string;
  summary: string;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_site_name: string | null;
  relevance_score: number;
  credibility_score: number;
  matched_item: string | null;
}

export interface PostMagazineLayout {
  schema_version: string;
  title: string;
  subtitle: string | null;
  editorial: PostMagazineEditorialSection;
  celeb_list: PostMagazineCelebWithItem[];
  items: PostMagazineSpotItem[];
  related_items: PostMagazineRelatedItem[];
  news_references: PostMagazineNewsReference[];
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
