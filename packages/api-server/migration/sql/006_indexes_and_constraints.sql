-- PK, UNIQUE, indexes, FKs (reordered: indexes+FK after tables; triggers excluded)

-- Name: agent_sessions agent_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_sessions
    ADD CONSTRAINT agent_sessions_pkey PRIMARY KEY (id);


--

-- Name: agent_sessions agent_sessions_thread_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_sessions
    ADD CONSTRAINT agent_sessions_thread_id_key UNIQUE (thread_id);


--

-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--

-- Name: categories categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_code_key UNIQUE (code);


--

-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--

-- Name: checkpoint_blobs checkpoint_blobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkpoint_blobs
    ADD CONSTRAINT checkpoint_blobs_pkey PRIMARY KEY (thread_id, checkpoint_ns, channel, version);


--

-- Name: checkpoint_migrations checkpoint_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkpoint_migrations
    ADD CONSTRAINT checkpoint_migrations_pkey PRIMARY KEY (v);


--

-- Name: checkpoint_writes checkpoint_writes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkpoint_writes
    ADD CONSTRAINT checkpoint_writes_pkey PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx);


--

-- Name: checkpoints checkpoints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkpoints
    ADD CONSTRAINT checkpoints_pkey PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id);


--

-- Name: click_logs click_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.click_logs
    ADD CONSTRAINT click_logs_pkey PRIMARY KEY (id);


--

-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--

-- Name: content_reports content_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_pkey PRIMARY KEY (id);


--

-- Name: credit_transactions credit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_pkey PRIMARY KEY (id);


--

-- Name: curation_posts curation_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curation_posts
    ADD CONSTRAINT curation_posts_pkey PRIMARY KEY (curation_id, post_id);


--

-- Name: curations curations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curations
    ADD CONSTRAINT curations_pkey PRIMARY KEY (id);


--

-- Name: decoded_picks decoded_picks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decoded_picks
    ADD CONSTRAINT decoded_picks_pkey PRIMARY KEY (id);


--

-- Name: earnings earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.earnings
    ADD CONSTRAINT earnings_pkey PRIMARY KEY (id);


--

-- Name: embeddings embeddings_entity_type_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_entity_type_entity_id_key UNIQUE (entity_type, entity_id);


--

-- Name: embeddings embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_pkey PRIMARY KEY (id);


--

-- Name: failed_batch_items failed_batch_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_batch_items
    ADD CONSTRAINT failed_batch_items_pkey PRIMARY KEY (id);


--

-- Name: magazine_posts magazine_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magazine_posts
    ADD CONSTRAINT magazine_posts_pkey PRIMARY KEY (magazine_id, post_id);


--

-- Name: magazines magazines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magazines
    ADD CONSTRAINT magazines_pkey PRIMARY KEY (id);


--

-- Name: user_badges pk_user_badges; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT pk_user_badges PRIMARY KEY (user_id, badge_id);


--

-- Name: point_logs point_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_logs
    ADD CONSTRAINT point_logs_pkey PRIMARY KEY (id);


--

-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--

-- Name: post_magazine_news_references post_magazine_news_references_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_magazine_news_references
    ADD CONSTRAINT post_magazine_news_references_pkey PRIMARY KEY (id);


--

-- Name: post_magazines post_magazines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_magazines
    ADD CONSTRAINT post_magazines_pkey PRIMARY KEY (id);


--

-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--

-- Name: processed_batches processed_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.processed_batches
    ADD CONSTRAINT processed_batches_pkey PRIMARY KEY (batch_id);


--

-- Name: saved_posts saved_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT saved_posts_pkey PRIMARY KEY (id);


--

-- Name: search_logs search_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT search_logs_pkey PRIMARY KEY (id);


--

-- Name: settlements settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT settlements_pkey PRIMARY KEY (id);


--

-- Name: solutions solutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT solutions_pkey PRIMARY KEY (id);


--

-- Name: spots spots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spots
    ADD CONSTRAINT spots_pkey PRIMARY KEY (id);


--

-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--

-- Name: synonyms synonyms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.synonyms
    ADD CONSTRAINT synonyms_pkey PRIMARY KEY (id);


--

-- Name: try_spot_tags try_spot_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_spot_tags
    ADD CONSTRAINT try_spot_tags_pkey PRIMARY KEY (id);


--

-- Name: user_collections user_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_collections_pkey PRIMARY KEY (id);


--

-- Name: user_events user_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_pkey PRIMARY KEY (id);


--

-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, following_id);


