/**
 * Server-side query functions for personalized content recommendations
 *
 * Uses behavioral events from the `user_events` table to derive affinities
 * and surface relevant posts. Falls back to trending content for cold-start users.
 */

import { createSupabaseServerClient } from "../server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Personalized post data returned by recommendation queries.
 * Defined locally to avoid circular dependency with main-page.server.ts.
 */
export interface PersonalizedPostData {
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
 * Aggregated user affinity signals derived from recent behavioral events.
 */
export interface UserAffinities {
  topArtists: string[];
  topCategories: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns top-N keys from a count map, sorted by value descending */
const getTopN = (map: Map<string, number>, n = 5): string[] =>
  [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);

/** Maps a raw posts row to PersonalizedPostData */
function toPersonalizedPostData(row: {
  id: string;
  image_url: string | null;
  artist_name: string | null;
  group_name: string | null;
  media_title: string | null;
  media_type: string | null;
  context: string | null;
  view_count: number;
  created_at: string;
}): PersonalizedPostData {
  return {
    id: row.id,
    imageUrl: row.image_url,
    artistName: row.artist_name,
    groupName: row.group_name,
    mediaTitle: row.media_title,
    mediaType: row.media_type,
    context: row.context,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Aggregates a user's top artists and categories from their recent events.
 *
 * Looks at `post_click` and `post_view` events within the last 30 days,
 * then resolves artist names and media types from the `posts` table.
 * Returns the top 5 of each dimension.
 *
 * @param userId - The authenticated user's ID
 * @returns Object with topArtists and topCategories arrays (may be empty)
 */
export async function fetchUserAffinities(
  userId: string
): Promise<UserAffinities> {
  const supabase = await createSupabaseServerClient();

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch recent engagement events
  const { data: events, error: eventsError } = await supabase
    .from("user_events")
    .select("entity_id")
    .eq("user_id", userId)
    .in("event_type", ["post_click", "post_view"])
    .gte("created_at", thirtyDaysAgo);

  if (eventsError) {
    console.error(
      "Error fetching user events for affinities:",
      JSON.stringify(eventsError, null, 2)
    );
    return { topArtists: [], topCategories: [] };
  }

  if (!events || events.length === 0) {
    return { topArtists: [], topCategories: [] };
  }

  // Count entity_id occurrences to understand engagement frequency per post
  const entityCounts = new Map<string, number>();
  for (const event of events) {
    if (event.entity_id) {
      entityCounts.set(
        event.entity_id,
        (entityCounts.get(event.entity_id) ?? 0) + 1
      );
    }
  }

  const postIds = [...entityCounts.keys()];
  if (postIds.length === 0) {
    return { topArtists: [], topCategories: [] };
  }

  // Resolve post metadata for all engaged post IDs
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, artist_name, media_type")
    .in("id", postIds);

  if (postsError) {
    console.error(
      "Error fetching posts for affinities:",
      JSON.stringify(postsError, null, 2)
    );
    return { topArtists: [], topCategories: [] };
  }

  // Tally artist and media_type occurrences weighted by event frequency
  const artistCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const post of posts ?? []) {
    const weight = entityCounts.get(post.id) ?? 1;

    if (post.artist_name) {
      artistCounts.set(
        post.artist_name,
        (artistCounts.get(post.artist_name) ?? 0) + weight
      );
    }

    if (post.media_type) {
      categoryCounts.set(
        post.media_type,
        (categoryCounts.get(post.media_type) ?? 0) + weight
      );
    }
  }

  const topArtists = getTopN(artistCounts);
  const topCategories = getTopN(categoryCounts);

  return { topArtists, topCategories };
}

/**
 * Fetches personalized posts for the "For You" section.
 *
 * Strategy:
 * - If the user has artist affinities, fetch posts matching their top artists.
 * - Cold-start (no affinities): fall back to trending posts ordered by view_count.
 *
 * @param userId - The authenticated user's ID
 * @param limit  - Maximum number of posts to return (default: 10)
 * @returns Array of PersonalizedPostData
 */
export async function fetchForYouPosts(
  userId: string,
  limit = 10
): Promise<PersonalizedPostData[]> {
  const affinities = await fetchUserAffinities(userId);

  if (affinities.topArtists.length === 0) {
    // Cold-start: serve trending content
    return fetchTrendingPosts(limit);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "active")
    .not("image_url", "is", null)
    .in("artist_name", affinities.topArtists)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching for-you posts:",
      JSON.stringify(error, null, 2)
    );
    // Graceful degradation: return trending instead of an error
    return fetchTrendingPosts(limit);
  }

  const posts = (data ?? []).map(toPersonalizedPostData);

  // Pad with trending posts when affinity matches are insufficient
  if (posts.length < limit) {
    const trending = await fetchTrendingPosts(limit - posts.length);
    const existingIds = new Set(posts.map((p) => p.id));
    for (const p of trending) {
      if (!existingIds.has(p.id)) {
        posts.push(p);
        if (posts.length >= limit) break;
      }
    }
  }

