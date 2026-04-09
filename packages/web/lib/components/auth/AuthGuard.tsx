"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuthStore,
  selectIsLoggedIn,
  selectIsInitialized,
} from "@/lib/stores/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const isInitialized = useAuthStore(selectIsInitialized);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoggedIn) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isInitialized, isLoggedIn, router]);

  if (!isInitialized) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
