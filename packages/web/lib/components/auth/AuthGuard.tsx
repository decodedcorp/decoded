"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsInitialized,
} from "@/lib/stores/authStore";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isInitialized = useAuthStore(selectIsInitialized);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isInitialized, isAuthenticated, router]);

  if (!isInitialized) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
