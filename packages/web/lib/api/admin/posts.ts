/**
 * Admin Posts types — matches Rust API response shapes.
 */

export const POST_STATUSES = ["active", "hidden", "deleted"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export function isValidPostStatus(s: string): s is PostStatus {
  return (POST_STATUSES as readonly string[]).includes(s);
}

export interface PostUserInfo {
  id: string;
  username: string;
  avatar_url: string | null;
  rank: string;
}

export interface MediaSourceDto {
  type: string;
  description?: string;
}

export interface AdminPostListItem {
  id: string;
  user: PostUserInfo;
  image_url: string;
  media_source: MediaSourceDto;
  title?: string;
  artist_name?: string;
  group_name?: string;
  context?: string;
  spot_count: number;
  view_count: number;
  comment_count: number;
  status: PostStatus;
  created_at: string;
  post_magazine_title?: string;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface AdminPostListResponse {
  data: AdminPostListItem[];
  pagination: PaginationMeta;
}
