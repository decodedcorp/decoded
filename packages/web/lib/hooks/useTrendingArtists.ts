import { useQuery } from "@tanstack/react-query";
import { supabaseBrowserClient } from "@/lib/supabase/client";

export interface TrendingArtist {
  name: string;
  postCount: number;
  imageUrl: string;
}

async function fetchAllTimeTopArtists(
  limit: number
): Promise<TrendingArtist[]> {
  try {
    const { data, error } = await supabaseBrowserClient
      .from("posts")
      .select("artist_name, image_url, view_count")
      .eq("status", "active")
      .not("artist_name", "is", null)
      .not("image_url", "is", null)
      .order("view_count", { ascending: false })
      .limit(200);

    if (error || !data) return [];

    const artistMap = new Map<
      string,
      { postCount: number; imageUrl: string }
    >();
    for (const post of data) {
      if (!post.artist_name || !post.image_url) continue;
      const existing = artistMap.get(post.artist_name);
      if (existing) {
        existing.postCount += 1;
      } else {
        artistMap.set(post.artist_name, {
          postCount: 1,
          imageUrl: post.image_url,
        });
      }
    }

    return Array.from(artistMap.entries())
      .map(([name, { postCount, imageUrl }]) => ({ name, postCount, imageUrl }))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, limit);
  } catch {
    return [];
  }
}

async function fetchTrendingArtists(
  dayWindow: number,
  limit: number
): Promise<TrendingArtist[]> {
  const cutoff = new Date(
    Date.now() - dayWindow * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("artist_name, image_url, created_at")
    .eq("status", "active")
    .not("artist_name", "is", null)
    .not("image_url", "is", null)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return fetchAllTimeTopArtists(limit);

  const artistMap = new Map<string, { postCount: number; imageUrl: string }>();
  for (const post of data) {
    if (!post.artist_name || !post.image_url) continue;
    const existing = artistMap.get(post.artist_name);
    if (existing) {
      existing.postCount += 1;
    } else {
      // Use first (most recent) image_url as representative
      artistMap.set(post.artist_name, {
        postCount: 1,
        imageUrl: post.image_url,
      });
    }
  }

  const results = Array.from(artistMap.entries())
    .map(([name, { postCount, imageUrl }]) => ({ name, postCount, imageUrl }))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, limit);

  // Fallback: if fewer than 3 trending artists found in window, use all-time top
  if (results.length < 3) {
    return fetchAllTimeTopArtists(limit);
  }

  return results;
}

export function useTrendingArtists(dayWindow = 7, limit = 10) {
  return useQuery<TrendingArtist[]>({
    queryKey: ["trending-artists", { dayWindow, limit }],
    queryFn: () => fetchTrendingArtists(dayWindow, limit),
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 10, // 10 min
  });
}
