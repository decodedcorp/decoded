-- Seed: `system` category + `uncategorized` subcategory (idempotent)
--
-- Why: `api-server` Post creation path calls `resolve_uncategorized_subcategory_id`
--      in `packages/api-server/src/domains/subcategories/service.rs`. Without this
--      seed, POST /api/v1/posts fails with 500
--      "system category not found; run migrations" whenever the request has no
--      pre-tagged spot (most no-solution uploads). See GitHub issue #312.
--
-- SOT: this file (Supabase CLI migrations). The equivalent SeaORM migration
--      (`m20260320_000001_add_system_uncategorized_subcategory.rs`) is skipped
--      on dev (`SKIP_DB_MIGRATIONS=1`), so the Supabase path must carry it.
--
-- Idempotent: uses unique constraints `categories_code_key` and
-- `idx_subcategories_category_code_unique (category_id, code)`.

BEGIN;

INSERT INTO public.categories (id, code, name, display_order, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'system',
    '{"ko": "시스템", "en": "System"}'::json,
    99,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.subcategories (id, category_id, code, name, display_order, is_active, created_at, updated_at)
SELECT
    gen_random_uuid(),
    c.id,
    'uncategorized',
    '{"ko": "카테고리 없음", "en": "Uncategorized"}'::json,
    1,
    true,
    NOW(),
    NOW()
FROM public.categories c
WHERE c.code = 'system'
ON CONFLICT (category_id, code) DO NOTHING;

UPDATE public.spots
SET subcategory_id = s.id
FROM public.subcategories s
INNER JOIN public.categories c ON c.id = s.category_id
WHERE public.spots.subcategory_id IS NULL
  AND c.code = 'system'
  AND s.code = 'uncategorized';

COMMIT;
