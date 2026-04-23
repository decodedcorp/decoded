/**
 * Auth Store - Supabase OAuth 인증 상태 관리
 */

import { create } from "zustand";
import { type User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { getMyProfile, updateMyProfile } from "@/lib/api/generated/users/users";
import type { UpdateUserDto } from "@/lib/api/generated/models";

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
  sessionExpired: boolean;
  loadingProvider: OAuthProvider | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  guestLogin: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
  setUser: (supabaseUser: SupabaseUser | null) => Promise<void>;
  setSessionExpired: (expired: boolean) => void;
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

/**
 * Guest 세션 sessionStorage 키. hard navigation 후(`/login` → `/request/upload`)
 * 에도 `isGuest` 상태를 복원할 수 있도록 persist한다. `logout()` / `setUser(logged-in)`
 * 시 클리어된다. #296.
 */
const GUEST_SESSION_STORAGE_KEY = "decoded_guest_session";

function persistGuestSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, "1");
  } catch {
    // sessionStorage 접근 실패(프라이빗 모드/쿼터 초과 등)는 무시
  }
}

function clearGuestSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
  } catch {
    // noop
  }
}

function readGuestSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isAdmin: false,
  isGuest: false,
  isLoading: false,
  isInitialized: false,
  needsOnboarding: false,
  sessionExpired: false,
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
        // Supabase 세션 없으면 sessionStorage에서 guest 플래그 복원 (#296)
        const guestRestored = readGuestSession();
        set({
          isInitialized: true,
          user: null,
          isAdmin: false,
          isGuest: guestRestored,
        });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      // 실패 경로에서도 guest 세션 복원 시도 (로컬 상태로 fallback)
      const guestRestored = readGuestSession();
      set({
        isInitialized: true,
        user: null,
        isAdmin: false,
        isGuest: guestRestored,
      });
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
          redirectTo: `${window.location.origin}/${sessionStorage.getItem("post_login_redirect")?.replace(/^\//, "") || ""}`,
        },
      });

      if (error) {
        throw error;
      }

      // OAuth는 리다이렉트되므로 여기서 loading 상태는 유지됨
      // 실제 로그인 완료는 onAuthStateChange에서 처리
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed.";
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
    persistGuestSession();
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

      clearGuestSession();
      set({
        user: null,
        profile: null,
        isAdmin: false,
        isGuest: false,
        isLoading: false,
        needsOnboarding: false,
        sessionExpired: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logout failed.";
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

  setSessionExpired: (expired: boolean) => {
    set({ sessionExpired: expired });
  },

  /**
   * Supabase auth state change에서 호출
   */
  setUser: async (supabaseUser: SupabaseUser | null) => {
    if (supabaseUser) {
      // 실제 user가 설정되면 guest 세션을 폐기 (권한/상태 충돌 방지)
      clearGuestSession();
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
        sessionExpired: false,
      });
    }
  },

  /**
   * 백엔드 API를 통해 프로필 데이터 가져오기
   */
  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      const data = await getMyProfile();

      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        username: data.username,
        display_name: data.display_name ?? null,
        avatar_url: data.avatar_url ?? null,
        bio: data.bio ?? null,
        rank: data.rank ?? null,
        total_points: data.total_points,
        is_admin: data.is_admin,
        created_at: "",
        updated_at: "",
      };

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
    } catch (error: unknown) {
      // 404 = new user not yet in users table
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        (error as { status: number }).status === 404
      ) {
        console.log("[authStore] New user detected, needs onboarding");
        set({ needsOnboarding: true, profile: null });
        return;
      }
      console.error("Profile fetch error:", error);
    }
  },

  /**
   * 백엔드 API를 통해 프로필 업데이트
   */
  updateProfile: async (
    updates: Partial<Pick<UserProfile, "username" | "display_name" | "bio">>
  ): Promise<boolean> => {
    const user = get().user;
    if (!user) return false;

    try {
      await updateMyProfile(updates as UpdateUserDto);
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
export const selectLoadingProvider = (state: AuthState) =>
  state.loadingProvider;
export const selectError = (state: AuthState) => state.error;
export const selectSessionExpired = (state: AuthState) => state.sessionExpired;
export const selectLogout = (state: AuthState) => state.logout;
