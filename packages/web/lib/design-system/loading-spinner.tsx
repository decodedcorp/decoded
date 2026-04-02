"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Text to display next to the spinner
   * @default "Loading..."
   */
  text?: string;
}

/**
 * LoadingSpinner Component
 *
 * Pill-shaped loading indicator with spinning icon and text.
 * Matches decoded.pen specs:
 * - Fill: #1F1F1FCC (dark with opacity)
 * - Corner radius: 9999 (pill shape)
 * - Padding: [8, 16] vertical/horizontal
 * - Gap: 8px
 * - Icon: 16px Loader2 with spin animation
 * - Text: 14px Inter medium
 *
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner text="Loading more..." />
 */
export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, text = "Loading...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2",
          "px-4 py-2 rounded-full",
          "bg-neutral-900/80",
          className
        )}
        {...props}
      >
        <Loader2 className="h-4 w-4 animate-spin text-white" />
        <span className="text-sm font-medium text-white">{text}</span>
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";
