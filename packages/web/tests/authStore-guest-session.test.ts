/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";

// Supabase 클라이언트 mock — initialize()에서 호출
vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowserClient: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(async () => ({ error: null })),
    },
  },
}));

// users API mock
vi.mock("@/lib/api/generated/users/users", () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}));

// authStore를 lazy import — 각 테스트마다 fresh 인스턴스
import { useAuthStore } from "@/lib/stores/authStore";

const GUEST_STORAGE_KEY = "decoded_guest_session";

describe("authStore — guest session persistence (#296)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    // 스토어 리셋 (간단히 초기 상태로)
    useAuthStore.setState({
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
    });
  });

  test("guestLogin sets isGuest=true AND writes sessionStorage", () => {
    useAuthStore.getState().guestLogin();

    expect(useAuthStore.getState().isGuest).toBe(true);
    expect(sessionStorage.getItem(GUEST_STORAGE_KEY)).toBe("1");
  });

  test("initialize restores isGuest from sessionStorage even without Supabase session", async () => {
    // Arrange: prior session persisted guest flag
    sessionStorage.setItem(GUEST_STORAGE_KEY, "1");

    // Act
    await useAuthStore.getState().initialize();

    // Assert: isGuest restored, user remains null (no Supabase session)
    const s = useAuthStore.getState();
    expect(s.isGuest).toBe(true);
    expect(s.user).toBeNull();
    expect(s.isInitialized).toBe(true);
  });

  test("initialize does not set isGuest when sessionStorage is empty", async () => {
    await useAuthStore.getState().initialize();
    expect(useAuthStore.getState().isGuest).toBe(false);
  });

  test("logout clears sessionStorage guest flag", async () => {
    useAuthStore.getState().guestLogin();
    expect(sessionStorage.getItem(GUEST_STORAGE_KEY)).toBe("1");

    await useAuthStore.getState().logout();
    expect(sessionStorage.getItem(GUEST_STORAGE_KEY)).toBeNull();
    expect(useAuthStore.getState().isGuest).toBe(false);
  });
});