--

-- Name: user_magazines user_magazines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_magazines
    ADD CONSTRAINT user_magazines_pkey PRIMARY KEY (id);


--

-- Name: user_social_accounts user_social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT user_social_accounts_pkey PRIMARY KEY (id);


--

-- Name: user_tryon_history user_tryon_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tryon_history
    ADD CONSTRAINT user_tryon_history_pkey PRIMARY KEY (id);


--

-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--

-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--

-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--

-- Name: view_logs view_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.view_logs
    ADD CONSTRAINT view_logs_pkey PRIMARY KEY (id);


--

-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--

-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);


--

-- Name: artists artists_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.artists
    ADD CONSTRAINT artists_pkey PRIMARY KEY (id);


--

-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--

-- Name: group_members group_members_pkey1; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.group_members
    ADD CONSTRAINT group_members_pkey1 PRIMARY KEY (group_id, artist_id);


--

-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--

-- Name: images images_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--

-- Name: instagram_accounts instagram_accounts_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.instagram_accounts
    ADD CONSTRAINT instagram_accounts_pkey PRIMARY KEY (id);


--

-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--

-- Name: raw_post_sources raw_post_sources_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.raw_post_sources
    ADD CONSTRAINT raw_post_sources_pkey PRIMARY KEY (id);


--

-- Name: raw_post_sources raw_post_sources_unique_target; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.raw_post_sources
    ADD CONSTRAINT raw_post_sources_unique_target UNIQUE (platform, source_type, source_identifier);


--

-- Name: raw_posts raw_posts_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.raw_posts
    ADD CONSTRAINT raw_posts_pkey PRIMARY KEY (id);


--

-- Name: raw_posts raw_posts_unique_external; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.raw_posts
    ADD CONSTRAINT raw_posts_unique_external UNIQUE (platform, external_id);


--

-- Name: seed_asset seed_asset_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_asset
    ADD CONSTRAINT seed_asset_pkey PRIMARY KEY (id);


--

-- Name: seed_posts seed_posts_backend_post_id_key; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_posts
    ADD CONSTRAINT seed_posts_backend_post_id_key UNIQUE (backend_post_id);


--

-- Name: seed_posts seed_posts_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_posts
    ADD CONSTRAINT seed_posts_pkey PRIMARY KEY (id);


--

-- Name: seed_spots seed_spots_pkey; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_spots
    ADD CONSTRAINT seed_spots_pkey PRIMARY KEY (id);


--

-- Name: images warehouse_images_post_id_image_hash_key; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.images
    ADD CONSTRAINT warehouse_images_post_id_image_hash_key UNIQUE (post_id, image_hash);


--

-- Name: instagram_accounts warehouse_instagram_accounts_username_key; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.instagram_accounts
    ADD CONSTRAINT warehouse_instagram_accounts_username_key UNIQUE (username);


--

-- Name: posts warehouse_posts_account_id_posted_at_key; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.posts
    ADD CONSTRAINT warehouse_posts_account_id_posted_at_key UNIQUE (account_id, posted_at);


--

-- Name: seed_asset warehouse_seed_asset_image_hash_key; Type: CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_asset
    ADD CONSTRAINT warehouse_seed_asset_image_hash_key UNIQUE (image_hash);


--

-- Name: checkpoint_blobs_thread_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX checkpoint_blobs_thread_id_idx ON public.checkpoint_blobs USING btree (thread_id);


--

-- Name: checkpoint_writes_thread_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX checkpoint_writes_thread_id_idx ON public.checkpoint_writes USING btree (thread_id);


--

-- Name: checkpoints_thread_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX checkpoints_thread_id_idx ON public.checkpoints USING btree (thread_id);


--

-- Name: idx_badges_rarity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badges_rarity ON public.badges USING btree (rarity);


--

-- Name: idx_badges_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_badges_type ON public.badges USING btree (type);


--

-- Name: idx_categories_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_code ON public.categories USING btree (code);


--

-- Name: idx_categories_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_display_order ON public.categories USING btree (display_order);


--

-- Name: idx_categories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_is_active ON public.categories USING btree (is_active);


--

-- Name: idx_click_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_click_logs_created_at ON public.click_logs USING btree (created_at);


--

-- Name: idx_click_logs_ip_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_click_logs_ip_created ON public.click_logs USING btree (ip_address, created_at);


--

-- Name: idx_click_logs_solution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_click_logs_solution_id ON public.click_logs USING btree (solution_id);


--

