-- Enhance handle_new_user() to capture OAuth metadata (avatar, display name)
-- and handle username UNIQUE collisions gracefully with random suffix.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix TEXT;
BEGIN
  -- Extract base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1)
  );

  -- Sanitize: lowercase, alphanumeric + underscore only, max 20 chars
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  base_username := left(base_username, 20);

  -- If empty after sanitization, use 'user'
  IF base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Handle UNIQUE collision: try base, then append random 4-char suffix
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
      NEW.raw_user_meta_data->>'nickname',    -- Kakao
      NEW.raw_user_meta_data->>'full_name',   -- Google
      NEW.raw_user_meta_data->>'name',         -- Generic
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',  -- Standard
      NEW.raw_user_meta_data->>'picture'       -- Google
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
