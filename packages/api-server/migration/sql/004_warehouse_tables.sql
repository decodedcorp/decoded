-- warehouse tables

-- Name: admin_audit_log; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.admin_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid NOT NULL,
    action text NOT NULL,
    target_table text NOT NULL,
    target_id uuid,
    before_state jsonb,
    after_state jsonb,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: TABLE admin_audit_log; Type: COMMENT; Schema: warehouse; Owner: -
--

COMMENT ON TABLE warehouse.admin_audit_log IS 'Admin action audit trail for all seed-ops and entity management operations';


--

-- Name: artists; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.artists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ko text,
    name_en text,
    profile_image_url text,
    primary_instagram_account_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: brands; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.brands (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ko text,
    name_en text,
    logo_image_url text,
    primary_instagram_account_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: group_members; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.group_members (
    group_id uuid NOT NULL,
    artist_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: groups; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ko text,
    name_en text,
    profile_image_url text,
    primary_instagram_account_id uuid,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: images; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    image_hash text NOT NULL,
    image_url text NOT NULL,
    with_items boolean DEFAULT false NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: instagram_accounts; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.instagram_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    account_type warehouse.account_type NOT NULL,
    name_ko text,
    name_en text,
    display_name text,
    bio text,
    profile_image_url text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    wikidata_status text,
    wikidata_id text,
    needs_review boolean,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    brand_id uuid,
    artist_id uuid,
    entity_ig_role warehouse.entity_ig_role,
    entity_region_code text,
    group_id uuid,
    CONSTRAINT warehouse_instagram_accounts_brand_xor_artist CHECK ((NOT ((brand_id IS NOT NULL) AND (artist_id IS NOT NULL)))),
    CONSTRAINT warehouse_instagram_accounts_entity_role_when_linked CHECK ((((brand_id IS NULL) AND (artist_id IS NULL)) OR (entity_ig_role IS NOT NULL))),
    CONSTRAINT warehouse_instagram_accounts_wikidata_status_check CHECK (((wikidata_status IS NULL) OR (wikidata_status = ANY (ARRAY['matched'::text, 'not_found'::text, 'ambiguous'::text, 'error'::text]))))
);


--

-- Name: posts; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    posted_at timestamp with time zone NOT NULL,
    caption_text text,
    tagged_account_ids uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: raw_post_sources; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.raw_post_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    platform text NOT NULL,
    source_type text NOT NULL,
    source_identifier text NOT NULL,
    label text,
    is_active boolean DEFAULT true NOT NULL,
    fetch_interval_seconds integer DEFAULT 3600 NOT NULL,
    last_enqueued_at timestamp with time zone,
    last_scraped_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: raw_posts; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.raw_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid NOT NULL,
    platform text NOT NULL,
    external_id text NOT NULL,
    external_url text NOT NULL,
    image_url text NOT NULL,
    r2_key text,
    r2_url text,
    image_hash text,
    caption text,
    author_name text,
    parse_status text DEFAULT 'pending'::text NOT NULL,
    parse_result jsonb,
    parse_error text,
    parse_attempts integer DEFAULT 0 NOT NULL,
    seed_post_id uuid,
    platform_metadata jsonb,
    dispatch_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT raw_posts_parse_status_check CHECK ((parse_status = ANY (ARRAY['pending'::text, 'parsing'::text, 'parsed'::text, 'failed'::text, 'skipped'::text])))
);


--

-- Name: seed_asset; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.seed_asset (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seed_post_id uuid NOT NULL,
    source_url text,
    source_domain text,
    archived_url text,
    image_hash text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--

-- Name: seed_posts; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.seed_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_post_id uuid,
    source_image_id uuid,
    image_url text NOT NULL,
    media_source jsonb,
    group_id uuid,
    artist_id uuid,
    metadata jsonb,
    status text DEFAULT 'draft'::text NOT NULL,
    publish_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    backend_post_id uuid
);


--

-- Name: seed_spots; Type: TABLE; Schema: warehouse; Owner: -
--

CREATE TABLE IF NOT EXISTS warehouse.seed_spots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    seed_post_id uuid NOT NULL,
    request_order integer NOT NULL,
    position_left text NOT NULL,
    position_top text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    publish_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    solutions jsonb DEFAULT '[]'::jsonb NOT NULL,
    subcategory_id uuid
);


--
