-- RLS 정책: posts 테이블
-- 공개 조회, 본인만 수정/삭제

-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 활성화된 게시물 조회 가능
CREATE POLICY "posts_select_active"
    ON posts
    FOR SELECT
    USING (status = 'active');

-- 정책 2: 인증된 사용자는 자신이 작성한 게시물 조회 가능 (hidden 포함)
CREATE POLICY "posts_select_own"
    ON posts
    FOR SELECT
    USING (auth.uid() = user_id);

-- 정책 3: 인증된 사용자는 게시물 생성 가능
CREATE POLICY "posts_insert_authenticated"
    ON posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 정책 4: 인증된 사용자는 자신이 작성한 게시물만 수정 가능
CREATE POLICY "posts_update_own"
    ON posts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 정책 5: 인증된 사용자는 자신이 작성한 게시물만 삭제 가능
CREATE POLICY "posts_delete_own"
    ON posts
    FOR DELETE
    USING (auth.uid() = user_id);

