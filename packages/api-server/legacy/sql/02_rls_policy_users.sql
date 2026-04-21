-- RLS 정책: users 테이블
-- 이 파일은 Supabase Dashboard SQL Editor에서 수동으로 실행해야 합니다.

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자는 모든 유저 프로필을 조회할 수 있음 (공개 프로필)
CREATE POLICY "Users are viewable by everyone"
ON public.users
FOR SELECT
USING (true);

-- 정책 2: 사용자는 자신의 프로필만 수정할 수 있음
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 정책 3: 사용자는 자신의 프로필만 삭제할 수 있음
CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
USING (auth.uid() = id);

-- 정책 4: 새 사용자는 트리거를 통해서만 생성됨 (직접 INSERT 불가)
-- INSERT 정책은 생성하지 않음 (트리거에서만 INSERT 가능)

-- RLS 정책 설명
COMMENT ON POLICY "Users are viewable by everyone" ON public.users IS '모든 사용자 프로필은 공개 (SELECT)';
COMMENT ON POLICY "Users can update own profile" ON public.users IS '사용자는 자신의 프로필만 수정 가능 (UPDATE)';
COMMENT ON POLICY "Users can delete own profile" ON public.users IS '사용자는 자신의 프로필만 삭제 가능 (DELETE)';
