"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface GuestButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Loading state - shows spinner instead of text
   */
  isLoading?: boolean;
}

/**
 * GuestButton Component
 *
 * Guest continuation button with transparent background and white border.
 * Matches decoded.pen specs:
 * - Height: 52px
 * - Corner radius: 12px
 * - Background: transparent
 * - Border: 1px #FFFFFF33 (white/20)
 * - Text: #FFFFFFB3 (white/70)
 *
 * @example
 * <GuestButton onClick={() => continueAsGuest()} />
 * <GuestButton isLoading />
 * <GuestButton>Skip for now</GuestButton>
 */
export const GuestButton = forwardRef<HTMLButtonElement, GuestButtonProps>(
  (
    {
      className,
      children = "Continue as Guest",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          "relative flex w-full max-w-[320px] items-center justify-center gap-3",
          "h-[52px] rounded-xl px-4 text-sm font-medium transition-colors",
          "bg-transparent border border-white/20 text-white/70",
          "hover:bg-white/10 hover:text-white",
          "active:bg-white/15",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span>{children}</span>
        )}
      </button>
    );
  }
);

GuestButton.displayName = "GuestButton";
