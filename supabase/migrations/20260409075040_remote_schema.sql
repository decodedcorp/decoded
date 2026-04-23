-- #282: extensions schema + vector extension (Supabase 관례)
CREATE SCHEMA IF NOT EXISTS "extensions";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "warehouse";


ALTER SCHEMA "warehouse" OWNER TO "postgres";


CREATE TYPE "warehouse"."account_type" AS ENUM (
    'artist',
    'group',
    'brand',
    'source',
    'influencer',
    'place',
    'other',
    'company',
    'designer'
);


ALTER TYPE "warehouse"."account_type" OWNER TO "postgres";


CREATE TYPE "warehouse"."entity_ig_role" AS ENUM (
    'primary',
    'regional',
    'secondary'
);


ALTER TYPE "warehouse"."entity_ig_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_daily_metrics"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) RETURNS TABLE("day" "date", "clicks" integer, "searches" integer, "dau" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_from_ts IS NULL OR p_to_ts IS NULL
     OR NOT isfinite(p_from_ts) OR NOT isfinite(p_to_ts)
     OR p_to_ts <= p_from_ts THEN
    RAISE EXCEPTION 'invalid_range' USING ERRCODE = 'P0001';
  END IF;

  IF (p_to_ts - p_from_ts) > INTERVAL '366 days' THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  WITH
    c AS (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*)::int AS n
      FROM public.click_logs
      WHERE created_at >= p_from_ts AND created_at < p_to_ts
      GROUP BY 1
    ),
    s AS (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*)::int AS n
      FROM public.search_logs
      WHERE created_at >= p_from_ts AND created_at < p_to_ts
      GROUP BY 1
    ),
    e AS (
      SELECT date_trunc('day', created_at)::date AS d,
             COUNT(DISTINCT user_id)::int AS n
      FROM public.user_events
      WHERE created_at >= p_from_ts AND created_at < p_to_ts
      GROUP BY 1
    ),
    days AS (
      SELECT generate_series(
        date_trunc('day', p_from_ts)::date,
        date_trunc('day', p_to_ts - INTERVAL '1 microsecond')::date,
        INTERVAL '1 day'
      )::date AS d
    )
  SELECT
    days.d,
    COALESCE(c.n, 0),
    COALESCE(s.n, 0),
    COALESCE(e.n, 0)
  FROM days
  LEFT JOIN c USING (d)
  LEFT JOIN s USING (d)
  LEFT JOIN e USING (d)
  ORDER BY days.d;
END;
$$;


ALTER FUNCTION "public"."admin_daily_metrics"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_distinct_user_count"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_from_ts IS NULL OR p_to_ts IS NULL
     OR NOT isfinite(p_from_ts) OR NOT isfinite(p_to_ts)
     OR p_to_ts <= p_from_ts THEN
    RAISE EXCEPTION 'invalid_range' USING ERRCODE = 'P0001';
  END IF;

  IF (p_to_ts - p_from_ts) > INTERVAL '366 days' THEN
    RAISE EXCEPTION 'range_too_large' USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(DISTINCT user_id)::INTEGER
  INTO v_count
  FROM public.user_events
  WHERE created_at >= p_from_ts
    AND created_at <  p_to_ts;

  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."admin_distinct_user_count"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    INSERT INTO public.users (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Supabase Auth에서 새 사용자 생성 시 public.users 테이블에 자동으로 레코드 생성';



CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = user_id),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_similar"("query_embedding" "extensions"."vector", "match_count" integer DEFAULT 10, "filter_type" character varying DEFAULT NULL::character varying) RETURNS TABLE("entity_type" character varying, "entity_id" "uuid", "content_text" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT e.entity_type, e.entity_id, e.content_text,
           1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.embeddings e
    WHERE (filter_type IS NULL OR e.entity_type = filter_type)
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."search_similar"("query_embedding" "extensions"."vector", "match_count" integer, "filter_type" character varying) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."post_magazines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying DEFAULT 'Untitled'::character varying NOT NULL,
    "subtitle" "text",
    "keyword" character varying,
    "layout_json" "jsonb",
    "status" character varying DEFAULT 'draft'::character varying NOT NULL,
    "review_summary" "text",
    "error_log" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "published_at" timestamp with time zone,
    "approved_by" "uuid",
    "rejection_reason" "text",
    CONSTRAINT "post_magazines_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'published'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."post_magazines" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_magazine_status"("p_magazine_id" "uuid", "p_new_status" character varying, "p_admin_user_id" "uuid", "p_rejection_reason" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."post_magazines"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'warehouse', 'pg_temp'
    AS $$
DECLARE
  v_before public.post_magazines;
  v_after public.post_magazines;
  v_action TEXT;
  v_caller UUID := auth.uid();
BEGIN
  IF v_caller IS NOT NULL AND v_caller <> p_admin_user_id THEN
    RAISE EXCEPTION 'caller_mismatch' USING ERRCODE = 'P0003';
  END IF;

  IF NOT public.is_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'caller_not_admin' USING ERRCODE = 'P0003';
  END IF;

  IF p_rejection_reason IS NOT NULL AND length(p_rejection_reason) > 2000 THEN
    RAISE EXCEPTION 'rejection_reason_too_long' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_before FROM public.post_magazines
    WHERE id = p_magazine_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'magazine_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (
    (v_before.status = 'draft'     AND p_new_status = 'pending')   OR
    (v_before.status = 'pending'   AND p_new_status = 'published') OR
    (v_before.status = 'pending'   AND p_new_status = 'rejected')  OR
    (v_before.status = 'rejected'  AND p_new_status = 'pending')   OR
    (v_before.status = 'published' AND p_new_status = 'draft')
  ) THEN
    RAISE EXCEPTION 'invalid_transition: % -> %', v_before.status, p_new_status
      USING ERRCODE = 'P0001';
  END IF;

  IF p_new_status = 'rejected' AND (p_rejection_reason IS NULL OR length(trim(p_rejection_reason)) = 0) THEN
    RAISE EXCEPTION 'rejection_reason_required' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.post_magazines
  SET status = p_new_status,
      approved_by = CASE WHEN p_new_status = 'published' THEN p_admin_user_id ELSE approved_by END,
      published_at = CASE WHEN p_new_status = 'published' THEN now() ELSE published_at END,
      rejection_reason = CASE WHEN p_new_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
      updated_at = now()
  WHERE id = p_magazine_id
  RETURNING * INTO v_after;

  v_action := CASE p_new_status
    WHEN 'published' THEN 'magazine_approve'
    WHEN 'rejected'  THEN 'magazine_reject'
    WHEN 'pending'   THEN 'magazine_submit'
    WHEN 'draft'     THEN 'magazine_unpublish'
    ELSE 'magazine_status_change'
  END;

  INSERT INTO warehouse.admin_audit_log (
    admin_user_id, action, target_table, target_id,
    before_state, after_state, metadata
  ) VALUES (
    p_admin_user_id, v_action, 'post_magazines', p_magazine_id,
    row_to_json(v_before)::jsonb,
    row_to_json(v_after)::jsonb,
    jsonb_build_object('rejection_reason', p_rejection_reason)
  );

  RETURN NEXT v_after;
END;
$$;


ALTER FUNCTION "public"."update_magazine_status"("p_magazine_id" "uuid", "p_new_status" character varying, "p_admin_user_id" "uuid", "p_rejection_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "warehouse"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
            BEGIN
              NEW.updated_at = now();
              RETURN NEW;
            END;
            $$;


ALTER FUNCTION "warehouse"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "warehouse"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "warehouse"."touch_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" character varying(100) NOT NULL,
    "magazine_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "keywords" "jsonb" DEFAULT '[]'::"jsonb",
    "message_count" integer DEFAULT 0,
    "last_message_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."agent_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "icon_url" "text",
    "criteria" "jsonb" NOT NULL,
    "rarity" character varying(20) DEFAULT 'common'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" json NOT NULL,
    "icon_url" "text",
    "color_hex" character varying(7),
    "description" json,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkpoint_blobs" (
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT ''::"text" NOT NULL,
    "channel" "text" NOT NULL,
    "version" "text" NOT NULL,
    "type" "text" NOT NULL,
    "blob" "bytea"
);


