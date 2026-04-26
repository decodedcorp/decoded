-- decoded assets: 초기 스키마
--
-- 파이프라인 스테이징 전용 Supabase 프로젝트.
-- 모든 테이블은 public 스키마 (warehouse 스키마 사용 안 함 — 완전 분리 원칙).
--
-- 상태머신 (raw_posts.status):
--   NOT_STARTED → IN_PROGRESS → COMPLETED → (admin verify) → VERIFIED
--                              ↘ ERROR
--
-- 검증(verify)이 최종 액션: admin이 COMPLETED 를 승인하면
-- prod.posts 에 INSERT 되고 assets 쪽 status 가 VERIFIED 로 전이된다.
-- 승격(promote) 별도 개념 없음. 상세: docs/architecture/assets-project.md

-- 파이프라인 상태 enum -------------------------------------------------
CREATE TYPE public.pipeline_status AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'VERIFIED',
    'ERROR'
);

-- 수집 소스 ----------------------------------------------------------
CREATE TABLE public.raw_post_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform text NOT NULL,                               -- 'pinterest' | 'instagram' | ...
    source_type text NOT NULL,                            -- 'board' | 'account' | 'hashtag' | ...
    source_identifier text NOT NULL,                      -- URL / handle / 식별자
    label text,
    is_active boolean NOT NULL DEFAULT true,
    fetch_interval_seconds integer NOT NULL DEFAULT 3600,
    last_enqueued_at timestamptz,
    last_scraped_at timestamptz,
    initial_scraped_at timestamptz,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT raw_post_sources_identity_unique
        UNIQUE (platform, source_type, source_identifier)
);

COMMENT ON TABLE  public.raw_post_sources IS 'Pinterest/Instagram 등 플랫폼별 수집 소스 설정';
COMMENT ON COLUMN public.raw_post_sources.initial_scraped_at
    IS '초기 백필(최초 1회) 스크랩 완료 시각. 이후부터는 incremental fetch 적용';

-- 수집된 원본 + 파이프라인 상태 ---------------------------------------
CREATE TABLE public.raw_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id uuid NOT NULL REFERENCES public.raw_post_sources(id) ON DELETE CASCADE,
    platform text NOT NULL,
    external_id text NOT NULL,
    external_url text,

    -- 이미지 / 미디어
    image_url text,
    r2_key text,
    r2_url text,
    image_hash text,

    -- 플랫폼 메타
    caption text,
    author_name text,
    platform_metadata jsonb,

    -- 파이프라인 상태 (5-state)
    status public.pipeline_status NOT NULL DEFAULT 'NOT_STARTED',

    -- 파서 세부 상태 (하위 텔레메트리, status와 분리)
    parse_status text NOT NULL DEFAULT 'pending',
    parse_result jsonb,
    parse_error text,
    parse_attempts integer NOT NULL DEFAULT 0,

    -- 검증(verify) 이력
    verified_at timestamptz,
    verified_by uuid,                                     -- FK 없음: admin 유저는 prod 프로젝트에 존재

    dispatch_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT raw_posts_platform_external_id_unique
        UNIQUE (platform, external_id),
    CONSTRAINT raw_posts_parse_status_check
        CHECK (parse_status = ANY (ARRAY['pending', 'parsing', 'parsed', 'failed', 'skipped']))
);

CREATE INDEX raw_posts_status_idx         ON public.raw_posts (status);
CREATE INDEX raw_posts_status_updated_idx ON public.raw_posts (status, updated_at DESC);
CREATE INDEX raw_posts_source_idx         ON public.raw_posts (source_id);
CREATE INDEX raw_posts_dispatch_idx       ON public.raw_posts (dispatch_id);
CREATE INDEX raw_posts_verified_at_idx    ON public.raw_posts (verified_at DESC) WHERE verified_at IS NOT NULL;

COMMENT ON COLUMN public.raw_posts.status
    IS '파이프라인 상태머신. 기본값 NOT_STARTED. admin 검증 시 VERIFIED 전이';
COMMENT ON COLUMN public.raw_posts.verified_by
    IS 'prod 프로젝트의 admin user id. cross-project FK는 불가능하므로 애플리케이션 레벨에서만 참조';

-- 상태 전환 감사 로그 -------------------------------------------------
CREATE TABLE public.pipeline_events (
    id bigserial PRIMARY KEY,
    raw_post_id uuid NOT NULL REFERENCES public.raw_posts(id) ON DELETE CASCADE,
    from_status public.pipeline_status,
    to_status public.pipeline_status NOT NULL,
    actor uuid,                                           -- admin user id 또는 NULL(system)
    note text,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pipeline_events_raw_post_idx
    ON public.pipeline_events (raw_post_id, occurred_at DESC);

COMMENT ON TABLE public.pipeline_events IS
    '상태 전환 감사 로그. raw_posts.status 갱신과 동일 트랜잭션에서 INSERT';

-- updated_at 자동 갱신 트리거 ----------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_raw_post_sources_updated_at
    BEFORE UPDATE ON public.raw_post_sources
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_raw_posts_updated_at
    BEFORE UPDATE ON public.raw_posts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS — 기본 deny, 실사용은 service role (api-server / ai-server) ------
ALTER TABLE public.raw_post_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_events  ENABLE ROW LEVEL SECURITY;
