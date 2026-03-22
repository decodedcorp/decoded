-- Supabase Auth 트리거: 새 사용자 생성 시 users 테이블에 자동 삽입
-- 이 파일은 Supabase Dashboard SQL Editor에서 수동으로 실행해야 합니다.

-- handle_new_user 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 추가
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 트리거 설명
COMMENT ON FUNCTION public.handle_new_user() IS 'Supabase Auth에서 새 사용자 생성 시 public.users 테이블에 자동으로 레코드 생성';