-- Name: idx_click_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_click_logs_user_id ON public.click_logs USING btree (user_id);


--

-- Name: idx_click_logs_user_solution_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_click_logs_user_solution_created ON public.click_logs USING btree (user_id, solution_id, created_at);


--

-- Name: idx_comments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_parent_id ON public.comments USING btree (parent_id);


--

-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--

-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--

-- Name: idx_content_reports_reporter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_reports_reporter ON public.content_reports USING btree (reporter_id);


--

-- Name: idx_content_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_reports_status ON public.content_reports USING btree (status);


--

-- Name: idx_content_reports_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_reports_target ON public.content_reports USING btree (target_type, target_id);


--

-- Name: idx_content_reports_unique_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_content_reports_unique_per_user ON public.content_reports USING btree (target_type, target_id, reporter_id);


--

-- Name: idx_credit_transactions_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_transactions_action_type ON public.credit_transactions USING btree (action_type);


--

-- Name: idx_credit_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_transactions_status ON public.credit_transactions USING btree (status);


--

-- Name: idx_credit_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions USING btree (user_id);


--

-- Name: idx_curation_posts_curation_id_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_curation_posts_curation_id_display_order ON public.curation_posts USING btree (curation_id, display_order);


--

-- Name: idx_curation_posts_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_curation_posts_post_id ON public.curation_posts USING btree (post_id);


--

-- Name: idx_curations_is_active_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_curations_is_active_display_order ON public.curations USING btree (is_active, display_order);


--

-- Name: idx_decoded_picks_pick_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_decoded_picks_pick_date ON public.decoded_picks USING btree (pick_date DESC);


--

-- Name: idx_decoded_picks_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_decoded_picks_post_id ON public.decoded_picks USING btree (post_id);


--

-- Name: idx_earnings_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earnings_created_at ON public.earnings USING btree (created_at);


--

-- Name: idx_earnings_solution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earnings_solution_id ON public.earnings USING btree (solution_id);


--

-- Name: idx_earnings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earnings_status ON public.earnings USING btree (status);


--

-- Name: idx_earnings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_earnings_user_id ON public.earnings USING btree (user_id);


--

-- Name: idx_embeddings_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embeddings_entity_type ON public.embeddings USING btree (entity_type);


--

-- Name: idx_embeddings_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embeddings_hnsw ON public.embeddings USING hnsw (embedding extensions.vector_cosine_ops);


--

-- Name: idx_failed_items_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_failed_items_item_id ON public.failed_batch_items USING btree (item_id);


--

-- Name: idx_failed_items_retry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_failed_items_retry ON public.failed_batch_items USING btree (next_retry_at);


--

-- Name: idx_news_refs_magazine; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_news_refs_magazine ON public.post_magazine_news_references USING btree (post_magazine_id);


--

-- Name: idx_point_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_logs_created_at ON public.point_logs USING btree (created_at);


--

-- Name: idx_point_logs_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_logs_user_created ON public.point_logs USING btree (user_id, created_at);


--

-- Name: idx_point_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_point_logs_user_id ON public.point_logs USING btree (user_id);


--

-- Name: idx_post_likes_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);


--

-- Name: idx_post_likes_post_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_post_likes_post_user_unique ON public.post_likes USING btree (post_id, user_id);


--

-- Name: idx_post_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);


--

-- Name: idx_post_magazines_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_magazines_status ON public.post_magazines USING btree (status);


--

-- Name: idx_posts_artist_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_artist_id ON public.posts USING btree (artist_id);


--

-- Name: idx_posts_artist_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_artist_name ON public.posts USING btree (artist_name);


--

-- Name: idx_posts_artist_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_artist_name_trgm ON public.posts USING gin (artist_name extensions.gin_trgm_ops);


--

-- Name: idx_posts_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_context ON public.posts USING btree (context);


--

-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--

-- Name: idx_posts_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_group_id ON public.posts USING btree (group_id);


--

-- Name: idx_posts_group_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_group_name ON public.posts USING btree (group_name);


--

-- Name: idx_posts_group_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_group_name_trgm ON public.posts USING gin (group_name extensions.gin_trgm_ops);


--

-- Name: idx_posts_parent_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_parent_post_id ON public.posts USING btree (parent_post_id);


--

-- Name: idx_posts_post_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_post_type ON public.posts USING btree (post_type);


--

-- Name: idx_posts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_status ON public.posts USING btree (status);


--

