/**
 * Server-side query functions for main page sections
 *
 * This module contains server-only query functions for fetching data
 * displayed on the main page. Uses createSupabaseServerClient.
 *
 * Updated to use the new schema with 'posts' table.
 */

import { createSupabaseServerClient } from "../server";
import type { PostRow, SpotRow, SolutionRow, BadgeRow } from "../types";
import { buildArtistProfileMap } from "./warehouse-entities.server";

type SpotWithSolutions = SpotRow & { solutions: SolutionRow[] };
type PostWithSpots = PostRow & { spots: SpotWithSolutions[] };

/**
 * Post data for main page sections
 */
export interface PostData {
  id: string;
  imageUrl: string | null;
  artistName: string | null;
  groupName: string | null;
  mediaTitle: string | null;
  mediaType: string | null;
  context: string | null;
  viewCount: number;
  createdAt: string;
}

/**
 * Item data for style card display (placeholder for compatibility)
 */
export interface StyleItemData {
  id: string | number;
  label: string;
  brand: string;
  name: string;
  imageUrl?: string;
}

/**
 * Style data for style card display
 */
export interface StyleCardServerData {
  post: PostData;
  items: StyleItemData[];
  spots?: SpotWithSolutions[];
}

/**
 * Extended style data with decoded_picks curation metadata
 */
export interface DecodedPickServerData extends StyleCardServerData {
  pickDate: string | null;
  curatedBy: string | null;
  note: string | null;
}

/**
 * Trending keyword data
 */
export interface TrendingKeyword {
  id: string;
  label: string;
  href: string;
  image?: string;
}

/**
 * Magazine post data — post with a published editorial magazine
 */
export interface MagazinePostItem {
  title: string;
  brand: string | null;
  imageUrl: string | null;
  originalUrl: string | null;
}

export interface MagazinePostData {
  id: string;
  imageUrl: string | null;
  artistName: string | null;
  groupName: string | null;
  context: string | null;
  magazineTitle: string;
  magazineKeyword: string | null;
  items: MagazinePostItem[];
}

/**
 * Fetches posts that have a published post_magazine (server-side)
 */
export async function fetchMagazinePostsServer(
  limit = 8
): Promise<MagazinePostData[]> {
  const supabase = await createSupabaseServerClient();

  // First: get published magazine IDs
  const { data: magazines, error: magError } = await supabase
    .from("post_magazines")
    .select("id, title, keyword, layout_json")
    .eq("status", "published")
    .limit(limit);

  if (magError || !magazines || magazines.length === 0) {
    if (magError)
      console.error("[fetchMagazinePostsServer] Magazine error:", magError);
    return [];
  }

  const publishedIds = magazines.map((m) => m.id);

  // Then: get posts that reference these published magazines
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "active")
    .not("image_url", "is", null)
    .in("post_magazine_id", publishedIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !posts || posts.length === 0) {
    if (error) console.error("[fetchMagazinePostsServer] Posts error:", error);
    return [];
  }

  const magazineMap = new Map(
    magazines.map((m) => [
      m.id,
      { title: m.title, keyword: m.keyword, layout_json: m.layout_json },
    ])
  );

  return posts.map((row) => {
    const mag = magazineMap.get(row.post_magazine_id!);
    const layout = mag?.layout_json as {
      items?: {
        title: string;
        brand: string | null;
        image_url: string | null;
        original_url: string | null;
      }[];
    } | null;
    const items: MagazinePostItem[] = (layout?.items ?? [])
      .filter((it) => it.image_url)
      .map((it) => ({
        title: it.title,
        brand: it.brand,
        imageUrl: it.image_url,
        originalUrl: it.original_url,
      }));
    return {
      id: row.id,
      imageUrl: row.image_url,
      artistName: row.artist_name,
      groupName: row.group_name,
      context: row.context,
      magazineTitle: mag?.title || row.context || "Editorial",
      magazineKeyword: mag?.keyword ?? null,
      items,
    };
  });
}

/**
 * Transforms a raw post row to PostData
 */
function toPostData(row: PostRow): PostData {
  return {
    id: row.id,
    imageUrl: row.image_url,
    artistName: row.artist_name,
    groupName: row.group_name,
    mediaTitle: row.title,
    mediaType: row.media_type,
    context: row.context,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

/**
 * Fetches posts for Weekly Best section (server-side)
 * Gets recent posts ordered by view_count
 *
 * @param limit - Maximum number of posts to fetch (default: 8)
 * @returns Array of post data
 */
export async function fetchWeeklyBestPostsServer(
  limit = 8
): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "active")
    .not("image_url", "is", null)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching weekly best posts:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return (data ?? []).map(toPostData);
}

