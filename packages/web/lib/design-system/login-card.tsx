"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { OAuthButton, type OAuthProvider } from "./oauth-button";
import { GuestButton } from "./guest-button";
import { Divider } from "./divider";

export interface LoginCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Callback when OAuth login button is clicked
   */
  onOAuthLogin: (provider: OAuthProvider) => void;
  /**
   * Callback when guest login button is clicked
   */
  onGuestLogin: () => void;
  /**
   * Provider currently loading (shows spinner on that button)
   */
  loadingProvider?: OAuthProvider | null;
  /**
   * Whether any login operation is in progress
   */
  isLoading?: boolean;
  /**
   * Error message to display
   */
  error?: string | null;
}

/**
 * LoginCard Component
 *
 * Complete login card with glassmorphism effect, OAuth buttons, divider,
 * and guest button. Matches decoded.pen specs:
 * - Fill: #FFFFFF0D (white 5% opacity)
 * - Corner radius: 16px
 * - Background blur: 24px
 * - Padding: [32, 24, 16, 24] (top, right, bottom, left)
 * - Logo: "decoded" in Playfair Display 30px bold #d9fc69
 *
 * @example
 * <LoginCard
 *   onOAuthLogin={(provider) => handleLogin(provider)}
 *   onGuestLogin={() => handleGuest()}
 *   loadingProvider={currentProvider}
 *   error={error}
 * />
 */
export const LoginCard = forwardRef<HTMLDivElement, LoginCardProps>(
  (
    {
      className,
      onOAuthLogin,
      onGuestLogin,
      loadingProvider = null,
      isLoading = false,
      error = null,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-sm rounded-2xl",
          "bg-white/5 backdrop-blur-xl",
          "px-6 pt-8 pb-4",
          className
        )}
        {...props}
      >
        {/* Logo & Title */}
        <div className="space-y-2 text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            <span
              className="text-[#d9fc69]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              decoded
            </span>
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
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col items-center space-y-3 mb-6">
          <OAuthButton
            provider="kakao"
            onClick={() => onOAuthLogin("kakao")}
            isLoading={loadingProvider === "kakao"}
            disabled={isLoading}
          />
          <OAuthButton
            provider="google"
            onClick={() => onOAuthLogin("google")}
            isLoading={loadingProvider === "google"}
            disabled={isLoading}
          />
          <OAuthButton
            provider="apple"
            onClick={() => onOAuthLogin("apple")}
            isLoading={loadingProvider === "apple"}
            disabled={isLoading}
          />
        </div>

        {/* Divider */}
        <div className="mb-6">
          <Divider />
        </div>

        {/* Guest Button */}
        <div className="flex justify-center mb-6">
          <GuestButton
            onClick={onGuestLogin}
            disabled={isLoading}
            isLoading={loadingProvider === null && isLoading}
          />
        </div>

        {/* Footer */}
        <div className="text-center pb-4">
          <p className="text-xs text-white/40">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/60 transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/60 transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    );
  }
);

LoginCard.displayName = "LoginCard";
