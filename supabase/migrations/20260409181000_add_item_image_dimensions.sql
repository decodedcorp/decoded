-- Add image dimension columns to item table for CLS prevention
-- Nullable to avoid breaking existing workflows
-- Guarded with IF EXISTS so local Supabase (where `item` table may not yet exist)
-- and any environment without the legacy `item` table can run this migration safely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'item'
  ) THEN
    ALTER TABLE public.item
      ADD COLUMN IF NOT EXISTS image_width  integer,
      ADD COLUMN IF NOT EXISTS image_height integer;

    COMMENT ON COLUMN public.item.image_width IS '아이템 이미지 가로 크기 (픽셀)';
    COMMENT ON COLUMN public.item.image_height IS '아이템 이미지 세로 크기 (픽셀)';
  END IF;
END $$;
