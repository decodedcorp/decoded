"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import DecodedLogo from "@/lib/components/DecodedLogo";

/**
 * Mobile Header Variants
 *
 * Minimal mobile top bar (<md) with logo only.
 * Navigation is handled by MobileNavBar at the bottom.
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
    VariantProps<typeof mobileHeaderVariants> {}

/**
 * MobileHeader Component
 *
 * Mobile-only top bar with DecodedLogo linking to home.
 * Height: 56px. Visible below md breakpoint only.
 * All navigation is in MobileNavBar (bottom bar).
 */
export function MobileHeader({
  variant,
  className,
  ...props
}: MobileHeaderProps) {
  return (
    <header
      className={cn(mobileHeaderVariants({ variant }), className)}
      style={{ height: "56px" }}
      {...props}
    >
      <div className="w-full px-2 h-full flex items-center">
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
      </div>
    </header>
  );
}
