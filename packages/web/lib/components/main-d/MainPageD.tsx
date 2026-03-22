"use client";

import { computeScatterPosition } from "./scatter";
import { PolaroidCard } from "./PolaroidCard";
import { BottomNav } from "./BottomNav";
import { NeonDoodles } from "./NeonDoodles";
import { RoughCanvasOverlay } from "./RoughCanvas";
import type { MainDPost } from "./types";

interface MainPageDProps {
  posts: MainDPost[];
  trendingKeywords: string[];
}

export function MainPageD({
  posts,
  trendingKeywords: _trendingKeywords,
}: MainPageDProps) {
  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        height: "calc(100dvh - 44px)",
        minHeight: 600,
        background: "#0a0a0a",
      }}
    >
      {/* ── DECODED ransom-note title ── */}
      <div className="relative z-[35] flex items-center justify-center gap-[1px] md:gap-[3px] pt-4 md:pt-6 pb-1">
        {"DECODED".split("").map((char, i) => {
          const fonts = [
            "'Impact', 'Arial Black', sans-serif",
            "'Georgia', 'Times New Roman', serif",
            "'Courier New', monospace",
            "'Impact', 'Arial Black', sans-serif",
            "'Georgia', serif",
            "'Courier New', monospace",
            "'Impact', 'Arial Black', sans-serif",
          ];
          const isOutline = i === 1 || i === 3 || i === 5;
          return (
            <span
              key={i}
              className="inline-block font-black"
              style={{
                fontSize: "clamp(48px, 11vw, 110px)",
                lineHeight: 0.9,
                fontFamily: fonts[i],
                fontStyle: i === 4 ? "italic" : "normal",
                transform: `rotate(${(i - 3) * 1.8}deg) translateY(${i % 2 === 0 ? -2 : 3}px)`,
                color: isOutline ? "transparent" : "#fff",
                WebkitTextStroke: isOutline ? "2.5px #fff" : undefined,
                textShadow: !isOutline
                  ? "4px 4px 0 rgba(0,0,0,0.6)"
                  : undefined,
                letterSpacing: "-0.02em",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* ── Collage band ── */}
      <div
        className="relative w-full"
        style={{ height: "calc(100dvh - 44px - 180px)", overflow: "visible" }}
      >
        <RoughCanvasOverlay />
        <NeonDoodles />

        {posts.map((post, index) => {
          const position = computeScatterPosition(post.id, index, posts.length);
          return (
            <PolaroidCard
              key={`${post.id}-${index}`}
              imageUrl={post.imageUrl}
              alt={post.artistName ?? `Post ${index + 1}`}
              position={position}
              priority={index < 4}
            />
          );
        })}
      </div>

      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none z-[26]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      <BottomNav />
    </div>
  );
}
