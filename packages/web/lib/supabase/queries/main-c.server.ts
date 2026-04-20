/**
 * Server-side query for Main C experimental page (Avant-Garde Editorial).
 * Fetches 7 random posts with item metadata for the editorial layout.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@decoded/shared";
import type { MainCPost } from "@/lib/components/main-c/types";

function getSharedClient() {
  const url =
    process.env.SHARED_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_DATABASE_API_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SHARED_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_DATABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[main-c] Missing SHARED_SUPABASE_URL / NEXT_PUBLIC_DATABASE_API_URL / NEXT_PUBLIC_SUPABASE_URL"
    );
  }
  return createClient<Database>(url, key);
}

export async function fetchMainCPostsServer(): Promise<MainCPost[]> {
  const supabase = getSharedClient();

  const { data: images, error: imagesError } = await supabase
    .from("image")
    .select("id, image_url")
    .not("image_url", "is", null)
    .limit(200);

  if (imagesError || !images?.length) {
    console.error("[main-c] Failed to fetch image pool:", imagesError);
    return [];
  }

  const shuffled = [...images].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, 7);

  const results = await Promise.all(
    chosen.map(async (image) => {
      // Fetch post metadata via post_image join
      const { data: postImageRow } = await supabase
        .from("post_image")
        .select("post_id")
        .eq("image_id", image.id)
        .limit(1)
        .single();

      let artistName: string | null = null;
      let postId: string = `image:${image.id}`;

      if (postImageRow) {
        postId = postImageRow.post_id;
        const { data: postData } = await supabase
          .from("post")
          .select("id, artists")
          .eq("id", postImageRow.post_id)
          .single();

        if (postData?.artists) {
          const artists = postData.artists as string[];
          artistName = Array.isArray(artists) ? (artists[0] ?? null) : null;
        }
      }

      // Fetch item metadata for this image (brand, product_name)
      let brand: string | null = null;
      let productName: string | null = null;
      let itemCount = 0;

      const { data: items } = await supabase
        .from("item")
        .select("brand, product_name")
        .eq("image_id", image.id)
        .limit(10);

      if (items?.length) {
        itemCount = items.length;
        // Pick first item with a brand
        const withBrand = items.find((i) => i.brand);
        brand = withBrand?.brand ?? null;
        productName = withBrand?.product_name ?? items[0]?.product_name ?? null;
      }

      if (!image.image_url) return null;

      return {
        id: postId,
        imageUrl: image.image_url,
        artistName,
        brand,
        productName,
        itemCount,
      } satisfies MainCPost;
    })
  );

  return results.filter((r): r is MainCPost => r !== null);
}