/**
 * Fetches a single featured post for Hero section (server-side)
 * Gets the most viewed active post
 *
 * @returns Featured post or null
 */
export async function fetchFeaturedPostServer(): Promise<PostData | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "active")
    .not("image_url", "is", null)
    .order("view_count", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error(
      "Error fetching featured post:",
      JSON.stringify(error, null, 2)
    );
    return null;
  }

  return data ? toPostData(data) : null;
}

export async function fetchWhatsNewPostsServer(
  limit = 2
): Promise<StyleCardServerData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, spots(*, solutions(*))")
    .eq("status", "active")
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching what's new posts:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return (data ?? []).map((row: PostWithSpots) => ({
    post: toPostData(row),
    items: (row.spots || []).flatMap((spot) =>
      (spot.solutions || []).map((sol) => ({
        id: sol.id,
        label: sol.title,
        brand:
          ((sol.metadata as Record<string, unknown>)?.brand as string) ||
          "Unknown",
        name: sol.title,
        imageUrl: sol.thumbnail_url || undefined,
      }))
    ),
    spots: row.spots || [],
  }));
}

/**
 * Fetches data for Decoded Pick section (server-side)
 *
 * Queries decoded_picks table for the most recent active pick,
 * then fetches the associated post with spots/solutions.
 * Falls back to offset-based selection if no curated pick exists.
 */
export async function fetchDecodedPickServer(): Promise<DecodedPickServerData | null> {
  const supabase = await createSupabaseServerClient();

  // 1. Try to get the most recent active curated pick
  const { data: pickRow } = await supabase
    .from("decoded_picks")
    .select("post_id, pick_date, curated_by, note")
    .eq("is_active", true)
    .order("pick_date", { ascending: false })
    .limit(1)
    .single();

  const postId: string | null = pickRow?.post_id ?? null;
  let pickDate: string | null = pickRow?.pick_date ?? null;
  let curatedBy: string | null = pickRow?.curated_by ?? null;
  let note: string | null = pickRow?.note ?? null;

  // 2. Fetch the post (by pick's post_id, or fallback to offset=2)
  let row: PostWithSpots | null = null;

  if (postId) {
    const { data } = await supabase
      .from("posts")
      .select("*, spots(*, solutions(*))")
      .eq("id", postId)
      .eq("status", "active")
      .single();
    row = data as PostWithSpots | null;
  }

  // Fallback: no curated pick or post inactive — use offset-based selection
  if (!row) {
    pickDate = null;
    curatedBy = null;
    note = null;

    const { data } = await supabase
      .from("posts")
      .select("*, spots(*, solutions(*))")
      .eq("status", "active")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .range(2, 2);

    row = (data?.[0] as PostWithSpots) ?? null;
  }

  if (!row) return null;

  return {
    post: toPostData(row),
    items: (row.spots || []).flatMap((spot) =>
      (spot.solutions || []).map((sol) => ({
        id: sol.id,
        label: sol.title,
        brand:
          ((sol.metadata as Record<string, unknown>)?.brand as string) ||
          "Unknown",
        name: sol.title,
        imageUrl: sol.thumbnail_url || undefined,
      }))
    ),
    spots: row.spots || [],
    pickDate,
    curatedBy,
    note,
  };
}

export async function fetchArtistSpotlightServer(
  limit = 2,
  offset = 3
): Promise<StyleCardServerData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*, spots(*, solutions(*))")
    .eq("status", "active")
    .not("image_url", "is", null)
    .not("artist_name", "is", null)
    .order("view_count", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error(
      "Error fetching artist spotlight:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return (data ?? []).map((row: PostWithSpots) => ({
    post: toPostData(row),
    items: (row.spots || []).flatMap((spot) =>
      (spot.solutions || []).map((sol) => ({
        id: sol.id,
        label: sol.title,
        brand:
          ((sol.metadata as Record<string, unknown>)?.brand as string) ||
          "Unknown",
        name: sol.title,
        imageUrl: sol.thumbnail_url || undefined,
      }))
    ),
    spots: row.spots || [],
  }));
}

/**
 * Fetches posts by artist name for Discover section (server-side)
 *
 * @param artistName - The artist name to filter by
 * @param limit - Maximum number of posts to fetch (default: 6)
 * @returns Array of post data
 */
