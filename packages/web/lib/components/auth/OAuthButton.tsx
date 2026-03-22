"use client";

import { cn } from "@/lib/utils";
import { type OAuthProvider } from "@/lib/stores/authStore";
import { Loader2 } from "lucide-react";

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const providerConfig: Record<
  OAuthProvider,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  kakao: {
    label: "Continue with Kakao",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.477 2 11c0 2.89 1.888 5.437 4.744 6.878l-.972 3.635c-.053.198.162.364.34.263l4.33-2.879A11.5 11.5 0 0 0 12 19c5.523 0 10-3.477 10-8s-4.477-8-10-8Z" />
      </svg>
    ),
    className:
      "bg-[#FEE500] text-[#191919] hover:bg-[#FDD800] active:bg-[#FAC800]",
  },
  google: {
    label: "Continue with Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    className:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100",
  },
  apple: {
    label: "Continue with Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
      </svg>
    ),
    className:
      "bg-black text-white hover:bg-gray-900 active:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100",
  },
};

export function OAuthButton({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
}: OAuthButtonProps) {
  const config = providerConfig[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative flex w-full max-w-[320px] items-center justify-center gap-3",
        "h-[52px] rounded-xl px-4 text-sm font-medium transition-all",
        "hover:opacity-90 active:opacity-80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        config.className
      )}
    >
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : config.icon}
      <span>{config.label}</span>
    </button>
  );
}