  return posts;
}

/**
 * Fetches trending posts ordered by view_count over the last 7 days.
 *
 * Used as the cold-start fallback and as a standalone trending feed.
 *
 * @param limit - Maximum number of posts to return (default: 10)
 * @returns Array of PersonalizedPostData
 */
export async function fetchTrendingPosts(
  limit = 10
): Promise<PersonalizedPostData[]> {
  const supabase = await createSupabaseServerClient();

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "active")
    .not("image_url", "is", null)
    .gte("created_at", sevenDaysAgo)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(
      "Error fetching trending posts:",
      JSON.stringify(error, null, 2)
    );
    return [];
  }

  return (data ?? []).map(toPersonalizedPostData);
}

// ---------------------------------------------------------------------------
// Home Layout Engine
// ---------------------------------------------------------------------------

/** Available section types on the home page */
export type HomeSectionType =
  | "hero"
  | "decoded-pick"
  | "for-you"
  | "today-decoded"
  | "artist-spotlight"
  | "masonry-grid"
  | "whats-new"
  | "discover-items"
  | "best-items"
  | "weekly-best"
  | "trending-now"
  | "personalize-banner";

/**
 * Layout density mode derived from behavioral signals.
 * - editorial: magazine-style, generous whitespace, large images (deliberate readers)
 * - dense: compact grid, max content density (fast scanners)
 * - magazine: hybrid — editorial hero + dense grid below (default)
 */
export type LayoutMode = "editorial" | "dense" | "magazine";

/** Configuration for the home page layout */
export interface HomeLayoutConfig {
  layoutMode: LayoutMode;
  sections: HomeSectionType[];
}

/**
 * Builds a personalized home page layout based on user behavioral signals.
 *
 * Section ordering logic:
 * - Users with high artist engagement → Artist Spotlight promoted to position 3
 * - Users with high spot_click count → Best Items, Discover Items promoted
 * - Cold start users → default editorial order
 *
 * Layout mode logic:
 * - High avg dwell_time (>5s) → "editorial" (deliberate reader)
 * - Low avg dwell_time (<2s) or high scroll_depth frequency → "dense" (fast scanner)
 * - Default → "magazine" (hybrid)
 *
 * @param userId - User ID (null for anonymous)
 * @returns HomeLayoutConfig with ordered sections and layout mode
 */
export async function buildHomeLayout(
  userId: string | null
): Promise<HomeLayoutConfig> {
  // Default layout for anonymous / cold-start
  const defaultSections: HomeSectionType[] = [
    "hero",
    "decoded-pick",
    "for-you",
    "today-decoded",
    "artist-spotlight",
    "masonry-grid",
    "whats-new",
    "discover-items",
    "best-items",
    "weekly-best",
    "trending-now",
    "personalize-banner",
  ];

  if (!userId) {
    return { layoutMode: "magazine", sections: defaultSections };
  }

  const supabase = await createSupabaseServerClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Fetch event type distribution for this user (last 7 days)
  const { data: eventStats, error } = await supabase
    .from("user_events")
    .select("event_type, metadata")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo);

  if (error || !eventStats || eventStats.length === 0) {
    return { layoutMode: "magazine", sections: defaultSections };
  }

  // Count events by type and accumulate dwell_time metrics
  const typeCounts = new Map<string, number>();
  let totalDwellMs = 0;
  let dwellCount = 0;

  for (const event of eventStats) {
    typeCounts.set(
      event.event_type,
      (typeCounts.get(event.event_type) ?? 0) + 1
    );

    if (event.event_type === "dwell_time" && event.metadata) {
      const meta = event.metadata as Record<string, unknown>;
      const dwellMs = Number(meta.dwell_ms);
      if (Number.isFinite(dwellMs) && dwellMs > 0) {
        totalDwellMs += dwellMs;
        dwellCount++;
      }
    }
  }

  const avgDwellMs = dwellCount > 0 ? totalDwellMs / dwellCount : 0;
  const postViews = typeCounts.get("post_view") ?? 0;
  const spotClicks = typeCounts.get("spot_click") ?? 0;
  const postClicks = typeCounts.get("post_click") ?? 0;
  const scrollEvents = typeCounts.get("scroll_depth") ?? 0;

  // --- Determine layout mode ---
  let layoutMode: LayoutMode = "magazine";
  if (avgDwellMs > 5000) {
    layoutMode = "editorial"; // deliberate reader
  } else if (avgDwellMs > 0 && avgDwellMs < 2000 && scrollEvents > postViews) {
    layoutMode = "dense"; // fast scanner
  }

  // --- Determine section order ---
  // hero is always first; personalize-banner is always last
  const sectionScores: [HomeSectionType, number][] = [
    ["decoded-pick", 50], // always high priority
    ["for-you", 45 + (postClicks > 5 ? 20 : 0)], // boost if active clicker
    ["today-decoded", 40],
    ["artist-spotlight", 30 + (postViews > 10 ? 25 : 0)], // boost for heavy viewers
    ["masonry-grid", 35],
    ["whats-new", 25],
    ["discover-items", 20 + (spotClicks > 3 ? 20 : 0)], // boost for spot engagers
    ["best-items", 15 + (spotClicks > 5 ? 25 : 0)], // boost for heavy spot engagers
    ["weekly-best", 10],
    ["trending-now", 5],
  ];

  // Sort by score descending to get priority order
  sectionScores.sort((a, b) => b[1] - a[1]);

  const middle: HomeSectionType[] = sectionScores.map(([section]) => section);
  const sections: HomeSectionType[] = ["hero", ...middle, "personalize-banner"];

  return { layoutMode, sections };
}
