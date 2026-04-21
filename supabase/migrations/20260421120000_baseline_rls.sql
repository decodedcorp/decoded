-- Name: badges Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.badges FOR SELECT USING (true);


--
-- Name: categories Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.categories FOR SELECT USING (true);


--
-- Name: comments Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.comments FOR SELECT USING (true);


--
-- Name: curation_posts Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.curation_posts FOR SELECT USING (true);


--
-- Name: curations Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.curations FOR SELECT USING (true);


--
-- Name: embeddings Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.embeddings FOR SELECT USING (true);


--
-- Name: magazine_posts Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.magazine_posts FOR SELECT USING (true);


--
-- Name: magazines Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.magazines FOR SELECT USING (true);


--
-- Name: post_magazines Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.post_magazines FOR SELECT USING (true);


--
-- Name: posts Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.posts FOR SELECT USING (true);


--
-- Name: solutions Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.solutions FOR SELECT USING (true);


--
-- Name: spots Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.spots FOR SELECT USING (true);


--
-- Name: subcategories Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.subcategories FOR SELECT USING (true);


--
-- Name: synonyms Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.synonyms FOR SELECT USING (true);


--
-- Name: user_badges Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.user_badges FOR SELECT USING (true);


--
-- Name: votes Allow public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read" ON public.votes FOR SELECT USING (true);


--
-- Name: decoded_picks Allow public read decoded_picks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read decoded_picks" ON public.decoded_picks FOR SELECT USING (true);


--
-- Name: comments Auth insert comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth insert comments" ON public.comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_follows Auth insert follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth insert follows" ON public.user_follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: votes Auth insert votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Auth insert votes" ON public.votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_likes Owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete" ON public.post_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_posts Owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete" ON public.saved_posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_collections Owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete" ON public.user_collections FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_magazines Owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete" ON public.user_magazines FOR DELETE USING ((auth.uid() = created_by));


--
-- Name: user_social_accounts Owner delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete" ON public.user_social_accounts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: comments Owner delete comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete comments" ON public.comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_follows Owner delete follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete follows" ON public.user_follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: posts Owner delete posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: votes Owner delete votes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner delete votes" ON public.votes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: click_logs Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.click_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: credit_transactions Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.credit_transactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: post_likes Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.post_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_posts Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.saved_posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_collections Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.user_collections FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_magazines Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.user_magazines FOR INSERT WITH CHECK ((auth.uid() = created_by));


--
-- Name: user_social_accounts Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.user_social_accounts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: view_logs Owner insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert" ON public.view_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: posts Owner insert posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner insert posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: click_logs Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.click_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: credit_transactions Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.credit_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: post_likes Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.post_likes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_posts Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.saved_posts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_collections Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.user_collections FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_magazines Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.user_magazines FOR SELECT USING ((auth.uid() = created_by));


--
-- Name: user_social_accounts Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.user_social_accounts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: view_logs Owner select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner select" ON public.view_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_social_accounts Owner update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner update" ON public.user_social_accounts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: posts Owner update posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner update posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: users Owner update profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner update profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: users Public read profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read profiles" ON public.users FOR SELECT USING (true);


--
-- Name: user_tryon_history Users can insert own tryon history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own tryon history" ON public.user_tryon_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_tryon_history Users can view own tryon history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tryon history" ON public.user_tryon_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_events Users insert own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users insert own events" ON public.user_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_events Users read own events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own events" ON public.user_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: post_magazines admin_can_update_magazines; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY admin_can_update_magazines ON public.post_magazines FOR UPDATE USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


--
-- Name: agent_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: checkpoint_blobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkpoint_blobs ENABLE ROW LEVEL SECURITY;

--
-- Name: checkpoint_migrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkpoint_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: checkpoint_writes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkpoint_writes ENABLE ROW LEVEL SECURITY;

--
-- Name: checkpoints; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;

