"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft } from "lucide-react";
import type { MagazineIssue } from "./types";
import { ShelfRow } from "./ShelfRow";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

interface BookshelfViewFallbackProps {
  issues: MagazineIssue[];
  activeIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
}

/**
 * CSS bookshelf fallback for browsers without WebGL support.
 * Includes the 3D studio unavailability banner and header navigation.
 * Preserves the isometric perspective and GSAP ScrollTrigger animations.
 */
export function BookshelfViewFallback({
  issues,
  activeIssueId,
  onSelectIssue,
}: BookshelfViewFallbackProps) {
  const router = useRouter();
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
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-mag-bg">
      {/* WebGL unavailability banner */}
      <p className="text-center text-mag-text/40 text-xs py-2 border-b border-white/5">
        3D studio requires a modern browser. Showing classic view.
      </p>

      {/* Header — Back button + title + count badge */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#050505]/80 backdrop-blur-sm border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
          <span className="text-xs tracking-wider">Back</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-white/90">
          My Collection
        </span>

        <div
          className="flex items-center justify-center w-6 h-6 rounded-full bg-[#eafd67] text-[#050505] text-xs font-bold"
          aria-label={`${issues.length} issues`}
        >
          {issues.length}
        </div>
      </header>

      {/* Bookshelf */}
      <div
        ref={containerRef}
        className="w-full px-4 py-8 md:px-8"
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
    </div>
  );
}
