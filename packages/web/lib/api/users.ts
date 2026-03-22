/**
 * User API Functions
 * - Profile endpoints (Supabase Auth direct)
 * - Stats and activities
 */

import { supabaseBrowserClient } from "@/lib/supabase/client";
import {
  UserResponse,
  UpdateUserDto,
  UserStatsResponse,
  PaginatedActivitiesResponse,
  ActivitiesListParams,
} from "./types";

// ============================================================
// GET current user profile (Supabase Auth direct)
// ============================================================

export async function fetchMe(): Promise<UserResponse> {
  const {
    data: { user },
    error,
  } = await supabaseBrowserClient.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email || "",
    username:
      metadata.preferred_username ||
      metadata.nickname ||
      user.email?.split("@")[0] ||
      "",
    rank: null,
    total_points: 0,
    is_admin: false,
    avatar_url: metadata.avatar_url || metadata.picture || null,
    bio: metadata.bio || null,
    display_name:
      metadata.full_name || metadata.name || metadata.nickname || null,
  };
}

// ============================================================
// Update current user's profile (Supabase Auth metadata)
// ============================================================

export async function updateMe(data: UpdateUserDto): Promise<UserResponse> {
  const updates: Record<string, unknown> = {};
  if (data.display_name !== undefined) updates.full_name = data.display_name;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
  if (data.bio !== undefined) updates.bio = data.bio;

  // updateUser returns the updated user directly — no need for a second getUser() call
  const { data: updated, error } = await supabaseBrowserClient.auth.updateUser({
    data: updates,
  });

  if (error || !updated?.user) {
    throw new Error(error?.message ?? "프로필 업데이트에 실패했습니다.");
  }

  const user = updated.user;
  const metadata = user.user_metadata || {};

  return {
    id: user.id,
    email: user.email || "",
    username:
      metadata.preferred_username ||
      metadata.nickname ||
      user.email?.split("@")[0] ||
      "",
    rank: null,
    total_points: 0,
    is_admin: false,
    avatar_url: metadata.avatar_url || metadata.picture || null,
    bio: metadata.bio || null,
    display_name:
      metadata.full_name || metadata.name || metadata.nickname || null,
  };
}

// ============================================================
// Get current user's stats (computed from DB tables)
// ============================================================

export async function fetchUserStats(): Promise<UserStatsResponse> {
  const {
    data: { user },
  } = await supabaseBrowserClient.auth.getUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  // Count posts by this user
  const { count: totalPosts } = await supabaseBrowserClient
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return {
    total_posts: totalPosts ?? 0,
    total_comments: 0,
    total_likes_received: 0,
    total_points: 0,
    rank: null,
  };
}

// ============================================================
// Get public user profile
// ============================================================

export async function fetchUserById(userId: string): Promise<UserResponse> {
  // For now, return minimal data since there's no public users table
  return {
    id: userId,
    email: "",
    username: "",
    rank: null,
    total_points: 0,
    is_admin: false,
    avatar_url: null,
    bio: null,
    display_name: null,
  };
}

// ============================================================
// User activities — 백엔드 없이 빈 데이터 반환
// ============================================================

export async function fetchUserActivities(
  _params?: ActivitiesListParams
): Promise<PaginatedActivitiesResponse> {
  return {
    data: [],
    pagination: {
      current_page: 1,
      per_page: 20,
      total_items: 0,
      total_pages: 0,
    },
  };
}