--
-- Name: click_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: content_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: content_reports content_reports_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_reports_insert_own ON public.content_reports FOR INSERT WITH CHECK ((auth.uid() = reporter_id));


--
-- Name: content_reports content_reports_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY content_reports_select_own ON public.content_reports FOR SELECT USING ((auth.uid() = reporter_id));


--
-- Name: credit_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: curation_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.curation_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: curations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.curations ENABLE ROW LEVEL SECURITY;

--
-- Name: decoded_picks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.decoded_picks ENABLE ROW LEVEL SECURITY;

--
-- Name: earnings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

--
-- Name: embeddings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

--
-- Name: failed_batch_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.failed_batch_items ENABLE ROW LEVEL SECURITY;

--
-- Name: magazine_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.magazine_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: magazines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.magazines ENABLE ROW LEVEL SECURITY;

--
-- Name: point_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: post_magazine_news_references; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_magazine_news_references ENABLE ROW LEVEL SECURITY;

--
-- Name: post_magazines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_magazines ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: processed_batches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.processed_batches ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: search_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: settlements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

--
-- Name: solutions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

--
-- Name: spots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

--
-- Name: subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: synonyms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.synonyms ENABLE ROW LEVEL SECURITY;

--
-- Name: try_spot_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.try_spot_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: user_badges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

--
-- Name: user_collections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

--
-- Name: user_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

--
-- Name: user_follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

--
-- Name: user_follows user_follows_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_follows_select_public ON public.user_follows FOR SELECT USING (true);


--
-- Name: user_magazines; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_magazines ENABLE ROW LEVEL SECURITY;

--
-- Name: user_social_accounts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_social_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_tryon_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_tryon_history ENABLE ROW LEVEL SECURITY;

--
-- Name: user_tryon_history user_tryon_history_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_tryon_history_select_own ON public.user_tryon_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: view_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: votes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

--
-- Name: artists Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.artists FOR SELECT USING (true);


--
-- Name: brands Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.brands FOR SELECT USING (true);


--
-- Name: group_members Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.group_members FOR SELECT USING (true);


--
-- Name: groups Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.groups FOR SELECT USING (true);


--
-- Name: images Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.images FOR SELECT USING (true);


--
-- Name: instagram_accounts Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.instagram_accounts FOR SELECT USING (true);


--
-- Name: posts Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.posts FOR SELECT USING (true);


--
-- Name: seed_asset Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.seed_asset FOR SELECT USING (true);


--
-- Name: seed_posts Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.seed_posts FOR SELECT USING (true);


--
-- Name: seed_spots Allow public read; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY "Allow public read" ON warehouse.seed_spots FOR SELECT USING (true);


--
-- Name: artists; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.artists ENABLE ROW LEVEL SECURITY;

--
-- Name: brands; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.brands ENABLE ROW LEVEL SECURITY;

--
-- Name: group_members; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.group_members ENABLE ROW LEVEL SECURITY;

--
-- Name: groups; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.groups ENABLE ROW LEVEL SECURITY;

--
-- Name: images; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.images ENABLE ROW LEVEL SECURITY;

--
-- Name: instagram_accounts; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.instagram_accounts ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: raw_post_sources; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.raw_post_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: raw_post_sources raw_post_sources_select_public; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY raw_post_sources_select_public ON warehouse.raw_post_sources FOR SELECT USING (true);


--
-- Name: raw_posts; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.raw_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: raw_posts raw_posts_select_public; Type: POLICY; Schema: warehouse; Owner: -
--

CREATE POLICY raw_posts_select_public ON warehouse.raw_posts FOR SELECT USING (true);


--
-- Name: seed_asset; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.seed_asset ENABLE ROW LEVEL SECURITY;

--
-- Name: seed_posts; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.seed_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: seed_spots; Type: ROW SECURITY; Schema: warehouse; Owner: -
--

ALTER TABLE warehouse.seed_spots ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


