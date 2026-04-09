"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/lib/components/ui/card";
import { OAuthButton } from "./OAuthButton";
import {
  useAuthStore,
  selectLoadingProvider,
  selectIsLoading,
  selectError,
  type OAuthProvider,
} from "@/lib/stores/authStore";

// Prevent open redirect: only allow same-origin relative paths
function getSafeRedirect(url: string | null): string {
  if (!url) return "/";
  return url.startsWith("/") && !url.startsWith("//") ? url : "/";
}

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get("redirect"));
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth);
  const guestLogin = useAuthStore((s) => s.guestLogin);
  const loadingProvider = useAuthStore(selectLoadingProvider);
  const isLoading = useAuthStore(selectIsLoading);
  const error = useAuthStore(selectError);
  const urlError = searchParams.get("error");

  const handleLogin = async (provider: OAuthProvider) => {
    // Store redirect destination before OAuth round-trip (browser loses query params)
    if (redirectTo !== "/") {
      sessionStorage.setItem("post_login_redirect", redirectTo);
    }
    await signInWithOAuth(provider);
  };

  const handleGuestLogin = () => {
    guestLogin();
    router.push(redirectTo);
  };

  return (
    <Card className="w-full max-w-sm border-0 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardContent className="space-y-6 pt-8 pb-4">
        {/* Logo & Title */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            <span className="text-[#d9fc69]">decoded</span>
          </h1>
          <p className="text-lg font-medium text-white/90">
            Welcome to Decoded
          </p>
          <p className="text-sm text-white/60">
            Discover what they&apos;re wearing
          </p>
        </div>

        {/* Error Message */}
        {(error || urlError) && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{error || urlError}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col items-center space-y-3">
          <OAuthButton
            provider="google"
            onClick={() => handleLogin("google")}
            isLoading={loadingProvider === "google"}
            disabled={isLoading}
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-2 text-white/40">or</span>
          </div>
        </div>

        {/* Guest Button */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={isLoading}
          className="relative flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all bg-transparent text-white/70 border border-white/20 hover:bg-white/10 hover:text-white active:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue as Guest
        </button>
      </CardContent>

      <CardFooter className="flex-col space-y-2 pb-8">
        <p className="text-center text-xs text-white/40">
          By continuing, you agree to our{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white/60"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-white/60"
          >
            Privacy Policy
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
