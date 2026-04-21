use sea_orm_migration::prelude::*;

/// Create `public.embeddings` + `public.search_similar()` function.
///
/// Used by api-server's embedding sync (`src/services/embedding/sync.rs`) and the
/// `/api/v1/search/similar` endpoint. Requires the `vector` extension from
/// `m20260502_000001_enable_extensions`.
///
/// Note on schema qualification: prod Supabase has `vector` installed in the `extensions`
/// schema (referenced as `extensions.vector`). Local plain Postgres has it in `public`
/// (just `vector`). We use the unqualified name — Postgres resolves it via search_path
/// wherever the extension actually lives. `SET search_path TO ''` inside SECURITY DEFINER
/// functions is preserved for prod parity, but the vector type reference uses the
/// PG-provided `vector` name which is catalog-registered regardless of schema.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        // 1) embeddings table
        conn.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS public.embeddings (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                entity_type varchar(20) NOT NULL,
                entity_id uuid NOT NULL,
                content_text text NOT NULL,
                embedding vector(256) NOT NULL,
                created_at timestamp with time zone DEFAULT now()
            );

            ALTER TABLE public.embeddings
                DROP CONSTRAINT IF EXISTS embeddings_pkey;
            ALTER TABLE public.embeddings
                ADD CONSTRAINT embeddings_pkey PRIMARY KEY (id);

            ALTER TABLE public.embeddings
                DROP CONSTRAINT IF EXISTS embeddings_entity_type_entity_id_key;
            ALTER TABLE public.embeddings
                ADD CONSTRAINT embeddings_entity_type_entity_id_key
                UNIQUE (entity_type, entity_id);

            CREATE INDEX IF NOT EXISTS idx_embeddings_entity_type
                ON public.embeddings USING btree (entity_type);
            CREATE INDEX IF NOT EXISTS idx_embeddings_hnsw
                ON public.embeddings USING hnsw (embedding vector_cosine_ops);

            ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Allow public read" ON public.embeddings;
            CREATE POLICY "Allow public read" ON public.embeddings FOR SELECT USING (true);
            "#,
        )
        .await?;

        // 2) search_similar function
        conn.execute_unprepared(
            r#"
            CREATE OR REPLACE FUNCTION public.search_similar(
                query_embedding vector,
                match_count integer DEFAULT 10,
                filter_type character varying DEFAULT NULL::character varying
            ) RETURNS TABLE(
                entity_type character varying,
                entity_id uuid,
                content_text text,
                similarity double precision
            )
            LANGUAGE plpgsql
            AS $fn$
            BEGIN
                RETURN QUERY
                SELECT e.entity_type, e.entity_id, e.content_text,
                       1 - (e.embedding <=> query_embedding) AS similarity
                FROM public.embeddings e
                WHERE (filter_type IS NULL OR e.entity_type = filter_type)
                ORDER BY e.embedding <=> query_embedding
                LIMIT match_count;
            END;
            $fn$;

            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    GRANT EXECUTE ON FUNCTION public.search_similar(vector, integer, character varying)
                        TO authenticated, service_role;
                END IF;
            END $$;
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let _ = manager;
        Ok(())
    }
}