export async function fetchPostsByArtistServer(
  artistName: string,
  limit = 6
): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "active")
    .not("image_url", "is", null)
    .ilike("artist_name", `%${artistName}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      `Error fetching posts for artist ${artistName}:`,
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return (data ?? []).map(toPostData);
}

/**
 * Fetches trending keywords derived from popular artists (server-side).
 *
 * Hybrid approach: trending order from public.posts frequency counts,
 * entity data (profile images, canonical names) from warehouse.artists/groups.
 *
 * @param limit - Maximum number of keywords to fetch (default: 7)
 * @returns Array of trending keywords
 */
export async function fetchTrendingKeywordsServer(
  limit = 7
): Promise<TrendingKeyword[]> {
  const supabase = await createSupabaseServerClient();
  const keywords: TrendingKeyword[] = [];

  // Fetch warehouse profile map and public.posts frequency data in parallel
  const [profileMap, result] = await Promise.all([
    buildArtistProfileMap(),
    supabase
      .from("posts")
      .select("artist_name, group_name, thumbnail_url")
      .not("artist_name", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts = result.data as any;
  const error = result.error;

  if (!error && posts) {
    // Count artist occurrences and keep first post thumbnail per artist (fallback)
    const artistCounts = new Map<string, number>();
    const artistImages = new Map<string, string>();
    for (const post of posts) {
      const name = post.artist_name || post.group_name;
      if (name) {
        artistCounts.set(name, (artistCounts.get(name) || 0) + 1);
        if (!artistImages.has(name) && post.thumbnail_url) {
          artistImages.set(name, post.thumbnail_url);
        }
      }
    }

    // Sort by frequency count — trending order is always from public.posts
    const topArtists = [...artistCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([artist]) => artist);

    for (const rawName of topArtists) {
      // Look up warehouse entity by lowercase name
      const warehouseEntry = profileMap.get(rawName.toLowerCase());

      keywords.push({
        id: `artist-${rawName}`,
        // Prefer warehouse canonical name for proper casing; fallback to raw post text
        label: warehouseEntry?.name ?? rawName,
        href: `/search?q=${encodeURIComponent(rawName)}`,
        // Prefer warehouse profile image; fallback to post thumbnail
        image: warehouseEntry?.profileImageUrl ?? artistImages.get(rawName),
      });
    }
  }

  return keywords.slice(0, limit);
}

// =============================================================================
// Legacy type exports for backward compatibility
// =============================================================================

/** Legacy ImageWithPost type */
export interface ImageWithPost {
  image: {
    id: string;
    image_url: string | null;
    created_at: string;
    image_hash: string;
    status: "extracted";
    with_items: boolean;
  };
  account: string | null;
}

/** Legacy WhatsNewStyleData type */
export interface WhatsNewStyleData {
  image: {
    id: string;
    image_url: string | null;
    created_at: string;
    image_hash: string;
    status: "extracted";
    with_items: boolean;
  };
  account: string | null;
  items: StyleItemData[];
  spots?: SpotWithSolutions[];
}

/** Legacy ItemWithImage type */
export interface ItemWithImage {
  item: {
    id: string | number;
    brand: string | null;
    product_name: string | null;
  };
  imageUrl: string | null;
}

// =============================================================================
// Legacy function aliases for backward compatibility
// These map old function names to new implementations
// =============================================================================

/** @deprecated Use fetchWeeklyBestPostsServer instead */
export async function fetchWeeklyBestImagesServer(
  limit = 8
): Promise<ImageWithPost[]> {
  const posts = await fetchWeeklyBestPostsServer(limit);
  return posts.map((post) => ({
    image: {
      id: post.id,
      image_url: post.imageUrl,
      created_at: post.createdAt,
      image_hash: "",
      status: "extracted" as const,
      with_items: false,
    },
    account: post.artistName || post.groupName,
  }));
}

/** @deprecated Use fetchFeaturedPostServer instead */
export async function fetchFeaturedImageServer(): Promise<ImageWithPost | null> {
  const post = await fetchFeaturedPostServer();
  if (!post) return null;
  return {
    image: {
      id: post.id,
      image_url: post.imageUrl,
      created_at: post.createdAt,
      image_hash: "",
      status: "extracted" as const,
      with_items: false,
    },
    account: post.artistName || post.groupName,
  };
}

/** @deprecated Use fetchWhatsNewPostsServer instead */
export async function fetchWhatsNewStylesServer(
  limit = 2
): Promise<WhatsNewStyleData[]> {
  const styles = await fetchWhatsNewPostsServer(limit);
  return styles.map((style) => ({
    image: {
      id: style.post.id,
      image_url: style.post.imageUrl,
      created_at: style.post.createdAt,
      image_hash: "",
      status: "extracted" as const,
      with_items: false,
    },
    account: style.post.artistName || style.post.groupName,
    items: style.items,
  }));
}

/**
 * Fetches recently uploaded items (solutions) for home page display
 *
 * @param limit - Maximum number of items to fetch (default: 4)
 * @returns Array of item data with associated post images
 */
export async function fetchWhatsNewItemsServer(
  limit = 4
): Promise<ItemWithImage[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("solutions")
    .select(
      `
      id,
      title,
      metadata,
      spot:spots(
        post:posts(image_url)
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching what's new items:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  interface SolutionRowResult {
    id: string;
    title: string | null;
    metadata: Record<string, unknown> | null;
    spot: {
      post: {
        image_url: string | null;
      } | null;
    } | null;
  }

  return ((data as unknown as SolutionRowResult[]) ?? []).map((row) => ({
    item: {
      id: row.id,
      brand: (row.metadata?.brand as string) || "Unknown",
      product_name: row.title,
    },
    imageUrl: row.spot?.post?.image_url || null,
  }));
}

