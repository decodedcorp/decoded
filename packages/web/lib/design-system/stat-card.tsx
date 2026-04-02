"use client";

import { forwardRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";
import { formatStatValue } from "@/lib/utils/format";

/**
 * StatCard Component
 *
 * Displays statistics in visually consistent card format.
 * Used in dashboard layouts, profile analytics, and metrics displays.
 *
 * Features:
 * - Formatted numeric value with K/M abbreviations
 * - Optional trend indicator with percentage
 * - Optional click handler for interactive cards
 * - Responsive text sizing
 *
 * @see docs/design-system/decoded.pen
 */

export interface StatCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick"
> {
  /** Display label for the statistic */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Optional trend indicator */
  trend?: {
    /** Direction of trend */
    direction: "up" | "down" | "neutral";
    /** Percentage value (e.g., 15 for +15%) */
    value: number;
  };
  /** Optional click handler (makes card interactive) */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatCard Component
 *
 * Display formatted statistics with optional trend indicators.
 * If onClick provided, card becomes interactive with hover state.
 *
 * @example
 * <StatCard
 *   label="Total Views"
 *   value={1234567}
 *   trend={{ direction: "up", value: 15 }}
 * />
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, trend, onClick, className, ...props }, ref) => {
    const isClickable = !!onClick;

    // Trend icon and color based on direction
    const trendIcon =
      trend?.direction === "up" ? (
        <TrendingUp className="w-4 h-4" />
      ) : trend?.direction === "down" ? (
        <TrendingDown className="w-4 h-4" />
      ) : null;

    const trendColorClass =
      trend?.direction === "up"
        ? "text-green-600 dark:text-green-400"
        : trend?.direction === "down"
          ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground";

    // Format trend value
    const trendText = trend
      ? `${trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}${Math.abs(trend.value)}%`
      : null;

    return (
      <Card
        ref={ref}
        variant="default"
        size="md"
        interactive={isClickable}
        className={cn(
          "overflow-hidden",
          isClickable && "cursor-pointer",
          className
        )}
        onClick={onClick}
        role={isClickable ? "button" : undefined}
        aria-label={
          isClickable ? `${label}: ${formatStatValue(value)}` : undefined
        }
        {...props}
      >
        <CardContent className="flex flex-col gap-2 p-4 md:p-6">
          {/* Label */}
          <p className="text-xs md:text-sm text-muted-foreground font-medium">
            {label}
          </p>

          {/* Value and Trend */}
          <div className="flex items-end justify-between gap-2">
            {/* Value */}
            <span className="text-2xl md:text-3xl font-bold text-foreground">
              {formatStatValue(value)}
            </span>

            {/* Trend Indicator */}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  trendColorClass
                )}
              >
                {trendIcon}
                <span>{trendText}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

/**
 * StatCardSkeleton Component
 *
 * Loading state for StatCard with shimmer effect.
 * Matches StatCard structure for seamless loading transitions.
 *
 * @example
 * <StatCardSkeleton />
 */
export interface StatCardSkeletonProps {
  className?: string;
}

export const StatCardSkeleton = ({ className }: StatCardSkeletonProps) => {
  return (
    <Card
      variant="default"
      size="md"
      className={cn("overflow-hidden", className)}
    >
      <CardContent className="flex flex-col gap-2 p-4 md:p-6">
        {/* Label Placeholder */}
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />

        {/* Value Placeholder */}
        <div className="h-8 md:h-9 w-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
};
