-- Decoded Picks: editor/AI curated daily pick for homepage section
-- Issue #71: feat(home): Decoded Pick 큐레이션 섹션 추가

CREATE TABLE IF NOT EXISTS public.decoded_picks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  pick_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  note        TEXT,
  curated_by  TEXT NOT NULL DEFAULT 'ai',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one pick per date
CREATE UNIQUE INDEX IF NOT EXISTS decoded_picks_pick_date_unique
  ON public.decoded_picks (pick_date);

-- Quick lookup for active picks (homepage query)
CREATE INDEX IF NOT EXISTS decoded_picks_active_date
  ON public.decoded_picks (is_active, pick_date DESC);

-- RLS
ALTER TABLE public.decoded_picks ENABLE ROW LEVEL SECURITY;

-- Public read for active picks (homepage section)
CREATE POLICY "Public can read active picks"
  ON public.decoded_picks
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Authenticated full access (admin check enforced at app layer)
CREATE POLICY "Authenticated users can manage picks"
  ON public.decoded_picks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service role full access (for future cron / backend operations)
CREATE POLICY "Service role full access"
  ON public.decoded_picks
  TO service_role
  USING (true)
  WITH CHECK (true);
