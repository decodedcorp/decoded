"use client";

import { useEffect } from "react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";

const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * 브라우저 localStorage 세션을 서버 쿠키로 동기화.
 *
 * `@supabase/supabase-js createClient`는 localStorage만 쓰므로 서버 route
 * handler(`createSupabaseServerClient`, `proxy.ts`)가 세션을 인식하려면
 * 토큰이 바뀔 때마다 쿠키에 기록해 줘야 한다. 이게 없으면 토큰 갱신 이후
 * 관리자 API에서 401이 떨어진다.
 */
async function syncSessionCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    });
  } catch (error) {
    console.error("[AuthProvider] Failed to sync session cookies:", error);
  }
}

async function clearSessionCookies(): Promise<void> {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (error) {
    console.error("[AuthProvider] Failed to clear session cookies:", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] Auth state changed:", event);

      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
        case "INITIAL_SESSION":
          if (session?.access_token && session?.refresh_token) {
            await syncSessionCookies(
              session.access_token,
              session.refresh_token
            );
          }
          if (event !== "INITIAL_SESSION") {
            setUser(session?.user ?? null);
            setSessionExpired(false);
          }
          break;

        case "SIGNED_OUT":
          await clearSessionCookies();
          setUser(null);
          setSessionExpired(false);
          break;

        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setUser, setSessionExpired]);

  // 인증된 유저가 있을 때만 주기적 세션 체크 (5분마다)
  useEffect(() => {
    if (!user) return;

    const sessionCheckInterval = setInterval(async () => {
      const {
        data: { session },
        error,
      } = await supabaseBrowserClient.auth.getSession();

      if (error || !session) {
        console.warn("[AuthProvider] Session expired, attempting refresh...");
        const { error: refreshError } =
          await supabaseBrowserClient.auth.refreshSession();
        if (refreshError) {
          console.error(
            "[AuthProvider] Session refresh failed:",
            refreshError.message
          );
          setSessionExpired(true);
        }
      }
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [user, setSessionExpired]);

  return <>{children}</>;
}
