export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_sessions: {
        Row: {
          created_at: string
          id: string
          keywords: Json | null
          last_message_at: string | null
          magazine_id: string | null
          message_count: number | null
          metadata: Json | null
          status: string
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          keywords?: Json | null
          last_message_at?: string | null
          magazine_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          status?: string
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          keywords?: Json | null
          last_message_at?: string | null
          magazine_id?: string | null
          message_count?: number | null
          metadata?: Json | null
          status?: string
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_magazine_id_fkey"
            columns: ["magazine_id"]
            isOneToOne: false
            referencedRelation: "magazines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          criteria: Json
          description: string | null
          icon_url: string | null
          id: string
          name: string
          rarity: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria: Json
          description?: string | null
          icon_url?: string | null
          id: string
          name: string
          rarity?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          rarity?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          code: string
          color_hex: string | null
          created_at: string
          description: Json | null
          display_order: number
          icon_url: string | null
          id: string
          is_active: boolean
          name: Json
          updated_at: string
        }
        Insert: {
          code: string
          color_hex?: string | null
          created_at?: string
          description?: Json | null
          display_order?: number
          icon_url?: string | null
          id: string
          is_active?: boolean
          name: Json
          updated_at?: string
        }
        Update: {
          code?: string
          color_hex?: string | null
          created_at?: string
          description?: Json | null
          display_order?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: Json
          updated_at?: string
        }
        Relationships: []
      }
      checkpoint_blobs: {
        Row: {
          blob: string | null
          channel: string
          checkpoint_ns: string
          thread_id: string
          type: string
          version: string
        }
        Insert: {
          blob?: string | null
          channel: string
          checkpoint_ns?: string
          thread_id: string
          type: string
          version: string
        }
        Update: {
          blob?: string | null
          channel?: string
          checkpoint_ns?: string
          thread_id?: string
          type?: string
          version?: string
        }
        Relationships: []
      }
      checkpoint_migrations: {
        Row: {
          v: number
        }
        Insert: {
          v: number
        }
        Update: {
          v?: number
        }
        Relationships: []
      }
      checkpoint_writes: {
        Row: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns: string
          idx: number
          task_id: string
          task_path: string
          thread_id: string
          type: string | null
        }
        Insert: {
          blob: string
          channel: string
          checkpoint_id: string
          checkpoint_ns?: string
          idx: number
          task_id: string
          task_path?: string
          thread_id: string
          type?: string | null
        }
        Update: {
          blob?: string
          channel?: string
          checkpoint_id?: string
          checkpoint_ns?: string
          idx?: number
          task_id?: string
          task_path?: string
          thread_id?: string
          type?: string | null
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns: string
          metadata: Json
          parent_checkpoint_id: string | null
          thread_id: string
          type: string | null
        }
        Insert: {
          checkpoint: Json
          checkpoint_id: string
          checkpoint_ns?: string
          metadata?: Json
          parent_checkpoint_id?: string | null
          thread_id: string
          type?: string | null
        }
        Update: {
          checkpoint?: Json
          checkpoint_id?: string
          checkpoint_ns?: string
          metadata?: Json
          parent_checkpoint_id?: string | null
          thread_id?: string
          type?: string | null
        }
        Relationships: []
      }
      click_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          referrer: string | null
          solution_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          ip_address: string
          referrer?: string | null
          solution_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          referrer?: string | null
          solution_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_click_logs_solution_id"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_click_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comments_parent_id"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolution: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          reference_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          id: string
          reference_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          reference_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      curation_posts: {
        Row: {
          curation_id: string
          display_order: number
          post_id: string
        }
        Insert: {
          curation_id: string
          display_order?: number
          post_id: string
        }
        Update: {
          curation_id?: string
          display_order?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_curation_posts_curation_id"
            columns: ["curation_id"]
            isOneToOne: false
            referencedRelation: "curations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_curation_posts_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_curation_posts_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      curations: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at: string
          description?: string | null
          display_order?: number
          id: string
          is_active?: boolean
          title: string
          updated_at: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      decoded_picks: {
        Row: {
          created_at: string
          curated_by: string
          id: string
          is_active: boolean
          note: string | null
          pick_date: string
          post_id: string
        }
        Insert: {
          created_at?: string
          curated_by?: string
          id?: string
          is_active?: boolean
          note?: string | null
          pick_date?: string
          post_id: string
        }
        Update: {
          created_at?: string
          curated_by?: string
          id?: string
          is_active?: boolean
          note?: string | null
          pick_date?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decoded_picks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decoded_picks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      earnings: {
        Row: {
          affiliate_platform: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          solution_id: string
          status: string
          user_id: string
        }
        Insert: {
          affiliate_platform?: string | null
          amount: number
          created_at?: string
          currency?: string
          id: string
          solution_id: string
          status?: string
          user_id: string
        }
        Update: {
          affiliate_platform?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          solution_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_earnings_solution_id"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_earnings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          content_text: string
          created_at: string | null
          embedding: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          content_text: string
          created_at?: string | null
          embedding: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          content_text?: string
          created_at?: string | null
          embedding?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      failed_batch_items: {
        Row: {
          batch_id: string
          created_at: string
          error_message: string | null
          id: string
          item_id: string
          next_retry_at: string
          retry_count: number
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          error_message?: string | null
          id: string
          item_id: string
          next_retry_at: string
          retry_count?: number
          status: string
          updated_at?: string
          url: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          item_id?: string
          next_retry_at?: string
          retry_count?: number
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      magazine_posts: {
        Row: {
          magazine_id: string
          post_id: string
          section_index: number
        }
        Insert: {
          magazine_id: string
          post_id: string
          section_index?: number
        }
        Update: {
          magazine_id?: string
          post_id?: string
          section_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "magazine_posts_magazine_id_fkey"
            columns: ["magazine_id"]
            isOneToOne: false
            referencedRelation: "magazines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magazine_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magazine_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      magazines: {
        Row: {
          agent_version: string | null
          artists: Json | null
          cover_image_url: string | null
          created_at: string
          generation_log: Json | null
          id: string
          keywords: Json
          published_at: string | null
          published_by: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          spec: Json
          status: string
          subtitle: string | null
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agent_version?: string | null
          artists?: Json | null
          cover_image_url?: string | null
          created_at?: string
          generation_log?: Json | null
          id?: string
          keywords?: Json
          published_at?: string | null
          published_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spec?: Json
          status?: string
          subtitle?: string | null
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agent_version?: string | null
          artists?: Json | null
          cover_image_url?: string | null
          created_at?: string
          generation_log?: Json | null
          id?: string
          keywords?: Json
          published_at?: string | null
          published_by?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spec?: Json
          status?: string
          subtitle?: string | null
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "magazines_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magazines_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      point_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          points: number
          ref_id: string | null
          ref_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id: string
          points: number
          ref_id?: string | null
          ref_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          ref_id?: string | null
          ref_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_point_logs_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_post_likes_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_likes_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_post_likes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_magazines: {
        Row: {
          created_at: string
          error_log: Json | null
          id: string
          keyword: string | null
          layout_json: Json | null
          published_at: string | null
          review_summary: string | null
          status: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_log?: Json | null
          id?: string
          keyword?: string | null
          layout_json?: Json | null
          published_at?: string | null
          review_summary?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_log?: Json | null
          id?: string
          keyword?: string | null
          layout_json?: Json | null
          published_at?: string | null
          review_summary?: string | null
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          ai_summary: string | null
          artist_id: string | null
          artist_name: string | null
          context: string | null
          created_at: string
          created_with_solutions: boolean | null
          group_id: string | null
          group_name: string | null
          id: string
          image_url: string
          media_metadata: Json | null
          media_type: string
          post_magazine_id: string | null
          status: string
          style_tags: Json | null
          title: string | null
          trending_score: number | null
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          ai_summary?: string | null
          artist_id?: string | null
          artist_name?: string | null
          context?: string | null
          created_at?: string
          created_with_solutions?: boolean | null
          group_id?: string | null
          group_name?: string | null
          id: string
          image_url: string
          media_metadata?: Json | null
          media_type: string
          post_magazine_id?: string | null
          status?: string
          style_tags?: Json | null
          title?: string | null
          trending_score?: number | null
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          ai_summary?: string | null
          artist_id?: string | null
          artist_name?: string | null
          context?: string | null
          created_at?: string
          created_with_solutions?: boolean | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          image_url?: string
          media_metadata?: Json | null
          media_type?: string
          post_magazine_id?: string | null
          status?: string
          style_tags?: Json | null
          title?: string | null
          trending_score?: number | null
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_post_magazine_id"
            columns: ["post_magazine_id"]
            isOneToOne: false
            referencedRelation: "post_magazines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_batches: {
        Row: {
          batch_id: string
          created_at: string
          failed_count: number
          partial_count: number
          processing_time_ms: number
          processing_timestamp: string
          success_count: number
          total_count: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          failed_count: number
          partial_count: number
          processing_time_ms: number
          processing_timestamp: string
          success_count: number
          total_count: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          failed_count?: number
          partial_count?: number
          processing_time_ms?: number
          processing_timestamp?: string
          success_count?: number
          total_count?: number
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saved_posts_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_saved_posts_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_saved_posts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seaql_migrations: {
        Row: {
          applied_at: number
          version: string
        }
        Insert: {
          applied_at: number
          version: string
        }
        Update: {
          applied_at?: number
          version?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          filters: Json | null
          id: string
          query: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          filters?: Json | null
          id: string
          query: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          filters?: Json | null
          id?: string
          query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_search_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          bank_info: Json | null
          created_at: string
          currency: string
          id: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_info?: Json | null
          created_at?: string
          currency?: string
          id: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_info?: Json | null
          created_at?: string
          currency?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_settlements_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          accurate_count: number
          adopted_at: string | null
          affiliate_url: string | null
          brand_id: string | null
          click_count: number
          comment: string | null
          created_at: string
          description: string | null
          different_count: number
          id: string
          is_adopted: boolean
          is_verified: boolean
          keywords: Json | null
          link_type: string | null
          match_type: string | null
          metadata: Json | null
          original_url: string | null
          price_amount: number | null
          price_currency: string | null
          purchase_count: number
          qna: Json | null
          spot_id: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accurate_count?: number
          adopted_at?: string | null
          affiliate_url?: string | null
          brand_id?: string | null
          click_count?: number
          comment?: string | null
          created_at?: string
          description?: string | null
          different_count?: number
          id: string
          is_adopted?: boolean
          is_verified?: boolean
          keywords?: Json | null
          link_type?: string | null
          match_type?: string | null
          metadata?: Json | null
          original_url?: string | null
          price_amount?: number | null
          price_currency?: string | null
          purchase_count?: number
          qna?: Json | null
          spot_id: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accurate_count?: number
          adopted_at?: string | null
          affiliate_url?: string | null
          brand_id?: string | null
          click_count?: number
          comment?: string | null
          created_at?: string
          description?: string | null
          different_count?: number
          id?: string
          is_adopted?: boolean
          is_verified?: boolean
          keywords?: Json | null
          link_type?: string | null
          match_type?: string | null
          metadata?: Json | null
          original_url?: string | null
          price_amount?: number | null
          price_currency?: string | null
          purchase_count?: number
          qna?: Json | null
          spot_id?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_solutions_spot_id"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_solutions_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spots: {
        Row: {
          created_at: string
          id: string
          position_left: string
          position_top: string
          post_id: string
          status: string
          subcategory_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          position_left: string
          position_top: string
          post_id: string
          status?: string
          subcategory_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position_left?: string
          position_top?: string
          post_id?: string
          status?: string
          subcategory_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_spots_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "explore_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_spots_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_spots_subcategory_id"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_spots_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          code: string
          created_at: string
          description: Json | null
          display_order: number
          id: string
          is_active: boolean
          name: Json
          updated_at: string
        }
        Insert: {
          category_id: string
          code: string
          created_at?: string
          description?: Json | null
          display_order?: number
          id: string
          is_active?: boolean
          name: Json
          updated_at?: string
        }
        Update: {
          category_id?: string
          code?: string
          created_at?: string
          description?: Json | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subcategories_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      synonyms: {
        Row: {
          canonical: string
          created_at: string
          id: string
          is_active: boolean
          synonyms: string[]
          type: string
          updated_at: string
        }
        Insert: {
          canonical: string
          created_at?: string
          id: string
          is_active?: boolean
          synonyms: string[]
          type: string
          updated_at?: string
        }
        Update: {
          canonical?: string
          created_at?: string
          id?: string
          is_active?: boolean
          synonyms?: string[]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_badges_badge_id"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_badges_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collections: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          magazine_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          is_pinned?: boolean
          magazine_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          magazine_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_collections_magazine_id_fkey"
            columns: ["magazine_id"]
            isOneToOne: false
            referencedRelation: "user_magazines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string
          entity_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          page_path: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_path: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      user_magazines: {
        Row: {
          created_at: string
          created_by: string
          id: string
          layout_json: Json | null
          magazine_type: string
          theme_palette: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id: string
          layout_json?: Json | null
          magazine_type: string
          theme_palette?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          layout_json?: Json | null
          magazine_type?: string
          theme_palette?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_magazines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_accounts: {
        Row: {
          access_token: string
          created_at: string
          id: string
          last_synced_at: string | null
          provider: string
          provider_user_id: string
          refresh_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id: string
          last_synced_at?: string | null
          provider: string
          provider_user_id: string
          refresh_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          provider?: string
          provider_user_id?: string
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_social_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tryon_history: {
        Row: {
          created_at: string
          id: string
          image_url: string
          style_combination: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          style_combination?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          style_combination?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tryon_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          ink_credits: number
          is_admin: boolean
          rank: string
          studio_config: Json | null
          style_dna: Json | null
          total_points: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          ink_credits?: number
          is_admin?: boolean
          rank?: string
          studio_config?: Json | null
          style_dna?: Json | null
          total_points?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          ink_credits?: number
          is_admin?: boolean
          rank?: string
          studio_config?: Json | null
          style_dna?: Json | null
          total_points?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      view_logs: {
        Row: {
          created_at: string
          id: string
          reference_id: string
          reference_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id: string
          reference_id: string
          reference_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reference_id?: string
          reference_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_view_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          solution_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id: string
          solution_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          solution_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_votes_solution_id"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_votes_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      explore_posts: {
        Row: {
          ai_summary: string | null
          artist_id: string | null
          artist_name: string | null
          context: string | null
          created_at: string | null
          created_with_solutions: boolean | null
          group_id: string | null
          group_name: string | null
          id: string | null
          image_url: string | null
          media_metadata: Json | null
          media_type: string | null
          post_magazine_id: string | null
          post_magazine_title: string | null
          status: string | null
          title: string | null
          trending_score: number | null
          updated_at: string | null
          user_id: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_posts_post_magazine_id"
            columns: ["post_magazine_id"]
            isOneToOne: false
            referencedRelation: "post_magazines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_posts_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      search_similar: {
        Args: {
          filter_type?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content_text: string
          entity_id: string
          entity_type: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  warehouse: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          admin_user_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          name_en: string | null
          name_ko: string | null
          primary_instagram_account_id: string | null
          profile_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          primary_instagram_account_id?: string | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          primary_instagram_account_id?: string | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_primary_instagram_account_id_fkey"
            columns: ["primary_instagram_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_image_url: string | null
          metadata: Json | null
          name_en: string | null
          name_ko: string | null
          primary_instagram_account_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_image_url?: string | null
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          primary_instagram_account_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_image_url?: string | null
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          primary_instagram_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_primary_instagram_account_id_fkey"
            columns: ["primary_instagram_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          artist_id: string
          created_at: string
          group_id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          group_id: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          group_id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          name_en: string | null
          name_ko: string | null
          primary_instagram_account_id: string | null
          profile_image_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          primary_instagram_account_id?: string | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          primary_instagram_account_id?: string | null
          profile_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_primary_instagram_account_id_fkey"
            columns: ["primary_instagram_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          created_at: string
          id: string
          image_hash: string
          image_url: string
          post_id: string
          status: string
          with_items: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          image_hash: string
          image_url: string
          post_id: string
          status?: string
          with_items?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          image_hash?: string
          image_url?: string
          post_id?: string
          status?: string
          with_items?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_accounts: {
        Row: {
          account_type: Database["warehouse"]["Enums"]["account_type"]
          artist_id: string | null
          bio: string | null
          brand_id: string | null
          created_at: string
          display_name: string | null
          entity_ig_role:
            | Database["warehouse"]["Enums"]["entity_ig_role"]
            | null
          entity_region_code: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name_en: string | null
          name_ko: string | null
          needs_review: boolean | null
          profile_image_url: string | null
          updated_at: string
          username: string
          wikidata_id: string | null
          wikidata_status: string | null
        }
        Insert: {
          account_type: Database["warehouse"]["Enums"]["account_type"]
          artist_id?: string | null
          bio?: string | null
          brand_id?: string | null
          created_at?: string
          display_name?: string | null
          entity_ig_role?:
            | Database["warehouse"]["Enums"]["entity_ig_role"]
            | null
          entity_region_code?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          needs_review?: boolean | null
          profile_image_url?: string | null
          updated_at?: string
          username: string
          wikidata_id?: string | null
          wikidata_status?: string | null
        }
        Update: {
          account_type?: Database["warehouse"]["Enums"]["account_type"]
          artist_id?: string | null
          bio?: string | null
          brand_id?: string | null
          created_at?: string
          display_name?: string | null
          entity_ig_role?:
            | Database["warehouse"]["Enums"]["entity_ig_role"]
            | null
          entity_region_code?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name_en?: string | null
          name_ko?: string | null
          needs_review?: boolean | null
          profile_image_url?: string | null
          updated_at?: string
          username?: string
          wikidata_id?: string | null
          wikidata_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_accounts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          account_id: string
          caption_text: string | null
          created_at: string
          id: string
          posted_at: string
          tagged_account_ids: string[] | null
        }
        Insert: {
          account_id: string
          caption_text?: string | null
          created_at?: string
          id?: string
          posted_at: string
          tagged_account_ids?: string[] | null
        }
        Update: {
          account_id?: string
          caption_text?: string | null
          created_at?: string
          id?: string
          posted_at?: string
          tagged_account_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_asset: {
        Row: {
          archived_url: string | null
          created_at: string
          id: string
          image_hash: string
          metadata: Json | null
          seed_post_id: string
          source_domain: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          archived_url?: string | null
          created_at?: string
          id?: string
          image_hash: string
          metadata?: Json | null
          seed_post_id: string
          source_domain?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          archived_url?: string | null
          created_at?: string
          id?: string
          image_hash?: string
          metadata?: Json | null
          seed_post_id?: string
          source_domain?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_asset_seed_post_id_fkey"
            columns: ["seed_post_id"]
            isOneToOne: false
            referencedRelation: "seed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_posts: {
        Row: {
          artist_account_id: string | null
          backend_post_id: string | null
          context: string | null
          created_at: string
          group_account_id: string | null
          id: string
          image_url: string
          media_source: Json | null
          metadata: Json | null
          publish_error: string | null
          source_image_id: string | null
          source_post_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          artist_account_id?: string | null
          backend_post_id?: string | null
          context?: string | null
          created_at?: string
          group_account_id?: string | null
          id?: string
          image_url: string
          media_source?: Json | null
          metadata?: Json | null
          publish_error?: string | null
          source_image_id?: string | null
          source_post_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          artist_account_id?: string | null
          backend_post_id?: string | null
          context?: string | null
          created_at?: string
          group_account_id?: string | null
          id?: string
          image_url?: string
          media_source?: Json | null
          metadata?: Json | null
          publish_error?: string | null
          source_image_id?: string | null
          source_post_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_posts_artist_account_id_fkey"
            columns: ["artist_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_seed_posts_group_account_id_fkey"
            columns: ["group_account_id"]
            isOneToOne: false
            referencedRelation: "instagram_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_seed_posts_source_image_id_fkey"
            columns: ["source_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_seed_posts_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_solutions: {
        Row: {
          backend_solution_id: string | null
          brand: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          original_url: string | null
          price_amount: number | null
          price_currency: string | null
          product_name: string | null
          publish_error: string | null
          seed_spot_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          backend_solution_id?: string | null
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          original_url?: string | null
          price_amount?: number | null
          price_currency?: string | null
          product_name?: string | null
          publish_error?: string | null
          seed_spot_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          backend_solution_id?: string | null
          brand?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          original_url?: string | null
          price_amount?: number | null
          price_currency?: string | null
          product_name?: string | null
          publish_error?: string | null
          seed_spot_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_solutions_seed_spot_id_fkey"
            columns: ["seed_spot_id"]
            isOneToOne: false
            referencedRelation: "seed_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      seed_spots: {
        Row: {
          backend_spot_id: string | null
          created_at: string
          id: string
          position_left: string
          position_top: string
          publish_error: string | null
          request_order: number
          seed_post_id: string
          status: string
          subcategory_code: string | null
          updated_at: string
        }
        Insert: {
          backend_spot_id?: string | null
          created_at?: string
          id?: string
          position_left: string
          position_top: string
          publish_error?: string | null
          request_order: number
          seed_post_id: string
          status?: string
          subcategory_code?: string | null
          updated_at?: string
        }
        Update: {
          backend_spot_id?: string | null
          created_at?: string
          id?: string
          position_left?: string
          position_top?: string
          publish_error?: string | null
          request_order?: number
          seed_post_id?: string
          status?: string
          subcategory_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_seed_spots_seed_post_id_fkey"
            columns: ["seed_post_id"]
            isOneToOne: false
            referencedRelation: "seed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type:
        | "artist"
        | "group"
        | "brand"
        | "source"
        | "influencer"
        | "place"
        | "other"
      entity_ig_role: "primary" | "regional" | "secondary"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
  warehouse: {
    Enums: {
      account_type: [
        "artist",
        "group",
        "brand",
        "source",
        "influencer",
        "place",
        "other",
      ],
      entity_ig_role: ["primary", "regional", "secondary"],
    },
  },
} as const

// =============================================================================
// CUSTOM TYPE ALIASES (manually maintained)
// =============================================================================

/**
 * Internationalized text (Korean/English)
 */
export interface I18nText {
  ko: string;
  en: string;
}

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
export type PostMagazineRow =
  Database["public"]["Tables"]["post_magazines"]["Row"];

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
