"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useAuthStore,
  selectIsLoggedIn,
  selectUser,
} from "@/lib/stores/authStore";

const DecodedLogo = dynamic(() => import("@/lib/components/DecodedLogo"), {
  ssr: false,
  loading: () => <span className="font-bold text-[#eafd67] tracking-tight">decoded</span>,
});

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
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const user = useAuthStore(selectUser);

  return (
    <header
      className={cn(mobileHeaderVariants({ variant }), className)}
      style={{ height: "56px" }}
      {...props}
    >
      <div className="w-full px-2 h-full flex items-center justify-between">
        <Link
          href="/"
          className="relative w-48 h-14 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
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

        {/* Auth button */}
        <div className="flex items-center pr-2">
          {isLoggedIn ? (
            <Link href="/profile" aria-label="Profile">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-medium text-white">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full bg-[#eafd67] text-black font-semibold hover:bg-[#d9fc69] transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
