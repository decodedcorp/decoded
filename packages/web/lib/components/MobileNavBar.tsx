"use client";

import { memo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, BookOpen, PlusCircle, User } from "lucide-react";
import { NavBar, NavItem } from "@/lib/design-system";
import { RequestModal } from "./request/RequestModal";
import { useAuthStore } from "@/lib/stores/authStore";

interface NavItemConfig {
  id: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  isAction?: boolean;
}

/**
 * Navigation items. Feed 비활성화: 네비에서만 제거, /feed 경로·코드는 유지.
 * Home, Search, + (Request), Profile (4 items)
 */
const navItems: NavItemConfig[] = [
  { id: "home", href: "/", icon: Home, label: "Home" },
  { id: "search", href: "/search", icon: Search, label: "Search" },
  { id: "editorial", href: "/editorial", icon: BookOpen, label: "Editorial" },
  {
    id: "request",
    href: "#",
    icon: PlusCircle,
    label: "Upload",
    isAction: true,
  },
  { id: "profile", href: "/profile", icon: User, label: "Profile" },
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
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const handleRequestOpen = useCallback(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsRequestModalOpen(true);
  }, [user, router]);

  const handleRequestClose = useCallback(() => {
    setIsRequestModalOpen(false);
  }, []);

  return (
    <>
      <NavBar>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <NavItem
              key={item.id}
              icon={<Icon className="h-[22px] w-[22px]" />}
              label={item.label}
              href={item.isAction ? undefined : item.href}
              onClick={item.isAction ? handleRequestOpen : undefined}
              active={isActive}
              disabled={item.disabled}
            />
          );
        })}
      </NavBar>

      {/* Request Modal */}
      <RequestModal isOpen={isRequestModalOpen} onClose={handleRequestClose} />
    </>
  );
});

MobileNavBar.displayName = "MobileNavBar";
