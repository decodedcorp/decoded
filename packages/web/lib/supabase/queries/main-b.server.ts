/**
 * Server-side query for Main B experimental page.
 * Uses shared Database type (pipeline schema: image, item, post, post_image).
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@decoded/shared";
import type { MainBData, MainBItem } from "@decoded/shared";

function getSharedClient() {
  // Use Shared/Pipeline DB (has image, item, post, post_image tables)
  // Falls back to PRD DB if shared env vars not set
  const url =
    process.env.SHARED_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SHARED_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "[main-b] Missing SHARED_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL"
    );
  }
  return createClient<Database>(url, key);
}

/**
 * Fetch a random post with 3-6 items suitable for Main B layout.
 * Uses RPC-style approach: find eligible image_ids via aggregation,
 * then fetch full data for one random pick.
 */
export async function fetchMainBPostServer(): Promise<MainBData | null> {
  const supabase = getSharedClient();

  // Step 1: Use a more targeted query — fetch distinct image_ids with counts
  // by fetching items grouped (client-side) from a larger sample
  const { data: candidates, error: candidateError } = await supabase
    .from("item")
    .select("image_id")
    .not("center", "is", null)
    .not("cropped_image_path", "is", null)
    .limit(2000);

  if (candidateError || !candidates?.length) {
    console.error("[main-b] Failed to find candidate items:", candidateError);
    return null;
  }

  // Count items per image_id, keep only images with 3-8 items (ideal range)
  const countByImage = new Map<string, number>();
  for (const row of candidates) {
    const id = row.image_id;
    countByImage.set(id, (countByImage.get(id) ?? 0) + 1);
  }

  const eligibleImageIds = Array.from(countByImage.entries())
    .filter(([, count]) => count >= 3 && count <= 8)
    .map(([id]) => id);

  // Fallback: if no 3-8 range, accept 3+ items
  const finalIds =
    eligibleImageIds.length > 0
      ? eligibleImageIds
      : Array.from(countByImage.entries())
          .filter(([, count]) => count >= 3)
          .map(([id]) => id);

  if (finalIds.length === 0) {
    console.warn("[main-b] No images with 3+ items having center+crop");
    return null;
  }

  // Pick a random image
  const randomIdx = Math.floor(Math.random() * finalIds.length);
  const chosenImageId = finalIds[randomIdx];

  // Step 2: Fetch the image + its items in parallel
  const [imageResult, itemsResult] = await Promise.all([
    supabase
      .from("image")
      .select("id, image_url")
      .eq("id", chosenImageId)
      .single(),
    supabase
      .from("item")
      .select("id, brand, product_name, center, cropped_image_path")
      .eq("image_id", chosenImageId)
      .not("center", "is", null)
      .not("cropped_image_path", "is", null)
      .order("created_at", { ascending: true })
      .limit(6),
  ]);

  if (imageResult.error || !imageResult.data) {
    console.error("[main-b] Failed to fetch image:", imageResult.error);
    return null;
  }

  if (itemsResult.error || !itemsResult.data?.length) {
    console.error("[main-b] Failed to fetch items:", itemsResult.error);
    return null;
  }

  // Step 3: Find the post for this image (via post_image)
  const { data: postImageRow } = await supabase
    .from("post_image")
    .select("post_id")
    .eq("image_id", chosenImageId)
    .limit(1)
    .single();

  let artistName: string | null = null;
  let postId: string = `image:${chosenImageId}`;

  if (postImageRow) {
    postId = postImageRow.post_id;
    const { data: postData } = await supabase
      .from("post")
      .select("id, artists, account_id")
      .eq("id", postImageRow.post_id)
      .single();

    if (postData?.artists) {
      const artists = postData.artists as string[];
      artistName = Array.isArray(artists) ? (artists[0] ?? null) : null;
    }
  }

  const image = imageResult.data;
  const items: MainBItem[] = itemsResult.data.map((row) => {
    // DB stores center as [y, x] — swap to [x, y] for UI consumption
    const raw = row.center as unknown as number[];
    return {
      id: row.id,
      brand: row.brand,
      productName: row.product_name,
      center: [raw[1], raw[0]] as [number, number], // [x, y]
      imageUrl: row.cropped_image_path!,
    };
  });

  // Step 4: Fetch related posts by the same artist (up to 3)
  const relatedPosts: MainBData["relatedPosts"] = [];
  if (postImageRow && artistName) {
    const { data: related } = await supabase
      .from("post")
      .select("id, artists")
      .contains("artists", JSON.stringify([artistName]))
      .neq("id", postImageRow.post_id)
      .limit(12);

    if (related?.length) {
      const relPostIds = related.map((r) => r.id);
      const { data: relImages } = await supabase
        .from("post_image")
        .select("post_id, image:image_id(id, image_url)")
        .in("post_id", relPostIds)
        .limit(12);

      if (relImages) {
        const seen = new Set<string>();
        for (const ri of relImages) {
          if (seen.size >= 6) break;
          const img = ri.image as unknown as { id: string; image_url: string };
          if (!img?.image_url || seen.has(ri.post_id)) continue;
          seen.add(ri.post_id);
          relatedPosts.push({
            id: ri.post_id,
            imageUrl: img.image_url,
            artistName,
          });
        }
      }
    }
  }

  return {
    post: {
      id: postId,
      imageUrl: image.image_url ?? "",
      artistName,
    },
    items,
    relatedPosts,
  };
}
