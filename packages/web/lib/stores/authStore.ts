/**
 * Auth Store - Supabase OAuth 인증 상태 관리
 */

import { create } from "zustand";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseBrowserClient } from "@/lib/supabase/client";

export type OAuthProvider = "kakao" | "google" | "apple";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  rank: string | null;
  total_points: number;
  is_admin: boolean;
  style_dna?: Record<string, unknown> | null;
  ink_credits?: number;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  needsOnboarding: boolean;
  loadingProvider: OAuthProvider | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  guestLogin: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (supabaseUser: SupabaseUser | null) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (
    updates: Partial<Pick<UserProfile, "username" | "display_name" | "bio">>
  ) => Promise<boolean>;
  completeOnboarding: () => void;
}

/**
 * Supabase User를 앱 User 형식으로 변환
 */
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  const metadata = supabaseUser.user_metadata || {};

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    name:
      metadata.full_name ||
      metadata.name ||
      metadata.nickname ||
      supabaseUser.email?.split("@")[0] ||
      "User",
    avatarUrl: metadata.avatar_url || metadata.picture,
    createdAt: supabaseUser.created_at,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isGuest: false,
  isLoading: false,
  isInitialized: false,
  needsOnboarding: false,
  loadingProvider: null,
  error: null,

  /**
   * 앱 시작 시 세션 확인
   */
  initialize: async () => {
    if (get().isInitialized) return;

    try {
      const {
        data: { session },
        error,
      } = await supabaseBrowserClient.auth.getSession();

      if (error) {
        console.error("Failed to get session:", error);
        set({ isInitialized: true, user: null, isAdmin: false });
        return;
      }

      if (session?.user) {
        const mappedUser = mapSupabaseUser(session.user);
        set({
          user: mappedUser,
          isInitialized: true,
          isGuest: false,
        });
        await get().fetchProfile();

        // Post-login redirect: handle return URL stored before OAuth round-trip
        if (typeof window !== "undefined") {
          const savedRedirect = sessionStorage.getItem("post_login_redirect");
          if (savedRedirect) {
            sessionStorage.removeItem("post_login_redirect");
            // Use window.location.replace so login page is not in browser history
            window.location.replace(savedRedirect);
          }
        }
      } else {
        set({ isInitialized: true, user: null, isAdmin: false });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isInitialized: true, user: null, isAdmin: false });
    }
  },

  /**
   * OAuth 로그인
   */
  signInWithOAuth: async (provider: OAuthProvider) => {
    set({ isLoading: true, loadingProvider: provider, error: null });

    try {
      const { error } = await supabaseBrowserClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }

      // OAuth는 리다이렉트되므로 여기서 loading 상태는 유지됨
      // 실제 로그인 완료는 onAuthStateChange에서 처리
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그인에 실패했습니다.";
      set({
        error: message,
        isLoading: false,
        loadingProvider: null,
      });
    }
  },

  /**
   * 게스트 로그인
   */
  guestLogin: () => {
    set({ isGuest: true, user: null, isAdmin: false, error: null });
  },

  /**
   * 로그아웃
   */
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabaseBrowserClient.auth.signOut();

      if (error) {
        throw error;
      }

      set({
        user: null,
        profile: null,
        isAdmin: false,
        isGuest: false,
        isLoading: false,
        needsOnboarding: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그아웃에 실패했습니다.";
      set({
        error: message,
        isLoading: false,
      });
    }
  },

  /**
   * 에러 초기화
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Supabase auth state change에서 호출
   */
  setUser: async (supabaseUser: SupabaseUser | null) => {
    if (supabaseUser) {
      set({
        user: mapSupabaseUser(supabaseUser),
        isGuest: false,
        isLoading: false,
        loadingProvider: null,
      });
      await get().fetchProfile();
    } else {
      set({
        user: null,
        profile: null,
        isAdmin: false,
        isLoading: false,
        loadingProvider: null,
        needsOnboarding: false,
      });
    }
  },

  /**
   * public.users 프로필 데이터 가져오기
   */
  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const { data, error } = await supabaseBrowserClient
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to fetch profile:", error);
        return;
      }

      const profile = data as unknown as UserProfile;

      // Detect first-time user: username and display_name are both email-prefix defaults
      const emailPrefix = user.email.split("@")[0] || "";
      const isDefault =
        (profile.username ?? "") === emailPrefix &&
        (profile.display_name ?? "") === emailPrefix;

      set({
        profile,
        isAdmin: profile.is_admin === true,
        needsOnboarding: isDefault,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  },

  /**
   * public.users 프로필 업데이트
   */
  updateProfile: async (
    updates: Partial<Pick<UserProfile, "username" | "display_name" | "bio">>
  ): Promise<boolean> => {
    const user = get().user;
    if (!user) return false;

    try {
      const { error } = await supabaseBrowserClient
        .from("users")
        .update(updates as Record<string, unknown>)
        .eq("id", user.id);

      if (error) {
        console.error("Failed to update profile:", error);
        return false;
      }

      // Re-fetch profile to get updated data
      await get().fetchProfile();
      return true;
    } catch (error) {
      console.error("Profile update error:", error);
      return false;
    }
  },

  /**
   * 온보딩 완료 처리
   */
  completeOnboarding: () => {
    set({ needsOnboarding: false });
  },
}));

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectProfile = (state: AuthState) => state.profile;
export const selectNeedsOnboarding = (state: AuthState) =>
  state.needsOnboarding;
export const selectIsAdmin = (state: AuthState) => state.isAdmin;
export const selectIsAuthenticated = (state: AuthState) =>
  !!state.user || state.isGuest;
export const selectIsLoggedIn = (state: AuthState) => !!state.user;
export const selectIsGuest = (state: AuthState) => state.isGuest;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectLoadingProvider = (state: AuthState) => state.loadingProvider;
export const selectError = (state: AuthState) => state.error;
export const selectLogout = (state: AuthState) => state.logout;
