"use client";

import { useEffect } from "react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const setUser = useAuthStore((s) => s.setUser);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);

  useEffect(() => {
    initialize();

    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] Auth state changed:", event);

      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          setUser(session?.user ?? null);
          setSessionExpired(false);
          break;

        case "SIGNED_OUT":
          setUser(null);
          setSessionExpired(false);
          break;

        case "INITIAL_SESSION":
          // initialize()에서 처리
          break;

        default:
          break;
      }
    });

    // 주기적 세션 체크 (5분마다)
    const sessionCheckInterval = setInterval(async () => {
      const {
        data: { session },
        error,
      } = await supabaseBrowserClient.auth.getSession();

      if (error || !session) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
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
      }
    }, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [initialize, setUser, setSessionExpired]);

  return <>{children}</>;
}
