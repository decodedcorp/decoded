-- #151 Post Magazine 승인 워크플로우: is_admin 함수 + 필드 + CHECK + RLS

-- 1) is_admin(uuid) SQL 함수 정의
--    `users.is_admin` 컬럼을 단일 진실원으로 사용
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = user_id),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- 2) 승인 메타데이터 컬럼
ALTER TABLE public.post_magazines
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3) 기존 NULL 레코드 안전하게 'draft'로 백필
UPDATE public.post_magazines SET status = 'draft' WHERE status IS NULL;

-- 4) status CHECK 제약
ALTER TABLE public.post_magazines
  DROP CONSTRAINT IF EXISTS post_magazines_status_check;
ALTER TABLE public.post_magazines
  ADD CONSTRAINT post_magazines_status_check
  CHECK (status IN ('draft', 'pending', 'published', 'rejected'));

-- 5) 관리자 UPDATE RLS 정책
DROP POLICY IF EXISTS "admin_can_update_magazines" ON public.post_magazines;
CREATE POLICY "admin_can_update_magazines"
  ON public.post_magazines
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 6) 필터링 인덱스
CREATE INDEX IF NOT EXISTS post_magazines_status_idx
  ON public.post_magazines(status)
  WHERE status IN ('pending', 'draft');
