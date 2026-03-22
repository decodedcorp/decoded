"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/lib/components/ui/card";
import { OAuthButton } from "./OAuthButton";
import { useAuthStore, type OAuthProvider } from "@/lib/stores/authStore";

export function LoginCard() {
  const router = useRouter();
  const { signInWithOAuth, guestLogin, loadingProvider, isLoading, error } =
    useAuthStore();

  const handleLogin = async (provider: OAuthProvider) => {
    await signInWithOAuth(provider);
    // OAuth는 리다이렉트 방식이므로 여기서 router.push 하지 않음
    // 로그인 성공 후 redirectTo에서 설정한 URL로 이동
  };

  const handleGuestLogin = () => {
    guestLogin();
    router.push("/");
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
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{error}</p>
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
