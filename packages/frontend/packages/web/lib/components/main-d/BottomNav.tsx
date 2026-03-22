"use client";

import Link from "next/link";
import { ShoppingBag, LayoutGrid, User, ShoppingCart } from "lucide-react";

const NAV_ITEMS: {
  href: string;
  icon: typeof ShoppingBag;
  label: string;
  active?: boolean;
}[] = [
  { href: "/", icon: ShoppingBag, label: "SHOP" },
  { href: "/lab/main-d", icon: LayoutGrid, label: "CANVAS", active: true },
  { href: "/profile", icon: User, label: "ABOUT" },
  { href: "/", icon: ShoppingCart, label: "CART" },
];

/**
 * Sticker-style bottom navigation — tape/label aesthetic.
 * White background with black text, matching the reference collage nav.
 */
export function BottomNav() {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] pb-[env(safe-area-inset-bottom)]">
      <nav
        className="flex items-center rounded-sm overflow-hidden"
        style={{
          background: "#f5f5f0",
          border: "2.5px solid #222",
          boxShadow:
            "4px 4px 0 rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.1) inset",
        }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label, active }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-2 py-3.5 px-5 md:px-7 transition-colors duration-150"
            style={{
              color: active ? "#fff" : "#222",
              background: active ? "#111" : "transparent",
              fontFamily: "'Courier New', monospace",
              fontSize: "clamp(13px, 1.6vw, 16px)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRight: "1.5px solid #ccc",
            }}
          >
            <Icon className="h-5 w-5 md:h-5 md:w-5" strokeWidth={2} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
