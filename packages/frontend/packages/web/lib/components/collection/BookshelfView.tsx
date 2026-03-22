"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MagazineIssue } from "./types";
import { ShelfRow } from "./ShelfRow";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

interface BookshelfViewProps {
  issues: MagazineIssue[];
  activeIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
}

/**
 * 3D isometric bookshelf container with enhanced perspective and GSAP ScrollTrigger.
 * Look-down perspective with rotateX tilt for isometric feel.
 */
export function BookshelfView({
  issues,
  activeIssueId,
  onSelectIssue,
}: BookshelfViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Group issues into rows
  const rows: MagazineIssue[][] = [];
  const perRow = 4;
  for (let i = 0; i < issues.length; i += perRow) {
    rows.push(issues.slice(i, i + perRow));
  }

  useEffect(() => {
    if (!containerRef.current || rows.length === 0) return;

    const ctx = gsap.context(() => {
      rowRefs.current.forEach((rowEl) => {
        if (!rowEl) return;

        gsap.fromTo(
          rowEl,
          { translateY: 30, opacity: 0 },
          {
            translateY: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: rowEl,
              start: "top 90%",
              once: true,
            },
          }
        );
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [rows.length]);

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen bg-gradient-to-b from-[#0d0d0d] to-mag-bg px-4 py-8 md:px-8"
      style={{
        perspective: isDesktop ? "1600px" : "1000px",
        transformStyle: "preserve-3d",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectIssue(null);
        }
      }}
    >
      <div
        className="max-w-3xl mx-auto space-y-2"
        style={{
          transform: "rotateX(8deg) translateY(-20px)",
          transformStyle: "preserve-3d",
        }}
      >
        {rows.map((rowIssues, idx) => (
          <ShelfRow
            key={idx}
            ref={(el) => {
              rowRefs.current[idx] = el;
            }}
            issues={rowIssues}
            activeIssueId={activeIssueId}
            onSelectIssue={onSelectIssue}
          />
        ))}
      </div>
    </div>
  );
}
