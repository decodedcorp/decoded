export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      agent_sessions: {
        Row: {
          created_at: string;
          id: string;
          keywords: Json | null;
          last_message_at: string | null;
          magazine_id: string | null;
          message_count: number | null;
          metadata: Json | null;
          status: string;
          thread_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          keywords?: Json | null;
          last_message_at?: string | null;
          magazine_id?: string | null;
          message_count?: number | null;
          metadata?: Json | null;
          status?: string;
          thread_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          keywords?: Json | null;
          last_message_at?: string | null;
          magazine_id?: string | null;
          message_count?: number | null;
          metadata?: Json | null;
          status?: string;
          thread_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_sessions_magazine_id_fkey";
            columns: ["magazine_id"];
            isOneToOne: false;
            referencedRelation: "magazines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          created_at: string;
          criteria: Json;
          description: string | null;
          icon_url: string | null;
          id: string;
          name: string;
          rarity: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          criteria: Json;
          description?: string | null;
          icon_url?: string | null;
          id: string;
          name: string;
          rarity?: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          criteria?: Json;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          name?: string;
          rarity?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          code: string;
          color_hex: string | null;
          created_at: string;
          description: Json | null;
          display_order: number;
          icon_url: string | null;
          id: string;
          is_active: boolean;
          name: Json;
          updated_at: string;
        };
        Insert: {
          code: string;
          color_hex?: string | null;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          icon_url?: string | null;
          id: string;
          is_active?: boolean;
          name: Json;
          updated_at?: string;
        };
        Update: {
          code?: string;
          color_hex?: string | null;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          icon_url?: string | null;
          id?: string;
          is_active?: boolean;
          name?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      checkpoint_blobs: {
        Row: {
          blob: string | null;
          channel: string;
          checkpoint_ns: string;
          thread_id: string;
          type: string;
          version: string;
        };
        Insert: {
          blob?: string | null;
          channel: string;
          checkpoint_ns?: string;
          thread_id: string;
          type: string;
          version: string;
        };
        Update: {
          blob?: string | null;
          channel?: string;
          checkpoint_ns?: string;
          thread_id?: string;
          type?: string;
          version?: string;
        };
        Relationships: [];
      };
      checkpoint_migrations: {
        Row: {
          v: number;
        };
        Insert: {
          v: number;
        };
        Update: {
          v?: number;
        };
        Relationships: [];
      };
      checkpoint_writes: {
        Row: {
          blob: string;
          channel: string;
          checkpoint_id: string;
          checkpoint_ns: string;
          idx: number;
          task_id: string;
          task_path: string;
          thread_id: string;
          type: string | null;
        };
        Insert: {
          blob: string;
          channel: string;
          checkpoint_id: string;
          checkpoint_ns?: string;
          idx: number;
          task_id: string;
          task_path?: string;
          thread_id: string;
          type?: string | null;
        };
        Update: {
          blob?: string;
          channel?: string;
          checkpoint_id?: string;
          checkpoint_ns?: string;
          idx?: number;
          task_id?: string;
          task_path?: string;
          thread_id?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      checkpoints: {
        Row: {
          checkpoint: Json;
          checkpoint_id: string;
          checkpoint_ns: string;
          metadata: Json;
          parent_checkpoint_id: string | null;
          thread_id: string;
          type: string | null;
        };
        Insert: {
          checkpoint: Json;
          checkpoint_id: string;
          checkpoint_ns?: string;
          metadata?: Json;
          parent_checkpoint_id?: string | null;
          thread_id: string;
          type?: string | null;
        };
        Update: {
          checkpoint?: Json;
          checkpoint_id?: string;
          checkpoint_ns?: string;
          metadata?: Json;
          parent_checkpoint_id?: string | null;
          thread_id?: string;
          type?: string | null;
        };
        Relationships: [];
      };
      click_logs: {
        Row: {
          created_at: string;
          id: string;
          ip_address: string;
          referrer: string | null;
          solution_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          ip_address: string;
          referrer?: string | null;
          solution_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          ip_address?: string;
          referrer?: string | null;
          solution_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_click_logs_solution_id";
            columns: ["solution_id"];
            isOneToOne: false;
            referencedRelation: "solutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_click_logs_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          parent_id: string | null;
          post_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id: string;
          parent_id?: string | null;
          post_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          parent_id?: string | null;
          post_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_comments_parent_id";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_comments_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_comments_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_comments_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      content_reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          resolution: string | null;
          reviewed_by: string | null;
          status: string;
          target_id: string;
          target_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id: string;
          resolution?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_id: string;
          target_type?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolution?: string | null;
          reviewed_by?: string | null;
          status?: string;
          target_id?: string;
          target_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          action_type: string;
          amount: number;
          created_at: string;
          id: string;
          reference_id: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          action_type: string;
          amount: number;
          created_at?: string;
          id: string;
          reference_id?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          action_type?: string;
          amount?: number;
          created_at?: string;
          id?: string;
          reference_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "credit_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      curation_posts: {
        Row: {
          curation_id: string;
          display_order: number;
          post_id: string;
        };
        Insert: {
          curation_id: string;
          display_order?: number;
          post_id: string;
        };
        Update: {
          curation_id?: string;
          display_order?: number;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_curation_posts_curation_id";
            columns: ["curation_id"];
            isOneToOne: false;
            referencedRelation: "curations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_curation_posts_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_curation_posts_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      curations: {
        Row: {
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          display_order: number;
          id: string;
          is_active: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at: string;
          description?: string | null;
          display_order?: number;
          id: string;
          is_active?: boolean;
          title: string;
          updated_at: string;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      decoded_picks: {
        Row: {
          created_at: string;
          curated_by: string;
          id: string;
          is_active: boolean;
          note: string | null;
          pick_date: string;
          post_id: string;
        };
        Insert: {
          created_at?: string;
          curated_by?: string;
          id?: string;
          is_active?: boolean;
          note?: string | null;
          pick_date?: string;
          post_id: string;
        };
        Update: {
          created_at?: string;
          curated_by?: string;
          id?: string;
          is_active?: boolean;
          note?: string | null;
          pick_date?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decoded_picks_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decoded_picks_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      earnings: {
        Row: {
          affiliate_platform: string | null;
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          solution_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          affiliate_platform?: string | null;
          amount: number;
          created_at?: string;
          currency?: string;
          id: string;
          solution_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          affiliate_platform?: string | null;
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          solution_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_earnings_solution_id";
            columns: ["solution_id"];
            isOneToOne: false;
            referencedRelation: "solutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_earnings_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      embeddings: {
        Row: {
          content_text: string;
          created_at: string | null;
          embedding: string;
          entity_id: string;
          entity_type: string;
          id: string;
        };
        Insert: {
          content_text: string;
          created_at?: string | null;
          embedding: string;
          entity_id: string;
          entity_type: string;
          id?: string;
        };
        Update: {
          content_text?: string;
          created_at?: string | null;
          embedding?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
        };
        Relationships: [];
      };
      failed_batch_items: {
        Row: {
          batch_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          item_id: string;
          next_retry_at: string;
          retry_count: number;
          status: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          error_message?: string | null;
          id: string;
          item_id: string;
          next_retry_at: string;
          retry_count?: number;
          status: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          batch_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          item_id?: string;
          next_retry_at?: string;
          retry_count?: number;
          status?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      magazine_posts: {
        Row: {
          magazine_id: string;
          post_id: string;
          section_index: number;
        };
        Insert: {
          magazine_id: string;
          post_id: string;
          section_index?: number;
        };
        Update: {
          magazine_id?: string;
          post_id?: string;
          section_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "magazine_posts_magazine_id_fkey";
            columns: ["magazine_id"];
            isOneToOne: false;
            referencedRelation: "magazines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "magazine_posts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "magazine_posts_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      magazines: {
        Row: {
          agent_version: string | null;
          artists: Json | null;
          cover_image_url: string | null;
          created_at: string;
          generation_log: Json | null;
          id: string;
          keywords: Json;
          published_at: string | null;
          published_by: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          spec: Json;
          status: string;
          subtitle: string | null;
          theme: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          agent_version?: string | null;
          artists?: Json | null;
          cover_image_url?: string | null;
          created_at?: string;
          generation_log?: Json | null;
          id?: string;
          keywords?: Json;
          published_at?: string | null;
          published_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          spec?: Json;
          status?: string;
          subtitle?: string | null;
          theme?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          agent_version?: string | null;
          artists?: Json | null;
          cover_image_url?: string | null;
          created_at?: string;
          generation_log?: Json | null;
          id?: string;
          keywords?: Json;
          published_at?: string | null;
          published_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          spec?: Json;
          status?: string;
          subtitle?: string | null;
          theme?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "magazines_published_by_fkey";
            columns: ["published_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "magazines_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      point_logs: {
        Row: {
          activity_type: string;
          created_at: string;
          description: string | null;
          id: string;
          points: number;
          ref_id: string | null;
          ref_type: string | null;
          user_id: string;
        };
        Insert: {
          activity_type: string;
          created_at?: string;
          description?: string | null;
          id: string;
          points: number;
          ref_id?: string | null;
          ref_type?: string | null;
          user_id: string;
        };
        Update: {
          activity_type?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          points?: number;
          ref_id?: string | null;
          ref_type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_point_logs_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      post_likes: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_post_likes_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_post_likes_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_post_likes_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      post_magazine_news_references: {
        Row: {
          created_at: string;
          credibility_score: number;
          id: string;
          matched_item: string | null;
          og_description: string | null;
          og_image: string | null;
          og_site_name: string | null;
          og_title: string | null;
          post_magazine_id: string;
          relevance_score: number;
          source: string;
          summary: string | null;
          title: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          credibility_score?: number;
          id?: string;
          matched_item?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_site_name?: string | null;
          og_title?: string | null;
          post_magazine_id: string;
          relevance_score?: number;
          source: string;
          summary?: string | null;
          title: string;
          url: string;
        };
        Update: {
          created_at?: string;
          credibility_score?: number;
          id?: string;
          matched_item?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          og_site_name?: string | null;
          og_title?: string | null;
          post_magazine_id?: string;
          relevance_score?: number;
          source?: string;
          summary?: string | null;
          title?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_magazine_news_references_post_magazine_id_fkey";
            columns: ["post_magazine_id"];
            isOneToOne: false;
            referencedRelation: "post_magazines";
            referencedColumns: ["id"];
          },
        ];
      };
      post_magazines: {
        Row: {
          approved_by: string | null;
          created_at: string;
          error_log: Json | null;
          id: string;
          keyword: string | null;
          layout_json: Json | null;
          published_at: string | null;
          rejection_reason: string | null;
          review_summary: string | null;
          status: string;
          subtitle: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          approved_by?: string | null;
          created_at?: string;
          error_log?: Json | null;
          id?: string;
          keyword?: string | null;
          layout_json?: Json | null;
          published_at?: string | null;
          rejection_reason?: string | null;
          review_summary?: string | null;
          status?: string;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
        Update: {
          approved_by?: string | null;
          created_at?: string;
          error_log?: Json | null;
          id?: string;
          keyword?: string | null;
          layout_json?: Json | null;
          published_at?: string | null;
          rejection_reason?: string | null;
          review_summary?: string | null;
          status?: string;
          subtitle?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          ai_summary: string | null;
          artist_id: string | null;
          artist_name: string | null;
          context: string | null;
          created_at: string;
          created_with_solutions: boolean | null;
          group_id: string | null;
          group_name: string | null;
          id: string;
          image_height: number | null;
          image_url: string;
          image_width: number | null;
          media_metadata: Json | null;
          media_type: string;
          post_magazine_id: string | null;
          status: string;
          style_tags: Json | null;
          title: string | null;
          trending_score: number | null;
          updated_at: string;
          user_id: string;
          view_count: number;
        };
        Insert: {
          ai_summary?: string | null;
          artist_id?: string | null;
          artist_name?: string | null;
          context?: string | null;
          created_at?: string;
          created_with_solutions?: boolean | null;
          group_id?: string | null;
          group_name?: string | null;
          id: string;
          image_height?: number | null;
          image_url: string;
          image_width?: number | null;
          media_metadata?: Json | null;
          media_type: string;
          post_magazine_id?: string | null;
          status?: string;
          style_tags?: Json | null;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string;
          user_id: string;
          view_count?: number;
        };
        Update: {
          ai_summary?: string | null;
          artist_id?: string | null;
          artist_name?: string | null;
          context?: string | null;
          created_at?: string;
          created_with_solutions?: boolean | null;
          group_id?: string | null;
          group_name?: string | null;
          id?: string;
          image_height?: number | null;
          image_url?: string;
          image_width?: number | null;
          media_metadata?: Json | null;
          media_type?: string;
          post_magazine_id?: string | null;
          status?: string;
          style_tags?: Json | null;
          title?: string | null;
          trending_score?: number | null;
          updated_at?: string;
          user_id?: string;
          view_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_posts_post_magazine_id";
            columns: ["post_magazine_id"];
            isOneToOne: false;
            referencedRelation: "post_magazines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_posts_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      processed_batches: {
        Row: {
          batch_id: string;
          created_at: string;
          failed_count: number;
          partial_count: number;
          processing_time_ms: number;
          processing_timestamp: string;
          success_count: number;
          total_count: number;
        };
        Insert: {
          batch_id: string;
          created_at?: string;
          failed_count: number;
          partial_count: number;
          processing_time_ms: number;
          processing_timestamp: string;
          success_count: number;
          total_count: number;
        };
        Update: {
          batch_id?: string;
          created_at?: string;
          failed_count?: number;
          partial_count?: number;
          processing_time_ms?: number;
          processing_timestamp?: string;
          success_count?: number;
          total_count?: number;
        };
        Relationships: [];
      };
      saved_posts: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_saved_posts_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_saved_posts_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_saved_posts_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      seaql_migrations: {
        Row: {
          applied_at: number;
          version: string;
        };
        Insert: {
          applied_at: number;
          version: string;
        };
        Update: {
          applied_at?: number;
          version?: string;
        };
        Relationships: [];
      };
      search_logs: {
        Row: {
          created_at: string;
          filters: Json | null;
          id: string;
          query: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          filters?: Json | null;
          id: string;
          query: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          filters?: Json | null;
          id?: string;
          query?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_search_logs_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          amount: number;
          bank_info: Json | null;
          created_at: string;
          currency: string;
          id: string;
          processed_at: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          bank_info?: Json | null;
          created_at?: string;
          currency?: string;
          id: string;
          processed_at?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          bank_info?: Json | null;
          created_at?: string;
          currency?: string;
          id?: string;
          processed_at?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_settlements_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      solutions: {
        Row: {
          accurate_count: number;
          adopted_at: string | null;
          affiliate_url: string | null;
          brand_id: string | null;
          click_count: number;
          comment: string | null;
          created_at: string;
          description: string | null;
          different_count: number;
          id: string;
          is_adopted: boolean;
          is_verified: boolean;
          keywords: Json | null;
          link_type: string | null;
          match_type: string | null;
          metadata: Json | null;
          original_url: string | null;
          price_amount: number | null;
          price_currency: string | null;
          purchase_count: number;
          qna: Json | null;
          spot_id: string;
          status: string;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          accurate_count?: number;
          adopted_at?: string | null;
          affiliate_url?: string | null;
          brand_id?: string | null;
          click_count?: number;
          comment?: string | null;
          created_at?: string;
          description?: string | null;
          different_count?: number;
          id: string;
          is_adopted?: boolean;
          is_verified?: boolean;
          keywords?: Json | null;
          link_type?: string | null;
          match_type?: string | null;
          metadata?: Json | null;
          original_url?: string | null;
          price_amount?: number | null;
          price_currency?: string | null;
          purchase_count?: number;
          qna?: Json | null;
          spot_id: string;
          status?: string;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          accurate_count?: number;
          adopted_at?: string | null;
          affiliate_url?: string | null;
          brand_id?: string | null;
          click_count?: number;
          comment?: string | null;
          created_at?: string;
          description?: string | null;
          different_count?: number;
          id?: string;
          is_adopted?: boolean;
          is_verified?: boolean;
          keywords?: Json | null;
          link_type?: string | null;
          match_type?: string | null;
          metadata?: Json | null;
          original_url?: string | null;
          price_amount?: number | null;
          price_currency?: string | null;
          purchase_count?: number;
          qna?: Json | null;
          spot_id?: string;
          status?: string;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_solutions_spot_id";
            columns: ["spot_id"];
            isOneToOne: false;
            referencedRelation: "spots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_solutions_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      spots: {
        Row: {
          created_at: string;
          id: string;
          position_left: string;
          position_top: string;
          post_id: string;
          status: string;
          subcategory_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          position_left: string;
          position_top: string;
          post_id: string;
          status?: string;
          subcategory_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position_left?: string;
          position_top?: string;
          post_id?: string;
          status?: string;
          subcategory_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_spots_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "explore_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_spots_post_id";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_spots_subcategory_id";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "subcategories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_spots_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      subcategories: {
        Row: {
          category_id: string;
          code: string;
          created_at: string;
          description: Json | null;
          display_order: number;
          id: string;
          is_active: boolean;
          name: Json;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          code: string;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          id: string;
          is_active?: boolean;
          name: Json;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          code?: string;
          created_at?: string;
          description?: Json | null;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_subcategories_category_id";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      synonyms: {
        Row: {
          canonical: string;
          created_at: string;
          id: string;
          is_active: boolean;
          synonyms: string[];
          type: string;
          updated_at: string;
        };
        Insert: {
          canonical: string;
          created_at?: string;
          id: string;
          is_active?: boolean;
          synonyms: string[];
          type: string;
          updated_at?: string;
        };
        Update: {
          canonical?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          synonyms?: string[];
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_user_badges_badge_id";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_user_badges_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_collections: {
        Row: {
          created_at: string;
          id: string;
          is_pinned: boolean;
          magazine_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          is_pinned?: boolean;
          magazine_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_pinned?: boolean;
          magazine_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_collections_magazine_id_fkey";
            columns: ["magazine_id"];
            isOneToOne: false;
            referencedRelation: "user_magazines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_collections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_events: {
        Row: {
          created_at: string;
          entity_id: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          page_path: string;
          session_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          page_path: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          page_path?: string;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      user_magazines: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          layout_json: Json | null;
          magazine_type: string;
          theme_palette: Json | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id: string;
          layout_json?: Json | null;
          magazine_type: string;
          theme_palette?: Json | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
          layout_json?: Json | null;
          magazine_type?: string;
          theme_palette?: Json | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_magazines_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_social_accounts: {
        Row: {
          access_token: string;
          created_at: string;
          id: string;
          last_synced_at: string | null;
          provider: string;
          provider_user_id: string;
          refresh_token: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          created_at?: string;
          id: string;
          last_synced_at?: string | null;
          provider: string;
          provider_user_id: string;
          refresh_token?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          created_at?: string;
          id?: string;
          last_synced_at?: string | null;
          provider?: string;
          provider_user_id?: string;
          refresh_token?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_social_accounts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_tryon_history: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          style_combination: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          style_combination?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          style_combination?: Json | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_tryon_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          email: string;
          id: string;
          ink_credits: number;
          is_admin: boolean;
          rank: string;
          studio_config: Json | null;
          style_dna: Json | null;
          total_points: number;
          updated_at: string;
          username: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email: string;
          id: string;
          ink_credits?: number;
          is_admin?: boolean;
          rank?: string;
          studio_config?: Json | null;
          style_dna?: Json | null;
          total_points?: number;
          updated_at?: string;
          username: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string;
          id?: string;
          ink_credits?: number;
          is_admin?: boolean;
          rank?: string;
          studio_config?: Json | null;
          style_dna?: Json | null;
          total_points?: number;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      view_logs: {
        Row: {
          created_at: string;
          id: string;
          reference_id: string;
          reference_type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          reference_id: string;
          reference_type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          reference_id?: string;
          reference_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_view_logs_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          created_at: string;
          id: string;
          solution_id: string;
          user_id: string;
          vote_type: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          solution_id: string;
          user_id: string;
          vote_type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          solution_id?: string;
          user_id?: string;
          vote_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_votes_solution_id";
            columns: ["solution_id"];
            isOneToOne: false;
            referencedRelation: "solutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_votes_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      explore_posts: {
        Row: {
          ai_summary: string | null;
          artist_id: string | null;
          artist_name: string | null;
          context: string | null;
          created_at: string | null;
          created_with_solutions: boolean | null;
          group_id: string | null;
          group_name: string | null;
          id: string | null;
          image_url: string | null;
          media_metadata: Json | null;
          media_type: string | null;
          post_magazine_id: string | null;
          post_magazine_title: string | null;
          status: string | null;
          title: string | null;
          trending_score: number | null;
          updated_at: string | null;
          user_id: string | null;
          view_count: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_posts_post_magazine_id";
            columns: ["post_magazine_id"];
            isOneToOne: false;
            referencedRelation: "post_magazines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_posts_user_id";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_daily_metrics: {
        Args: { p_from_ts: string; p_to_ts: string };
        Returns: {
          clicks: number;
          dau: number;
          day: string;
          searches: number;
        }[];
      };
      admin_distinct_user_count: {
        Args: { p_from_ts: string; p_to_ts: string };
        Returns: number;
      };
      is_admin: { Args: { user_id: string }; Returns: boolean };
      search_similar: {
        Args: {
          filter_type?: string;
          match_count?: number;
          query_embedding: string;
        };
        Returns: {
          content_text: string;
          entity_id: string;
          entity_type: string;
          similarity: number;
        }[];
      };
      update_magazine_status: {
        Args: {
          p_admin_user_id: string;
          p_magazine_id: string;
          p_new_status: string;
          p_rejection_reason?: string;
        };
        Returns: {
          approved_by: string | null;
          created_at: string;
          error_log: Json | null;
          id: string;
          keyword: string | null;
          layout_json: Json | null;
          published_at: string | null;
          rejection_reason: string | null;
          review_summary: string | null;
          status: string;
          subtitle: string | null;
          title: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "post_magazines";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
