"use client";

import { usePathname } from "next/navigation";
import { MobileHeader } from "@/lib/design-system";
import { MobileNavBar } from "./MobileNavBar";
import { SmartNav } from "./main-renewal/SmartNav";

/**
 * ConditionalNav - Renders header-based navigation and mobile nav
 *
 * Hidden on /admin routes (admin has its own sidebar layout).
 *
 * Layout:
 * - Desktop (md+): SmartNav (dark theme, scroll-responsive)
 * - Mobile (<md): MobileHeader at top + MobileNavBar at bottom
 */
export function ConditionalNav() {
  const pathname = usePathname();

  // Hide all main-app navigation on admin, lab/main-b, lab/main-d routes
  if (
    pathname.startsWith("/admin") ||
    pathname === "/lab/main-b" ||
    pathname === "/lab/main-d"
  ) {
    return null;
  }

  return (
    <>
      {/* Desktop Header - visible on md+ */}
      <SmartNav />
      {/* Mobile Header - visible on <md */}
      <MobileHeader />
      {/* Mobile Bottom Nav - preserved */}
      <MobileNavBar />
    </>
  );
}

/**
 * MainContentWrapper - Wrapper for main content area
 *
 * Applies padding for top header and bottom nav per decoded.pen:
 * - pt-14 md:pt-[72px]: Top padding (56px mobile header, 72px desktop header)
 * - pb-16 md:pb-0: Bottom padding (64px mobile nav bar, none on desktop)
 *
 * No padding on /admin routes (admin layout handles its own spacing).
 */
export function MainContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Admin, home, lab/main-b, lab/main-d pages manage their own padding
  if (
    pathname.startsWith("/admin") ||
    pathname === "/" ||
    pathname === "/lab/main-b" ||
    pathname === "/lab/main-d"
  ) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen pt-14 md:pt-[72px] pb-16 md:pb-0">
      {children}
    </main>
  );
}