ALTER TABLE "public"."checkpoint_blobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkpoint_migrations" (
    "v" integer NOT NULL
);


ALTER TABLE "public"."checkpoint_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkpoint_writes" (
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT ''::"text" NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "task_id" "text" NOT NULL,
    "idx" integer NOT NULL,
    "channel" "text" NOT NULL,
    "type" "text",
    "blob" "bytea" NOT NULL,
    "task_path" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."checkpoint_writes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkpoints" (
    "thread_id" "text" NOT NULL,
    "checkpoint_ns" "text" DEFAULT ''::"text" NOT NULL,
    "checkpoint_id" "text" NOT NULL,
    "parent_checkpoint_id" "text",
    "type" "text",
    "checkpoint" "jsonb" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."checkpoints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."click_logs" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "solution_id" "uuid" NOT NULL,
    "ip_address" character varying(45) NOT NULL,
    "user_agent" "text",
    "referrer" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."click_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_type" character varying(32) DEFAULT 'post'::character varying NOT NULL,
    "target_id" "uuid" NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reason" character varying(64) NOT NULL,
    "details" "text",
    "status" character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    "resolution" "text",
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."content_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "action_type" character varying(50) NOT NULL,
    "status" character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."curation_posts" (
    "curation_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."curation_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."curations" (
    "id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "cover_image_url" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp without time zone NOT NULL,
    "updated_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."curations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decoded_picks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "pick_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "note" "text",
    "curated_by" character varying DEFAULT 'system'::character varying NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."decoded_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."earnings" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "solution_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(10) DEFAULT 'KRW'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "affiliate_platform" character varying(50),
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."earnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."embeddings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity_type" character varying(20) NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "content_text" "text" NOT NULL,
    "embedding" "extensions"."vector"(256) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "media_type" character varying(50) NOT NULL,
    "title" character varying(255),
    "media_metadata" json,
    "group_name" character varying(100),
    "artist_name" character varying(100),
    "context" character varying(50),
    "view_count" integer DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "trending_score" double precision,
    "created_with_solutions" boolean,
    "post_magazine_id" "uuid",
    "ai_summary" "text",
    "artist_id" "uuid",
    "group_id" "uuid",
    "style_tags" "jsonb",
    "image_width" integer,
    "image_height" integer,
    "parent_post_id" "uuid",
    "post_type" character varying(20)
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."posts"."artist_id" IS 'FK to warehouse.artists.id (backfilled from legacy artist_name)';



COMMENT ON COLUMN "public"."posts"."group_id" IS 'FK to warehouse.groups.id (backfilled from legacy group_name)';



COMMENT ON COLUMN "public"."posts"."image_width" IS 'Original image width in pixels';



COMMENT ON COLUMN "public"."posts"."image_height" IS 'Original image height in pixels';



CREATE OR REPLACE VIEW "public"."explore_posts" WITH ("security_invoker"='true') AS
 SELECT "p"."id",
    "p"."user_id",
    "p"."image_url",
    "p"."media_type",
    "p"."title",
    "p"."media_metadata",
    "p"."group_name",
    "p"."artist_name",
    "p"."context",
    "p"."view_count",
    "p"."status",
    "p"."created_at",
    "p"."updated_at",
    "p"."trending_score",
    "p"."created_with_solutions",
    "p"."post_magazine_id",
    "p"."ai_summary",
    "p"."artist_id",
    "p"."group_id",
    "pm"."title" AS "post_magazine_title"
   FROM ("public"."posts" "p"
     JOIN "public"."post_magazines" "pm" ON (("pm"."id" = "p"."post_magazine_id")))
  WHERE ((("p"."status")::"text" = 'active'::"text") AND ("p"."image_url" IS NOT NULL) AND ("p"."created_with_solutions" = true) AND (("pm"."status")::"text" = 'published'::"text"));


ALTER VIEW "public"."explore_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."failed_batch_items" (
    "id" "uuid" NOT NULL,
    "item_id" character varying(255) NOT NULL,
    "batch_id" character varying(255) NOT NULL,
    "url" "text" NOT NULL,
    "status" character varying(50) NOT NULL,
    "error_message" "text",
    "retry_count" integer DEFAULT 0 NOT NULL,
    "next_retry_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."failed_batch_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."magazine_posts" (
    "magazine_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "section_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."magazine_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."magazines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "subtitle" "text",
    "keywords" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "spec" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "cover_image_url" "text",
    "theme" character varying(50),
    "artists" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    "review_notes" "text",
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "published_at" timestamp with time zone,
    "published_by" "uuid",
    "agent_version" character varying(20),
    "generation_log" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."magazines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_logs" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_type" character varying NOT NULL,
    "points" integer NOT NULL,
    "ref_id" "uuid",
    "ref_type" character varying,
    "description" character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."point_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_magazine_news_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_magazine_id" "uuid" NOT NULL,
    "title" character varying NOT NULL,
    "url" character varying NOT NULL,
    "source" character varying NOT NULL,
    "summary" "text",
    "og_title" character varying,
    "og_description" "text",
    "og_image" character varying,
    "og_site_name" character varying,
    "relevance_score" double precision DEFAULT 0 NOT NULL,
    "credibility_score" double precision DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "matched_item" character varying
);


ALTER TABLE "public"."post_magazine_news_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processed_batches" (
    "batch_id" character varying(255) NOT NULL,
    "processing_timestamp" timestamp with time zone NOT NULL,
    "total_count" integer NOT NULL,
    "success_count" integer NOT NULL,
    "partial_count" integer NOT NULL,
    "failed_count" integer NOT NULL,
    "processing_time_ms" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."processed_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_posts" (
    "id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."saved_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seaql_migrations" (
    "version" character varying NOT NULL,
    "applied_at" bigint NOT NULL
);


ALTER TABLE "public"."seaql_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_logs" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "query" character varying(255) NOT NULL,
    "filters" json,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."search_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settlements" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" character varying(10) DEFAULT 'KRW'::character varying NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "bank_info" "jsonb",
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."settlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."solutions" (
    "id" "uuid" NOT NULL,
    "spot_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_type" character varying(20),
    "title" character varying(255) NOT NULL,
    "original_url" "text",
    "affiliate_url" "text",
    "thumbnail_url" "text",
    "description" "text",
    "accurate_count" integer DEFAULT 0 NOT NULL,
    "different_count" integer DEFAULT 0 NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "is_adopted" boolean DEFAULT false NOT NULL,
    "adopted_at" timestamp with time zone,
    "click_count" integer DEFAULT 0 NOT NULL,
    "purchase_count" integer DEFAULT 0 NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "metadata" "jsonb",
    "comment" "text",
    "qna" "jsonb",
    "keywords" "jsonb",
    "link_type" character varying(20) DEFAULT 'other'::character varying,
    "brand_id" "uuid",
    "price_amount" numeric(12,2),
    "price_currency" character varying(10) DEFAULT 'KRW'::character varying
);


ALTER TABLE "public"."solutions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."solutions"."metadata" IS 'Product metadata (price, brand, etc.)';



COMMENT ON COLUMN "public"."solutions"."comment" IS 'Solver 코멘트 (상품 설명과 구분)';



COMMENT ON COLUMN "public"."solutions"."qna" IS 'Question and Answer pairs from Gemini analysis';



COMMENT ON COLUMN "public"."solutions"."link_type" IS 'Link type: product | article | video | other';



COMMENT ON COLUMN "public"."solutions"."brand_id" IS 'FK to warehouse.brands.id (backfilled from metadata.brand)';



CREATE TABLE IF NOT EXISTS "public"."spots" (
    "id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "position_left" "text" NOT NULL,
    "position_top" "text" NOT NULL,
    "subcategory_id" "uuid",
    "status" character varying(20) DEFAULT 'open'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."spots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcategories" (
    "id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" json NOT NULL,
    "description" json,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."synonyms" (
    "id" "uuid" NOT NULL,
    "type" character varying(50) NOT NULL,
    "canonical" character varying(255) NOT NULL,
    "synonyms" "text"[] NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."synonyms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."try_spot_tags" (
    "id" "uuid" NOT NULL,
    "try_post_id" "uuid" NOT NULL,
    "spot_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."try_spot_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "user_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_collections" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "magazine_id" "uuid" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" character varying NOT NULL,
    "entity_id" "uuid",
    "session_id" character varying NOT NULL,
    "page_path" character varying NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_magazines" (
    "id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "magazine_type" character varying(20) NOT NULL,
    "title" "text" NOT NULL,
    "theme_palette" "jsonb",
    "layout_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_magazines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_social_accounts" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" character varying(20) NOT NULL,
    "provider_user_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "refresh_token" "text",
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."user_social_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_tryon_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "style_combination" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_tryon_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_tryon_history" IS 'Virtual try-on (VTON) history for archive stats';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "username" character varying(50) NOT NULL,
    "display_name" character varying(100),
    "avatar_url" "text",
    "bio" "text",
    "rank" character varying(20) DEFAULT 'Member'::character varying NOT NULL,
    "total_points" integer DEFAULT 0 NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "style_dna" "jsonb",
    "ink_credits" integer DEFAULT 5 NOT NULL,
    "studio_config" "jsonb"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."view_logs" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "reference_type" character varying(20) NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."view_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."votes" (
    "id" "uuid" NOT NULL,
    "solution_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote_type" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_table" "text" NOT NULL,
    "target_id" "uuid",
    "before_state" "jsonb",
    "after_state" "jsonb",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."admin_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "warehouse"."admin_audit_log" IS 'Admin action audit trail for all seed-ops and entity management operations';



CREATE TABLE IF NOT EXISTS "warehouse"."artists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_ko" "text",
    "name_en" "text",
    "profile_image_url" "text",
    "primary_instagram_account_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."artists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."brands" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_ko" "text",
    "name_en" "text",
    "logo_image_url" "text",
    "primary_instagram_account_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."group_members" (
    "group_id" "uuid" NOT NULL,
    "artist_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_ko" "text",
    "name_en" "text",
    "profile_image_url" "text",
    "primary_instagram_account_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "image_hash" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "with_items" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."instagram_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "username" "text" NOT NULL,
    "account_type" "warehouse"."account_type" NOT NULL,
    "name_ko" "text",
    "name_en" "text",
    "display_name" "text",
    "bio" "text",
    "profile_image_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb",
    "wikidata_status" "text",
    "wikidata_id" "text",
    "needs_review" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "brand_id" "uuid",
    "artist_id" "uuid",
    "entity_ig_role" "warehouse"."entity_ig_role",
    "entity_region_code" "text",
    "group_id" "uuid",
    CONSTRAINT "warehouse_instagram_accounts_brand_xor_artist" CHECK ((NOT (("brand_id" IS NOT NULL) AND ("artist_id" IS NOT NULL)))),
    CONSTRAINT "warehouse_instagram_accounts_entity_role_when_linked" CHECK (((("brand_id" IS NULL) AND ("artist_id" IS NULL)) OR ("entity_ig_role" IS NOT NULL))),
    CONSTRAINT "warehouse_instagram_accounts_wikidata_status_check" CHECK ((("wikidata_status" IS NULL) OR ("wikidata_status" = ANY (ARRAY['matched'::"text", 'not_found'::"text", 'ambiguous'::"text", 'error'::"text"]))))
);


ALTER TABLE "warehouse"."instagram_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid" NOT NULL,
    "posted_at" timestamp with time zone NOT NULL,
    "caption_text" "text",
    "tagged_account_ids" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."raw_post_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "platform" "text" NOT NULL,
    "source_type" "text" NOT NULL,
    "source_identifier" "text" NOT NULL,
    "label" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "fetch_interval_seconds" integer DEFAULT 3600 NOT NULL,
    "last_enqueued_at" timestamp with time zone,
    "last_scraped_at" timestamp with time zone,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."raw_post_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."raw_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid" NOT NULL,
    "platform" "text" NOT NULL,
    "external_id" "text" NOT NULL,
    "external_url" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "r2_key" "text",
    "r2_url" "text",
    "image_hash" "text",
    "caption" "text",
    "author_name" "text",
    "parse_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "parse_result" "jsonb",
    "parse_error" "text",
    "parse_attempts" integer DEFAULT 0 NOT NULL,
    "seed_post_id" "uuid",
    "platform_metadata" "jsonb",
    "dispatch_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "raw_posts_parse_status_check" CHECK (("parse_status" = ANY (ARRAY['pending'::"text", 'parsing'::"text", 'parsed'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "warehouse"."raw_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."seed_asset" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seed_post_id" "uuid" NOT NULL,
    "source_url" "text",
    "source_domain" "text",
    "archived_url" "text",
    "image_hash" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "warehouse"."seed_asset" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."seed_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_post_id" "uuid",
    "source_image_id" "uuid",
    "image_url" "text" NOT NULL,
    "media_source" "jsonb",
    "group_id" "uuid",
    "artist_id" "uuid",
    "metadata" "jsonb",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "publish_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "backend_post_id" "uuid"
);


ALTER TABLE "warehouse"."seed_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "warehouse"."seed_spots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seed_post_id" "uuid" NOT NULL,
    "request_order" integer NOT NULL,
    "position_left" "text" NOT NULL,
    "position_top" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "publish_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "solutions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "subcategory_id" "uuid"
);


ALTER TABLE "warehouse"."seed_spots" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agent_sessions"
    ADD CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_sessions"
    ADD CONSTRAINT "agent_sessions_thread_id_key" UNIQUE ("thread_id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkpoint_blobs"
    ADD CONSTRAINT "checkpoint_blobs_pkey" PRIMARY KEY ("thread_id", "checkpoint_ns", "channel", "version");



ALTER TABLE ONLY "public"."checkpoint_migrations"
    ADD CONSTRAINT "checkpoint_migrations_pkey" PRIMARY KEY ("v");



ALTER TABLE ONLY "public"."checkpoint_writes"
    ADD CONSTRAINT "checkpoint_writes_pkey" PRIMARY KEY ("thread_id", "checkpoint_ns", "checkpoint_id", "task_id", "idx");



ALTER TABLE ONLY "public"."checkpoints"
    ADD CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("thread_id", "checkpoint_ns", "checkpoint_id");



ALTER TABLE ONLY "public"."click_logs"
    ADD CONSTRAINT "click_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."curation_posts"
    ADD CONSTRAINT "curation_posts_pkey" PRIMARY KEY ("curation_id", "post_id");



ALTER TABLE ONLY "public"."curations"
    ADD CONSTRAINT "curations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decoded_picks"
    ADD CONSTRAINT "decoded_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."embeddings"
    ADD CONSTRAINT "embeddings_entity_type_entity_id_key" UNIQUE ("entity_type", "entity_id");



ALTER TABLE ONLY "public"."embeddings"
    ADD CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."failed_batch_items"
    ADD CONSTRAINT "failed_batch_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."magazine_posts"
    ADD CONSTRAINT "magazine_posts_pkey" PRIMARY KEY ("magazine_id", "post_id");



ALTER TABLE ONLY "public"."magazines"
    ADD CONSTRAINT "magazines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "pk_user_badges" PRIMARY KEY ("user_id", "badge_id");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_magazine_news_references"
    ADD CONSTRAINT "post_magazine_news_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_magazines"
    ADD CONSTRAINT "post_magazines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processed_batches"
    ADD CONSTRAINT "processed_batches_pkey" PRIMARY KEY ("batch_id");



ALTER TABLE ONLY "public"."saved_posts"
    ADD CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seaql_migrations"
    ADD CONSTRAINT "seaql_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settlements"
    ADD CONSTRAINT "settlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."solutions"
    ADD CONSTRAINT "solutions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "spots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."synonyms"
    ADD CONSTRAINT "synonyms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."try_spot_tags"
    ADD CONSTRAINT "try_spot_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."user_magazines"
    ADD CONSTRAINT "user_magazines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_social_accounts"
    ADD CONSTRAINT "user_social_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_tryon_history"
    ADD CONSTRAINT "user_tryon_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."view_logs"
    ADD CONSTRAINT "view_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."artists"
    ADD CONSTRAINT "artists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."group_members"
    ADD CONSTRAINT "group_members_pkey1" PRIMARY KEY ("group_id", "artist_id");



ALTER TABLE ONLY "warehouse"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."images"
    ADD CONSTRAINT "images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."instagram_accounts"
    ADD CONSTRAINT "instagram_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."raw_post_sources"
    ADD CONSTRAINT "raw_post_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."raw_post_sources"
    ADD CONSTRAINT "raw_post_sources_unique_target" UNIQUE ("platform", "source_type", "source_identifier");



ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_unique_external" UNIQUE ("platform", "external_id");



ALTER TABLE ONLY "warehouse"."seed_asset"
    ADD CONSTRAINT "seed_asset_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."seed_posts"
    ADD CONSTRAINT "seed_posts_backend_post_id_key" UNIQUE ("backend_post_id");



ALTER TABLE ONLY "warehouse"."seed_posts"
    ADD CONSTRAINT "seed_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."seed_spots"
    ADD CONSTRAINT "seed_spots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "warehouse"."images"
    ADD CONSTRAINT "warehouse_images_post_id_image_hash_key" UNIQUE ("post_id", "image_hash");



ALTER TABLE ONLY "warehouse"."instagram_accounts"
    ADD CONSTRAINT "warehouse_instagram_accounts_username_key" UNIQUE ("username");



ALTER TABLE ONLY "warehouse"."posts"
    ADD CONSTRAINT "warehouse_posts_account_id_posted_at_key" UNIQUE ("account_id", "posted_at");



ALTER TABLE ONLY "warehouse"."seed_asset"
    ADD CONSTRAINT "warehouse_seed_asset_image_hash_key" UNIQUE ("image_hash");



CREATE INDEX "checkpoint_blobs_thread_id_idx" ON "public"."checkpoint_blobs" USING "btree" ("thread_id");



CREATE INDEX "checkpoint_writes_thread_id_idx" ON "public"."checkpoint_writes" USING "btree" ("thread_id");



CREATE INDEX "checkpoints_thread_id_idx" ON "public"."checkpoints" USING "btree" ("thread_id");



CREATE INDEX "idx_badges_rarity" ON "public"."badges" USING "btree" ("rarity");



CREATE INDEX "idx_badges_type" ON "public"."badges" USING "btree" ("type");



CREATE INDEX "idx_categories_code" ON "public"."categories" USING "btree" ("code");



CREATE INDEX "idx_categories_display_order" ON "public"."categories" USING "btree" ("display_order");



CREATE INDEX "idx_categories_is_active" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "idx_click_logs_created_at" ON "public"."click_logs" USING "btree" ("created_at");



CREATE INDEX "idx_click_logs_ip_created" ON "public"."click_logs" USING "btree" ("ip_address", "created_at");



CREATE INDEX "idx_click_logs_solution_id" ON "public"."click_logs" USING "btree" ("solution_id");



CREATE INDEX "idx_click_logs_user_id" ON "public"."click_logs" USING "btree" ("user_id");



CREATE INDEX "idx_click_logs_user_solution_created" ON "public"."click_logs" USING "btree" ("user_id", "solution_id", "created_at");



CREATE INDEX "idx_comments_parent_id" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_comments_user_id" ON "public"."comments" USING "btree" ("user_id");



CREATE INDEX "idx_content_reports_reporter" ON "public"."content_reports" USING "btree" ("reporter_id");



CREATE INDEX "idx_content_reports_status" ON "public"."content_reports" USING "btree" ("status");



CREATE INDEX "idx_content_reports_target" ON "public"."content_reports" USING "btree" ("target_type", "target_id");



CREATE UNIQUE INDEX "idx_content_reports_unique_per_user" ON "public"."content_reports" USING "btree" ("target_type", "target_id", "reporter_id");



CREATE INDEX "idx_credit_transactions_action_type" ON "public"."credit_transactions" USING "btree" ("action_type");



CREATE INDEX "idx_credit_transactions_status" ON "public"."credit_transactions" USING "btree" ("status");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_curation_posts_curation_id_display_order" ON "public"."curation_posts" USING "btree" ("curation_id", "display_order");



CREATE INDEX "idx_curation_posts_post_id" ON "public"."curation_posts" USING "btree" ("post_id");



CREATE INDEX "idx_curations_is_active_display_order" ON "public"."curations" USING "btree" ("is_active", "display_order");



CREATE INDEX "idx_decoded_picks_pick_date" ON "public"."decoded_picks" USING "btree" ("pick_date" DESC);



CREATE INDEX "idx_decoded_picks_post_id" ON "public"."decoded_picks" USING "btree" ("post_id");



CREATE INDEX "idx_earnings_created_at" ON "public"."earnings" USING "btree" ("created_at");



CREATE INDEX "idx_earnings_solution_id" ON "public"."earnings" USING "btree" ("solution_id");



CREATE INDEX "idx_earnings_status" ON "public"."earnings" USING "btree" ("status");



CREATE INDEX "idx_earnings_user_id" ON "public"."earnings" USING "btree" ("user_id");



CREATE INDEX "idx_embeddings_entity_type" ON "public"."embeddings" USING "btree" ("entity_type");



CREATE INDEX "idx_embeddings_hnsw" ON "public"."embeddings" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops");



CREATE INDEX "idx_failed_items_item_id" ON "public"."failed_batch_items" USING "btree" ("item_id");



CREATE INDEX "idx_failed_items_retry" ON "public"."failed_batch_items" USING "btree" ("next_retry_at");



CREATE INDEX "idx_news_refs_magazine" ON "public"."post_magazine_news_references" USING "btree" ("post_magazine_id");



CREATE INDEX "idx_point_logs_created_at" ON "public"."point_logs" USING "btree" ("created_at");



CREATE INDEX "idx_point_logs_user_created" ON "public"."point_logs" USING "btree" ("user_id", "created_at");



CREATE INDEX "idx_point_logs_user_id" ON "public"."point_logs" USING "btree" ("user_id");



CREATE INDEX "idx_post_likes_post_id" ON "public"."post_likes" USING "btree" ("post_id");



CREATE UNIQUE INDEX "idx_post_likes_post_user_unique" ON "public"."post_likes" USING "btree" ("post_id", "user_id");



CREATE INDEX "idx_post_likes_user_id" ON "public"."post_likes" USING "btree" ("user_id");



CREATE INDEX "idx_post_magazines_status" ON "public"."post_magazines" USING "btree" ("status");



CREATE INDEX "idx_posts_artist_id" ON "public"."posts" USING "btree" ("artist_id");



CREATE INDEX "idx_posts_artist_name" ON "public"."posts" USING "btree" ("artist_name");



CREATE INDEX "idx_posts_artist_name_trgm" ON "public"."posts" USING "gin" ("artist_name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_posts_context" ON "public"."posts" USING "btree" ("context");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at");



CREATE INDEX "idx_posts_group_id" ON "public"."posts" USING "btree" ("group_id");



CREATE INDEX "idx_posts_group_name" ON "public"."posts" USING "btree" ("group_name");



CREATE INDEX "idx_posts_group_name_trgm" ON "public"."posts" USING "gin" ("group_name" "extensions"."gin_trgm_ops");



CREATE INDEX "idx_posts_parent_post_id" ON "public"."posts" USING "btree" ("parent_post_id");



CREATE INDEX "idx_posts_post_type" ON "public"."posts" USING "btree" ("post_type");



CREATE INDEX "idx_posts_status" ON "public"."posts" USING "btree" ("status");



CREATE INDEX "idx_posts_trending_active" ON "public"."posts" USING "btree" ("trending_score" DESC NULLS LAST, "created_at" DESC) WHERE ((("status")::"text" = 'active'::"text") AND (("post_type" IS NULL) OR (("post_type")::"text" <> 'try'::"text")));



CREATE INDEX "idx_posts_trending_score" ON "public"."posts" USING "btree" ("trending_score");



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_processed_batches_created_at" ON "public"."processed_batches" USING "btree" ("created_at");



CREATE INDEX "idx_saved_posts_post_id" ON "public"."saved_posts" USING "btree" ("post_id");



CREATE UNIQUE INDEX "idx_saved_posts_post_user_unique" ON "public"."saved_posts" USING "btree" ("post_id", "user_id");



CREATE INDEX "idx_saved_posts_user_id" ON "public"."saved_posts" USING "btree" ("user_id");



CREATE INDEX "idx_search_logs_created_at" ON "public"."search_logs" USING "btree" ("created_at");



CREATE INDEX "idx_search_logs_query" ON "public"."search_logs" USING "btree" ("query");



CREATE INDEX "idx_search_logs_user_id" ON "public"."search_logs" USING "btree" ("user_id");



CREATE INDEX "idx_settlements_created_at" ON "public"."settlements" USING "btree" ("created_at");



CREATE INDEX "idx_settlements_status" ON "public"."settlements" USING "btree" ("status");



CREATE INDEX "idx_settlements_user_id" ON "public"."settlements" USING "btree" ("user_id");



CREATE INDEX "idx_solutions_active_spot_id" ON "public"."solutions" USING "btree" ("spot_id") WHERE (("status")::"text" = 'active'::"text");



CREATE INDEX "idx_solutions_brand_id" ON "public"."solutions" USING "btree" ("brand_id");



CREATE INDEX "idx_solutions_is_adopted" ON "public"."solutions" USING "btree" ("is_adopted");



CREATE INDEX "idx_solutions_is_verified" ON "public"."solutions" USING "btree" ("is_verified");



CREATE INDEX "idx_solutions_match_type" ON "public"."solutions" USING "btree" ("match_type");



CREATE INDEX "idx_solutions_spot_id" ON "public"."solutions" USING "btree" ("spot_id");



CREATE INDEX "idx_solutions_user_id" ON "public"."solutions" USING "btree" ("user_id");



CREATE INDEX "idx_spots_post_id" ON "public"."spots" USING "btree" ("post_id");



CREATE INDEX "idx_spots_status" ON "public"."spots" USING "btree" ("status");



CREATE INDEX "idx_spots_subcategory_id" ON "public"."spots" USING "btree" ("subcategory_id");



CREATE UNIQUE INDEX "idx_subcategories_category_code_unique" ON "public"."subcategories" USING "btree" ("category_id", "code");



CREATE INDEX "idx_subcategories_category_id" ON "public"."subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_subcategories_display_order" ON "public"."subcategories" USING "btree" ("display_order");



CREATE INDEX "idx_subcategories_is_active" ON "public"."subcategories" USING "btree" ("is_active");



CREATE INDEX "idx_synonyms_canonical" ON "public"."synonyms" USING "btree" ("canonical");



CREATE INDEX "idx_synonyms_is_active" ON "public"."synonyms" USING "btree" ("is_active");



CREATE INDEX "idx_synonyms_type" ON "public"."synonyms" USING "btree" ("type");



CREATE INDEX "idx_try_spot_tags_spot_id" ON "public"."try_spot_tags" USING "btree" ("spot_id");



CREATE UNIQUE INDEX "idx_try_spot_tags_try_post_spot_unique" ON "public"."try_spot_tags" USING "btree" ("try_post_id", "spot_id");



CREATE INDEX "idx_user_badges_badge_id" ON "public"."user_badges" USING "btree" ("badge_id");



CREATE INDEX "idx_user_badges_earned_at" ON "public"."user_badges" USING "btree" ("earned_at");



CREATE INDEX "idx_user_badges_user_id" ON "public"."user_badges" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_user_collections_user_magazine" ON "public"."user_collections" USING "btree" ("user_id", "magazine_id");



CREATE INDEX "idx_user_events_created_at" ON "public"."user_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_events_event_type" ON "public"."user_events" USING "btree" ("event_type");



CREATE INDEX "idx_user_events_user_id" ON "public"."user_events" USING "btree" ("user_id");



CREATE INDEX "idx_user_follows_follower_id" ON "public"."user_follows" USING "btree" ("follower_id");



CREATE INDEX "idx_user_follows_following_id" ON "public"."user_follows" USING "btree" ("following_id");



CREATE INDEX "idx_user_magazines_created_by" ON "public"."user_magazines" USING "btree" ("created_by");



CREATE INDEX "idx_user_magazines_type" ON "public"."user_magazines" USING "btree" ("magazine_type");



CREATE UNIQUE INDEX "idx_user_social_accounts_user_provider" ON "public"."user_social_accounts" USING "btree" ("user_id", "provider");



CREATE INDEX "idx_user_tryon_history_created_at" ON "public"."user_tryon_history" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_user_tryon_history_user_id" ON "public"."user_tryon_history" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_rank" ON "public"."users" USING "btree" ("rank");



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE INDEX "idx_view_logs_created_at" ON "public"."view_logs" USING "btree" ("created_at");



CREATE INDEX "idx_view_logs_reference" ON "public"."view_logs" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_view_logs_user_id" ON "public"."view_logs" USING "btree" ("user_id");



CREATE INDEX "idx_view_logs_user_reference_created" ON "public"."view_logs" USING "btree" ("user_id", "reference_type", "reference_id", "created_at");



CREATE INDEX "idx_votes_solution_id" ON "public"."votes" USING "btree" ("solution_id");



CREATE UNIQUE INDEX "idx_votes_solution_user_unique" ON "public"."votes" USING "btree" ("solution_id", "user_id");



CREATE INDEX "idx_votes_user_id" ON "public"."votes" USING "btree" ("user_id");



CREATE INDEX "post_magazines_status_idx" ON "public"."post_magazines" USING "btree" ("status") WHERE (("status")::"text" = ANY ((ARRAY['pending'::character varying, 'draft'::character varying])::"text"[]));



CREATE INDEX "idx_audit_log_admin" ON "warehouse"."admin_audit_log" USING "btree" ("admin_user_id");



CREATE INDEX "idx_audit_log_created" ON "warehouse"."admin_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_log_target" ON "warehouse"."admin_audit_log" USING "btree" ("target_table", "target_id");



CREATE INDEX "idx_warehouse_group_members_artist_id" ON "warehouse"."group_members" USING "btree" ("artist_id");



CREATE INDEX "idx_warehouse_group_members_is_active" ON "warehouse"."group_members" USING "btree" ("is_active");



CREATE INDEX "idx_warehouse_images_post_id" ON "warehouse"."images" USING "btree" ("post_id");



CREATE INDEX "idx_warehouse_images_with_items" ON "warehouse"."images" USING "btree" ("with_items");



CREATE INDEX "idx_warehouse_instagram_accounts_active" ON "warehouse"."instagram_accounts" USING "btree" ("is_active");



CREATE INDEX "idx_warehouse_instagram_accounts_artist_id" ON "warehouse"."instagram_accounts" USING "btree" ("artist_id") WHERE ("artist_id" IS NOT NULL);



CREATE INDEX "idx_warehouse_instagram_accounts_brand_id" ON "warehouse"."instagram_accounts" USING "btree" ("brand_id") WHERE ("brand_id" IS NOT NULL);



CREATE INDEX "idx_warehouse_instagram_accounts_group_id" ON "warehouse"."instagram_accounts" USING "btree" ("group_id");



CREATE INDEX "idx_warehouse_instagram_accounts_type" ON "warehouse"."instagram_accounts" USING "btree" ("account_type");



CREATE INDEX "idx_warehouse_posts_account_id" ON "warehouse"."posts" USING "btree" ("account_id");



CREATE INDEX "idx_warehouse_posts_posted_at" ON "warehouse"."posts" USING "btree" ("posted_at");



CREATE INDEX "idx_warehouse_posts_tagged_account_ids" ON "warehouse"."posts" USING "gin" ("tagged_account_ids");



CREATE INDEX "idx_warehouse_seed_asset_seed_post_id" ON "warehouse"."seed_asset" USING "btree" ("seed_post_id");



CREATE INDEX "idx_warehouse_seed_posts_source_image_id" ON "warehouse"."seed_posts" USING "btree" ("source_image_id");



CREATE INDEX "idx_warehouse_seed_posts_source_post_id" ON "warehouse"."seed_posts" USING "btree" ("source_post_id");



CREATE INDEX "idx_warehouse_seed_posts_status" ON "warehouse"."seed_posts" USING "btree" ("status");



CREATE INDEX "idx_warehouse_seed_spots_request_order" ON "warehouse"."seed_spots" USING "btree" ("request_order");



CREATE INDEX "idx_warehouse_seed_spots_seed_post_id" ON "warehouse"."seed_spots" USING "btree" ("seed_post_id");



CREATE INDEX "idx_warehouse_seed_spots_status" ON "warehouse"."seed_spots" USING "btree" ("status");



CREATE INDEX "raw_post_sources_active_platform_idx" ON "warehouse"."raw_post_sources" USING "btree" ("is_active", "platform");



CREATE INDEX "raw_post_sources_due_idx" ON "warehouse"."raw_post_sources" USING "btree" ("last_enqueued_at") WHERE ("is_active" = true);



CREATE INDEX "raw_posts_parse_status_idx" ON "warehouse"."raw_posts" USING "btree" ("parse_status", "created_at");



CREATE INDEX "raw_posts_platform_idx" ON "warehouse"."raw_posts" USING "btree" ("platform");



CREATE INDEX "raw_posts_source_idx" ON "warehouse"."raw_posts" USING "btree" ("source_id");



CREATE UNIQUE INDEX "uq_warehouse_seed_posts_source_post_image" ON "warehouse"."seed_posts" USING "btree" ("source_post_id", "source_image_id") WHERE (("source_post_id" IS NOT NULL) AND ("source_image_id" IS NOT NULL));



CREATE UNIQUE INDEX "warehouse_artists_primary_ig_unique" ON "warehouse"."artists" USING "btree" ("primary_instagram_account_id") WHERE ("primary_instagram_account_id" IS NOT NULL);



CREATE UNIQUE INDEX "warehouse_brands_primary_ig_unique" ON "warehouse"."brands" USING "btree" ("primary_instagram_account_id") WHERE ("primary_instagram_account_id" IS NOT NULL);



CREATE UNIQUE INDEX "warehouse_groups_primary_ig_unique" ON "warehouse"."groups" USING "btree" ("primary_instagram_account_id") WHERE ("primary_instagram_account_id" IS NOT NULL);



CREATE UNIQUE INDEX "warehouse_ig_one_primary_per_artist" ON "warehouse"."instagram_accounts" USING "btree" ("artist_id") WHERE (("artist_id" IS NOT NULL) AND ("entity_ig_role" = 'primary'::"warehouse"."entity_ig_role"));



CREATE UNIQUE INDEX "warehouse_ig_one_primary_per_brand" ON "warehouse"."instagram_accounts" USING "btree" ("brand_id") WHERE (("brand_id" IS NOT NULL) AND ("entity_ig_role" = 'primary'::"warehouse"."entity_ig_role"));



CREATE OR REPLACE TRIGGER "update_badges_updated_at" BEFORE UPDATE ON "public"."badges" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_solutions_updated_at" BEFORE UPDATE ON "public"."solutions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_spots_updated_at" BEFORE UPDATE ON "public"."spots" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subcategories_updated_at" BEFORE UPDATE ON "public"."subcategories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_synonyms_updated_at" BEFORE UPDATE ON "public"."synonyms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_magazines_updated_at" BEFORE UPDATE ON "public"."user_magazines" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_social_accounts_updated_at" BEFORE UPDATE ON "public"."user_social_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "raw_post_sources_set_updated_at" BEFORE UPDATE ON "warehouse"."raw_post_sources" FOR EACH ROW EXECUTE FUNCTION "warehouse"."set_updated_at"();



CREATE OR REPLACE TRIGGER "raw_posts_set_updated_at" BEFORE UPDATE ON "warehouse"."raw_posts" FOR EACH ROW EXECUTE FUNCTION "warehouse"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_artists_touch_updated_at" BEFORE UPDATE ON "warehouse"."artists" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_brands_touch_updated_at" BEFORE UPDATE ON "warehouse"."brands" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_group_members_touch_updated_at" BEFORE UPDATE ON "warehouse"."group_members" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_groups_touch_updated_at" BEFORE UPDATE ON "warehouse"."groups" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_instagram_accounts_touch_updated_at" BEFORE UPDATE ON "warehouse"."instagram_accounts" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seed_asset_touch_updated_at" BEFORE UPDATE ON "warehouse"."seed_asset" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seed_posts_touch_updated_at" BEFORE UPDATE ON "warehouse"."seed_posts" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seed_spots_touch_updated_at" BEFORE UPDATE ON "warehouse"."seed_spots" FOR EACH ROW EXECUTE FUNCTION "warehouse"."touch_updated_at"();



ALTER TABLE ONLY "public"."agent_sessions"
    ADD CONSTRAINT "agent_sessions_magazine_id_fkey" FOREIGN KEY ("magazine_id") REFERENCES "public"."magazines"("id");



ALTER TABLE ONLY "public"."agent_sessions"
    ADD CONSTRAINT "agent_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_reports"
    ADD CONSTRAINT "content_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."decoded_picks"
    ADD CONSTRAINT "decoded_picks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."click_logs"
    ADD CONSTRAINT "fk_click_logs_solution_id" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."click_logs"
    ADD CONSTRAINT "fk_click_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "fk_comments_parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "fk_comments_post_id" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "fk_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curation_posts"
    ADD CONSTRAINT "fk_curation_posts_curation_id" FOREIGN KEY ("curation_id") REFERENCES "public"."curations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."curation_posts"
    ADD CONSTRAINT "fk_curation_posts_post_id" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "fk_earnings_solution_id" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "fk_earnings_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "fk_point_logs_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "fk_post_likes_post_id" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "fk_post_likes_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "fk_posts_artist_id" FOREIGN KEY ("artist_id") REFERENCES "warehouse"."artists"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "fk_posts_group_id" FOREIGN KEY ("group_id") REFERENCES "warehouse"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "fk_posts_parent_post_id" FOREIGN KEY ("parent_post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "fk_posts_post_magazine_id" FOREIGN KEY ("post_magazine_id") REFERENCES "public"."post_magazines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "fk_posts_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_posts"
    ADD CONSTRAINT "fk_saved_posts_post_id" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_posts"
    ADD CONSTRAINT "fk_saved_posts_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."search_logs"
    ADD CONSTRAINT "fk_search_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."settlements"
    ADD CONSTRAINT "fk_settlements_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."solutions"
    ADD CONSTRAINT "fk_solutions_brand_id" FOREIGN KEY ("brand_id") REFERENCES "warehouse"."brands"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."solutions"
    ADD CONSTRAINT "fk_solutions_spot_id" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."solutions"
    ADD CONSTRAINT "fk_solutions_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "fk_spots_post_id" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "fk_spots_subcategory_id" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id");



ALTER TABLE ONLY "public"."spots"
    ADD CONSTRAINT "fk_spots_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "fk_subcategories_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."try_spot_tags"
    ADD CONSTRAINT "fk_try_spot_tags_spot_id" FOREIGN KEY ("spot_id") REFERENCES "public"."spots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."try_spot_tags"
    ADD CONSTRAINT "fk_try_spot_tags_try_post_id" FOREIGN KEY ("try_post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "fk_user_badges_badge_id" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "fk_user_badges_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "fk_users_auth_users" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."view_logs"
    ADD CONSTRAINT "fk_view_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "fk_votes_solution_id" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."votes"
    ADD CONSTRAINT "fk_votes_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."magazine_posts"
    ADD CONSTRAINT "magazine_posts_magazine_id_fkey" FOREIGN KEY ("magazine_id") REFERENCES "public"."magazines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."magazine_posts"
    ADD CONSTRAINT "magazine_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."magazines"
    ADD CONSTRAINT "magazines_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."magazines"
    ADD CONSTRAINT "magazines_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."post_magazine_news_references"
    ADD CONSTRAINT "post_magazine_news_references_post_magazine_id_fkey" FOREIGN KEY ("post_magazine_id") REFERENCES "public"."post_magazines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_magazines"
    ADD CONSTRAINT "post_magazines_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_magazine_id_fkey" FOREIGN KEY ("magazine_id") REFERENCES "public"."user_magazines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_collections"
    ADD CONSTRAINT "user_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_follows"
    ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_magazines"
    ADD CONSTRAINT "user_magazines_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_social_accounts"
    ADD CONSTRAINT "user_social_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_tryon_history"
    ADD CONSTRAINT "user_tryon_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "warehouse"."artists"
    ADD CONSTRAINT "artists_primary_instagram_account_id_fkey" FOREIGN KEY ("primary_instagram_account_id") REFERENCES "warehouse"."instagram_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."brands"
    ADD CONSTRAINT "brands_primary_instagram_account_id_fkey" FOREIGN KEY ("primary_instagram_account_id") REFERENCES "warehouse"."instagram_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."group_members"
    ADD CONSTRAINT "group_members_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "warehouse"."artists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "warehouse"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "warehouse"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "warehouse"."groups"
    ADD CONSTRAINT "groups_primary_instagram_account_id_fkey" FOREIGN KEY ("primary_instagram_account_id") REFERENCES "warehouse"."instagram_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."instagram_accounts"
    ADD CONSTRAINT "instagram_accounts_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "warehouse"."artists"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."instagram_accounts"
    ADD CONSTRAINT "instagram_accounts_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "warehouse"."brands"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_seed_post_id_fkey" FOREIGN KEY ("seed_post_id") REFERENCES "warehouse"."seed_posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "warehouse"."raw_post_sources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "warehouse"."images"
    ADD CONSTRAINT "warehouse_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "warehouse"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "warehouse"."instagram_accounts"
    ADD CONSTRAINT "warehouse_instagram_accounts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "warehouse"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."posts"
    ADD CONSTRAINT "warehouse_posts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "warehouse"."instagram_accounts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "warehouse"."seed_asset"
    ADD CONSTRAINT "warehouse_seed_asset_seed_post_id_fkey" FOREIGN KEY ("seed_post_id") REFERENCES "warehouse"."seed_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "warehouse"."seed_posts"
    ADD CONSTRAINT "warehouse_seed_posts_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "warehouse"."artists"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."seed_posts"
    ADD CONSTRAINT "warehouse_seed_posts_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "warehouse"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."seed_posts"
    ADD CONSTRAINT "warehouse_seed_posts_source_image_id_fkey" FOREIGN KEY ("source_image_id") REFERENCES "warehouse"."images"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."seed_posts"
    ADD CONSTRAINT "warehouse_seed_posts_source_post_id_fkey" FOREIGN KEY ("source_post_id") REFERENCES "warehouse"."posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "warehouse"."seed_spots"
    ADD CONSTRAINT "warehouse_seed_spots_seed_post_id_fkey" FOREIGN KEY ("seed_post_id") REFERENCES "warehouse"."seed_posts"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."curation_posts" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."curations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."embeddings" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."magazine_posts" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."magazines" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."post_magazines" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."posts" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."seaql_migrations" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."solutions" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."spots" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."subcategories" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."synonyms" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."user_badges" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "public"."votes" FOR SELECT USING (true);



CREATE POLICY "Allow public read decoded_picks" ON "public"."decoded_picks" FOR SELECT USING (true);



CREATE POLICY "Auth insert comments" ON "public"."comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Auth insert follows" ON "public"."user_follows" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Auth insert votes" ON "public"."votes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete" ON "public"."post_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete" ON "public"."saved_posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete" ON "public"."user_collections" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete" ON "public"."user_magazines" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Owner delete" ON "public"."user_social_accounts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete comments" ON "public"."comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete follows" ON "public"."user_follows" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Owner delete posts" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner delete votes" ON "public"."votes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."click_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."credit_transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."post_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."saved_posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."user_collections" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."user_magazines" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Owner insert" ON "public"."user_social_accounts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert" ON "public"."view_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner insert posts" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."click_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."post_likes" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."saved_posts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."user_collections" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."user_magazines" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Owner select" ON "public"."user_social_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner select" ON "public"."view_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner update" ON "public"."user_social_accounts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner update posts" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner update profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Public read profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can insert own tryon history" ON "public"."user_tryon_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own tryon history" ON "public"."user_tryon_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own events" ON "public"."user_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users read own events" ON "public"."user_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_can_update_magazines" ON "public"."post_magazines" FOR UPDATE USING ("public"."is_admin"("auth"."uid"())) WITH CHECK ("public"."is_admin"("auth"."uid"()));



ALTER TABLE "public"."agent_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_blobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoint_writes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkpoints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."click_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_reports_insert_own" ON "public"."content_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "content_reports_select_own" ON "public"."content_reports" FOR SELECT USING (("auth"."uid"() = "reporter_id"));



ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."curation_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."curations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decoded_picks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."earnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."failed_batch_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."magazine_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."magazines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_magazine_news_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_magazines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."processed_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seaql_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settlements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."solutions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."spots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcategories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."synonyms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."try_spot_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_collections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_follows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_follows_select_public" ON "public"."user_follows" FOR SELECT USING (true);



ALTER TABLE "public"."user_magazines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_social_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_tryon_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_tryon_history_select_own" ON "public"."user_tryon_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."view_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."votes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow public read" ON "warehouse"."artists" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."brands" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."group_members" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."groups" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."images" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."instagram_accounts" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."posts" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."seed_asset" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."seed_posts" FOR SELECT USING (true);



CREATE POLICY "Allow public read" ON "warehouse"."seed_spots" FOR SELECT USING (true);



ALTER TABLE "warehouse"."artists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."instagram_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."raw_post_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "raw_post_sources_select_public" ON "warehouse"."raw_post_sources" FOR SELECT USING (true);



ALTER TABLE "warehouse"."raw_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "raw_posts_select_public" ON "warehouse"."raw_posts" FOR SELECT USING (true);



ALTER TABLE "warehouse"."seed_asset" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."seed_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "warehouse"."seed_spots" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "warehouse" TO "service_role";
GRANT USAGE ON SCHEMA "warehouse" TO "anon";
GRANT USAGE ON SCHEMA "warehouse" TO "authenticated";



REVOKE ALL ON FUNCTION "public"."admin_daily_metrics"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_daily_metrics"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_daily_metrics"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_distinct_user_count"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_distinct_user_count"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_distinct_user_count"("p_from_ts" timestamp with time zone, "p_to_ts" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_similar"("query_embedding" "extensions"."vector", "match_count" integer, "filter_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."search_similar"("query_embedding" "extensions"."vector", "match_count" integer, "filter_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_similar"("query_embedding" "extensions"."vector", "match_count" integer, "filter_type" character varying) TO "service_role";



GRANT ALL ON TABLE "public"."post_magazines" TO "anon";
GRANT ALL ON TABLE "public"."post_magazines" TO "authenticated";
GRANT ALL ON TABLE "public"."post_magazines" TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_magazine_status"("p_magazine_id" "uuid", "p_new_status" character varying, "p_admin_user_id" "uuid", "p_rejection_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_magazine_status"("p_magazine_id" "uuid", "p_new_status" character varying, "p_admin_user_id" "uuid", "p_rejection_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."agent_sessions" TO "anon";
GRANT ALL ON TABLE "public"."agent_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_blobs" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_migrations" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoint_writes" TO "anon";
GRANT ALL ON TABLE "public"."checkpoint_writes" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoint_writes" TO "service_role";



GRANT ALL ON TABLE "public"."checkpoints" TO "anon";
GRANT ALL ON TABLE "public"."checkpoints" TO "authenticated";
GRANT ALL ON TABLE "public"."checkpoints" TO "service_role";



GRANT ALL ON TABLE "public"."click_logs" TO "anon";
GRANT ALL ON TABLE "public"."click_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."click_logs" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."content_reports" TO "anon";
GRANT ALL ON TABLE "public"."content_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."content_reports" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."curation_posts" TO "anon";
GRANT ALL ON TABLE "public"."curation_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."curation_posts" TO "service_role";



GRANT ALL ON TABLE "public"."curations" TO "anon";
GRANT ALL ON TABLE "public"."curations" TO "authenticated";
GRANT ALL ON TABLE "public"."curations" TO "service_role";



GRANT ALL ON TABLE "public"."decoded_picks" TO "anon";
GRANT ALL ON TABLE "public"."decoded_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."decoded_picks" TO "service_role";



GRANT ALL ON TABLE "public"."earnings" TO "anon";
GRANT ALL ON TABLE "public"."earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."earnings" TO "service_role";



GRANT ALL ON TABLE "public"."embeddings" TO "anon";
GRANT ALL ON TABLE "public"."embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."explore_posts" TO "anon";
GRANT ALL ON TABLE "public"."explore_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."explore_posts" TO "service_role";



GRANT ALL ON TABLE "public"."failed_batch_items" TO "anon";
GRANT ALL ON TABLE "public"."failed_batch_items" TO "authenticated";
GRANT ALL ON TABLE "public"."failed_batch_items" TO "service_role";



GRANT ALL ON TABLE "public"."magazine_posts" TO "anon";
GRANT ALL ON TABLE "public"."magazine_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."magazine_posts" TO "service_role";



GRANT ALL ON TABLE "public"."magazines" TO "anon";
GRANT ALL ON TABLE "public"."magazines" TO "authenticated";
GRANT ALL ON TABLE "public"."magazines" TO "service_role";



GRANT ALL ON TABLE "public"."point_logs" TO "anon";
GRANT ALL ON TABLE "public"."point_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."point_logs" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."post_magazine_news_references" TO "anon";
GRANT ALL ON TABLE "public"."post_magazine_news_references" TO "authenticated";
GRANT ALL ON TABLE "public"."post_magazine_news_references" TO "service_role";



GRANT ALL ON TABLE "public"."processed_batches" TO "anon";
GRANT ALL ON TABLE "public"."processed_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."processed_batches" TO "service_role";



GRANT ALL ON TABLE "public"."saved_posts" TO "anon";
GRANT ALL ON TABLE "public"."saved_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_posts" TO "service_role";



GRANT ALL ON TABLE "public"."seaql_migrations" TO "anon";
GRANT ALL ON TABLE "public"."seaql_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."seaql_migrations" TO "service_role";



GRANT ALL ON TABLE "public"."search_logs" TO "anon";
GRANT ALL ON TABLE "public"."search_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."search_logs" TO "service_role";



GRANT ALL ON TABLE "public"."settlements" TO "anon";
GRANT ALL ON TABLE "public"."settlements" TO "authenticated";
GRANT ALL ON TABLE "public"."settlements" TO "service_role";



GRANT ALL ON TABLE "public"."solutions" TO "anon";
GRANT ALL ON TABLE "public"."solutions" TO "authenticated";
GRANT ALL ON TABLE "public"."solutions" TO "service_role";



GRANT ALL ON TABLE "public"."spots" TO "anon";
GRANT ALL ON TABLE "public"."spots" TO "authenticated";
GRANT ALL ON TABLE "public"."spots" TO "service_role";



GRANT ALL ON TABLE "public"."subcategories" TO "anon";
GRANT ALL ON TABLE "public"."subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."synonyms" TO "anon";
GRANT ALL ON TABLE "public"."synonyms" TO "authenticated";
GRANT ALL ON TABLE "public"."synonyms" TO "service_role";



GRANT ALL ON TABLE "public"."try_spot_tags" TO "anon";
GRANT ALL ON TABLE "public"."try_spot_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."try_spot_tags" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_collections" TO "anon";
GRANT ALL ON TABLE "public"."user_collections" TO "authenticated";
GRANT ALL ON TABLE "public"."user_collections" TO "service_role";



GRANT ALL ON TABLE "public"."user_events" TO "anon";
GRANT ALL ON TABLE "public"."user_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_events" TO "service_role";



GRANT ALL ON TABLE "public"."user_follows" TO "anon";
GRANT ALL ON TABLE "public"."user_follows" TO "authenticated";
GRANT ALL ON TABLE "public"."user_follows" TO "service_role";



GRANT ALL ON TABLE "public"."user_magazines" TO "anon";
GRANT ALL ON TABLE "public"."user_magazines" TO "authenticated";
GRANT ALL ON TABLE "public"."user_magazines" TO "service_role";



GRANT ALL ON TABLE "public"."user_social_accounts" TO "anon";
GRANT ALL ON TABLE "public"."user_social_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_social_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."user_tryon_history" TO "anon";
GRANT ALL ON TABLE "public"."user_tryon_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_tryon_history" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."view_logs" TO "anon";
GRANT ALL ON TABLE "public"."view_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."view_logs" TO "service_role";



GRANT ALL ON TABLE "public"."votes" TO "anon";
GRANT ALL ON TABLE "public"."votes" TO "authenticated";
GRANT ALL ON TABLE "public"."votes" TO "service_role";



GRANT SELECT ON TABLE "warehouse"."admin_audit_log" TO "anon";
GRANT SELECT ON TABLE "warehouse"."admin_audit_log" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."admin_audit_log" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."artists" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."artists" TO "anon";
GRANT SELECT ON TABLE "warehouse"."artists" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."brands" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."brands" TO "anon";
GRANT SELECT ON TABLE "warehouse"."brands" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."group_members" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."group_members" TO "anon";
GRANT SELECT ON TABLE "warehouse"."group_members" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."groups" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."groups" TO "anon";
GRANT SELECT ON TABLE "warehouse"."groups" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."images" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."images" TO "anon";
GRANT SELECT ON TABLE "warehouse"."images" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."instagram_accounts" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."instagram_accounts" TO "anon";
GRANT SELECT ON TABLE "warehouse"."instagram_accounts" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."posts" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."posts" TO "anon";
GRANT SELECT ON TABLE "warehouse"."posts" TO "authenticated";



GRANT SELECT ON TABLE "warehouse"."raw_post_sources" TO "anon";
GRANT SELECT ON TABLE "warehouse"."raw_post_sources" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."raw_post_sources" TO "service_role";



GRANT SELECT ON TABLE "warehouse"."raw_posts" TO "anon";
GRANT SELECT ON TABLE "warehouse"."raw_posts" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."raw_posts" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."seed_asset" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."seed_asset" TO "anon";
GRANT SELECT ON TABLE "warehouse"."seed_asset" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."seed_posts" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."seed_posts" TO "anon";
GRANT SELECT ON TABLE "warehouse"."seed_posts" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "warehouse"."seed_spots" TO "service_role";
GRANT SELECT ON TABLE "warehouse"."seed_spots" TO "anon";
GRANT SELECT ON TABLE "warehouse"."seed_spots" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "warehouse" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "warehouse" GRANT SELECT ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "warehouse" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "service_role";




