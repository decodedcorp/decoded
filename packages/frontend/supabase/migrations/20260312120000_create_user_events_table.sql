-- Migration: Create user_events table for behavioral analytics
-- Phase m8-01 — Event Tracking Infrastructure
-- Purpose: Store per-user interaction events for behavioral intelligence (m8-02 affinity scoring)

-- ============================================================
-- Table: public.user_events
-- Events are immutable — no updated_at column or trigger needed
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_events (
  id          uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid            NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type  text            NOT NULL,
  entity_id   text,           -- nullable: scroll_depth and other entity-less events
  session_id  text            NOT NULL,
  page_path   text            NOT NULL,
  metadata    jsonb,          -- nullable: per-event additional data (GIN indexed)
  created_at  timestamptz     NOT NULL DEFAULT now()
);

-- Valid event_type values (enforced at application layer, not DB constraint for flexibility):
-- post_click, post_view, spot_click, search_query, category_filter, dwell_time, scroll_depth

-- ============================================================
-- Indexes
-- ============================================================

-- GIN index on metadata JSONB for m8-02 affinity scoring queries
CREATE INDEX IF NOT EXISTS user_events_metadata_gin
  ON public.user_events USING gin(metadata);

-- Composite index for per-user time-range queries (primary access pattern)
CREATE INDEX IF NOT EXISTS user_events_user_created
  ON public.user_events(user_id, created_at DESC);

-- Index for event_type filtering
CREATE INDEX IF NOT EXISTS user_events_type
  ON public.user_events(event_type);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events only
CREATE POLICY "Users can insert own events"
  ON public.user_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own events only
CREATE POLICY "Users can read own events"
  ON public.user_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role bypasses RLS (for admin queries in m8-03 and TTL cleanup)
CREATE POLICY "Service role full access"
  ON public.user_events
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TTL Cleanup via pg_cron (30-day retention policy)
-- ============================================================
-- PREREQUISITE: Enable pg_cron extension in Supabase dashboard first:
--   Dashboard → Database → Extensions → Search "pg_cron" → Enable
--
-- After enabling pg_cron, run this statement to register the daily cleanup job:
--   SELECT cron.schedule(
--     'expire-user-events',
--     '0 3 * * *',
--     $$DELETE FROM public.user_events WHERE created_at < now() - interval '30 days'$$
--   );
--
-- If pg_cron is already enabled, the SELECT below will register the job automatically.
-- If pg_cron is NOT enabled, this will fail silently (DO block catches the error).
-- In that case, run the TTL delete manually or enable pg_cron and re-run.

DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-user-events',
    '0 3 * * *',
    'DELETE FROM public.user_events WHERE created_at < now() - interval ''30 days'''
  );
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not enabled — schedule manually after enabling the extension
  RAISE NOTICE 'pg_cron not available. TTL job not registered. Enable pg_cron in Supabase dashboard and re-run: SELECT cron.schedule(''expire-user-events'', ''0 3 * * *'', ''DELETE FROM public.user_events WHERE created_at < now() - interval ''''30 days'''''');';
END;
$$;
