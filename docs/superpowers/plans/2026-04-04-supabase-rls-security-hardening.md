# Supabase RLS & Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** public 스키마 37개 테이블에 RLS 적용 + explore_posts 뷰 SECURITY INVOKER 전환 + 함수 search_path 고정 + extension 스키마 이동

**Architecture:** 4개 Supabase 마이그레이션으로 분리. 테이블을 3 카테고리(Public Read / User-scoped / Internal-only)로 분류하여 정형화된 RLS 정책 적용. 기존 RLS ON 테이블(5개)은 누락 정책만 보충.

**Tech Stack:** Supabase MCP `apply_migration` + `execute_sql` + `get_advisors`

**Spec:** `docs/superpowers/specs/2026-04-04-supabase-rls-security-hardening.md`

---

### Task 1: Public Read 테이블 RLS (16개 + 기존 1개 보충)

**Files:** Supabase migration only (no local files)

- [ ] **Step 1: Apply migration — public read tables**

```
mcp__supabase__apply_migration
name: rls_public_read_tables
```

```sql
-- ============================================
-- Public Read Tables: SELECT true, no write
-- ============================================

-- Reference tables (read-only)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.categories FOR SELECT USING (true);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.subcategories FOR SELECT USING (true);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.badges FOR SELECT USING (true);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.user_badges FOR SELECT USING (true);

ALTER TABLE public.synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.synonyms FOR SELECT USING (true);

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.embeddings FOR SELECT USING (true);

-- Content tables (public read)
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.spots FOR SELECT USING (true);

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.solutions FOR SELECT USING (true);

ALTER TABLE public.post_magazines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.post_magazines FOR SELECT USING (true);

ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.magazines FOR SELECT USING (true);

ALTER TABLE public.magazine_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.magazine_posts FOR SELECT USING (true);

ALTER TABLE public.curations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.curations FOR SELECT USING (true);

ALTER TABLE public.curation_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.curation_posts FOR SELECT USING (true);

-- Posts: public read + owner write
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Owner insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read + auth write
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth insert comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Votes: public read + auth write
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Auth insert votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- user_follows: already RLS ON with public read, add write policies
CREATE POLICY "Auth insert follows" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Owner delete follows" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id);
```

- [ ] **Step 2: Verify public read tables**

```sql
SELECT c.relname, CASE WHEN c.relrowsecurity THEN 'ON' ELSE 'OFF' END as rls,
       (SELECT COUNT(*) FROM pg_policy p WHERE p.polrelid = c.oid) as policies
FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname IN (
  'categories','subcategories','badges','user_badges','synonyms','embeddings',
  'spots','solutions','post_magazines','magazines','magazine_posts',
  'curations','curation_posts','posts','comments','votes','user_follows'
) ORDER BY c.relname;
```

Expected: All 17 tables show `ON`, posts has 4 policies, comments/votes 3 each, user_follows 3, others 1 each.

---

### Task 2: User-scoped 테이블 RLS (9개)

- [ ] **Step 1: Apply migration — user-scoped tables**

```
mcp__supabase__apply_migration
name: rls_user_scoped_tables
```

```sql
-- ============================================
-- User-scoped Tables: owner-only CRUD
-- ============================================

-- CRITICAL: user_social_accounts (token protection)
ALTER TABLE public.user_social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.user_social_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.user_social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update" ON public.user_social_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON public.user_social_accounts FOR DELETE USING (auth.uid() = user_id);

-- Users: public read + owner update only
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Owner update profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Private user data tables
ALTER TABLE public.user_magazines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.user_magazines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.user_magazines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON public.user_magazines FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.user_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.user_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON public.user_collections FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.post_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner delete" ON public.saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Logging tables (insert own + read own)
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.click_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.click_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.view_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.view_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner select" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner insert" ON public.credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Verify token protection**

```sql
-- Verify user_social_accounts is now protected
SELECT c.relname, CASE WHEN c.relrowsecurity THEN 'ON' ELSE 'OFF' END as rls,
       (SELECT COUNT(*) FROM pg_policy p WHERE p.polrelid = c.oid) as policies
FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname IN (
  'user_social_accounts','users','user_magazines','user_collections',
  'post_likes','saved_posts','click_logs','view_logs','credit_transactions'
) ORDER BY c.relname;
```

Expected: All 9 tables `ON`. user_social_accounts has 4 policies, users 2, logging tables 2, others 3.

---

### Task 3: Internal-only 테이블 RLS (11개)

- [ ] **Step 1: Apply migration — internal tables**

```
mcp__supabase__apply_migration
name: rls_internal_only_tables
```

```sql
-- ============================================
-- Internal-only Tables: RLS ON, no policies = deny all
-- ============================================

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_blobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_writes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- seaql_migrations: public read (migration info is not sensitive)
ALTER TABLE public.seaql_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.seaql_migrations FOR SELECT USING (true);
```

- [ ] **Step 2: Verify internal tables**

```sql
SELECT c.relname, CASE WHEN c.relrowsecurity THEN 'ON' ELSE 'OFF' END as rls
FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND c.relname IN (
  'agent_sessions','checkpoints','checkpoint_blobs','checkpoint_writes',
  'checkpoint_migrations','processed_batches','failed_batch_items',
  'search_logs','point_logs','earnings','settlements','seaql_migrations'
) ORDER BY c.relname;
```

Expected: All 12 tables `ON`.

---

### Task 4: Security Hardening (뷰 + 함수 + extension)

- [ ] **Step 1: Apply migration — security hardening**

```
mcp__supabase__apply_migration
name: security_hardening_views_functions
```

```sql
-- ============================================
-- 1. explore_posts: SECURITY INVOKER
-- ============================================
CREATE OR REPLACE VIEW public.explore_posts
WITH (security_invoker = true) AS
SELECT p.id, p.user_id, p.image_url, p.media_type, p.title,
       p.media_metadata, p.group_name, p.artist_name, p.context,
       p.view_count, p.status, p.created_at, p.updated_at,
       p.trending_score, p.created_with_solutions, p.post_magazine_id,
       p.ai_summary, p.artist_id, p.group_id,
       pm.title AS post_magazine_title
FROM posts p
JOIN post_magazines pm ON pm.id = p.post_magazine_id
WHERE p.status::text = 'active'::text
  AND p.image_url IS NOT NULL
  AND p.created_with_solutions = true
  AND pm.status::text = 'published'::text;

-- ============================================
-- 2. Functions: set search_path
-- ============================================
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.search_similar(vector, integer, character varying) SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION warehouse.touch_updated_at() SET search_path = '';

-- ============================================
-- 3. Extensions: move to extensions schema
-- ============================================
ALTER EXTENSION unaccent SET SCHEMA extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
```

- [ ] **Step 2: Verify security hardening**

```sql
-- Check view security
SELECT schemaname, viewname,
       (SELECT reloptions FROM pg_class WHERE relname = 'explore_posts') as options
FROM pg_views WHERE viewname = 'explore_posts';

-- Check function search_path
SELECT p.proname, n.nspname, p.proconfig
FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('handle_new_user','search_similar','update_updated_at_column','touch_updated_at');

-- Check extension schemas
SELECT extname, nspname FROM pg_extension e JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname IN ('unaccent','pg_trgm');
```

---

### Task 5: 전체 검증 — Security Advisor 재실행

- [ ] **Step 1: Run security advisor**

`mcp__supabase__get_advisors` type=security

Expected: `rls_disabled_in_public` ERROR 0건, `security_definer_view` 0건, `function_search_path_mutable` 0건, `extension_in_public` 0건. `sensitive_columns_exposed` 해소 (user_social_accounts RLS 적용됨).

- [ ] **Step 2: Run performance advisor**

`mcp__supabase__get_advisors` type=performance

Verify no new performance issues introduced by RLS.

- [ ] **Step 3: Commit spec and plan**

```bash
git add docs/superpowers/specs/2026-04-04-supabase-rls-security-hardening.md
git add docs/superpowers/plans/2026-04-04-supabase-rls-security-hardening.md
git commit -m "docs: add RLS security hardening spec and plan"
```
