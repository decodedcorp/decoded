"use client";

import Link from "next/link";
import { Home, Search, BookOpen, User } from "lucide-react";
import { DecodedTypography } from "./DecodedTypography";
import { ScatteredCanvas } from "./ScatteredCanvas";
import { NeonDoodles } from "./NeonDoodles";
import type { MainBPost, MainBItem, MainBRelatedPost } from "./types";

interface MainPageBProps {
  post: MainBPost;
  items: MainBItem[];
  relatedPosts: MainBRelatedPost[];
}

/**
 * Main Page B — "No Section" editorial layout.
 * Uses only crop images (no composite original image).
 *
 * Z-index layers:
 * 0 — Background (dark + noise grain)
 * 1 — DECODED typography watermark
 * 2 — Scattered item crops (left/right)
 * 3 — Center post hero image (cropped fashion photo)
 * 5 — Neon sketch doodles
 * 10 — Bottom navigation bar
 * 20 — Noise grain overlay
 */
export function MainPageB({ post, items, relatedPosts }: MainPageBProps) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: "100vh",
        minHeight: 700,
        background: "#0d0d0d",
      }}
    >
      {/* Layer 1: Background DECODED typography */}
      <DecodedTypography />

      {/* Layer 3: Center post hero image (left half = fashion photo only) */}
      <PostHeroImage post={post} />

      {/* Layer 2: Scattered crop images + related posts (left/right of hero) */}
      <ScatteredCanvas items={items} relatedPosts={relatedPosts} />

      {/* Layer 5: Neon sketch doodles (arrows connecting items) */}
      <NeonDoodles items={items} />

      {/* Bottom navigation bar */}
      <BottomNav />

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}

/* ── Center Post Hero Image (CSS-cropped to show only fashion photo portion) ── */

function PostHeroImage({ post }: { post: MainBPost }) {
  return (
    <div
      className="post-hero-image absolute z-[3]"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "clamp(200px, 30vw, 380px)",
      }}
    >
      <div
        className="relative overflow-hidden rounded-sm"
        style={{ aspectRatio: "3 / 4" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={post.artistName ?? "Post image"}
          className="absolute inset-0 w-full h-full object-cover object-left"
          style={{ filter: "brightness(0.9)" }}
        />
      </div>
      {post.artistName && (
        <p
          className="text-center mt-2 text-[10px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(234, 253, 103, 0.5)" }}
        >
          {post.artistName}
        </p>
      )}
    </div>
  );
}

/* ── Minimal bottom nav ── */

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/explore", icon: BookOpen, label: "Explore" },
  { href: "/profile", icon: User, label: "Profile" },
] as const;

function BottomNav() {
  // RoughJS-inspired hand-drawn rectangle — wobbly on all 4 sides
  // viewBox sized to wrap the nav content (~470x56)
  const W = 470;
  const H = 56;
  const j = 2; // jitter amount
  const roughRect = [
    `M ${2 + j * 0.5},${3 - j * 0.3}`,
    `Q ${W * 0.25 + j},${-j * 0.8} ${W * 0.5 - j},${2 + j * 0.4}`,
    `Q ${W * 0.75 + j},${-j * 0.5} ${W - 3 + j * 0.3},${3 + j * 0.2}`,
    `Q ${W + j * 0.4},${H * 0.3 - j} ${W - 2 - j * 0.3},${H * 0.5 + j}`,
    `Q ${W + j * 0.6},${H * 0.7 + j} ${W - 3 + j * 0.2},${H - 3 - j * 0.4}`,
    `Q ${W * 0.75 - j},${H + j * 0.7} ${W * 0.5 + j},${H - 2 + j * 0.3}`,
    `Q ${W * 0.25 + j},${H + j * 0.5} ${3 - j * 0.3},${H - 3 + j * 0.2}`,
    `Q ${-j * 0.5},${H * 0.7 + j} ${2 + j * 0.4},${H * 0.5 - j}`,
    `Q ${-j * 0.3},${H * 0.3 - j} ${2 + j * 0.5},${3 - j * 0.3}`,
  ].join(" ");
  // Second pass for double-stroke effect
  const roughRect2 = [
    `M ${3 + j},${4 + j * 0.5}`,
    `Q ${W * 0.25 - j},${1 + j} ${W * 0.5 + j},${3 - j * 0.3}`,
    `Q ${W * 0.75 - j},${1 - j * 0.4} ${W - 4 - j * 0.2},${4 + j * 0.3}`,
    `Q ${W - 1 + j * 0.3},${H * 0.3 + j} ${W - 3 + j * 0.2},${H * 0.5 - j * 0.5}`,
    `Q ${W - 1 - j * 0.4},${H * 0.7 - j} ${W - 4 + j},${H - 4 + j * 0.3}`,
    `Q ${W * 0.75 + j},${H - 1 - j * 0.6} ${W * 0.5 - j},${H - 3 - j * 0.2}`,
    `Q ${W * 0.25 - j},${H - 1 + j * 0.4} ${4 + j * 0.3},${H - 4 - j * 0.3}`,
    `Q ${1 + j * 0.4},${H * 0.7 - j} ${3 - j * 0.2},${H * 0.5 + j * 0.5}`,
    `Q ${1 - j * 0.3},${H * 0.3 + j} ${3 + j},${4 + j * 0.5}`,
  ].join(" ");
  // Sketchy vertical dividers between items
  const dividers = [1, 2, 3].map((idx) => {
    const dx = (W / 4) * idx;
    return `M ${dx + j * 0.5},${10 - j * 0.3} Q ${dx - j},${H * 0.5 + j} ${dx + j * 0.4},${H - 10 + j * 0.2}`;
  });

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pb-[env(safe-area-inset-bottom)]">
      <div className="relative">
        {/* Hand-drawn border overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={roughRect}
            fill="none"
            stroke="rgba(234,253,103,0.25)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={roughRect2}
            fill="none"
            stroke="rgba(234,253,103,0.1)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {dividers.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="rgba(234,253,103,0.12)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          ))}
        </svg>

        <nav
          className="relative flex items-center gap-2 px-3"
          style={{
            background: "rgba(16, 16, 16, 0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "4px",
            boxShadow: "0 6px 32px rgba(0, 0, 0, 0.5)",
          }}
        >
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-3 px-6 rounded-md transition-all duration-200 hover:bg-[rgba(234,253,103,0.08)] hover:text-[#eafd67]"
              style={{ color: "rgba(245, 245, 245, 0.6)" }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.18em] font-semibold uppercase">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
