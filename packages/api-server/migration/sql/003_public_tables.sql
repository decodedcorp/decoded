CREATE SCHEMA IF NOT EXISTS public;
COMMENT ON SCHEMA public IS 'standard public schema';

SET default_tablespace = '';

SET default_table_access_method = heap;

--

-- Name: post_magazines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.post_magazines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying DEFAULT 'Untitled'::character varying NOT NULL,
    subtitle text,
    keyword character varying,
    layout_json jsonb,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    review_summary text,
    error_log jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    approved_by uuid,
    rejection_reason text,
    CONSTRAINT post_magazines_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'published'::character varying, 'rejected'::character varying, 'failed'::character varying])::text[])))
);


--

-- Name: agent_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id character varying(100) NOT NULL,
    magazine_id uuid,
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    keywords jsonb DEFAULT '[]'::jsonb,
    message_count integer DEFAULT 0,
    last_message_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);


--

-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.badges (
    id uuid NOT NULL,
    type character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon_url text,
    criteria jsonb NOT NULL,
    rarity character varying(20) DEFAULT 'common'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.categories (
    id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name json NOT NULL,
    icon_url text,
    color_hex character varying(7),
    description json,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: checkpoint_blobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.checkpoint_blobs (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    channel text NOT NULL,
    version text NOT NULL,
    type text NOT NULL,
    blob bytea
);


--

-- Name: checkpoint_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.checkpoint_migrations (
    v integer NOT NULL
);


--

-- Name: checkpoint_writes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.checkpoint_writes (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    checkpoint_id text NOT NULL,
    task_id text NOT NULL,
    idx integer NOT NULL,
    channel text NOT NULL,
    type text,
    blob bytea NOT NULL,
    task_path text DEFAULT ''::text NOT NULL
);


--

-- Name: checkpoints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.checkpoints (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    checkpoint_id text NOT NULL,
    parent_checkpoint_id text,
    type text,
    checkpoint jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--

-- Name: click_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.click_logs (
    id uuid NOT NULL,
    user_id uuid,
    solution_id uuid NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    referrer text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    parent_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: content_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.content_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    target_type character varying(32) DEFAULT 'post'::character varying NOT NULL,
    target_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reason character varying(64) NOT NULL,
    details text,
    status character varying(32) DEFAULT 'pending'::character varying NOT NULL,
    resolution text,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: credit_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    action_type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'completed'::character varying NOT NULL,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: curation_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.curation_posts (
    curation_id uuid NOT NULL,
    post_id uuid NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--

-- Name: curations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.curations (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    cover_image_url text,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--

-- Name: decoded_picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.decoded_picks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    pick_date date DEFAULT CURRENT_DATE NOT NULL,
    note text,
    curated_by character varying DEFAULT 'system'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.earnings (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    solution_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'KRW'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    affiliate_platform character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.embeddings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(20) NOT NULL,
    entity_id uuid NOT NULL,
    content_text text NOT NULL,
    embedding extensions.vector(256) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--

-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    image_url text NOT NULL,
    media_type character varying(50) NOT NULL,
    title character varying(255),
    media_metadata json,
    group_name character varying(100),
    artist_name character varying(100),
    context character varying(50),
    view_count integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trending_score double precision,
    created_with_solutions boolean,
    post_magazine_id uuid,
    ai_summary text,
    artist_id uuid,
    group_id uuid,
    style_tags jsonb,
    image_width integer,
    image_height integer,
    parent_post_id uuid,
    post_type character varying(20)
);


--

-- Name: COLUMN posts.artist_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.artist_id IS 'FK to warehouse.artists.id (backfilled from legacy artist_name)';


--

-- Name: COLUMN posts.group_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.group_id IS 'FK to warehouse.groups.id (backfilled from legacy group_name)';


--

-- Name: COLUMN posts.image_width; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.image_width IS 'Original image width in pixels';


--

-- Name: COLUMN posts.image_height; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.posts.image_height IS 'Original image height in pixels';


--

-- Name: failed_batch_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.failed_batch_items (
    id uuid NOT NULL,
    item_id character varying(255) NOT NULL,
    batch_id character varying(255) NOT NULL,
    url text NOT NULL,
    status character varying(50) NOT NULL,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: magazine_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.magazine_posts (
    magazine_id uuid NOT NULL,
    post_id uuid NOT NULL,
    section_index integer DEFAULT 0 NOT NULL
);


--

-- Name: magazines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.magazines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255) NOT NULL,
    subtitle text,
    keywords jsonb DEFAULT '[]'::jsonb NOT NULL,
    spec jsonb DEFAULT '{}'::jsonb NOT NULL,
    cover_image_url text,
    theme character varying(50),
    artists jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    review_notes text,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    published_at timestamp with time zone,
    published_by uuid,
    agent_version character varying(20),
    generation_log jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: point_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.point_logs (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    activity_type character varying NOT NULL,
    points integer NOT NULL,
    ref_id uuid,
    ref_type character varying,
    description character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.post_likes (
    id uuid NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: post_magazine_news_references; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.post_magazine_news_references (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_magazine_id uuid NOT NULL,
    title character varying NOT NULL,
    url character varying NOT NULL,
    source character varying NOT NULL,
    summary text,
    og_title character varying,
    og_description text,
    og_image character varying,
    og_site_name character varying,
    relevance_score double precision DEFAULT 0 NOT NULL,
    credibility_score double precision DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    matched_item character varying
);


--

-- Name: processed_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.processed_batches (
    batch_id character varying(255) NOT NULL,
    processing_timestamp timestamp with time zone NOT NULL,
    total_count integer NOT NULL,
    success_count integer NOT NULL,
    partial_count integer NOT NULL,
    failed_count integer NOT NULL,
    processing_time_ms integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: saved_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.saved_posts (
    id uuid NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: search_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.search_logs (
    id uuid NOT NULL,
    user_id uuid,
    query character varying(255) NOT NULL,
    filters json,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: settlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.settlements (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    currency character varying(10) DEFAULT 'KRW'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    bank_info jsonb,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: solutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.solutions (
    id uuid NOT NULL,
    spot_id uuid NOT NULL,
    user_id uuid NOT NULL,
    match_type character varying(20),
    title character varying(255) NOT NULL,
    original_url text,
    affiliate_url text,
    thumbnail_url text,
    description text,
    accurate_count integer DEFAULT 0 NOT NULL,
    different_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_adopted boolean DEFAULT false NOT NULL,
    adopted_at timestamp with time zone,
    click_count integer DEFAULT 0 NOT NULL,
    purchase_count integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    comment text,
    qna jsonb,
    keywords jsonb,
    link_type character varying(20) DEFAULT 'other'::character varying,
    brand_id uuid,
    price_amount numeric(12,2),
    price_currency character varying(10) DEFAULT 'KRW'::character varying
);


--

-- Name: COLUMN solutions.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solutions.metadata IS 'Product metadata (price, brand, etc.)';


--

-- Name: COLUMN solutions.comment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solutions.comment IS 'Solver 코멘트 (상품 설명과 구분)';


--

-- Name: COLUMN solutions.qna; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solutions.qna IS 'Question and Answer pairs from Gemini analysis';


--

-- Name: COLUMN solutions.link_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solutions.link_type IS 'Link type: product | article | video | other';


--

-- Name: COLUMN solutions.brand_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.solutions.brand_id IS 'FK to warehouse.brands.id (backfilled from metadata.brand)';


--

-- Name: spots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.spots (
    id uuid NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    position_left text NOT NULL,
    position_top text NOT NULL,
    subcategory_id uuid,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.subcategories (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name json NOT NULL,
    description json,
    display_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: synonyms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.synonyms (
    id uuid NOT NULL,
    type character varying(50) NOT NULL,
    canonical character varying(255) NOT NULL,
    synonyms text[] NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: try_spot_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.try_spot_tags (
    id uuid NOT NULL,
    try_post_id uuid NOT NULL,
    spot_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_badges (
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: user_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_collections (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    magazine_id uuid NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: user_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type character varying NOT NULL,
    entity_id uuid,
    session_id character varying NOT NULL,
    page_path character varying NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: user_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: user_magazines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_magazines (
    id uuid NOT NULL,
    created_by uuid NOT NULL,
    magazine_type character varying(20) NOT NULL,
    title text NOT NULL,
    theme_palette jsonb,
    layout_json jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: user_social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_social_accounts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider character varying(20) NOT NULL,
    provider_user_id text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: user_tryon_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.user_tryon_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    image_url text NOT NULL,
    style_combination jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: TABLE user_tryon_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_tryon_history IS 'Virtual try-on (VTON) history for archive stats';


--

-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(50) NOT NULL,
    display_name character varying(100),
    avatar_url text,
    bio text,
    rank character varying(20) DEFAULT 'Member'::character varying NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    style_dna jsonb,
    ink_credits integer DEFAULT 5 NOT NULL,
    studio_config jsonb
);


--

-- Name: view_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.view_logs (
    id uuid NOT NULL,
    user_id uuid,
    reference_type character varying(20) NOT NULL,
    reference_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--

-- Name: votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.votes (
    id uuid NOT NULL,
    solution_id uuid NOT NULL,
    user_id uuid NOT NULL,
    vote_type character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
