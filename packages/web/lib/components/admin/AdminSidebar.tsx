"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  FileText,
  ScanSearch,
  DollarSign,
  GitBranch,
  Server,
  Sparkles,
  Star,
  LogOut,
  Users,
  Image,
  MapPin,
  CheckCircle,
  Mic2,
  Tag,
  UsersRound,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/authStore";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

type SidebarEntry = NavItem | NavGroup;

function isNavGroup(entry: SidebarEntry): entry is NavGroup {
  return "items" in entry;
}

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/editorial-candidates", label: "Editorial", icon: Sparkles },
  { href: "/admin/picks", label: "Decoded Pick", icon: Star },
  {
    label: "Seed Pipeline",
    items: [
      { href: "/admin/seed/candidates", label: "Candidates", icon: Users },
      { href: "/admin/seed/post-images", label: "Post Images", icon: Image },
      { href: "/admin/seed/post-spots", label: "Post Spots", icon: MapPin },
      { href: "/admin/review", label: "Review Queue", icon: CheckCircle },
    ],
  },
  {
    label: "Entities",
    items: [
      { href: "/admin/entities/artists", label: "Artists", icon: Mic2 },
      { href: "/admin/entities/brands", label: "Brands", icon: Tag },
      {
        href: "/admin/entities/group-members",
        label: "Groups",
        icon: UsersRound,
      },
    ],
  },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
  { href: "/admin/ai-audit", label: "AI Audit", icon: ScanSearch },
  { href: "/admin/ai-cost", label: "AI Cost", icon: DollarSign },
  { href: "/admin/pipeline-logs", label: "Pipeline Logs", icon: GitBranch },
  { href: "/admin/server-logs", label: "Server Logs", icon: Server },
  { href: "/admin/monitoring", label: "Monitoring", icon: Activity },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
}

function NavLink({
  item,
  pathname,
  onClose,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2",
        active
          ? "bg-gray-800 text-white border-blue-500 font-medium"
          : "text-gray-400 border-transparent hover:bg-gray-800/60 hover:text-gray-200"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
}

/**
 * AdminSidebar - Dark theme sidebar for admin navigation
 *
 * Width: 220px (compact, maximizes content area)
 * Theme: Dark (bg-gray-900) with light text
 * Features: Active route detection, logout, back-to-app link, grouped nav sections
 */
export function AdminSidebar({
  isOpen,
  onClose,
  adminName,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[220px] bg-gray-900 text-gray-100 flex flex-col z-50",
          "transition-transform duration-200 ease-in-out",
          // Mobile: hidden by default, shown when open
          // Desktop: always visible
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo / Title area */}
        <div className="px-4 py-5 border-b border-gray-800 flex-shrink-0">
          <p className="text-sm font-semibold text-white tracking-wide mb-2">
            Decoded Admin
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            onClick={onClose}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to App
          </Link>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 py-4 overflow-y-auto"
          aria-label="Admin navigation"
        >
          <ul className="space-y-0.5 px-2">
            {SIDEBAR_ENTRIES.map((entry, idx) => {
              if (isNavGroup(entry)) {
                return (
                  <li key={entry.label} className="mt-4 first:mt-0">
                    <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                      {entry.label}
                    </p>
                    <ul className="space-y-0.5">
                      {entry.items.map((item) => (
                        <li key={item.href}>
                          <NavLink
                            item={item}
                            pathname={pathname}
                            onClose={onClose}
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={entry.href}>
                  <NavLink item={entry} pathname={pathname} onClose={onClose} />
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: User + Logout */}
        <div className="px-4 py-4 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2 truncate" title={adminName}>
            {adminName}
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
