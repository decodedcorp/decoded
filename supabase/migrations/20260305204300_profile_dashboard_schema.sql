-- Profile Dashboard: Add user_tryon_history table
-- Related component: ArchiveStats (try-on count)
--
-- Already exist (no action needed):
--   users.ink_credits (default 5)
--   users.style_dna (jsonb)
--   user_social_accounts

CREATE TABLE IF NOT EXISTS public.user_tryon_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  style_combination jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_tryon_history IS 'Virtual try-on (VTON) history for archive stats';

ALTER TABLE public.user_tryon_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tryon history"
  ON public.user_tryon_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tryon history"
  ON public.user_tryon_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_tryon_history_user_id
  ON public.user_tryon_history(user_id);

CREATE INDEX IF NOT EXISTS idx_user_tryon_history_created_at
  ON public.user_tryon_history(user_id, created_at DESC);