/**
 * Fetches best performing items (most clicked/purchased solutions)
 *
 * @param limit - Maximum number of items to fetch (default: 6)
 * @returns Array of item data with associated post images
 */
export async function fetchBestItemsServer(
  limit = 6
): Promise<ItemWithImage[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("solutions")
    .select(
      `
      id,
      title,
      metadata,
      click_count,
      spot:spots(
        post:posts(image_url)
      )
    `
    )
    .eq("status", "active")
    .order("click_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching best items:", JSON.stringify(error, null, 2));
    return [];
  }

  interface BestSolutionRowResult {
    id: string;
    title: string | null;
    metadata: Record<string, unknown> | null;
    click_count: number;
    spot: {
      post: {
        image_url: string | null;
      } | null;
    } | null;
  }

  return ((data as unknown as BestSolutionRowResult[]) ?? []).map((row) => ({
    item: {
      id: row.id,
      brand: (row.metadata?.brand as string) || "Unknown",
      product_name: row.title,
    },
    imageUrl: row.spot?.post?.image_url || null,
  }));
}

/**
 * Fetches all available achievement badges (server-side)
 *
 * @returns Array of badge records
 */
export async function fetchAllBadgesServer(): Promise<BadgeRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching all badges:", JSON.stringify(error, null, 2));
    return [];
  }

  return data ?? [];
}

/** @deprecated Use fetchDecodedPickServer instead */
export async function fetchDecodedPickStyleServer(): Promise<{
  style: WhatsNewStyleData | null;
  items: ItemWithImage[];
}> {
  const pick = await fetchDecodedPickServer();
  if (!pick)
    return {
      style: null,
      items: [],
    };
  return {
    style: {
      image: {
        id: pick.post.id,
        image_url: pick.post.imageUrl,
        created_at: pick.post.createdAt,
        image_hash: "",
        status: "extracted" as const,
        with_items: false,
      },
      account: pick.post.artistName || pick.post.groupName,
      items: pick.items,
    },
    items: [],
  };
}

/** @deprecated Use fetchArtistSpotlightServer instead */
export async function fetchArtistSpotlightStylesServer(
  limit = 2,
  offset = 3
): Promise<WhatsNewStyleData[]> {
  const styles = await fetchArtistSpotlightServer(limit, offset);
  return styles.map((style) => ({
    image: {
      id: style.post.id,
      image_url: style.post.imageUrl,
      created_at: style.post.createdAt,
      image_hash: "",
      status: "extracted" as const,
      with_items: false,
    },
    account: style.post.artistName || style.post.groupName,
    items: style.items,
  }));
}

/** @deprecated Use fetchPostsByArtistServer instead */
export async function fetchItemsByAccountServer(
  _account: string,
  _limit = 6
): Promise<ItemWithImage[]> {
  // Items not available, return empty
  return [];
}

export async function fetchEditorPicksServer(): Promise<
  Array<{
    id: string;
    imageUrl: string;
    title: string;
    link: string;
    artistName: string;
  }>
> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("curation_posts")
    .select(
      `
      post_id,
      posts!inner(id, image_url, title, context, artist_name, group_name)
    `
    )
    .order("order_index", { ascending: true })
    .limit(8);

  if (!data || data.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((cp: any) => ({
    id: cp.posts.id,
    imageUrl: cp.posts.image_url,
    title: cp.posts.title || cp.posts.context || "",
    link: `/posts/${cp.posts.id}`,
    artistName: cp.posts.artist_name || cp.posts.group_name || "",
  }));
}
