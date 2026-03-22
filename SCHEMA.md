# SCHEMA.md - DECODED 데이터베이스 스키마

**Version:** 1.0.0
**Last Updated:** 2026.01.08
**Parent Document:** [REQUIREMENT.md](./REQUIREMENT.md)

---

> 이 문서는 REQUIREMENT.md에서 분리된 상세 데이터베이스 스키마 문서입니다.
> ERD 및 테이블 목록은 [REQUIREMENT.md 섹션 5](./REQUIREMENT.md#5-데이터베이스-설계) 참조

---

## 목차

1. [핵심 테이블](#1-핵심-테이블)
2. [인덱스](#2-인덱스)
3. [Row Level Security (RLS)](#3-row-level-security-rls)

---

## 1. 핵심 테이블

```sql
-- 사용자 프로필 (auth.users와 1:1 연결)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    rank VARCHAR(20) DEFAULT 'Member', -- 'Member' | 'Contributor' | 'Expert'
    total_points INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 게시물 (이미지 + 메타데이터)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Cloudflare URL
    media_type VARCHAR(50) NOT NULL, -- 'mv' | 'drama' | 'movie' | 'youtube' | 'variety' | 'event' | 'paparazzi' | 'commercial'
    media_title VARCHAR(255) NOT NULL,
    media_metadata JSONB, -- { platform, timestamp, season, episode, year, ... }
    group_name VARCHAR(100),
    artist_name VARCHAR(100),
    context VARCHAR(50), -- 'airport' | 'stage' | 'mv' | 'red_carpet' | etc
    view_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active' | 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE posts IS '사용자가 업로드한 미디어 이미지 게시물';
COMMENT ON COLUMN posts.media_type IS '미디어 타입 (검색/필터링용)';
COMMENT ON COLUMN posts.media_title IS '미디어 제목 (드라마명, MV명 등)';
COMMENT ON COLUMN posts.media_metadata IS '미디어 부가 정보 (platform, timestamp, season 등 - 타입별로 다름)';
COMMENT ON COLUMN posts.group_name IS '그룹명 (예: BLACKPINK) - AI 제안 후 사용자 확인/수정을 거쳐 저장됨';
COMMENT ON COLUMN posts.artist_name IS '아티스트명 (예: Jennie) - AI 제안 후 사용자 확인/수정을 거쳐 저장됨';
COMMENT ON COLUMN posts.context IS '상황 정보 (예: airport, stage, mv) - AI 제안 후 사용자 확인/수정을 거쳐 저장됨';
COMMENT ON COLUMN posts.view_count IS '게시물 조회수';
COMMENT ON COLUMN posts.status IS '게시물 상태 (active: 공개, hidden: 숨김)';

-- 카테고리 (아이템 분류)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'fashion', 'living', 'tech', 'beauty'
    name JSONB NOT NULL, -- {"ko": "패션", "en": "Fashion", "ja": "ファッション"}
    icon_url TEXT,
    color_hex VARCHAR(7),
    description JSONB,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS '아이템 카테고리 마스터 테이블 (Admin에서 관리 가능)';
COMMENT ON COLUMN categories.code IS '카테고리 고유 코드 (영문, API에서 사용)';
COMMENT ON COLUMN categories.name IS '다국어 카테고리명 JSONB';
COMMENT ON COLUMN categories.is_active IS '활성화 상태 (비활성 시 선택 불가)';

-- 초기 카테고리 데이터
INSERT INTO categories (code, name, display_order) VALUES
    ('fashion', '{"ko": "패션", "en": "Fashion", "ja": "ファッション"}', 1),
    ('living', '{"ko": "리빙", "en": "Living", "ja": "リビング"}', 2),
    ('tech', '{"ko": "테크", "en": "Tech", "ja": "テック"}', 3),
    ('beauty', '{"ko": "뷰티", "en": "Beauty", "ja": "ビューティー"}', 4);

-- 스팟 (이미지 위 개별 아이템 위치)
CREATE TABLE spots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_left TEXT NOT NULL, -- 퍼센트 값 (0-100)
    position_top TEXT NOT NULL, -- 퍼센트 값 (0-100)
    category_id UUID REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'open', -- 'open' | 'resolved'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN spots.category_id IS '카테고리 외래키 (categories 테이블 참조)';

-- 솔루션 (Solver가 제공한 상품 정보)
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_type VARCHAR(20), -- 'perfect' | 'close' | NULL (채택 시 Spotter가 결정)
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    price_amount DECIMAL(12, 2),
    price_currency VARCHAR(10) DEFAULT 'KRW',
    original_url TEXT,
    affiliate_url TEXT,
    thumbnail_url TEXT,
    description TEXT,
    accurate_count INTEGER DEFAULT 0,
    different_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_adopted BOOLEAN DEFAULT FALSE,
    adopted_at TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active' | 'hidden'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN solutions.match_type IS 'Perfect Match(정확히 동일) 또는 Close Match(유사 대체품). 채택 시 Spotter가 결정하며, Perfect 선택 시 공식 메타데이터로 자동 업데이트됨';

-- 투표
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL, -- 'accurate' | 'different'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(solution_id, user_id)
);

-- 댓글 (Post에 대한 의견)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 뱃지 정의
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'specialist' | 'category' | 'achievement' | 'milestone'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    criteria JSONB NOT NULL, -- { type, target, threshold }
    rarity VARCHAR(20) DEFAULT 'common', -- 'common' | 'rare' | 'epic' | 'legendary'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 뱃지
CREATE TABLE user_badges (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
);

-- 활동 포인트 로그
CREATE TABLE point_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'post_create' | 'spot_create' | 'solution_create' | 'verified' | 'vote_received' | 'vote_cast' | 'purchase'
    points INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'post' | 'spot' | 'solution'
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 클릭 로그
CREATE TABLE click_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 수익 기록
CREATE TABLE earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    solution_id UUID REFERENCES solutions(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KRW',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'confirmed' | 'settled'
    affiliate_platform VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 정산 기록
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KRW',
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'completed'
    bank_info JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 큐레이션
CREATE TABLE curations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 큐레이션-Post 연결
CREATE TABLE curation_posts (
    curation_id UUID REFERENCES curations(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (curation_id, post_id)
);

-- 검색 로그 (트렌딩용)
CREATE TABLE search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query VARCHAR(255) NOT NULL,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 검색 동의어 (Meilisearch 동기화용)
CREATE TABLE synonyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'artist' | 'group' | 'location' | 'brand' | 'other'
    canonical VARCHAR(255) NOT NULL, -- 정규 표현 (예: 'Jennie')
    synonyms TEXT[] NOT NULL, -- 동의어 배열 (예: ['제니', 'JENNIE', 'jennie'])
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE synonyms IS 'Meilisearch 검색 동의어 관리 테이블 (Admin에서 관리)';
COMMENT ON COLUMN synonyms.canonical IS '정규 표현 (대표 명칭)';
COMMENT ON COLUMN synonyms.synonyms IS '동의어 배열 (검색 시 함께 매칭될 단어들)';

-- 초기 동의어 데이터
INSERT INTO synonyms (type, canonical, synonyms) VALUES
    ('artist', 'Jennie', ARRAY['제니', 'JENNIE', 'jennie', '김제니']),
    ('artist', 'Rosé', ARRAY['로제', 'Rose', 'ROSÉ', '박채영']),
    ('artist', 'Lisa', ARRAY['리사', 'LISA', 'lisa']),
    ('artist', 'Jisoo', ARRAY['지수', 'JISOO', 'jisoo', '김지수']),
    ('group', 'BLACKPINK', ARRAY['블랙핑크', 'blackpink', 'BP', '블핑']),
    ('group', 'BTS', ARRAY['방탄소년단', 'bts', 'Bangtan', '방탄']),
    ('location', 'ICN', ARRAY['인천공항', 'Incheon Airport', '인천국제공항']),
    ('location', 'LAX', ARRAY['LA공항', 'Los Angeles Airport']),
    ('brand', 'Chanel', ARRAY['샤넬', 'chanel', 'CHANEL']);
```

---

## 2. 인덱스

```sql
-- 성능 최적화를 위한 인덱스

-- Posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_media_type ON posts(media_type);
CREATE INDEX idx_posts_media_title ON posts(media_title);
CREATE INDEX idx_posts_media_metadata ON posts USING GIN (media_metadata);
CREATE INDEX idx_posts_artist_name ON posts(artist_name);
CREATE INDEX idx_posts_group_name ON posts(group_name);
CREATE INDEX idx_posts_context ON posts(context);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Categories
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Spots
CREATE INDEX idx_spots_post_id ON spots(post_id);
CREATE INDEX idx_spots_user_id ON spots(user_id);
CREATE INDEX idx_spots_category_id ON spots(category_id);
CREATE INDEX idx_spots_status ON spots(status);

-- Solutions
CREATE INDEX idx_solutions_spot_id ON solutions(spot_id);
CREATE INDEX idx_solutions_user_id ON solutions(user_id);
CREATE INDEX idx_solutions_is_verified ON solutions(is_verified);
CREATE INDEX idx_solutions_is_adopted ON solutions(is_adopted);
CREATE INDEX idx_solutions_match_type ON solutions(match_type);

-- Comments
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Votes
CREATE INDEX idx_votes_solution_id ON votes(solution_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Click logs
CREATE INDEX idx_click_logs_solution_id ON click_logs(solution_id);
CREATE INDEX idx_click_logs_user_id ON click_logs(user_id);
CREATE INDEX idx_click_logs_created_at ON click_logs(created_at);

-- Point logs
CREATE INDEX idx_point_logs_user_id ON point_logs(user_id);
CREATE INDEX idx_point_logs_created_at ON point_logs(created_at);

-- Search logs
CREATE INDEX idx_search_logs_query ON search_logs(query);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);

-- Synonyms
CREATE INDEX idx_synonyms_type ON synonyms(type);
CREATE INDEX idx_synonyms_canonical ON synonyms(canonical);
CREATE INDEX idx_synonyms_is_active ON synonyms(is_active);

-- Full-text search (PostgreSQL)
CREATE INDEX idx_posts_artist_name_trgm ON posts USING gin(artist_name gin_trgm_ops);
CREATE INDEX idx_posts_group_name_trgm ON posts USING gin(group_name gin_trgm_ops);
CREATE INDEX idx_solutions_product_name_trgm ON solutions USING gin(product_name gin_trgm_ops);
CREATE INDEX idx_solutions_brand_trgm ON solutions USING gin(brand gin_trgm_ops);
```

---

## 3. Row Level Security (RLS)

```sql
-- Supabase RLS 정책 예시

-- Users: 자신의 프로필만 수정 가능
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Posts: 누구나 조회 가능, 작성자만 수정/삭제 가능
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone" ON posts
    FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- Solutions, Spots, Votes, Comments 등도 유사하게 적용
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026.01.08 | REQUIREMENT.md에서 분리하여 초판 작성 |
