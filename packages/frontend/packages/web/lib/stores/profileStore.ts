/**
 * Profile 상태 관리
 * 프로필 페이지의 Mock 데이터 및 모달 상태를 관리합니다.
 */

import { create } from "zustand";
import type { UserResponse, UserStatsResponse } from "@/lib/api/types";

// Types
export interface ProfileUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
}

export interface ProfileStats {
  totalContributions: number;
  totalAnswers: number;
  totalAccepted: number;
  totalEarnings: number;
}

export type BadgeIconType =
  | "trophy"
  | "heart"
  | "rabbit"
  | "sparkles"
  | "star"
  | "gem"
  | "rocket"
  | "crown"
  | "medal"
  | "award";

export interface Badge {
  id: string;
  name: string;
  icon: BadgeIconType;
  category: string;
  earnedAt: Date;
  description?: string;
  /** 진행 중(미획득) 뱃지 */
  isLocked?: boolean;
}

export interface Ranking {
  scope: "global" | string;
  rank: number;
  change: number;
  period: "week" | "month" | "all";
}

// Badge Modal Types
export type BadgeModalMode = "single" | "all" | null;

interface ProfileState {
  // Data
  user: ProfileUser;
  stats: ProfileStats;
  badges: Badge[];
  rankings: Ranking[];

  // Modal State
  badgeModalMode: BadgeModalMode;
  selectedBadge: Badge | null;

  // Actions
  openBadgeModal: (mode: "single" | "all", badge?: Badge) => void;
  closeBadgeModal: () => void;

  // API sync actions
  setUserFromApi: (apiUser: UserResponse) => void;
  setStatsFromApi: (apiStats: UserStatsResponse) => void;
  setBadgesFromApi: (badges: Badge[]) => void;
  setRankingsFromApi: (rankings: Ranking[]) => void;
}

const INITIAL_USER: ProfileUser = {
  id: "",
  displayName: "",
  username: "",
  avatarUrl: undefined,
  bio: undefined,
};

const INITIAL_STATS: ProfileStats = {
  totalContributions: 0,
  totalAnswers: 0,
  totalAccepted: 0,
  totalEarnings: 0,
};

export const useProfileStore = create<ProfileState>((set) => ({
  user: INITIAL_USER,
  stats: INITIAL_STATS,
  badges: [],
  rankings: [],

  // Modal state
  badgeModalMode: null,
  selectedBadge: null,

  // Actions
  openBadgeModal: (mode, badge) => {
    set({
      badgeModalMode: mode,
      selectedBadge: badge || null,
    });
  },

  closeBadgeModal: () => {
    set({
      badgeModalMode: null,
      selectedBadge: null,
    });
  },

  setUserFromApi: (apiUser) => {
    set({
      user: {
        id: apiUser.id,
        displayName: apiUser.display_name || apiUser.username,
        username: `@${apiUser.username}`,
        avatarUrl: apiUser.avatar_url || undefined,
        bio: apiUser.bio || undefined,
      },
    });
  },

  setStatsFromApi: (apiStats) => {
    set({
      stats: {
        totalContributions: apiStats.total_posts,
        totalAnswers: apiStats.total_comments,
        totalAccepted: apiStats.total_likes_received,
        totalEarnings: apiStats.total_points,
      },
    });
  },

  setBadgesFromApi: (badges) => {
    set({ badges });
  },

  setRankingsFromApi: (rankings) => {
    set({ rankings });
  },
}));

// Selectors
export const selectUser = (state: ProfileState) => state.user;
export const selectStats = (state: ProfileState) => state.stats;
export const selectBadges = (state: ProfileState) => state.badges;
export const selectRankings = (state: ProfileState) => state.rankings;
export const selectBadgeModalMode = (state: ProfileState) =>
  state.badgeModalMode;
export const selectSelectedBadge = (state: ProfileState) => state.selectedBadge;

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateAcceptRate(accepted: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((accepted / total) * 100);
}
