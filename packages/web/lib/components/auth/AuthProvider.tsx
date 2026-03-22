"use client";

import { useEffect } from "react";
import { supabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/authStore";

/**
 * Auth Provider - Supabase 인증 상태 변화를 감지하고 store에 반영
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // 앱 시작 시 세션 확인
    initialize();

    // Auth 상태 변화 구독
    const {
      data: { subscription },
    } = supabaseBrowserClient.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "INITIAL_SESSION") {
        // 초기 세션은 initialize에서 처리됨
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setUser]);

  return <>{children}</>;
}
