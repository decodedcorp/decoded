-- user_tryon_history 테이블
-- 이 파일은 Supabase Dashboard SQL Editor에서 수동으로 실행해야 합니다.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.user_tryon_history (
    id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for user_id query performance
CREATE INDEX IF NOT EXISTS idx_user_tryon_history_user_id
    ON public.user_tryon_history (user_id);

-- 3. RLS
ALTER TABLE public.user_tryon_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tryon_history_select_own"
    ON public.user_tryon_history
    FOR SELECT
    USING (auth.uid() = user_id);
