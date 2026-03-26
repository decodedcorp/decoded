/**
 * Supabase Warehouse Schema Types
 *
 * Auto-generated from warehouse schema via `supabase gen types`.
 * Last updated: 2026-03-26
 *
 * Regenerate: npx supabase gen types typescript --project-id fvxchskblyhuswzlcmql --schema warehouse
 *
 * Tables:
 * - artists - Artist entities (K-pop, etc.) with i18n names
 * - brands - Brand entities with logos
 * - groups - Group entities (K-pop groups, etc.)
 * - group_members - Artist-to-group membership
 * - instagram_accounts - Instagram account tracking (artist/group/brand/source)
 * - posts - Instagram posts collected via ETL
 * - images - Post images with hash deduplication
 * - seed_posts - Curated posts for publishing pipeline
 * - seed_spots - Item spot annotations on seed posts
 * - seed_solutions - Product matches for seed spots
 * - seed_asset - Archived image assets for seed posts
 *
 * Enums:
 * - account_type: artist | group | brand | source | influencer | place | other
 * - entity_ig_role: primary | regional | secondary
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WarehouseDatabase = {
  warehouse: {
    Tables: {
      artists: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json | null;
          name_en: string | null;
          name_ko: string | null;
          primary_instagram_account_id: string | null;
          profile_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          primary_instagram_account_id?: string | null;
          profile_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          primary_instagram_account_id?: string | null;
          profile_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artists_primary_instagram_account_id_fkey";
            columns: ["primary_instagram_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      brands: {
        Row: {
          created_at: string;
          id: string;
          logo_image_url: string | null;
          metadata: Json | null;
          name_en: string | null;
          name_ko: string | null;
          primary_instagram_account_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo_image_url?: string | null;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          primary_instagram_account_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_image_url?: string | null;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          primary_instagram_account_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brands_primary_instagram_account_id_fkey";
            columns: ["primary_instagram_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          artist_id: string;
          created_at: string;
          group_id: string;
          is_active: boolean;
          metadata: Json | null;
          updated_at: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          group_id: string;
          is_active?: boolean;
          metadata?: Json | null;
          updated_at?: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          group_id?: string;
          is_active?: boolean;
          metadata?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json | null;
          name_en: string | null;
          name_ko: string | null;
          primary_instagram_account_id: string | null;
          profile_image_url: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          primary_instagram_account_id?: string | null;
          profile_image_url?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          primary_instagram_account_id?: string | null;
          profile_image_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_primary_instagram_account_id_fkey";
            columns: ["primary_instagram_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      images: {
        Row: {
          created_at: string;
          id: string;
          image_hash: string;
          image_url: string;
          post_id: string;
          status: string;
          with_items: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_hash: string;
          image_url: string;
          post_id: string;
          status?: string;
          with_items?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_hash?: string;
          image_url?: string;
          post_id?: string;
          status?: string;
          with_items?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_images_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      instagram_accounts: {
        Row: {
          account_type: WarehouseDatabase["warehouse"]["Enums"]["account_type"];
          artist_id: string | null;
          bio: string | null;
          brand_id: string | null;
          created_at: string;
          display_name: string | null;
          entity_ig_role:
            | WarehouseDatabase["warehouse"]["Enums"]["entity_ig_role"]
            | null;
          entity_region_code: string | null;
          id: string;
          is_active: boolean;
          metadata: Json | null;
          name_en: string | null;
          name_ko: string | null;
          needs_review: boolean | null;
          profile_image_url: string | null;
          updated_at: string;
          username: string;
          wikidata_id: string | null;
          wikidata_status: string | null;
        };
        Insert: {
          account_type: WarehouseDatabase["warehouse"]["Enums"]["account_type"];
          artist_id?: string | null;
          bio?: string | null;
          brand_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          entity_ig_role?:
            | WarehouseDatabase["warehouse"]["Enums"]["entity_ig_role"]
            | null;
          entity_region_code?: string | null;
          id?: string;
          is_active?: boolean;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          needs_review?: boolean | null;
          profile_image_url?: string | null;
          updated_at?: string;
          username: string;
          wikidata_id?: string | null;
          wikidata_status?: string | null;
        };
        Update: {
          account_type?: WarehouseDatabase["warehouse"]["Enums"]["account_type"];
          artist_id?: string | null;
          bio?: string | null;
          brand_id?: string | null;
          created_at?: string;
          display_name?: string | null;
          entity_ig_role?:
            | WarehouseDatabase["warehouse"]["Enums"]["entity_ig_role"]
            | null;
          entity_region_code?: string | null;
          id?: string;
          is_active?: boolean;
          metadata?: Json | null;
          name_en?: string | null;
          name_ko?: string | null;
          needs_review?: boolean | null;
          profile_image_url?: string | null;
          updated_at?: string;
          username?: string;
          wikidata_id?: string | null;
          wikidata_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "instagram_accounts_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          account_id: string;
          caption_text: string | null;
          created_at: string;
          id: string;
          posted_at: string;
          tagged_account_ids: string[] | null;
        };
        Insert: {
          account_id: string;
          caption_text?: string | null;
          created_at?: string;
          id?: string;
          posted_at: string;
          tagged_account_ids?: string[] | null;
        };
        Update: {
          account_id?: string;
          caption_text?: string | null;
          created_at?: string;
          id?: string;
          posted_at?: string;
          tagged_account_ids?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_posts_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_asset: {
        Row: {
          archived_url: string | null;
          created_at: string;
          id: string;
          image_hash: string;
          metadata: Json | null;
          seed_post_id: string;
          source_domain: string | null;
          source_url: string | null;
          updated_at: string;
        };
        Insert: {
          archived_url?: string | null;
          created_at?: string;
          id?: string;
          image_hash: string;
          metadata?: Json | null;
          seed_post_id: string;
          source_domain?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_url?: string | null;
          created_at?: string;
          id?: string;
          image_hash?: string;
          metadata?: Json | null;
          seed_post_id?: string;
          source_domain?: string | null;
          source_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_asset_seed_post_id_fkey";
            columns: ["seed_post_id"];
            isOneToOne: false;
            referencedRelation: "seed_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_posts: {
        Row: {
          artist_account_id: string | null;
          backend_post_id: string | null;
          context: string | null;
          created_at: string;
          group_account_id: string | null;
          id: string;
          image_url: string;
          media_source: Json | null;
          metadata: Json | null;
          publish_error: string | null;
          source_image_id: string | null;
          source_post_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          artist_account_id?: string | null;
          backend_post_id?: string | null;
          context?: string | null;
          created_at?: string;
          group_account_id?: string | null;
          id?: string;
          image_url: string;
          media_source?: Json | null;
          metadata?: Json | null;
          publish_error?: string | null;
          source_image_id?: string | null;
          source_post_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          artist_account_id?: string | null;
          backend_post_id?: string | null;
          context?: string | null;
          created_at?: string;
          group_account_id?: string | null;
          id?: string;
          image_url?: string;
          media_source?: Json | null;
          metadata?: Json | null;
          publish_error?: string | null;
          source_image_id?: string | null;
          source_post_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_posts_artist_account_id_fkey";
            columns: ["artist_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_seed_posts_group_account_id_fkey";
            columns: ["group_account_id"];
            isOneToOne: false;
            referencedRelation: "instagram_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_seed_posts_source_image_id_fkey";
            columns: ["source_image_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "warehouse_seed_posts_source_post_id_fkey";
            columns: ["source_post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_solutions: {
        Row: {
          backend_solution_id: string | null;
          brand: string | null;
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json | null;
          original_url: string | null;
          price_amount: number | null;
          price_currency: string | null;
          product_name: string | null;
          publish_error: string | null;
          seed_spot_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          backend_solution_id?: string | null;
          brand?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          original_url?: string | null;
          price_amount?: number | null;
          price_currency?: string | null;
          product_name?: string | null;
          publish_error?: string | null;
          seed_spot_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          backend_solution_id?: string | null;
          brand?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          original_url?: string | null;
          price_amount?: number | null;
          price_currency?: string | null;
          product_name?: string | null;
          publish_error?: string | null;
          seed_spot_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_solutions_seed_spot_id_fkey";
            columns: ["seed_spot_id"];
            isOneToOne: false;
            referencedRelation: "seed_spots";
            referencedColumns: ["id"];
          },
        ];
      };
      seed_spots: {
        Row: {
          backend_spot_id: string | null;
          created_at: string;
          id: string;
          position_left: string;
          position_top: string;
          publish_error: string | null;
          request_order: number;
          seed_post_id: string;
          status: string;
          subcategory_code: string | null;
          updated_at: string;
        };
        Insert: {
          backend_spot_id?: string | null;
          created_at?: string;
          id?: string;
          position_left: string;
          position_top: string;
          publish_error?: string | null;
          request_order: number;
          seed_post_id: string;
          status?: string;
          subcategory_code?: string | null;
          updated_at?: string;
        };
        Update: {
          backend_spot_id?: string | null;
          created_at?: string;
          id?: string;
          position_left?: string;
          position_top?: string;
          publish_error?: string | null;
          request_order?: number;
          seed_post_id?: string;
          status?: string;
          subcategory_code?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_spots_seed_post_id_fkey";
            columns: ["seed_post_id"];
            isOneToOne: false;
            referencedRelation: "seed_posts";
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
      account_type:
        | "artist"
        | "group"
        | "brand"
        | "source"
        | "influencer"
        | "place"
        | "other";
      entity_ig_role: "primary" | "regional" | "secondary";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ── Convenience Row aliases ──────────────────────────────────────────
type WarehouseTables = WarehouseDatabase["warehouse"]["Tables"];

export type ArtistRow = WarehouseTables["artists"]["Row"];
export type BrandRow = WarehouseTables["brands"]["Row"];
export type GroupRow = WarehouseTables["groups"]["Row"];
export type GroupMemberRow = WarehouseTables["group_members"]["Row"];
export type InstagramAccountRow = WarehouseTables["instagram_accounts"]["Row"];
export type WarehousePostRow = WarehouseTables["posts"]["Row"];
export type WarehouseImageRow = WarehouseTables["images"]["Row"];
export type SeedPostRow = WarehouseTables["seed_posts"]["Row"];
export type SeedSpotRow = WarehouseTables["seed_spots"]["Row"];
export type SeedSolutionRow = WarehouseTables["seed_solutions"]["Row"];
export type SeedAssetRow = WarehouseTables["seed_asset"]["Row"];

// ── Enum aliases ─────────────────────────────────────────────────────
type WarehouseEnums = WarehouseDatabase["warehouse"]["Enums"];

export type AccountType = WarehouseEnums["account_type"];
export type EntityIgRole = WarehouseEnums["entity_ig_role"];
