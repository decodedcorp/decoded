"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  useAuthStore,
  selectIsLoggedIn,
  selectUser,
  selectProfile,
  selectLogout,
} from "@/lib/stores/authStore";
import { RequestModal } from "@/lib/components/request/RequestModal";

const DecodedLogo = dynamic(() => import("@/lib/components/DecodedLogo"), {
  ssr: false,
  loading: () => (
    <span className="font-bold text-[#eafd67] tracking-tight">decoded</span>
  ),
});

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
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
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const user = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);
  const logout = useAuthStore(selectLogout);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    setIsProfileOpen(false);
    await logout();
    router.push("/");
  }, [logout, router]);

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

  // On home: transparent at top, blurred on scroll
  // On other pages: always solid dark bg
  const bgClass = isHome
    ? isAtTop
      ? "bg-[#050505]/60 backdrop-blur-sm border-b border-transparent"
      : "bg-[#050505]/80 backdrop-blur-md border-b border-white/5"
    : "bg-[#050505] border-b border-white/5";

  return (
    <>
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
          className="relative w-48 h-16 flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
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

        {/* Right: Nav links + Search */}
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

            return (
              <Link key={item.href} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            );
          })}

          {/* Upload — opens modal without URL change */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className={[
              "text-xs tracking-[0.2em] uppercase transition-colors",
              isUploadModalOpen
                ? "text-white"
                : "text-white/60 hover:text-white",
            ].join(" ")}
          >
            Upload
          </button>

          {/* Auth: Login / Profile Dropdown */}
          {isLoggedIn ? (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={profile?.display_name || user.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                    width={28}
                    height={28}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-medium text-white">
                    {(user?.name?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.display_name || user?.name}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      @{profile?.username || user?.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      프로필 보기
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsUploadModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      업로드
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs tracking-[0.2em] uppercase px-4 py-2 rounded-full bg-[#eafd67] text-black font-semibold hover:bg-[#d9fc69] transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Upload Modal — rendered outside header to avoid z-index issues */}
      <RequestModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </>
  );
}