-- Name: idx_posts_trending_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_trending_active ON public.posts USING btree (trending_score DESC NULLS LAST, created_at DESC) WHERE (((status)::text = 'active'::text) AND ((post_type IS NULL) OR ((post_type)::text <> 'try'::text)));


--

-- Name: idx_posts_trending_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_trending_score ON public.posts USING btree (trending_score);


--

-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);


--

-- Name: idx_processed_batches_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processed_batches_created_at ON public.processed_batches USING btree (created_at);


--

-- Name: idx_saved_posts_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_posts_post_id ON public.saved_posts USING btree (post_id);


--

-- Name: idx_saved_posts_post_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_saved_posts_post_user_unique ON public.saved_posts USING btree (post_id, user_id);


--

-- Name: idx_saved_posts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_posts_user_id ON public.saved_posts USING btree (user_id);


--

-- Name: idx_search_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_logs_created_at ON public.search_logs USING btree (created_at);


--

-- Name: idx_search_logs_query; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_logs_query ON public.search_logs USING btree (query);


--

-- Name: idx_search_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_logs_user_id ON public.search_logs USING btree (user_id);


--

-- Name: idx_settlements_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlements_created_at ON public.settlements USING btree (created_at);


--

-- Name: idx_settlements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlements_status ON public.settlements USING btree (status);


--

-- Name: idx_settlements_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_settlements_user_id ON public.settlements USING btree (user_id);


--

-- Name: idx_solutions_active_spot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_active_spot_id ON public.solutions USING btree (spot_id) WHERE ((status)::text = 'active'::text);


--

-- Name: idx_solutions_brand_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_brand_id ON public.solutions USING btree (brand_id);


--

-- Name: idx_solutions_is_adopted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_is_adopted ON public.solutions USING btree (is_adopted);


--

-- Name: idx_solutions_is_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_is_verified ON public.solutions USING btree (is_verified);


--

-- Name: idx_solutions_match_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_match_type ON public.solutions USING btree (match_type);


--

-- Name: idx_solutions_spot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_spot_id ON public.solutions USING btree (spot_id);


--

-- Name: idx_solutions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solutions_user_id ON public.solutions USING btree (user_id);


--

-- Name: idx_spots_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spots_post_id ON public.spots USING btree (post_id);


--

-- Name: idx_spots_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spots_status ON public.spots USING btree (status);


--

-- Name: idx_spots_subcategory_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_spots_subcategory_id ON public.spots USING btree (subcategory_id);


--

-- Name: idx_subcategories_category_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_subcategories_category_code_unique ON public.subcategories USING btree (category_id, code);


--

-- Name: idx_subcategories_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_category_id ON public.subcategories USING btree (category_id);


--

-- Name: idx_subcategories_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_display_order ON public.subcategories USING btree (display_order);


--

-- Name: idx_subcategories_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subcategories_is_active ON public.subcategories USING btree (is_active);


--

-- Name: idx_synonyms_canonical; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_synonyms_canonical ON public.synonyms USING btree (canonical);


--

-- Name: idx_synonyms_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_synonyms_is_active ON public.synonyms USING btree (is_active);


--

-- Name: idx_synonyms_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_synonyms_type ON public.synonyms USING btree (type);


--

-- Name: idx_try_spot_tags_spot_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_try_spot_tags_spot_id ON public.try_spot_tags USING btree (spot_id);


--

-- Name: idx_try_spot_tags_try_post_spot_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_try_spot_tags_try_post_spot_unique ON public.try_spot_tags USING btree (try_post_id, spot_id);


--

-- Name: idx_user_badges_badge_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_badge_id ON public.user_badges USING btree (badge_id);


--

-- Name: idx_user_badges_earned_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_earned_at ON public.user_badges USING btree (earned_at);


--

-- Name: idx_user_badges_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_badges_user_id ON public.user_badges USING btree (user_id);


--

-- Name: idx_user_collections_user_magazine; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_collections_user_magazine ON public.user_collections USING btree (user_id, magazine_id);


--

-- Name: idx_user_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_events_created_at ON public.user_events USING btree (created_at DESC);


--

-- Name: idx_user_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_events_event_type ON public.user_events USING btree (event_type);


--

-- Name: idx_user_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_events_user_id ON public.user_events USING btree (user_id);


--

-- Name: idx_user_follows_follower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_follows_follower_id ON public.user_follows USING btree (follower_id);


--

-- Name: idx_user_follows_following_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_follows_following_id ON public.user_follows USING btree (following_id);


--

-- Name: idx_user_magazines_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_magazines_created_by ON public.user_magazines USING btree (created_by);


--

