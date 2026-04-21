SET check_function_bodies = false;

-- Name: set_updated_at(); Type: FUNCTION; Schema: warehouse; Owner: -
--

CREATE OR REPLACE FUNCTION warehouse.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            BEGIN
              NEW.updated_at = now();
              RETURN NEW;
            END;
            $$;


--

-- Name: touch_updated_at(); Type: FUNCTION; Schema: warehouse; Owner: -
--

CREATE OR REPLACE FUNCTION warehouse.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--

-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$;


--

-- Name: artists trg_artists_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_artists_touch_updated_at ON warehouse.artists;

CREATE TRIGGER trg_artists_touch_updated_at BEFORE UPDATE ON warehouse.artists FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: badges update_badges_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_badges_updated_at ON public.badges;

CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON public.badges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: brands trg_brands_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_brands_touch_updated_at ON warehouse.brands;

CREATE TRIGGER trg_brands_touch_updated_at BEFORE UPDATE ON warehouse.brands FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: comments update_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: group_members trg_group_members_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_group_members_touch_updated_at ON warehouse.group_members;

CREATE TRIGGER trg_group_members_touch_updated_at BEFORE UPDATE ON warehouse.group_members FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: groups trg_groups_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_groups_touch_updated_at ON warehouse.groups;

CREATE TRIGGER trg_groups_touch_updated_at BEFORE UPDATE ON warehouse.groups FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: instagram_accounts trg_instagram_accounts_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_instagram_accounts_touch_updated_at ON warehouse.instagram_accounts;

CREATE TRIGGER trg_instagram_accounts_touch_updated_at BEFORE UPDATE ON warehouse.instagram_accounts FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: raw_post_sources raw_post_sources_set_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS raw_post_sources_set_updated_at ON warehouse.raw_post_sources;

CREATE TRIGGER raw_post_sources_set_updated_at BEFORE UPDATE ON warehouse.raw_post_sources FOR EACH ROW EXECUTE FUNCTION warehouse.set_updated_at();


--

-- Name: raw_posts raw_posts_set_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS raw_posts_set_updated_at ON warehouse.raw_posts;

CREATE TRIGGER raw_posts_set_updated_at BEFORE UPDATE ON warehouse.raw_posts FOR EACH ROW EXECUTE FUNCTION warehouse.set_updated_at();


--

-- Name: seed_asset trg_seed_asset_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_seed_asset_touch_updated_at ON warehouse.seed_asset;

CREATE TRIGGER trg_seed_asset_touch_updated_at BEFORE UPDATE ON warehouse.seed_asset FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: seed_posts trg_seed_posts_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_seed_posts_touch_updated_at ON warehouse.seed_posts;

CREATE TRIGGER trg_seed_posts_touch_updated_at BEFORE UPDATE ON warehouse.seed_posts FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: seed_spots trg_seed_spots_touch_updated_at; Type: TRIGGER; Schema: warehouse; Owner: -
--

DROP TRIGGER IF EXISTS trg_seed_spots_touch_updated_at ON warehouse.seed_spots;

CREATE TRIGGER trg_seed_spots_touch_updated_at BEFORE UPDATE ON warehouse.seed_spots FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();


--

-- Name: solutions update_solutions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_solutions_updated_at ON public.solutions;

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON public.solutions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: spots update_spots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_spots_updated_at ON public.spots;

CREATE TRIGGER update_spots_updated_at BEFORE UPDATE ON public.spots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: subcategories update_subcategories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON public.subcategories;

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: synonyms update_synonyms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_synonyms_updated_at ON public.synonyms;

CREATE TRIGGER update_synonyms_updated_at BEFORE UPDATE ON public.synonyms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: user_magazines update_user_magazines_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_user_magazines_updated_at ON public.user_magazines;

CREATE TRIGGER update_user_magazines_updated_at BEFORE UPDATE ON public.user_magazines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: user_social_accounts update_user_social_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_user_social_accounts_updated_at ON public.user_social_accounts;

CREATE TRIGGER update_user_social_accounts_updated_at BEFORE UPDATE ON public.user_social_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--

-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
