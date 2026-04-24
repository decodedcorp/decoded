-- decoded: warehouse 스키마 완전 제거 + 검증 엔티티 public 이관
--
-- 배경:
--   raw_posts 파이프라인을 신규 assets Supabase 프로젝트로 분리(#333).
--   prod 는 검증 완료된 포스트 + 관련 엔티티만 보관하도록 warehouse 스키마를
--   완전 드롭하고, 계속 쓰는 엔티티 테이블(artists/groups/brands/group_members/
--   admin_audit_log/instagram_accounts)을 public 으로 이관한다.
--
-- 절차 (단일 트랜잭션):
--   1. 파이프라인/레거시 테이블 DROP CASCADE
--        raw_posts, raw_post_sources, seed_posts, seed_spots, seed_asset,
--        images, posts (warehouse.posts 레거시)
--   2. public → warehouse 방향 cross-schema FK 3개 제거
--   3. 유지할 엔티티 테이블을 public 으로 SET SCHEMA
--      (내부 FK 는 OID 기반이라 자동 유지: group_members→artists/groups,
--       instagram_accounts→artists/brands/groups, artists/groups/brands
--       →instagram_accounts)
--   4. public.* FK 재생성 (targets now in public)
--   5. warehouse 스키마 CASCADE DROP
--
-- 사전 작업(완료):
--   - 코드에서 warehouse.raw_*, warehouse.seed_*, warehouse.posts,
--     warehouse.images 참조 없음 확인
--   - instagram_accounts 는 타입 자동생성물에만 등장하지만
--     primary_instagram_account_id FK 가 artists/groups/brands 에 존재하므로
--     함께 public 으로 이관 (의존성 보존)

BEGIN;

-- 1. 파이프라인/레거시 테이블 DROP -----------------------------------
DROP TABLE IF EXISTS warehouse.raw_posts        CASCADE;
DROP TABLE IF EXISTS warehouse.raw_post_sources CASCADE;
DROP TABLE IF EXISTS warehouse.seed_spots       CASCADE;
DROP TABLE IF EXISTS warehouse.seed_asset       CASCADE;
DROP TABLE IF EXISTS warehouse.seed_posts       CASCADE;
DROP TABLE IF EXISTS warehouse.images           CASCADE;
DROP TABLE IF EXISTS warehouse.posts            CASCADE;

-- 2. Cross-schema FK 제거 (public → warehouse) -----------------------
ALTER TABLE public.posts     DROP CONSTRAINT IF EXISTS fk_posts_artist_id;
ALTER TABLE public.posts     DROP CONSTRAINT IF EXISTS fk_posts_group_id;
ALTER TABLE public.solutions DROP CONSTRAINT IF EXISTS fk_solutions_brand_id;

-- 3. 엔티티 테이블을 public 으로 이관 ---------------------------------
-- 이동 순서는 의존성에 무관 (OID 기반 FK 는 자동 유지)
ALTER TABLE warehouse.instagram_accounts SET SCHEMA public;
ALTER TABLE warehouse.artists            SET SCHEMA public;
ALTER TABLE warehouse.groups             SET SCHEMA public;
ALTER TABLE warehouse.brands             SET SCHEMA public;
ALTER TABLE warehouse.group_members      SET SCHEMA public;
ALTER TABLE warehouse.admin_audit_log    SET SCHEMA public;

-- 4. public.* FK 재생성 (동일 스키마) --------------------------------
ALTER TABLE public.posts
    ADD CONSTRAINT fk_posts_artist_id
    FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE SET NULL;

ALTER TABLE public.posts
    ADD CONSTRAINT fk_posts_group_id
    FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

ALTER TABLE public.solutions
    ADD CONSTRAINT fk_solutions_brand_id
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;

-- 5. COMMENT 업데이트 (warehouse 참조 문구 제거) ----------------------
COMMENT ON COLUMN public.posts.artist_id IS
    'FK to public.artists.id (backfilled from legacy artist_name)';
COMMENT ON COLUMN public.posts.group_id IS
    'FK to public.groups.id (backfilled from legacy group_name)';
COMMENT ON COLUMN public.solutions.brand_id IS
    'FK to public.brands.id (backfilled from metadata.brand)';

-- 6. warehouse 스키마 완전 제거 ---------------------------------------
DROP SCHEMA warehouse CASCADE;

COMMIT;
