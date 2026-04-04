/**
 * Supabase Database Types
 *
 * Auto-generated from actual database schema inspection.
 * Last updated: 2026-03-18
 *
 * Tables:
 * - posts - Main content posts with images
 * - users - User profiles and stats
 * - categories - Item categories (i18n)
 * - subcategories - Item subcategories (i18n)
 * - badges - Achievement badges
 * - user_badges - User-badge assignments
 * - spots - Item locations in images
 * - solutions - Product matches for spots
 * - comments - Post comments
 * - user_events - Behavioral event tracking (30-day TTL)
 * - user_tryon_history - VTON history
 * - user_social_accounts - OAuth SNS connections
 * - decoded_picks - Editor/AI curated daily picks for homepage
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Internationalized text (Korean/English)
 */
export interface I18nText {
  ko: string;
  en: string;
}

export type Database = {
  public: {
    Tables: {
      // =================================================================
      // CORE CONTENT
      // =================================================================

      /**
       * Decoded Picks - Editor/AI curated daily picks for homepage
       */
      decoded_picks: {
        Row: {
          id: string;
          post_id: string;
          pick_date: string;
          note: string | null;
          curated_by: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          pick_date?: string;
          note?: string | null;
          curated_by?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          pick_date?: string;
          note?: string | null;
          curated_by?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decoded_picks_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };

      /**
       * Posts - Main content with images
       * 591 records
       */
      posts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string | null;
          media_type: string | null; // 'event', 'paparazzi', etc.
          media_title: string | null;
          media_metadata: Json;
          group_name: string | null;
          artist_name: string | null;
          context: string | null; // 'street style', 'street', etc.
          view_count: number;
          status: string; // 'active', 'inactive', etc.
          created_at: string;
          updated_at: string;
          trending_score: number | null;
          post_magazine_id: string | null;
          ai_summary: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url?: string | null;
          media_type?: string | null;
          media_title?: string | null;
          media_metadata?: Json;
          group_name?: string | null;
          artist_name?: string | null;
          context?: string | null;
          view_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          trending_score?: number | null;
          post_magazine_id?: string | null;
          ai_summary?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string | null;
          media_type?: string | null;
          media_title?: string | null;
          media_metadata?: Json;
          group_name?: string | null;
          artist_name?: string | null;
          context?: string | null;
          view_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          trending_score?: number | null;
          post_magazine_id?: string | null;
          ai_summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_posts_post_magazine_id";
            columns: ["post_magazine_id"];
            referencedRelation: "post_magazines";
            referencedColumns: ["id"];
          },
        ];
      };

      /**
       * Post Magazines - Editorial magazine content
       */
      post_magazines: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          keyword: string | null;
          layout_json: Json | null;
          status: string;
          review_summary: string | null;
          thread_id: string | null;
          error_log: Json | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          keyword?: string | null;
          layout_json?: Json | null;
          status?: string;
          review_summary?: string | null;
          thread_id?: string | null;
          error_log?: Json | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          keyword?: string | null;
          layout_json?: Json | null;
          status?: string;
          review_summary?: string | null;
          thread_id?: string | null;
          error_log?: Json | null;
          updated_at?: string;
          published_at?: string | null;
        };
        Relationships: [];
      };

      /**
       * Comments - Post comments
       * 0 records (empty)
       */
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      // =================================================================
      // USER MANAGEMENT
      // =================================================================

      /**
       * Users - User profiles and stats
       * 3 records
       */
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          rank: string | null; // 'Member', etc.
          total_points: number;
          is_admin: boolean;
          ink_credits: number;
          style_dna: Record<string, unknown> | null;
          studio_config: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          rank?: string | null;
          total_points?: number;
          is_admin?: boolean;
          ink_credits?: number;
          style_dna?: Record<string, unknown> | null;
          studio_config?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          rank?: string | null;
          total_points?: number;
          is_admin?: boolean;
          ink_credits?: number;
          style_dna?: Record<string, unknown> | null;
          studio_config?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      /**
       * User Social Accounts - OAuth SNS connections
       */
      user_social_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_user_id: string;
          access_token: string;
          refresh_token: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          provider_user_id: string;
          access_token: string;
          refresh_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_user_id?: string;
          access_token?: string;
          refresh_token?: string | null;
          last_synced_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      /**
       * User Try-on History - VTON history
       */
      user_tryon_history: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          style_combination: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          style_combination?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          style_combination?: Record<string, unknown> | null;
        };
        Relationships: [];
      };

      /**
       * User Events - Behavioral event tracking
       * Immutable (insert-only), 30-day TTL via pg_cron
       */
      user_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string; // post_click, post_view, spot_click, search_query, category_filter, dwell_time, scroll_depth
          entity_id: string | null;
          session_id: string;
          page_path: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          entity_id?: string | null;
          session_id: string;
          page_path: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          entity_id?: string | null;
          session_id?: string;
          page_path?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      /**
       * User Badges - Badge assignments
       */
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };

      // =================================================================
      // CATEGORIES & CLASSIFICATION
      // =================================================================

      /**
       * Categories - Item categories (i18n)
       * 5 records: wearables, accessories, beauty, lifestyle, other
       */
      categories: {
        Row: {
          id: string;
          code: string; // 'wearables', 'accessories', etc.
          name: I18nText; // { ko: '패션 아이템', en: 'Wearables' }
          icon_url: string | null;
          color_hex: string | null;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: I18nText;
          icon_url?: string | null;
          color_hex?: string | null;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: I18nText;
          icon_url?: string | null;
          color_hex?: string | null;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      /**
       * Subcategories - Item subcategories (i18n)
       * 23 records: headwear, eyewear, tops, bottoms, etc.
       */
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          code: string; // 'headwear', 'eyewear', etc.
          name: I18nText; // { ko: '모자', en: 'Headwear' }
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          code: string;
          name: I18nText;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          code?: string;
          name?: I18nText;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };

      /**
       * Badges - Achievement badges
       * 20 records
       */
      badges: {
        Row: {
          id: string;
          type: string; // 'achievement', etc.
          name: string;
          description: string;
          icon_url: string | null;
          criteria: Json; // { type: 'count', threshold: 1 }
          rarity: string; // 'common', 'rare', 'epic', 'legendary'
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          name: string;
          description: string;
          icon_url?: string | null;
          criteria?: Json;
          rarity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          name?: string;
          description?: string;
          icon_url?: string | null;
          criteria?: Json;
          rarity?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // =================================================================
      // SPOTS & SOLUTIONS (Item Detection/Matching)
      // =================================================================

      /**
       * Spots - Item locations in images
       * 2 records
       */
      spots: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          position_left: string; // Percentage (e.g., "26.26788036410923")
          position_top: string; // Percentage (e.g., "30.54806828391734")
          subcategory_id: string;
          status: string; // 'open', 'solved', etc.
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          position_left: string;
          position_top: string;
          subcategory_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          position_left?: string;
          position_top?: string;
          subcategory_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spots_post_id_fkey";
            columns: ["post_id"];
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spots_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "spots_subcategory_id_fkey";
            columns: ["subcategory_id"];
            referencedRelation: "subcategories";
            referencedColumns: ["id"];
          },
        ];
      };

      /**
       * Solutions - Product matches for spots
       * 12 records
       */
      solutions: {
        Row: {
          id: string;
          spot_id: string;
          user_id: string;
          match_type: string | null;
          title: string;

          price_amount: number | null;
          price_currency: string; // 'KRW', 'USD', etc.
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
          status: string; // 'active', 'inactive', etc.
          created_at: string;
          updated_at: string;
          metadata: Json | null;
          comment: string | null;
          qna: Json | null;
          keywords: string[] | null;
        };
        Insert: {
          id?: string;
          spot_id: string;
          user_id: string;
          match_type?: string | null;
          title: string;

          price_amount?: number | null;
          price_currency?: string;
          original_url: string;
          affiliate_url?: string | null;
          thumbnail_url?: string | null;
          description?: string;
          accurate_count?: number;
          different_count?: number;
          is_verified?: boolean;
          is_adopted?: boolean;
          adopted_at?: string | null;
          click_count?: number;
          purchase_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
          comment?: string | null;
          qna?: Json | null;
          keywords?: string[] | null;
        };
        Update: {
          id?: string;
          spot_id?: string;
          user_id?: string;
          match_type?: string | null;
          title?: string;

          price_amount?: number | null;
          price_currency?: string;
          original_url?: string;
          affiliate_url?: string | null;
          thumbnail_url?: string | null;
          description?: string;
          accurate_count?: number;
          different_count?: number;
          is_verified?: boolean;
          is_adopted?: boolean;
          adopted_at?: string | null;
          click_count?: number;
          purchase_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
          metadata?: Json | null;
          comment?: string | null;
          qna?: Json | null;
          keywords?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "solutions_spot_id_fkey";
            columns: ["spot_id"];
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solutions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      // Note: These are inferred from data, not from actual DB enums
      post_status: "active" | "inactive" | "pending" | "deleted";
      spot_status: "open" | "solved" | "closed";
      solution_status: "active" | "inactive" | "pending" | "deleted";
      badge_rarity: "common" | "rare" | "epic" | "legendary";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// =============================================================================
// TYPE ALIASES
// =============================================================================

// Core content
export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];
export type CommentUpdate = Database["public"]["Tables"]["comments"]["Update"];

// User management
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type UserBadgeRow = Database["public"]["Tables"]["user_badges"]["Row"];

// Categories
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type SubcategoryRow =
  Database["public"]["Tables"]["subcategories"]["Row"];
export type BadgeRow = Database["public"]["Tables"]["badges"]["Row"];

// Events
export type UserEventRow = Database["public"]["Tables"]["user_events"]["Row"];
export type UserEventInsert =
  Database["public"]["Tables"]["user_events"]["Insert"];

// Try-on history
export type UserTryonHistoryRow =
  Database["public"]["Tables"]["user_tryon_history"]["Row"];

// Post Magazines
export type PostMagazineRow = Database["public"]["Tables"]["post_magazines"]["Row"];

// Spots & Solutions
export type SpotRow = Database["public"]["Tables"]["spots"]["Row"];
export type SpotInsert = Database["public"]["Tables"]["spots"]["Insert"];
export type SpotUpdate = Database["public"]["Tables"]["spots"]["Update"];

export type SolutionRow = Database["public"]["Tables"]["solutions"]["Row"];
export type SolutionInsert =
  Database["public"]["Tables"]["solutions"]["Insert"];
export type SolutionUpdate =
  Database["public"]["Tables"]["solutions"]["Update"];

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic table row type extractor
 */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/**
 * Generic table insert type extractor
 */
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/**
 * Generic table update type extractor
 */
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

/**
 * Enum type extractor
 */
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

// =============================================================================
// LEGACY COMPATIBILITY (deprecated, will be removed)
// =============================================================================

/**
 * @deprecated Use PostRow instead - Legacy image type for backward compatibility
 */
export interface ImageRow {
  id: string;
  image_url: string | null;
  created_at: string;
  image_hash: string;
  status: "pending" | "extracted" | "skipped" | "extracted_metadata";
  with_items: boolean;
}

/**
 * @deprecated Use SolutionRow instead - Legacy item type for backward compatibility
 */
export interface ItemRow {
  id: number;
  image_id: string;

  title: string | null;
  cropped_image_path: string | null;
  price: string | null;
  description: string | null;
  status: string | null;
  created_at: string | null;
}
