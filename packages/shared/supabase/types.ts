/**
 * Supabase Database Types (PRD / Legacy DB)
 *
 * Auto-generated from PRD database schema.
 * Last updated: 2026-03-18
 *
 * NOTE: PRD DB has migrated post.account → post.account_id (UUID FK).
 * The `account` field is kept here as a compatibility alias until
 * shared queries are updated to use account_id + instagram_account join.
 *
 * Tables: image, item, post, post_image, instagram_account,
 *         source_account, group_member, seed_posts, seed_asset,
 *         seed_spots, seed_solutions
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      group_member: {
        Row: {
          artist_account_id: string;
          created_at: string;
          group_account_id: string;
          is_active: boolean;
          joined_at: string | null;
          left_at: string | null;
          metadata: Json | null;
          updated_at: string;
        };
        Insert: {
          artist_account_id: string;
          created_at?: string;
          group_account_id: string;
          is_active?: boolean;
          joined_at?: string | null;
          left_at?: string | null;
          metadata?: Json | null;
          updated_at?: string;
        };
        Update: {
          artist_account_id?: string;
          created_at?: string;
          group_account_id?: string;
          is_active?: boolean;
          joined_at?: string | null;
          left_at?: string | null;
          metadata?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_member_artist_account_id_fkey";
            columns: ["artist_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_member_group_account_id_fkey";
            columns: ["group_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
        ];
      };
      image: {
        Row: {
          created_at: string;
          id: string;
          image_hash: string;
          image_url: string | null;
          status: Database["public"]["Enums"]["image_status"];
          with_items: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_hash: string;
          image_url?: string | null;
          status?: Database["public"]["Enums"]["image_status"];
          with_items?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_hash?: string;
          image_url?: string | null;
          status?: Database["public"]["Enums"]["image_status"];
          with_items?: boolean;
        };
        Relationships: [];
      };
      instagram_account: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"];
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_active: boolean;
          last_wikidata_checked_at: string | null;
          metadata: Json | null;
          name_en: string | null;
          name_ko: string | null;
          needs_review: boolean;
          profile_image_url: string | null;
          updated_at: string;
          username: string;
          wikidata_id: string | null;
          wikidata_status: string | null;
        };
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"];
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_wikidata_checked_at?: string | null;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          needs_review?: boolean;
          profile_image_url?: string | null;
          updated_at?: string;
          username: string;
          wikidata_id?: string | null;
          wikidata_status?: string | null;
        };
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"];
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          last_wikidata_checked_at?: string | null;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          needs_review?: boolean;
          profile_image_url?: string | null;
          updated_at?: string;
          username?: string;
          wikidata_id?: string | null;
          wikidata_status?: string | null;
        };
        Relationships: [];
      };
      item: {
        Row: {
          ambiguity: boolean | null;
          bboxes: Json | null;
          brand: string | null;
          brand_account_id: string | null;
          center: Json | null;
          citations: string[] | null;
          created_at: string | null;
          cropped_image_path: string | null;
          description: string | null;
          id: number;
          image_id: string;
          metadata: string[] | null;
          original_url: string | null;
          price: string | null;
          product_name: string | null;
          sam_prompt: string | null;
          scores: Json | null;
          status: string | null;
          thumbnail_url: string | null;
        };
        Insert: {
          ambiguity?: boolean | null;
          bboxes?: Json | null;
          brand?: string | null;
          brand_account_id?: string | null;
          center?: Json | null;
          citations?: string[] | null;
          created_at?: string | null;
          cropped_image_path?: string | null;
          description?: string | null;
          id?: number;
          image_id: string;
          metadata?: string[] | null;
          original_url?: string | null;
          price?: string | null;
          product_name?: string | null;
          sam_prompt?: string | null;
          scores?: Json | null;
          status?: string | null;
          thumbnail_url?: string | null;
        };
        Update: {
          ambiguity?: boolean | null;
          bboxes?: Json | null;
          brand?: string | null;
          brand_account_id?: string | null;
          center?: Json | null;
          citations?: string[] | null;
          created_at?: string | null;
          cropped_image_path?: string | null;
          description?: string | null;
          id?: number;
          image_id?: string;
          metadata?: string[] | null;
          original_url?: string | null;
          price?: string | null;
          product_name?: string | null;
          sam_prompt?: string | null;
          scores?: Json | null;
          status?: string | null;
          thumbnail_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "item_brand_account_id_fkey";
            columns: ["brand_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "image";
            referencedColumns: ["id"];
          },
        ];
      };
      post: {
        Row: {
          account_id: string;
          article: string | null;
          artists: Json | null;
          caption_text: string | null;
          created_at: string;
          id: string;
          item_ids: Json | null;
          metadata: string[] | null;
          migration_ready: boolean;
          original_url_searched: boolean;
          tagged_account_ids: string[] | null;
          ts: string;
          uploaded: boolean | null;
        };
        Insert: {
          account_id: string;
          article?: string | null;
          artists?: Json | null;
          caption_text?: string | null;
          created_at?: string;
          id?: string;
          item_ids?: Json | null;
          metadata?: string[] | null;
          migration_ready?: boolean;
          original_url_searched?: boolean;
          tagged_account_ids?: string[] | null;
          ts: string;
          uploaded?: boolean | null;
        };
        Update: {
          account_id?: string;
          article?: string | null;
          artists?: Json | null;
          caption_text?: string | null;
          created_at?: string;
          id?: string;
          item_ids?: Json | null;
          metadata?: string[] | null;
          migration_ready?: boolean;
          original_url_searched?: boolean;
          tagged_account_ids?: string[] | null;
          ts?: string;
          uploaded?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "post_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
        ];
      };
      post_image: {
        Row: {
          created_at: string;
          curated_item_ids: Json | null;
          image_id: string;
          item_locations: Json | null;
          item_locations_updated_at: string | null;
          post_id: string;
        };
        Insert: {
          created_at?: string;
          curated_item_ids?: Json | null;
          image_id: string;
          item_locations?: Json | null;
          item_locations_updated_at?: string | null;
          post_id: string;
        };
        Update: {
          created_at?: string;
          curated_item_ids?: Json | null;
          image_id?: string;
          item_locations?: Json | null;
          item_locations_updated_at?: string | null;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_image_image_id_fkey";
            columns: ["image_id"];
            isOneToOne: false;
            referencedRelation: "image";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_image_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "post";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_asset: {
        Row: {
          archived_url: string | null;
          captured_at: string | null;
          created_at: string;
          file_size_bytes: number | null;
          height: number | null;
          id: string;
          image_hash: string;
          ingested_at: string;
          metadata: Json | null;
          mime_type: string | null;
          post_id: string;
          source_author: string | null;
          source_domain: string | null;
          source_type: Database["public"]["Enums"]["seed_source_type"];
          source_url: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          updated_at: string;
          width: number | null;
        };
        Insert: {
          archived_url?: string | null;
          captured_at?: string | null;
          created_at?: string;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          image_hash: string;
          ingested_at?: string;
          metadata?: Json | null;
          mime_type?: string | null;
          post_id: string;
          source_author?: string | null;
          source_domain?: string | null;
          source_type?: Database["public"]["Enums"]["seed_source_type"];
          source_url?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          archived_url?: string | null;
          captured_at?: string | null;
          created_at?: string;
          file_size_bytes?: number | null;
          height?: number | null;
          id?: string;
          image_hash?: string;
          ingested_at?: string;
          metadata?: Json | null;
          mime_type?: string | null;
          post_id?: string;
          source_author?: string | null;
          source_domain?: string | null;
          source_type?: Database["public"]["Enums"]["seed_source_type"];
          source_url?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "seed_asset_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "seed_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_posts: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          artist_name: string | null;
          backend_post_id: string | null;
          candidate_generated_at: string;
          captured_at: string | null;
          context: string | null;
          created_at: string;
          created_with_solutions: boolean | null;
          export_error: string | null;
          exported_to_backend_at: string | null;
          group_name: string | null;
          id: string;
          image_url: string;
          ingested_at: string;
          media_metadata: Json | null;
          media_type: string;
          metadata: Json | null;
          ready_for_backend: boolean;
          rejected_reason: string | null;
          review_status: Database["public"]["Enums"]["seed_review_status"];
          source_author: string | null;
          source_domain: string | null;
          source_post_id: string | null;
          source_type: Database["public"]["Enums"]["seed_source_type"];
          source_url: string | null;
          source_with_items_image_id: string | null;
          status: string;
          title: string | null;
          trending_score: number | null;
          updated_at: string;
          user_id: string | null;
          view_count: number;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          artist_name?: string | null;
          backend_post_id?: string | null;
          candidate_generated_at?: string;
          captured_at?: string | null;
          context?: string | null;
          created_at?: string;
          created_with_solutions?: boolean | null;
          export_error?: string | null;
          exported_to_backend_at?: string | null;
          group_name?: string | null;
          id?: string;
          image_url: string;
          ingested_at?: string;
          media_metadata?: Json | null;
          media_type?: string;
          metadata?: Json | null;
          ready_for_backend?: boolean;
          rejected_reason?: string | null;
          review_status?: Database["public"]["Enums"]["seed_review_status"];
          source_author?: string | null;
          source_domain?: string | null;
          source_post_id?: string | null;
          source_type?: Database["public"]["Enums"]["seed_source_type"];
          source_url?: string | null;
          source_with_items_image_id?: string | null;
          status?: string;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string;
          user_id?: string | null;
          view_count?: number;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          artist_name?: string | null;
          backend_post_id?: string | null;
          candidate_generated_at?: string;
          captured_at?: string | null;
          context?: string | null;
          created_at?: string;
          created_with_solutions?: boolean | null;
          export_error?: string | null;
          exported_to_backend_at?: string | null;
          group_name?: string | null;
          id?: string;
          image_url?: string;
          ingested_at?: string;
          media_metadata?: Json | null;
          media_type?: string;
          metadata?: Json | null;
          ready_for_backend?: boolean;
          rejected_reason?: string | null;
          review_status?: Database["public"]["Enums"]["seed_review_status"];
          source_author?: string | null;
          source_domain?: string | null;
          source_post_id?: string | null;
          source_type?: Database["public"]["Enums"]["seed_source_type"];
          source_url?: string | null;
          source_with_items_image_id?: string | null;
          status?: string;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string;
          user_id?: string | null;
          view_count?: number;
        };
        Relationships: [];
      };
      seed_solutions: {
        Row: {
          accurate_count: number;
          adopted_at: string | null;
          affiliate_url: string | null;
          approved_at: string | null;
          approved_by: string | null;
          backend_solution_id: string | null;
          click_count: number;
          comment: string | null;
          created_at: string;
          description: string | null;
          different_count: number;
          export_error: string | null;
          exported_to_backend_at: string | null;
          id: string;
          is_adopted: boolean;
          is_verified: boolean;
          keywords: Json | null;
          link_type: string | null;
          match_type: string | null;
          metadata: Json | null;
          original_url: string | null;
          purchase_count: number;
          qna: Json | null;
          ready_for_backend: boolean;
          review_status: Database["public"]["Enums"]["seed_review_status"];
          source_author: string | null;
          source_domain: string | null;
          source_type: Database["public"]["Enums"]["seed_source_type"];
          source_url: string | null;
          spot_id: string;
          status: string;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          accurate_count?: number;
          adopted_at?: string | null;
          affiliate_url?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          backend_solution_id?: string | null;
          click_count?: number;
          comment?: string | null;
          created_at?: string;
          description?: string | null;
          different_count?: number;
          export_error?: string | null;
          exported_to_backend_at?: string | null;
          id?: string;
          is_adopted?: boolean;
          is_verified?: boolean;
          keywords?: Json | null;
          link_type?: string | null;
          match_type?: string | null;
          metadata?: Json | null;
          original_url?: string | null;
          purchase_count?: number;
          qna?: Json | null;
          ready_for_backend?: boolean;
          review_status?: Database["public"]["Enums"]["seed_review_status"];
          source_author?: string | null;
          source_domain?: string | null;
          source_type?: Database["public"]["Enums"]["seed_source_type"];
          source_url?: string | null;
          spot_id: string;
          status?: string;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          accurate_count?: number;
          adopted_at?: string | null;
          affiliate_url?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          backend_solution_id?: string | null;
          click_count?: number;
          comment?: string | null;
          created_at?: string;
          description?: string | null;
          different_count?: number;
          export_error?: string | null;
          exported_to_backend_at?: string | null;
          id?: string;
          is_adopted?: boolean;
          is_verified?: boolean;
          keywords?: Json | null;
          link_type?: string | null;
          match_type?: string | null;
          metadata?: Json | null;
          original_url?: string | null;
          purchase_count?: number;
          qna?: Json | null;
          ready_for_backend?: boolean;
          review_status?: Database["public"]["Enums"]["seed_review_status"];
          source_author?: string | null;
          source_domain?: string | null;
          source_type?: Database["public"]["Enums"]["seed_source_type"];
          source_url?: string | null;
          spot_id?: string;
          status?: string;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seed_solutions_spot_id_fkey";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "seed_spots";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_spots: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          backend_spot_id: string | null;
          created_at: string;
          export_error: string | null;
          exported_to_backend_at: string | null;
          id: string;
          metadata: Json | null;
          position_left: string;
          position_top: string;
          post_id: string;
          ready_for_backend: boolean;
          review_status: Database["public"]["Enums"]["seed_review_status"];
          source_image_id: string | null;
          status: string;
          subcategory_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          backend_spot_id?: string | null;
          created_at?: string;
          export_error?: string | null;
          exported_to_backend_at?: string | null;
          id?: string;
          metadata?: Json | null;
          position_left: string;
          position_top: string;
          post_id: string;
          ready_for_backend?: boolean;
          review_status?: Database["public"]["Enums"]["seed_review_status"];
          source_image_id?: string | null;
          status?: string;
          subcategory_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          backend_spot_id?: string | null;
          created_at?: string;
          export_error?: string | null;
          exported_to_backend_at?: string | null;
          id?: string;
          metadata?: Json | null;
          position_left?: string;
          position_top?: string;
          post_id?: string;
          ready_for_backend?: boolean;
          review_status?: Database["public"]["Enums"]["seed_review_status"];
          source_image_id?: string | null;
          status?: string;
          subcategory_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "seed_spots_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "seed_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      source_account: {
        Row: {
          active: boolean;
          artist_account_id: string | null;
          artist_group_account_id: string | null;
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          artist_account_id?: string | null;
          artist_group_account_id?: string | null;
          created_at?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          artist_account_id?: string | null;
          artist_group_account_id?: string | null;
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_account_artist_account_id_fkey";
            columns: ["artist_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_account_artist_group_account_id_fkey";
            columns: ["artist_group_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "source_account_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "instagram_account";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      vton_items: {
        Row: {
          brand: string | null;
          cropped_image_path: string | null;
          id: number | null;
          sam_prompt: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_orphan_images: {
        Args: {
          p_cursor_created_at?: string;
          p_cursor_id?: string;
          p_limit?: number;
        };
        Returns: {
          created_at: string;
          id: string;
          image_hash: string;
          image_url: string;
          status: Database["public"]["Enums"]["image_status"];
          with_items: boolean;
        }[];
      };
      search_vton_items: {
        Args: { result_limit?: number; search_query?: string };
        Returns: {
          brand: string;
          cropped_image_path: string;
          id: number;
          sam_prompt: string;
        }[];
      };
    };
    Enums: {
      account_type: "artist" | "artist_group" | "brand" | "source";
      CatalogStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
      image_status: "pending" | "extracted" | "skipped" | "extracted_metadata";
      seed_review_status: "draft" | "approved" | "rejected";
      seed_source_type:
        | "instagram"
        | "youtube"
        | "web"
        | "manual_upload"
        | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ============================================================================
// Utility type extractors
// ============================================================================

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = T extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][T]["Row"]
  : T extends keyof DefaultSchema["Views"]
    ? DefaultSchema["Views"][T]["Row"]
    : never;

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T];

// ============================================================================
// Convenience type aliases
// ============================================================================

export type ImageRow = Database["public"]["Tables"]["image"]["Row"];
export type ItemRow = Database["public"]["Tables"]["item"]["Row"];
export type PostRow = Database["public"]["Tables"]["post"]["Row"];
export type PostImageRow = Database["public"]["Tables"]["post_image"]["Row"];
export type InstagramAccountRow =
  Database["public"]["Tables"]["instagram_account"]["Row"];
export type SeedPostRow = Database["public"]["Tables"]["seed_posts"]["Row"];

export const Constants = {
  public: {
    Enums: {
      account_type: ["artist", "artist_group", "brand", "source"],
      CatalogStatus: ["PENDING", "PROCESSING", "COMPLETED", "ERROR"],
      image_status: ["pending", "extracted", "skipped", "extracted_metadata"],
      seed_review_status: ["draft", "approved", "rejected"],
      seed_source_type: [
        "instagram",
        "youtube",
        "web",
        "manual_upload",
        "other",
      ],
    },
  },
} as const;
