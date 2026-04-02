"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  User,
  Settings,
  Activity,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import DecodedLogo from "@/lib/components/DecodedLogo";
import { useAuthStore, selectIsAdmin } from "@/lib/stores/authStore";
import { useVtonStore } from "@/lib/stores/vtonStore";
import { useState, useRef, useEffect } from "react";

/**
 * Desktop Header Variants
 *
 * Sticky header for desktop viewports (md+) with navigation, search, and user area.
 * Part of the Desktop Infrastructure phase - replaces Sidebar navigation on desktop.
 *
 * @see .planning/phases/v2-04-desktop-infrastructure/CONTEXT.md
 * @see docs/design-system/decoded.pen
 */
export const desktopHeaderVariants = cva(
  "fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md transition-all hidden md:flex",
  {
    variants: {
      variant: {
        default: "bg-background/95 border-b border-border",
        transparent: "bg-transparent border-b border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface DesktopHeaderProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof desktopHeaderVariants> {
  onSearchClick?: () => void;
}

/**
 * Navigation items configuration.
 * Feed 비활성화: 네비에서만 제거, /feed 경로·코드는 유지.
 */
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/editorial", label: "Editorial" },
  { href: "/request/upload", label: "Upload", isUpload: true },
  { href: "/lab", label: "Lab" },
] as const;

/**
 * DesktopHeader Component
 *
 * Desktop-only header with:
 * - Left: DecodedLogo (links to home)
 * - Center: Navigation links (Home, Discover, Create)
 * - Right: Search icon, conditional auth UI (Login button or Avatar + Notification)
 *
 * Height: 64px (--header-height-desktop)
 * Visible: md breakpoint and above only
 */
export function DesktopHeader({
  variant,
  onSearchClick,
  className,
  ...props
}: DesktopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore(selectIsAdmin);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const openVton = useVtonStore((s) => s.open);

  const handleUploadClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/request/upload");
  };

  return (
    <header
      className={cn(desktopHeaderVariants({ variant }), className)}
      style={{ height: "72px" }}
      {...props}
    >
      <div className="w-full flex items-center justify-between h-full px-6 md:px-8">
        {/* Left Section: Logo - flex-1 for equal width with right */}
        <div className="flex-1 flex items-center">
          <Link
            href="/"
            className="relative w-48 h-16 flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <DecodedLogo
              asciiFontSize={4}
              textFontSize={200}
              planeBaseHeight={12}
              enableWaves={false}
              enableHueRotate={false}
            />
          </Link>
        </div>

        {/* Center Section: Navigation - True center with flex-none */}
        <nav
          className="flex-none flex items-center gap-8"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const baseClass = cn(
              "text-sm transition-colors",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground font-medium"
            );
            if ("isUpload" in item && item.isUpload) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={handleUploadClick}
                  className={baseClass}
                >
                  {item.label}
                </button>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={baseClass}>
                {item.label}
              </Link>
            );
          })}
          {/* Try On */}
          <button
            type="button"
            onClick={openVton}
            className="flex items-center gap-1.5 rounded-lg bg-[#eafd67]/10 px-3 py-1.5 text-xs font-medium text-[#eafd67] transition-colors hover:bg-[#eafd67]/20"
          >
            <Sparkles className="h-3 w-3" />
            Try On
          </button>
        </nav>

        {/* Right Section: Search + Auth UI - flex-1 for equal width with left */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {/* Search Icon Button */}
          <button
            onClick={onSearchClick}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Admin Panel Link - only visible to admin users */}
          {user && isAdmin && (
            <Link
              href="/admin"
              className="p-2 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Admin Panel"
              title="Admin Panel"
            >
              <Shield className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}

          {/* Conditional Auth UI */}
          {user ? (
            <div className="flex items-center gap-3">
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

              {/* User Avatar with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                >
                  <span className="text-sm font-medium text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg py-1 z-50"
                  >
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/profile?tab=activity"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Activity className="h-4 w-4" />
                      Activity
                    </Link>
                    <Link
                      href="/profile?tab=settings"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        useAuthStore.getState().logout();
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-destructive hover:bg-accent transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