-- Name: idx_user_magazines_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_magazines_type ON public.user_magazines USING btree (magazine_type);


--

-- Name: idx_user_social_accounts_user_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_social_accounts_user_provider ON public.user_social_accounts USING btree (user_id, provider);


--

-- Name: idx_user_tryon_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tryon_history_created_at ON public.user_tryon_history USING btree (user_id, created_at DESC);


--

-- Name: idx_user_tryon_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_tryon_history_user_id ON public.user_tryon_history USING btree (user_id);


--

-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--

-- Name: idx_users_rank; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_rank ON public.users USING btree (rank);


--

-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--

-- Name: idx_view_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_view_logs_created_at ON public.view_logs USING btree (created_at);


--

-- Name: idx_view_logs_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_view_logs_reference ON public.view_logs USING btree (reference_type, reference_id);


--

-- Name: idx_view_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_view_logs_user_id ON public.view_logs USING btree (user_id);


--

-- Name: idx_view_logs_user_reference_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_view_logs_user_reference_created ON public.view_logs USING btree (user_id, reference_type, reference_id, created_at);


--

-- Name: idx_votes_solution_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_votes_solution_id ON public.votes USING btree (solution_id);


--

-- Name: idx_votes_solution_user_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_votes_solution_user_unique ON public.votes USING btree (solution_id, user_id);


--

-- Name: idx_votes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_votes_user_id ON public.votes USING btree (user_id);


--

-- Name: post_magazines_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX post_magazines_status_idx ON public.post_magazines USING btree (status) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'draft'::character varying])::text[]));


--

-- Name: idx_audit_log_admin; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_audit_log_admin ON warehouse.admin_audit_log USING btree (admin_user_id);


--

-- Name: idx_audit_log_created; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_audit_log_created ON warehouse.admin_audit_log USING btree (created_at DESC);


--

-- Name: idx_audit_log_target; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_audit_log_target ON warehouse.admin_audit_log USING btree (target_table, target_id);


--

-- Name: idx_warehouse_group_members_artist_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_group_members_artist_id ON warehouse.group_members USING btree (artist_id);


--

-- Name: idx_warehouse_group_members_is_active; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_group_members_is_active ON warehouse.group_members USING btree (is_active);


--

-- Name: idx_warehouse_images_post_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_images_post_id ON warehouse.images USING btree (post_id);


--

-- Name: idx_warehouse_images_with_items; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_images_with_items ON warehouse.images USING btree (with_items);


--

-- Name: idx_warehouse_instagram_accounts_active; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_instagram_accounts_active ON warehouse.instagram_accounts USING btree (is_active);


--

-- Name: idx_warehouse_instagram_accounts_artist_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_instagram_accounts_artist_id ON warehouse.instagram_accounts USING btree (artist_id) WHERE (artist_id IS NOT NULL);


--

-- Name: idx_warehouse_instagram_accounts_brand_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_instagram_accounts_brand_id ON warehouse.instagram_accounts USING btree (brand_id) WHERE (brand_id IS NOT NULL);


--

-- Name: idx_warehouse_instagram_accounts_group_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_instagram_accounts_group_id ON warehouse.instagram_accounts USING btree (group_id);


--

-- Name: idx_warehouse_instagram_accounts_type; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_instagram_accounts_type ON warehouse.instagram_accounts USING btree (account_type);


--

-- Name: idx_warehouse_posts_account_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_posts_account_id ON warehouse.posts USING btree (account_id);


--

-- Name: idx_warehouse_posts_posted_at; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_posts_posted_at ON warehouse.posts USING btree (posted_at);


--

-- Name: idx_warehouse_posts_tagged_account_ids; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_posts_tagged_account_ids ON warehouse.posts USING gin (tagged_account_ids);


--

-- Name: idx_warehouse_seed_asset_seed_post_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_asset_seed_post_id ON warehouse.seed_asset USING btree (seed_post_id);


--

-- Name: idx_warehouse_seed_posts_source_image_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_posts_source_image_id ON warehouse.seed_posts USING btree (source_image_id);


--

-- Name: idx_warehouse_seed_posts_source_post_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_posts_source_post_id ON warehouse.seed_posts USING btree (source_post_id);


--

-- Name: idx_warehouse_seed_posts_status; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_posts_status ON warehouse.seed_posts USING btree (status);


--

-- Name: idx_warehouse_seed_spots_request_order; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_spots_request_order ON warehouse.seed_spots USING btree (request_order);


--

