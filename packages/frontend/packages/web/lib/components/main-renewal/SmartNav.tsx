"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import Link from "next/link";
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
import { useVtonStore } from "@/lib/stores/vtonStore";
import DecodedLogo from "@/lib/components/DecodedLogo";
import { useAuthStore, selectIsAdmin } from "@/lib/stores/authStore";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/request/upload", label: "Upload", isUpload: true },
  { href: "/lab", label: "Lab" },
] as const;

interface SmartNavProps {
  className?: string;
}

/**
 * SmartNav -- Full-featured dark-theme header for the renewed main page.
 *
 * Mirrors DesktopHeader layout (Logo | Nav | Actions) with:
 * - Dark theme colors (explicit, not CSS variables)
 * - Scroll-responsive hide/show via GSAP
 * - Transparent at top, blurred dark bg once scrolled
 */
export function SmartNav({ className }: SmartNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const [isAtTop, setIsAtTop] = useState(true);

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

  // Scroll-responsive hide/show
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const direction = currentY > lastScrollY.current ? "down" : "up";

        if (currentY < 50) {
          setIsAtTop(true);
          gsap.to(nav, { y: 0, duration: 0.3, ease: "power2.out" });
        } else {
          setIsAtTop(false);

          if (direction === "down" && currentY > 100) {
            gsap.to(nav, { y: -100, duration: 0.3, ease: "power2.in" });
          } else if (direction === "up") {
            gsap.to(nav, { y: 0, duration: 0.3, ease: "power2.out" });
          }
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";

  const openVton = useVtonStore((s) => s.open);

  const handleUploadClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/request/upload");
  };

  // On home: transparent at top, blurred on scroll
  // On other pages: always solid dark bg
  const bgClass = isHome
    ? isAtTop
      ? "bg-[#050505]/60 backdrop-blur-sm border-b border-transparent"
      : "bg-[#050505]/80 backdrop-blur-md border-b border-white/5"
    : "bg-[#050505] border-b border-white/5";

  return (
    <header
      ref={navRef}
      className={[
        "fixed top-0 left-0 right-0 z-50 hidden md:flex",
        "items-center justify-between px-6 md:px-8",
        "transition-colors duration-300",
        bgClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ height: "72px" }}
    >
      {/* Left: Logo */}
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

      {/* Right: Nav links + Search + Auth */}
      <div className="flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const linkClass = [
            "text-xs tracking-[0.2em] uppercase transition-colors",
            isActive ? "text-white" : "text-white/60 hover:text-white",
          ].join(" ");

          if ("isUpload" in item && item.isUpload) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={handleUploadClick}
                className={linkClass}
              >
                {item.label}
              </button>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          );
        })}

        {/* Try On */}
        <button
          type="button"
          onClick={openVton}
          className="flex items-center gap-1.5 rounded-lg bg-[#eafd67]/10 px-3 py-1.5 text-xs tracking-[0.1em] uppercase text-[#eafd67] transition-colors hover:bg-[#eafd67]/20"
        >
          <Sparkles className="h-3 w-3" />
          Try On
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-white/15" />

        {/* Search */}
        <button
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4 text-white/60" />
        </button>

        {/* Admin link */}
        {user && isAdmin && (
          <Link
            href="/admin"
            className="p-1.5 rounded-md opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Admin Panel"
          >
            <Shield className="h-4 w-4 text-white/60" />
          </Link>
        )}

        {/* Auth UI */}
        {user ? (
          <>
            <button
              className="relative p-1.5 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-white/60" />
              <span
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500"
                aria-hidden="true"
              />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="User menu"
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                <span className="text-xs font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </button>

              {dropdownOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-white/10 bg-[#1a1a1a] shadow-lg py-1 z-50"
                >
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link
                    href="/profile?tab=activity"
                    role="menuitem"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Activity className="h-4 w-4" /> Activity
                  </Link>
                  <Link
                    href="/profile?tab=settings"
                    role="menuitem"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <div className="border-t border-white/10 my-1" />
                  <button
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false);
                      useAuthStore.getState().logout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left text-red-400 hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="text-xs tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
