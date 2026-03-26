-- user_follows 테이블
-- 이 파일은 Supabase Dashboard SQL Editor에서 수동으로 실행해야 합니다.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

-- 2. Indexes for COUNT query performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id  ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows (following_id);

-- 3. RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_follows_select_public"
    ON public.user_follows
    FOR SELECT
    USING (true);