-- Name: idx_warehouse_seed_spots_seed_post_id; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_spots_seed_post_id ON warehouse.seed_spots USING btree (seed_post_id);


--

-- Name: idx_warehouse_seed_spots_status; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX idx_warehouse_seed_spots_status ON warehouse.seed_spots USING btree (status);


--

-- Name: raw_post_sources_active_platform_idx; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX raw_post_sources_active_platform_idx ON warehouse.raw_post_sources USING btree (is_active, platform);


--

-- Name: raw_post_sources_due_idx; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX raw_post_sources_due_idx ON warehouse.raw_post_sources USING btree (last_enqueued_at) WHERE (is_active = true);


--

-- Name: raw_posts_parse_status_idx; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX raw_posts_parse_status_idx ON warehouse.raw_posts USING btree (parse_status, created_at);


--

-- Name: raw_posts_platform_idx; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX raw_posts_platform_idx ON warehouse.raw_posts USING btree (platform);


--

-- Name: raw_posts_source_idx; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE INDEX raw_posts_source_idx ON warehouse.raw_posts USING btree (source_id);


--

-- Name: uq_warehouse_seed_posts_source_post_image; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE UNIQUE INDEX uq_warehouse_seed_posts_source_post_image ON warehouse.seed_posts USING btree (source_post_id, source_image_id) WHERE ((source_post_id IS NOT NULL) AND (source_image_id IS NOT NULL));


--

-- Name: warehouse_artists_primary_ig_unique; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE UNIQUE INDEX warehouse_artists_primary_ig_unique ON warehouse.artists USING btree (primary_instagram_account_id) WHERE (primary_instagram_account_id IS NOT NULL);


--

-- Name: warehouse_brands_primary_ig_unique; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE UNIQUE INDEX warehouse_brands_primary_ig_unique ON warehouse.brands USING btree (primary_instagram_account_id) WHERE (primary_instagram_account_id IS NOT NULL);


--

-- Name: warehouse_groups_primary_ig_unique; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE UNIQUE INDEX warehouse_groups_primary_ig_unique ON warehouse.groups USING btree (primary_instagram_account_id) WHERE (primary_instagram_account_id IS NOT NULL);


--

-- Name: warehouse_ig_one_primary_per_artist; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE UNIQUE INDEX warehouse_ig_one_primary_per_artist ON warehouse.instagram_accounts USING btree (artist_id) WHERE ((artist_id IS NOT NULL) AND (entity_ig_role = 'primary'::warehouse.entity_ig_role));


--

-- Name: warehouse_ig_one_primary_per_brand; Type: INDEX; Schema: warehouse; Owner: -
--

CREATE UNIQUE INDEX warehouse_ig_one_primary_per_brand ON warehouse.instagram_accounts USING btree (brand_id) WHERE ((brand_id IS NOT NULL) AND (entity_ig_role = 'primary'::warehouse.entity_ig_role));


--

-- Name: agent_sessions agent_sessions_magazine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_sessions
    ADD CONSTRAINT agent_sessions_magazine_id_fkey FOREIGN KEY (magazine_id) REFERENCES public.magazines(id);


--

-- Name: agent_sessions agent_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_sessions
    ADD CONSTRAINT agent_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--

-- Name: content_reports content_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- Name: content_reports content_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--

-- Name: credit_transactions credit_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_transactions
    ADD CONSTRAINT credit_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: decoded_picks decoded_picks_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.decoded_picks
    ADD CONSTRAINT decoded_picks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: click_logs fk_click_logs_solution_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.click_logs
    ADD CONSTRAINT fk_click_logs_solution_id FOREIGN KEY (solution_id) REFERENCES public.solutions(id) ON DELETE CASCADE;


--

-- Name: click_logs fk_click_logs_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.click_logs
    ADD CONSTRAINT fk_click_logs_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--

-- Name: comments fk_comments_parent_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_parent_id FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--

-- Name: comments fk_comments_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: comments fk_comments_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: curation_posts fk_curation_posts_curation_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curation_posts
    ADD CONSTRAINT fk_curation_posts_curation_id FOREIGN KEY (curation_id) REFERENCES public.curations(id) ON DELETE CASCADE;


--

-- Name: curation_posts fk_curation_posts_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curation_posts
    ADD CONSTRAINT fk_curation_posts_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: earnings fk_earnings_solution_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.earnings
    ADD CONSTRAINT fk_earnings_solution_id FOREIGN KEY (solution_id) REFERENCES public.solutions(id) ON DELETE CASCADE;


--

