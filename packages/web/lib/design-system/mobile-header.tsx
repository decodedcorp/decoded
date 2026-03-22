"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Search, SlidersHorizontal, Bell, Shield } from "lucide-react";
import DecodedLogo from "@/lib/components/DecodedLogo";
import { useAuthStore, selectIsAdmin } from "@/lib/stores/authStore";

/**
 * Mobile Header Variants
 *
 * Compact header for mobile viewports (<md) with logo and utility icons.
 * Part of the Desktop Infrastructure phase - complements DesktopHeader.
 *
 * @see .planning/phases/v2-04-desktop-infrastructure/CONTEXT.md
 * @see docs/design-system/decoded.pen
 */
export const mobileHeaderVariants = cva(
  "fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md md:hidden",
  {
    variants: {
      variant: {
        default: "bg-background/80",
        transparent: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface MobileHeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof mobileHeaderVariants> {
  onSearchClick?: () => void;
  onFilterClick?: () => void;
  showFilter?: boolean;
}

/**
 * MobileHeader Component
 *
 * Mobile-only header with:
 * - Left: DecodedLogo (links to home)
 * - Right: Search icon + optional Filter icon
 *
 * Height: 56px (--header-height-mobile)
 * Visible: Below md breakpoint only
 *
 * Refactored from lib/components/Header.tsx with cleaner props interface.
 */
export function MobileHeader({
  variant,
  onSearchClick,
  onFilterClick,
  showFilter = true,
  className,
  ...props
}: MobileHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore(selectIsAdmin);

  return (
    <header
      className={cn(mobileHeaderVariants({ variant }), className)}
      style={{ height: "56px" }}
      {...props}
    >
      <div className="w-full px-2 h-full flex items-center justify-between gap-2">
        {/* Left Section: Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link
            href="/"
            className="relative w-48 h-14 flex items-center justify-center -ml-4 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <DecodedLogo
              asciiFontSize={3}
              textFontSize={200}
              planeBaseHeight={12}
              enableWaves={false}
              enableHueRotate={true}
            />
          </Link>
        </div>

        {/* Right Section: Search + Notifications + Filter */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Search Icon Button */}
          <button
            onClick={onSearchClick}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Notification Bell with badge */}
          <button
            className="relative p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"
              aria-hidden="true"
            />
          </button>

          {/* Admin Panel Link - only visible to admin users */}
          {user && isAdmin && (
            <Link
              href="/admin"
              className="p-2 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Admin Panel"
              title="Admin Panel"
            >
              <Shield className="h-5 w-5 text-muted-foreground" />
            </Link>
          )}

          {/* Filter Icon Button */}
          {showFilter && (
            <button
              onClick={onFilterClick}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Filter"
            >
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
