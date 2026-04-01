"use client";

import { forwardRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * RankingItem Variants
 *
 * Displays rank changes with arrow icons and numeric values.
 * Used in LeaderItem, profile pages, and standalone rank displays.
 *
 * @see docs/design-system/decoded.pen
 */
export const rankingItemVariants = cva(
  "inline-flex items-center font-medium transition-colors",
  {
    variants: {
      size: {
        // Small: For embedding in LeaderItem
        sm: "gap-0.5 text-xs",
        // Medium: Default standalone display
        md: "gap-1 text-sm",
        // Large: Profile page feature display
        lg: "gap-1.5 text-base font-semibold",
      },
      direction: {
        up: "text-green-600 dark:text-green-400",
        down: "text-red-600 dark:text-red-400",
        neutral: "text-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      direction: "neutral",
    },
  }
);

export interface RankingItemProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof rankingItemVariants> {
  /**
   * Direction of rank change
   */
  direction: "up" | "down" | "neutral";
  /**
   * Numeric value of rank change (absolute value)
   */
  value: number;
  /**
   * Size variant
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
}

/**
 * RankingItem Component
 *
 * Displays rank changes with directional arrow and numeric value.
 * Shows actual numbers (not percentages) with brand colors for direction.
 *
 * @example
 * // Rank increased by 5
 * <RankingItem direction="up" value={5} />
 *
 * @example
 * // Rank decreased by 12
 * <RankingItem direction="down" value={12} />
 *
 * @example
 * // No rank change
 * <RankingItem direction="neutral" value={0} />
 *
 * @example
 * // Large size for profile page
 * <RankingItem direction="up" value={15} size="lg" />
 */
export const RankingItem = forwardRef<HTMLDivElement, RankingItemProps>(
  ({ direction, value, size = "md", className, ...props }, ref) => {
    // Icon size based on size variant
    const iconSize =
      size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5";

    // Icon based on direction
    const Icon =
      direction === "up"
        ? TrendingUp
        : direction === "down"
          ? TrendingDown
          : Minus;

    // Format value with sign
    const formattedValue =
      direction === "up"
        ? `+${value}`
        : direction === "down"
          ? `-${value}`
          : value === 0
            ? "0"
            : "—";

    return (
      <div
        ref={ref}
        className={cn(rankingItemVariants({ size, direction }), className)}
        {...props}
      >
        <Icon className={iconSize} />
        <span>{formattedValue}</span>
      </div>
    );
  }
);

RankingItem.displayName = "RankingItem";
