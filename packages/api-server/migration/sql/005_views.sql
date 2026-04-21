-- views

-- Name: explore_posts; Type: VIEW; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.explore_posts WITH (security_invoker='true') AS
 SELECT p.id,
    p.user_id,
    p.image_url,
    p.media_type,
    p.title,
    p.media_metadata,
    p.group_name,
    p.artist_name,
    p.context,
    p.view_count,
    p.status,
    p.created_at,
    p.updated_at,
    p.trending_score,
    p.created_with_solutions,
    p.post_magazine_id,
    p.ai_summary,
    p.artist_id,
    p.group_id,
    pm.title AS post_magazine_title
   FROM (public.posts p
     JOIN public.post_magazines pm ON ((pm.id = p.post_magazine_id)))
  WHERE (((p.status)::text = 'active'::text) AND (p.image_url IS NOT NULL) AND (p.created_with_solutions = true) AND ((pm.status)::text = 'published'::text));


--
