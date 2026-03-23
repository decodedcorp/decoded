/**
 * Profile Hooks
 * React Query hooks for user profile data
 */

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  useGetMyProfile,
  useGetMyStats,
  useGetUserProfile,
  getMyActivities,
} from "@/lib/api/generated/users/users";
import { useMyBadges as useMyBadgesGenerated } from "@/lib/api/generated/badges/badges";
import { useMyRankingDetail as useMyRankingDetailGenerated } from "@/lib/api/generated/rankings/rankings";
import type { MyBadgesResponse } from "@/lib/api/generated/models";
import type { MyRankingDetailResponse } from "@/lib/api/generated/models";
import type { UserResponse, UserStatsResponse } from "@/lib/api/generated/models";
import { UpdateUserDto } from "@/lib/api/types";
import { supabaseBrowserClient } from "@/lib/supabase/client";

// ============================================================
// Query Keys
// ============================================================

interface ActivitiesKeyParams {
  type?: string;
  perPage?: number;
  enabled?: boolean;
}

export const profileKeys = {
  all: ["profile"] as const,
  me: () => [...profileKeys.all, "me"] as const,
  stats: () => [...profileKeys.all, "stats"] as const,
  activities: (params?: ActivitiesKeyParams) =>
    [...profileKeys.all, "activities", params] as const,
  user: (userId: string) => [...profileKeys.all, "user", userId] as const,
  badges: () => [...profileKeys.all, "badges"] as const,
  rankings: () => [...profileKeys.all, "rankings"] as const,
};

// ============================================================
// Inline from deleted users.ts — Phase 42 will replace with generated mutation
// ============================================================

async function updateMe(data: UpdateUserDto): Promise<UserResponse> {
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
    rank: null as any, // Type mismatch with generated UserResponse — Phase 42 will fix
    total_points: 0,
    is_admin: false,
    avatar_url: metadata.avatar_url || metadata.picture || null,
    bio: metadata.bio || null,
    display_name:
      metadata.full_name || metadata.name || metadata.nickname || null,
  } as any;
}

// ============================================================
// useMe - Current user's profile
// ============================================================

export function useMe(
  options?: Omit<UseQueryOptions<UserResponse, Error>, "queryKey" | "queryFn">
) {
  return useGetMyProfile({
    query: {
      queryKey: profileKeys.me(),
      staleTime: 1000 * 60 * 5, // 5 minutes (profile changes less frequently)
      ...options,
    },
  });
}

// ============================================================
// useUserStats - Current user's statistics
// ============================================================

export function useUserStats(
  options?: Omit<
    UseQueryOptions<UserStatsResponse, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useGetMyStats({
    query: {
      queryKey: profileKeys.stats(),
      staleTime: 1000 * 60 * 2, // 2 minutes
      ...options,
    },
  });
}

// ============================================================
// useUserActivities - Paginated activities (infinite query using raw function)
// ============================================================

interface UseUserActivitiesParams {
  type?: string;
  perPage?: number;
  enabled?: boolean;
}

export function useUserActivities(params?: UseUserActivitiesParams) {
  return useInfiniteQuery({
    queryKey: profileKeys.activities(params),
    queryFn: async ({ pageParam }) => {
      const page = (pageParam as number) ?? 1;
      return getMyActivities({
        type: params?.type as any,
        page,
        per_page: params?.perPage ?? 20,
      });
    },
    getNextPageParam: (lastPage: any) =>
      lastPage.pagination?.current_page < lastPage.pagination?.total_pages
        ? lastPage.pagination.current_page + 1
        : undefined,
    initialPageParam: 1,
    staleTime: 1000 * 60, // 1 minute
    enabled: params?.enabled !== false,
  });
}

// ============================================================
// useUser - Another user's public profile
// ============================================================

export function useUser(
  userId: string,
  options?: Omit<UseQueryOptions<UserResponse, Error>, "queryKey" | "queryFn">
) {
  return useGetUserProfile(userId, {
    query: {
      queryKey: profileKeys.user(userId),
      enabled: !!userId,
      staleTime: 1000 * 60 * 5, // 5 minutes
      ...options,
    },
  });
}

// ============================================================
// useMyBadges - Current user's badges
// ============================================================

export function useMyBadges(
  options?: Omit<UseQueryOptions<MyBadgesResponse, Error>, "queryKey" | "queryFn">
) {
  return useMyBadgesGenerated({
    query: {
      queryKey: profileKeys.badges(),
      staleTime: 1000 * 60 * 5, // 5 minutes
      ...options,
    },
  });
}

// ============================================================
// useMyRanking - Current user's ranking detail
// ============================================================

export function useMyRanking(
  options?: Omit<UseQueryOptions<MyRankingDetailResponse, Error>, "queryKey" | "queryFn">
) {
  return useMyRankingDetailGenerated({
    query: {
      queryKey: profileKeys.rankings(),
      staleTime: 1000 * 60 * 2, // 2 minutes
      ...options,
    },
  });
}

// ============================================================
// Profile Dashboard Hooks (Style DNA, Ink, Social, Try-on)
// ============================================================

import {
  fetchUserProfileExtras,
  fetchUserSocialAccounts,
  fetchTryOnCount,
  type UserProfileExtras,
  type SocialAccount,
} from "@/lib/supabase/queries/profile";
import { useQuery } from "@tanstack/react-query";

export const profileDashboardKeys = {
  extras: (userId: string) => [...profileKeys.all, "extras", userId] as const,
  social: (userId: string) => [...profileKeys.all, "social", userId] as const,
  tryOnCount: (userId: string) =>
    [...profileKeys.all, "tryOnCount", userId] as const,
};

export function useProfileExtras(userId: string | undefined) {
  return useQuery({
    queryKey: profileDashboardKeys.extras(userId ?? ""),
    queryFn: () => fetchUserProfileExtras(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSocialAccounts(userId: string | undefined) {
  return useQuery({
    queryKey: profileDashboardKeys.social(userId ?? ""),
    queryFn: () => fetchUserSocialAccounts(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTryOnCount(userId: string | undefined) {
  return useQuery({
    queryKey: profileDashboardKeys.tryOnCount(userId ?? ""),
    queryFn: () => fetchTryOnCount(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================
// useUpdateProfile - Mutation for updating profile
// ============================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserDto) => updateMe(data),
    onSuccess: (updatedUser) => {
      // Update React Query cache
      queryClient.setQueryData(profileKeys.me(), updatedUser);

      // Sync with profileStore for immediate UI update
      // Import store dynamically to avoid circular dependency
      import("@/lib/stores/profileStore").then(({ useProfileStore }) => {
        useProfileStore.getState().setUserFromApi(updatedUser);
      });

      // Invalidate to trigger refetch in background
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
    onError: (error) => {
      console.error("[useUpdateProfile] Failed to update profile:", error);
    },
  });
}