-- Name: earnings fk_earnings_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.earnings
    ADD CONSTRAINT fk_earnings_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: point_logs fk_point_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_logs
    ADD CONSTRAINT fk_point_logs_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: post_likes fk_post_likes_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT fk_post_likes_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: post_likes fk_post_likes_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT fk_post_likes_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: posts fk_posts_artist_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_posts_artist_id FOREIGN KEY (artist_id) REFERENCES warehouse.artists(id) ON DELETE SET NULL;


--

-- Name: posts fk_posts_group_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_posts_group_id FOREIGN KEY (group_id) REFERENCES warehouse.groups(id) ON DELETE SET NULL;


--

-- Name: posts fk_posts_parent_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_posts_parent_post_id FOREIGN KEY (parent_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--

-- Name: posts fk_posts_post_magazine_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_posts_post_magazine_id FOREIGN KEY (post_magazine_id) REFERENCES public.post_magazines(id) ON DELETE SET NULL;


--

-- Name: posts fk_posts_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: saved_posts fk_saved_posts_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT fk_saved_posts_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: saved_posts fk_saved_posts_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_posts
    ADD CONSTRAINT fk_saved_posts_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: search_logs fk_search_logs_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_logs
    ADD CONSTRAINT fk_search_logs_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--

-- Name: settlements fk_settlements_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settlements
    ADD CONSTRAINT fk_settlements_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: solutions fk_solutions_brand_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT fk_solutions_brand_id FOREIGN KEY (brand_id) REFERENCES warehouse.brands(id) ON DELETE SET NULL;


--

-- Name: solutions fk_solutions_spot_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT fk_solutions_spot_id FOREIGN KEY (spot_id) REFERENCES public.spots(id) ON DELETE CASCADE;


--

-- Name: solutions fk_solutions_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT fk_solutions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: spots fk_spots_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spots
    ADD CONSTRAINT fk_spots_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: spots fk_spots_subcategory_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spots
    ADD CONSTRAINT fk_spots_subcategory_id FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);


--

-- Name: spots fk_spots_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spots
    ADD CONSTRAINT fk_spots_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: subcategories fk_subcategories_category_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT fk_subcategories_category_id FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--

-- Name: try_spot_tags fk_try_spot_tags_spot_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_spot_tags
    ADD CONSTRAINT fk_try_spot_tags_spot_id FOREIGN KEY (spot_id) REFERENCES public.spots(id) ON DELETE CASCADE;


--

