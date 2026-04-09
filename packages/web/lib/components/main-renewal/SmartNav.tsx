"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  useAuthStore,
  selectIsLoggedIn,
  selectUser,
  selectProfile,
} from "@/lib/stores/authStore";

const DecodedLogo = dynamic(() => import("@/lib/components/DecodedLogo"), {
  ssr: false,
  loading: () => <span className="font-bold text-[#eafd67] tracking-tight">decoded</span>,
});

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/request/upload", label: "Upload" },
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
  const isLoggedIn = useAuthStore(selectIsLoggedIn);
  const user = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);

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

        {/* Auth: Login / Profile */}
        {isLoggedIn ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
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
          </Link>
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
  );
}
