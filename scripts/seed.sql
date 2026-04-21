-- Local dev seed (#269, updated #282)
--
-- Prereqs:
--   1. Local Supabase stack running: `just local-deps`
--   2. Schema applied: `just dev-reset` (runs `supabase db reset` → supabase/migrations/*.sql)
--      또는 api-server 가 SeaORM 마이그레이션을 startup 시 실행
--   3. This file is idempotent — safe to re-run.
--
-- Scope: minimum data to render home feed + admin pages. Auth users are NOT created here —
-- 로컬 GoTrue(#282, http://localhost:54321) 에 테스트 유저 생성 후 해당 UUID 를 사용.
-- Studio (http://localhost:54323) 의 Authentication 탭에서 가장 빠르게 생성 가능.

BEGIN;

-- ---- 1. Dev users (must match real Supabase Auth UUIDs for session flow) ------------------
-- NOTE: placeholder UUIDs — replace with your team's actual dev Supabase Auth user IDs.
-- Until those are pinned, this seed creates synthetic local-only users that won't match any
-- real JWT. Use these only for RPC testing where an admin/user id is needed in the DB.
INSERT INTO public.users (id, email, username, display_name, is_admin, rank, total_points)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'local_admin@decoded.local',   'local_admin', 'Local Admin', true,  'Expert',      1000),
    ('00000000-0000-0000-0000-000000000002', 'local_user@decoded.local',    'local_user',  'Local User',  false, 'Contributor', 100)
ON CONFLICT (id) DO NOTHING;

-- ---- 2. Categories (required for posts → spots → solutions) ------------------------------
INSERT INTO public.categories (id, name, slug, description)
VALUES
    (gen_random_uuid(), 'Fashion',     'fashion',     'Clothing, accessories, styling'),
    (gen_random_uuid(), 'Beauty',      'beauty',      'Makeup, skincare, hair'),
    (gen_random_uuid(), 'Lifestyle',   'lifestyle',   'Daily items, hobbies, interiors')
ON CONFLICT (slug) DO NOTHING;

-- ---- 3. Sample posts (minimum viable — 2 posts so home feed renders) ---------------------
-- These use the "post" structure from public.posts. Spots/solutions can be added per need.
INSERT INTO public.posts (id, image_url, artist_name, group_name, context, status, created_at)
VALUES
    (gen_random_uuid(), 'https://picsum.photos/seed/seed1/800/1200', 'Dev Artist', NULL,         'street',   'active', now()),
    (gen_random_uuid(), 'https://picsum.photos/seed/seed2/800/1200', NULL,         'Dev Group',  'airport',  'active', now())
ON CONFLICT DO NOTHING;

COMMIT;

-- Summary
SELECT 'users'       AS table, count(*) AS rows FROM public.users
UNION ALL SELECT 'categories', count(*) FROM public.categories
UNION ALL SELECT 'posts',      count(*) FROM public.posts;