-- Name: try_spot_tags fk_try_spot_tags_try_post_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.try_spot_tags
    ADD CONSTRAINT fk_try_spot_tags_try_post_id FOREIGN KEY (try_post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: user_badges fk_user_badges_badge_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT fk_user_badges_badge_id FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE CASCADE;


--

-- Name: user_badges fk_user_badges_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT fk_user_badges_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: users fk_users_auth_users; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_auth_users FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- Name: view_logs fk_view_logs_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.view_logs
    ADD CONSTRAINT fk_view_logs_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--

-- Name: votes fk_votes_solution_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT fk_votes_solution_id FOREIGN KEY (solution_id) REFERENCES public.solutions(id) ON DELETE CASCADE;


--

-- Name: votes fk_votes_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT fk_votes_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: magazine_posts magazine_posts_magazine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magazine_posts
    ADD CONSTRAINT magazine_posts_magazine_id_fkey FOREIGN KEY (magazine_id) REFERENCES public.magazines(id) ON DELETE CASCADE;


--

-- Name: magazine_posts magazine_posts_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magazine_posts
    ADD CONSTRAINT magazine_posts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--

-- Name: magazines magazines_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magazines
    ADD CONSTRAINT magazines_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.users(id);


--

-- Name: magazines magazines_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.magazines
    ADD CONSTRAINT magazines_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--

-- Name: post_magazine_news_references post_magazine_news_references_post_magazine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_magazine_news_references
    ADD CONSTRAINT post_magazine_news_references_post_magazine_id_fkey FOREIGN KEY (post_magazine_id) REFERENCES public.post_magazines(id) ON DELETE CASCADE;


--

-- Name: post_magazines post_magazines_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_magazines
    ADD CONSTRAINT post_magazines_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--

-- Name: user_collections user_collections_magazine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_collections_magazine_id_fkey FOREIGN KEY (magazine_id) REFERENCES public.user_magazines(id) ON DELETE CASCADE;


--

-- Name: user_collections user_collections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_collections
    ADD CONSTRAINT user_collections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: user_events user_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- Name: user_follows user_follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--

-- Name: user_magazines user_magazines_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_magazines
    ADD CONSTRAINT user_magazines_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: user_social_accounts user_social_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_social_accounts
    ADD CONSTRAINT user_social_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: user_tryon_history user_tryon_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tryon_history
    ADD CONSTRAINT user_tryon_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--

-- Name: artists artists_primary_instagram_account_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.artists
    ADD CONSTRAINT artists_primary_instagram_account_id_fkey FOREIGN KEY (primary_instagram_account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;


--

-- Name: brands brands_primary_instagram_account_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.brands
    ADD CONSTRAINT brands_primary_instagram_account_id_fkey FOREIGN KEY (primary_instagram_account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;


--

-- Name: group_members group_members_artist_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.group_members
    ADD CONSTRAINT group_members_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES warehouse.artists(id) ON DELETE CASCADE;


--

-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES warehouse.groups(id) ON DELETE CASCADE;


--

-- Name: groups groups_primary_instagram_account_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.groups
    ADD CONSTRAINT groups_primary_instagram_account_id_fkey FOREIGN KEY (primary_instagram_account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;


--

-- Name: instagram_accounts instagram_accounts_artist_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.instagram_accounts
    ADD CONSTRAINT instagram_accounts_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES warehouse.artists(id) ON DELETE SET NULL;


--

-- Name: instagram_accounts instagram_accounts_brand_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.instagram_accounts
    ADD CONSTRAINT instagram_accounts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES warehouse.brands(id) ON DELETE SET NULL;


--

-- Name: raw_posts raw_posts_seed_post_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.raw_posts
    ADD CONSTRAINT raw_posts_seed_post_id_fkey FOREIGN KEY (seed_post_id) REFERENCES warehouse.seed_posts(id) ON DELETE SET NULL;


--

-- Name: raw_posts raw_posts_source_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.raw_posts
    ADD CONSTRAINT raw_posts_source_id_fkey FOREIGN KEY (source_id) REFERENCES warehouse.raw_post_sources(id) ON DELETE CASCADE;


--

-- Name: images warehouse_images_post_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.images
    ADD CONSTRAINT warehouse_images_post_id_fkey FOREIGN KEY (post_id) REFERENCES warehouse.posts(id) ON DELETE CASCADE;


--

-- Name: instagram_accounts warehouse_instagram_accounts_group_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.instagram_accounts
    ADD CONSTRAINT warehouse_instagram_accounts_group_id_fkey FOREIGN KEY (group_id) REFERENCES warehouse.groups(id) ON DELETE SET NULL;


--

-- Name: posts warehouse_posts_account_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.posts
    ADD CONSTRAINT warehouse_posts_account_id_fkey FOREIGN KEY (account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE RESTRICT;


--

-- Name: seed_asset warehouse_seed_asset_seed_post_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_asset
    ADD CONSTRAINT warehouse_seed_asset_seed_post_id_fkey FOREIGN KEY (seed_post_id) REFERENCES warehouse.seed_posts(id) ON DELETE CASCADE;


--

-- Name: seed_posts warehouse_seed_posts_artist_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_posts
    ADD CONSTRAINT warehouse_seed_posts_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES warehouse.artists(id) ON DELETE SET NULL;


--

-- Name: seed_posts warehouse_seed_posts_group_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_posts
    ADD CONSTRAINT warehouse_seed_posts_group_id_fkey FOREIGN KEY (group_id) REFERENCES warehouse.groups(id) ON DELETE SET NULL;


--

-- Name: seed_posts warehouse_seed_posts_source_image_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_posts
    ADD CONSTRAINT warehouse_seed_posts_source_image_id_fkey FOREIGN KEY (source_image_id) REFERENCES warehouse.images(id) ON DELETE SET NULL;


--

-- Name: seed_posts warehouse_seed_posts_source_post_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_posts
    ADD CONSTRAINT warehouse_seed_posts_source_post_id_fkey FOREIGN KEY (source_post_id) REFERENCES warehouse.posts(id) ON DELETE SET NULL;


--

-- Name: seed_spots warehouse_seed_spots_seed_post_id_fkey; Type: FK CONSTRAINT; Schema: warehouse; Owner: -
--

ALTER TABLE ONLY warehouse.seed_spots
    ADD CONSTRAINT warehouse_seed_spots_seed_post_id_fkey FOREIGN KEY (seed_post_id) REFERENCES warehouse.seed_posts(id) ON DELETE CASCADE;


--
