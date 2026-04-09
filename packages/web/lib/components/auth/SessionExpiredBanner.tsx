"use client";

import { useAuthStore, selectSessionExpired } from "@/lib/stores/authStore";
import { useRouter } from "next/navigation";

export function SessionExpiredBanner() {
  const sessionExpired = useAuthStore(selectSessionExpired);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  if (!sessionExpired) return null;

  const handleReLogin = async () => {
    await logout();
    sessionStorage.setItem("post_login_redirect", window.location.pathname);
    router.push("/login");
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-3 text-center text-sm font-medium backdrop-blur-sm">
      <span>세션이 만료되었습니다. </span>
      <button
        onClick={handleReLogin}
        className="underline font-bold hover:opacity-80"
      >
        다시 로그인
      </button>
    </div>
  );
}
