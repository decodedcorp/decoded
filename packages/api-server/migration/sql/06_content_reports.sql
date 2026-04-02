-- content_reports 테이블
-- 이 파일은 Supabase Dashboard SQL Editor에서 수동으로 실행해야 합니다.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.content_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(32) NOT NULL DEFAULT 'post',
    target_id   UUID NOT NULL,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason      VARCHAR(64) NOT NULL,
    details     TEXT,
    status      VARCHAR(32) NOT NULL DEFAULT 'pending',
    resolution  TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_target
    ON public.content_reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status
    ON public.content_reports (status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter
    ON public.content_reports (reporter_id);

-- 3. Unique constraint: one report per user per target
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique_per_user
    ON public.content_reports (target_type, target_id, reporter_id);

-- 4. RLS
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own reports
CREATE POLICY "content_reports_insert_own"
    ON public.content_reports
    FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Users can read their own reports
CREATE POLICY "content_reports_select_own"
    ON public.content_reports
    FOR SELECT
    USING (auth.uid() = reporter_id);

-- Admin can read all reports (via service role key from Rust API)
-- Note: Rust API uses service role, so RLS is bypassed for admin operations
