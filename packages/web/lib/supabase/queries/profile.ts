/**
 * Query layer for profile-related data (client-side)
 *
 * Provides user-scoped queries for posts, spots, and solutions
 * displayed on the profile page.
 */

import { supabaseBrowserClient } from "../client";
import type { PostRow, SpotRow, SolutionRow } from "../types";

/**
 * Spot row with joined post image for thumbnail display
 */
export type SpotWithPost = SpotRow & {
  post: { image_url: string | null } | null;
};

/**
 * Fetches posts by user ID for the profile page
 *
 * @param userId - User ID to filter by
 * @param limit - Maximum number of posts to fetch (default: 20)
 * @returns Array of PostRow
 */
export async function fetchPostsByUserProfile(
  userId: string,
  limit = 20
): Promise<PostRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchPostsByUserProfile] Error:",
        JSON.stringify(error, null, 2)
      );
    }
    return [];
  }

  return data || [];
}

/**
 * Fetches spots by user ID with joined post image
 *
 * @param userId - User ID to filter by
 * @param limit - Maximum number of spots to fetch (default: 20)
 * @returns Array of SpotRow with post image_url
 */
export async function fetchSpotsByUser(
  userId: string,
  limit = 20
): Promise<SpotWithPost[]> {
  const { data, error } = await supabaseBrowserClient
    .from("spots")
    .select("*, post:posts(image_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchSpotsByUser] Error:",
        JSON.stringify(error, null, 2)
      );
    }
    return [];
  }

  return (data as SpotWithPost[]) || [];
}

/**
 * Fetches solutions by user ID
 *
 * @param userId - User ID to filter by
 * @param limit - Maximum number of solutions to fetch (default: 20)
 * @returns Array of SolutionRow
 */
export async function fetchSolutionsByUser(
  userId: string,
  limit = 20
): Promise<SolutionRow[]> {
  const { data, error } = await supabaseBrowserClient
    .from("solutions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[fetchSolutionsByUser] Error:",
        JSON.stringify(error, null, 2)
      );
    }
    return [];
  }

  return data || [];
}

// ============================================================
// Profile Dashboard Queries (Style DNA, Ink, Social, Try-on)
// ============================================================

export interface UserProfileExtras {
  ink_credits: number;
  style_dna: {
    keywords: string[];
    colors: string[];
    progress: number;
  } | null;
}

export async function fetchUserProfileExtras(
  userId: string
): Promise<UserProfileExtras> {
  const { data, error } = await supabaseBrowserClient
    .from("users")
    .select("ink_credits, style_dna")
    .eq("id", userId)
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchUserProfileExtras] Error:", error);
    }
    return { ink_credits: 0, style_dna: null };
  }

  return {
    ink_credits: data.ink_credits ?? 0,
    style_dna: data.style_dna as UserProfileExtras["style_dna"],
  };
}

export interface SocialAccount {
  provider: string;
  provider_user_id: string;
  last_synced_at: string | null;
}

export async function fetchUserSocialAccounts(
  userId: string
): Promise<SocialAccount[]> {
  const { data, error } = await supabaseBrowserClient
    .from("user_social_accounts")
    .select("provider, provider_user_id, last_synced_at")
    .eq("user_id", userId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchUserSocialAccounts] Error:", error);
    }
    return [];
  }

  return (data as SocialAccount[]) || [];
}

export async function fetchTryOnCount(userId: string): Promise<number> {
  const { count, error } = await supabaseBrowserClient
    .from("user_tryon_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[fetchTryOnCount] Error:", error);
    }
    return 0;
  }

  return count ?? 0;
}
