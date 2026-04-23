-- Restore the on_auth_user_created trigger on auth.users.
--
-- The migration consolidation in 20260409075040_remote_schema.sql kept the
-- public.handle_new_user() function but dropped the AFTER INSERT trigger that
-- binds it to auth.users. As a result, OAuth sign-ups (Google, Kakao, …) on
-- fresh DB environments create an auth.users row without the matching
-- public.users row, which breaks admin checks and any query relying on the
-- public.users profile.
--
-- This migration:
--   1) Replaces handle_new_user() with an enhanced version that sanitizes
--      usernames, resolves UNIQUE collisions, and captures OAuth metadata
--      (avatar, display name) across providers.
--   2) Creates the AFTER INSERT trigger bound to auth.users.
--   3) Backfills public.users for any existing auth.users rows missing a
--      profile, using the same username-collision logic.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix TEXT;
BEGIN
  -- Extract base username from metadata or email local-part.
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Sanitize: lowercase, alphanumeric + underscore only, max 20 chars.
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  base_username := left(base_username, 20);
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Resolve UNIQUE(username) collision with random suffix.
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    suffix := substr(md5(random()::text), 1, 4);
    final_username := left(base_username, 16) || '_' || suffix;
  END LOOP;

  INSERT INTO public.users (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'nickname',    -- Kakao
      NEW.raw_user_meta_data->>'full_name',   -- Google
      NEW.raw_user_meta_data->>'name',         -- Generic OIDC
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',  -- Standard
      NEW.raw_user_meta_data->>'picture'       -- Google
    )
  );

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing public.users rows for pre-existing auth.users entries.
DO $$
DECLARE
  r RECORD;
  base_username TEXT;
  final_username TEXT;
  suffix TEXT;
BEGIN
  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.users p ON p.id = u.id
    WHERE p.id IS NULL
      AND u.email IS NOT NULL
  LOOP
    base_username := COALESCE(
      r.raw_user_meta_data->>'preferred_username',
      r.raw_user_meta_data->>'username',
      split_part(r.email, '@', 1)
    );
    base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
    base_username := left(base_username, 20);
    IF base_username = '' THEN
      base_username := 'user';
    END IF;

    final_username := base_username;
    WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
      suffix := substr(md5(random()::text), 1, 4);
      final_username := left(base_username, 16) || '_' || suffix;
    END LOOP;

    INSERT INTO public.users (id, email, username, display_name, avatar_url)
    VALUES (
      r.id,
      r.email,
      final_username,
      COALESCE(
        r.raw_user_meta_data->>'display_name',
        r.raw_user_meta_data->>'nickname',
        r.raw_user_meta_data->>'full_name',
        r.raw_user_meta_data->>'name',
        split_part(r.email, '@', 1)
      ),
      COALESCE(
        r.raw_user_meta_data->>'avatar_url',
        r.raw_user_meta_data->>'picture'
      )
    );
  END LOOP;
END $$;
