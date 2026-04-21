use sea_orm_migration::prelude::*;

/// `public.posts` / `public.solutions`에 warehouse 마스터 FK 컬럼 추가 및 백필.
/// Supabase `supabase/migrations/`의 다음 SQL과 동일한 효과:
/// - add_artist_id_and_brand_id_backfill
/// - backfill_solution_brand_id_from_title_prefix
/// - add_posts_group_id_backfill
///
/// 다른 스키마(`warehouse`) 참조 FK는 SeaORM `ForeignKey::create()`로는 지정하기 어려워 raw SQL을 사용합니다.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        conn.execute_unprepared(
            r#"
CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS artist_id uuid;

ALTER TABLE public.solutions
  ADD COLUMN IF NOT EXISTS brand_id uuid;

COMMENT ON COLUMN public.posts.artist_id IS 'FK to warehouse.artists.id (backfilled from legacy artist_name)';
COMMENT ON COLUMN public.solutions.brand_id IS 'FK to warehouse.brands.id (backfilled from metadata.brand)';

CREATE INDEX IF NOT EXISTS idx_posts_artist_id
  ON public.posts(artist_id);

CREATE INDEX IF NOT EXISTS idx_solutions_brand_id
  ON public.solutions(brand_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_posts_artist_id'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT fk_posts_artist_id
      FOREIGN KEY (artist_id)
      REFERENCES warehouse.artists(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_solutions_brand_id'
  ) THEN
    ALTER TABLE public.solutions
      ADD CONSTRAINT fk_solutions_brand_id
      FOREIGN KEY (brand_id)
      REFERENCES warehouse.brands(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

WITH artist_lookup AS (
  SELECT
    id,
    lower(unaccent(btrim(name_ko))) AS normalized_name
  FROM warehouse.artists
  WHERE name_ko IS NOT NULL
    AND btrim(name_ko) <> ''

  UNION ALL

  SELECT
    id,
    lower(unaccent(btrim(name_en))) AS normalized_name
  FROM warehouse.artists
  WHERE name_en IS NOT NULL
    AND btrim(name_en) <> ''
),
artist_unique AS (
  SELECT
    normalized_name,
    min(id::text)::uuid AS artist_id
  FROM artist_lookup
  GROUP BY normalized_name
  HAVING count(DISTINCT id) = 1
)
UPDATE public.posts AS p
SET artist_id = au.artist_id
FROM artist_unique AS au
WHERE p.artist_id IS NULL
  AND p.artist_name IS NOT NULL
  AND btrim(p.artist_name) <> ''
  AND lower(unaccent(btrim(p.artist_name))) = au.normalized_name;

WITH brand_lookup AS (
  SELECT
    id,
    lower(unaccent(btrim(name_ko))) AS normalized_name
  FROM warehouse.brands
  WHERE name_ko IS NOT NULL
    AND btrim(name_ko) <> ''

  UNION ALL

  SELECT
    id,
    lower(unaccent(btrim(name_en))) AS normalized_name
  FROM warehouse.brands
  WHERE name_en IS NOT NULL
    AND btrim(name_en) <> ''
),
brand_unique AS (
  SELECT
    normalized_name,
    min(id::text)::uuid AS brand_id
  FROM brand_lookup
  GROUP BY normalized_name
  HAVING count(DISTINCT id) = 1
)
UPDATE public.solutions AS s
SET brand_id = bu.brand_id
FROM brand_unique AS bu
WHERE s.brand_id IS NULL
  AND s.metadata IS NOT NULL
  AND coalesce(nullif(btrim(s.metadata->>'brand'), ''), null) IS NOT NULL
  AND lower(unaccent(btrim(s.metadata->>'brand'))) = bu.normalized_name;
"#,
        )
        .await?;

        conn.execute_unprepared(
            r#"
WITH brand_names AS (
  SELECT
    id,
    lower(unaccent(btrim(name_en))) AS norm_brand
  FROM warehouse.brands
  WHERE name_en IS NOT NULL
    AND btrim(name_en) <> ''

  UNION ALL

  SELECT
    id,
    lower(unaccent(btrim(name_ko))) AS norm_brand
  FROM warehouse.brands
  WHERE name_ko IS NOT NULL
    AND btrim(name_ko) <> ''
),
unique_brand_names AS (
  SELECT
    norm_brand,
    min(id::text)::uuid AS brand_id,
    max(length(norm_brand)) AS brand_len
  FROM brand_names
  GROUP BY norm_brand
  HAVING count(DISTINCT id) = 1
),
candidates AS (
  SELECT
    id,
    lower(unaccent(btrim(title))) AS norm_title
  FROM public.solutions
  WHERE brand_id IS NULL
    AND title IS NOT NULL
    AND btrim(title) <> ''
),
prefix_matches AS (
  SELECT
    c.id AS solution_id,
    ub.brand_id,
    row_number() OVER (
      PARTITION BY c.id
      ORDER BY ub.brand_len DESC, ub.norm_brand ASC
    ) AS rn
  FROM candidates c
  JOIN unique_brand_names ub
    ON c.norm_title = ub.norm_brand
    OR c.norm_title LIKE ub.norm_brand || ' %'
)
UPDATE public.solutions AS s
SET brand_id = pm.brand_id
FROM prefix_matches AS pm
WHERE s.id = pm.solution_id
  AND pm.rn = 1
  AND s.brand_id IS NULL;
"#,
        )
        .await?;

        conn.execute_unprepared(
            r#"
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS group_id uuid;

COMMENT ON COLUMN public.posts.group_id IS 'FK to warehouse.groups.id (backfilled from legacy group_name)';

CREATE INDEX IF NOT EXISTS idx_posts_group_id
  ON public.posts(group_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_posts_group_id'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT fk_posts_group_id
      FOREIGN KEY (group_id)
      REFERENCES warehouse.groups(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

WITH group_lookup AS (
  SELECT
    id,
    lower(unaccent(btrim(name_ko))) AS normalized_name
  FROM warehouse.groups
  WHERE name_ko IS NOT NULL
    AND btrim(name_ko) <> ''

  UNION ALL

  SELECT
    id,
    lower(unaccent(btrim(name_en))) AS normalized_name
  FROM warehouse.groups
  WHERE name_en IS NOT NULL
    AND btrim(name_en) <> ''
),
group_unique AS (
  SELECT
    normalized_name,
    min(id::text)::uuid AS group_id
  FROM group_lookup
  GROUP BY normalized_name
  HAVING count(DISTINCT id) = 1
)
UPDATE public.posts AS p
SET group_id = gu.group_id
FROM group_unique AS gu
WHERE p.group_id IS NULL
  AND p.group_name IS NOT NULL
  AND btrim(p.group_name) <> ''
  AND lower(unaccent(btrim(p.group_name))) = gu.normalized_name;
"#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        conn.execute_unprepared(
            r#"
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS fk_posts_group_id;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS fk_posts_artist_id;
ALTER TABLE public.solutions DROP CONSTRAINT IF EXISTS fk_solutions_brand_id;

DROP INDEX IF EXISTS public.idx_posts_group_id;
DROP INDEX IF EXISTS public.idx_posts_artist_id;
DROP INDEX IF EXISTS public.idx_solutions_brand_id;

ALTER TABLE public.posts DROP COLUMN IF EXISTS group_id;
ALTER TABLE public.posts DROP COLUMN IF EXISTS artist_id;
ALTER TABLE public.solutions DROP COLUMN IF EXISTS brand_id;
"#,
        )
        .await?;

        Ok(())
    }
}
