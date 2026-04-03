/**
 * Types for admin decoded pick management.
 */

export interface DecodedPickPost {
  id: string;
  image_url: string | null;
  artist_name: string | null;
  group_name: string | null;
  context: string | null;
}

export interface DecodedPickListItem {
  id: string;
  post_id: string;
  pick_date: string;
  note: string | null;
  curated_by: string;
  is_active: boolean;
  created_at: string;
  post: DecodedPickPost | null;
}

export interface DecodedPickListResponse {
  data: DecodedPickListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreatePickPayload {
  post_id: string;
  pick_date?: string;
  note?: string;
  curated_by?: string;
}

export interface UpdatePickPayload {
  note?: string | null;
  is_active?: boolean;
  curated_by?: string;
  post_id?: string;
}
