"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import type { MagazineIssue } from "./types";
import { IssuePreviewCard } from "./IssuePreviewCard";

interface IssueSpineProps {
  issue: MagazineIssue;
  isActive: boolean;
  onSelect: (id: string | null) => void;
}

/** CSS texture patterns layered on spine background (no external images). */
const TEXTURE_VARIANTS = [
  // matte: subtle horizontal noise lines
  `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)`,
  // fabric: cross-hatch at 45deg and -45deg
  `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 5px), repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.03) 4px, rgba(255,255,255,0.03) 5px)`,
  // leather: vertical grain with darker base
  `repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)`,
] as const;

const NEON_COLOR = "#eafd67";
const NEON_GLOW =
  "0 0 8px rgba(234,253,103,0.6), 0 0 20px rgba(234,253,103,0.3)";

/**
 * 3D textured spine with neon numbering and pop+flip GSAP animation.
 * On activation, spine pops out and a cover panel flips open to reveal preview content.
 */
export function IssueSpine({ issue, isActive, onSelect }: IssueSpineProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const coverPanelRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Texture variant based on issue number
  const textureIdx = issue.issue_number % 3;
  const texture = TEXTURE_VARIANTS[textureIdx];
  const isLeather = textureIdx === 2;

  // Pop + Flip GSAP timeline
  useEffect(() => {
    if (!spineRef.current || !coverPanelRef.current) return;

    // Kill previous timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    if (isActive) {
      const tl = gsap.timeline();

      // 1. Pop spine out
      tl.to(spineRef.current, {
        z: 80,
        rotateY: -5,
        duration: 0.3,
        ease: "back.out(1.7)",
      });

      // 2. Flip cover panel open (from edge-on to facing viewer)
      tl.fromTo(
        coverPanelRef.current,
        { rotateY: -90, opacity: 0 },
        {
          rotateY: 0,
          opacity: 1,
          duration: 0.4,
          ease: "power3.out",
        },
        0.15 // overlap with spine pop
      );

      timelineRef.current = tl;
    } else {
      const tl = gsap.timeline();

      // Reverse: close cover panel
      tl.to(coverPanelRef.current, {
        rotateY: -90,
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      });

      // Retract spine
      tl.to(
        spineRef.current,
        {
          rotateY: -15,
          z: 0,
          duration: 0.3,
          ease: "power2.out",
        },
        0.1
      );

      timelineRef.current = tl;
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [isActive]);

  const handleClick = useCallback(() => {
    onSelect(isActive ? null : issue.id);
  }, [isActive, issue.id, onSelect]);

  const handleMouseEnter = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      onSelect(issue.id);
    }, 200);
  }, [issue.id, onSelect]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Labels
  const volumeLabel = `Vol.${String(issue.issue_number).padStart(2, "0")}`;
  const truncatedTitle =
    issue.title.length > 20 ? issue.title.slice(0, 20) + "..." : issue.title;
  const firstKeyword =
    issue.theme_keywords && issue.theme_keywords.length > 0
      ? issue.theme_keywords[0]
      : null;

  // Spine background: texture layer on top of accent color
  const spineBackground = isLeather
    ? `${texture}, linear-gradient(180deg, ${issue.theme_palette.accent}, ${darken(issue.theme_palette.accent, 15)})`
    : `${texture}, linear-gradient(180deg, ${issue.theme_palette.accent}, ${issue.theme_palette.accent})`;

  return (
    <div
      ref={wrapperRef}
      className="relative flex-shrink-0"
      style={{
        perspective: "600px",
        zIndex: isActive ? 50 : 1,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Spine element */}
      <div
        ref={spineRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative w-[64px] md:w-[78px] h-[170px] md:h-[210px] rounded-sm cursor-pointer"
        style={{
          backgroundImage: spineBackground,
          transform: "rotateY(-15deg) translateZ(0px)",
          transformStyle: "preserve-3d",
          willChange: "transform",
          boxShadow: isActive
            ? `0 0 20px ${issue.theme_palette.accent}40, 0 0 8px ${NEON_COLOR}30`
            : "2px 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {/* Vertical text on spine */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-3 px-1 overflow-hidden">
          {/* Vol number - neon accent */}
          <span
            className="text-sm md:text-base font-black tracking-widest"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              color: NEON_COLOR,
              textShadow: NEON_GLOW,
            }}
          >
            {volumeLabel}
          </span>

          {/* Title - palette primary */}
          <span
            className="text-[7px] md:text-[8px] font-medium leading-tight"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              color: issue.theme_palette.primary,
              opacity: 0.8,
            }}
          >
            {truncatedTitle}
          </span>

          {/* Theme keyword at bottom */}
          {firstKeyword && (
            <span
              className="text-[6px] md:text-[7px] uppercase font-semibold tracking-wider"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                color: NEON_COLOR,
                opacity: 0.5,
              }}
            >
              {firstKeyword}
            </span>
          )}
        </div>
      </div>

      {/* Cover panel (flips open to reveal preview) */}
      <div
        ref={coverPanelRef}
        className="absolute top-0 left-full w-[180px] md:w-[200px] h-[170px] md:h-[210px] bg-[#111] border-l border-[#eafd67]/20 rounded-r-lg overflow-hidden"
        style={{
          transformOrigin: "left center",
          transform: "rotateY(-90deg)",
          opacity: 0,
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          boxShadow: "4px 4px 16px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IssuePreviewCard
          issue={issue}
          inline
          onOpen={() => {
            console.log("[Collection] Open issue:", issue.id);
          }}
          onDelete={() => {
            console.log("[Collection] Delete issue:", issue.id);
          }}
        />
      </div>
    </div>
  );
}

/** Simple hex color darken utility (no external deps). */
function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(
    0,
    ((num >> 16) & 0xff) - Math.round(255 * (percent / 100))
  );
  const g = Math.max(
    0,
    ((num >> 8) & 0xff) - Math.round(255 * (percent / 100))
  );
  const b = Math.max(0, (num & 0xff) - Math.round(255 * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
