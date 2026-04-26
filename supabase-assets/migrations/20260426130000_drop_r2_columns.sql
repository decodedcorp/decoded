-- assets: raw_posts.r2_url / r2_key 컬럼 드롭 (#347)
--
-- 이미지 위치는 image_url 한 컬럼으로 단일화.
-- ai-server R2 업로드 결과 URL 을 image_url 에 직접 채우는 방식으로 전환.
-- external_url 은 그대로 유지 (외부 출처 페이지 URL — 의미 다름).

ALTER TABLE public.raw_posts DROP COLUMN IF EXISTS r2_url;
ALTER TABLE public.raw_posts DROP COLUMN IF EXISTS r2_key;
