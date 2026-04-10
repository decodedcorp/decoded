"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { Home, Search, Compass, Upload } from "lucide-react";
import { NavBar, NavItem } from "@/lib/design-system";

interface NavItemConfig {
  id: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  isAction?: boolean;
}

/**
 * Navigation items for 1차 릴리즈: Home, Search, Explore (3 items)
 * Upload/Profile은 추후 추가 예정
 */
const navItems: NavItemConfig[] = [
  { id: "home", href: "/", icon: Home, label: "Home" },
  { id: "search", href: "/search", icon: Search, label: "Search" },
  { id: "upload", href: "/request/upload", icon: Upload, label: "Upload" },
  { id: "explore", href: "/explore", icon: Compass, label: "Explore" },
];

/**
 * MobileNavBar - Bottom navigation bar per decoded.pen spec
 *
 * Design spec:
 * - Height: 64px
 * - 5 items: Home, Search, Request, Feed, Profile
 * - Each item: icon (22px) + label (10px, font-medium)
 * - Background: card color
 * - Padding: 8px 24px
 *
 * Features:
 * - Fixed at bottom on mobile (<768px)
 * - Hidden on desktop (md:hidden)
 * - Active state with primary color
 * - Safe area support for iPhone notch
 * - Request opens modal instead of page navigation
 */
export const MobileNavBar = memo(() => {
  const pathname = usePathname();

  return (
    <NavBar>
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <NavItem
            key={item.id}
            icon={<Icon className="h-[22px] w-[22px]" />}
            label={item.label}
            href={item.href}
            active={isActive}
            disabled={item.disabled}
          />
        );
      })}
    </NavBar>
  );
});

MobileNavBar.displayName = "MobileNavBar";
