/**
 * @deprecated This component is deprecated as of v2-04.
 * Desktop navigation has moved to DesktopHeader.
 * This file is kept for reference during transition.
 * Safe to delete after v2.0 launch.
 *
 * @see packages/web/lib/design-system/desktop-header.tsx
 */

"use client";

import { memo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Compass,
  Search,
  SlidersHorizontal,
  HelpCircle,
  User,
} from "lucide-react";
import DecodedLogo from "./DecodedLogo";
import { SidebarSearchPanel } from "./SidebarSearchPanel";
import { SidebarFilterPanel } from "./SidebarFilterPanel";

interface NavItem {
  id: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  isAction?: boolean;
}

const navItems: NavItem[] = [
  { id: "home", href: "/", icon: Home, label: "Home" },
  { id: "explore", href: "/explore", icon: Compass, label: "Explore" },
  { id: "search", href: "#", icon: Search, label: "Search", isAction: true },
  {
    id: "filter",
    href: "#",
    icon: SlidersHorizontal,
    label: "Filter",
    isAction: true,
  },
  {
    id: "request",
    href: "#",
    icon: HelpCircle,
    label: "Create Request",
    isAction: true,
  },
];

interface NavItemComponentProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

const NavItemComponent = memo(
  ({ item, isActive, onClick }: NavItemComponentProps) => {
    const Icon = item.icon;

    // Reddit-style: minimal, clean design
    const baseClasses =
      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 w-full";
    const activeClasses = isActive
      ? "bg-accent/80 text-foreground font-medium"
      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground";
    const disabledClasses = item.disabled
      ? "opacity-40 cursor-not-allowed"
      : "";

    const content = (
      <>
        <Icon
          className={`h-5 w-5 flex-shrink-0 ${
            isActive ? "stroke-[2]" : "stroke-[1.5]"
          }`}
        />
        <span className="hidden lg:block truncate text-sm">{item.label}</span>
      </>
    );

    if (item.disabled) {
      return (
        <button
          disabled
          className={`${baseClasses} ${disabledClasses}`}
          aria-label={`${item.label} (coming soon)`}
          aria-disabled="true"
        >
          {content}
        </button>
      );
    }

    if (item.isAction && onClick) {
      return (
        <button
          onClick={onClick}
          className={`${baseClasses} ${activeClasses}`}
          aria-label={item.label}
          aria-expanded={isActive}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        className={`${baseClasses} ${activeClasses}`}
        aria-current={isActive ? "page" : undefined}
        aria-label={item.label}
      >
        {content}
      </Link>
    );
  }
);

NavItemComponent.displayName = "NavItemComponent";

/**
 * Sidebar - Reddit-style minimal left navigation
 *
 * @deprecated Use DesktopHeader instead (as of v2-04)
 *
 * Features:
 * - Fixed on left side for desktop/tablet (md+)
 * - Hidden on mobile (<768px)
 * - Collapsed (icons only) on tablet (768-1023px): 56px width
 * - Expanded (icons + text) on desktop (1024px+): 200px width
 * - Clean, minimal design inspired by Reddit
 */
export const Sidebar = memo(() => {
  // Development warning for deprecated component
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[DEPRECATED] Sidebar component is deprecated. Use DesktopHeader instead."
      );
    }
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearchToggle = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    setIsFilterOpen(false); // Close filter when opening search
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleFilterToggle = useCallback(() => {
    setIsFilterOpen((prev) => !prev);
    setIsSearchOpen(false); // Close search when opening filter
  }, []);

  const handleFilterClose = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const handleRequestNavigate = useCallback(() => {
    // Close panels then defer to intercept route for modal vs full-page.
    setIsSearchOpen(false);
    setIsFilterOpen(false);
    router.push("/request/upload");
  }, [router]);

  return (
    <>
      {/* Main Sidebar - Reddit style: clean, minimal */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className="fixed left-0 top-0 h-screen z-50 hidden md:flex flex-col
                   w-14 lg:w-[200px]
                   bg-background
                   transition-[width] duration-200"
      >
        {/* Logo Section - larger logo */}
        <div className="h-20 lg:h-24 flex items-center justify-center lg:justify-start lg:px-3">
          <Link
            href="/"
            className="flex items-center"
            aria-label="decoded home"
          >
            {/* Collapsed: Text "D" - larger */}
            <div className="lg:hidden w-14 h-14 flex items-center justify-center">
              <span className="text-primary text-3xl font-bold font-serif">
                D
              </span>
            </div>
            {/* Expanded: ASCII Logo - larger */}
            <div className="hidden lg:block relative w-44 h-20 overflow-visible">
              <DecodedLogo
                asciiFontSize={3}
                textFontSize={140}
                planeBaseHeight={8}
                enableWaves={false}
                enableHueRotate={false}
              />
            </div>
          </Link>
        </div>

        {/* Navigation Section - minimal spacing */}
        <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.id === "search"
                ? isSearchOpen
                : item.id === "filter"
                  ? isFilterOpen
                  : pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

            const handleClick =
              item.id === "search"
                ? handleSearchToggle
                : item.id === "filter"
                  ? handleFilterToggle
                  : item.id === "request"
                    ? handleRequestNavigate
                    : undefined;

            return (
              <NavItemComponent
                key={item.id}
                item={item}
                isActive={isActive}
                onClick={item.isAction ? handleClick : undefined}
              />
            );
          })}
        </nav>

        {/* Profile Section (Bottom) - no border for cleaner look */}
        <div className="px-2 py-3">
          <NavItemComponent
            item={{
              id: "profile",
              href: "/profile",
              icon: User,
              label: "Profile",
            }}
            isActive={pathname === "/profile"}
          />
        </div>
      </aside>

      {/* Search Panel (Slide out) */}
      <SidebarSearchPanel isOpen={isSearchOpen} onClose={handleSearchClose} />

      {/* Filter Panel (Slide out) */}
      <SidebarFilterPanel isOpen={isFilterOpen} onClose={handleFilterClose} />
    </>
  );
});

Sidebar.displayName = "Sidebar";
