"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TrendingKeywordItem {
  id: string;
  label: string;
  href: string;
  image?: string;
}

/* ------------------------------------------------------------------ */
/*  FlowingMenuItem                                                    */
/* ------------------------------------------------------------------ */

function FlowingMenuItem({
  item,
  index,
  isFirst,
}: {
  item: TrendingKeywordItem;
  index: number;
  isFirst: boolean;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [repetitions, setRepetitions] = useState(6);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  const findClosestEdge = useCallback(
    (mouseX: number, mouseY: number, width: number, height: number) => {
      const dx = mouseX - width / 2;
      const topEdgeDist = dx * dx + mouseY * mouseY;
      const botDist = mouseY - height;
      const bottomEdgeDist = dx * dx + botDist * botDist;
      return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
    },
    []
  );

  useEffect(() => {
    const calc = () => {
      if (!marqueeInnerRef.current) return;
      const part = marqueeInnerRef.current.querySelector(
        ".marquee-part"
      ) as HTMLElement;
      if (!part || part.offsetWidth === 0) return;
      const needed = Math.ceil(window.innerWidth / part.offsetWidth) + 2;
      setRepetitions(Math.max(6, needed));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [item.label, item.image]);

  const { contextSafe } = useGSAP(
    () => {
      const setup = () => {
        if (!marqueeInnerRef.current) return;
        const part = marqueeInnerRef.current.querySelector(
          ".marquee-part"
        ) as HTMLElement;
        if (!part || part.offsetWidth === 0) return;
        animationRef.current?.kill();
        animationRef.current = gsap.to(marqueeInnerRef.current, {
          x: -part.offsetWidth,
          duration: 12,
          ease: "none",
          repeat: -1,
        });
      };
      // requestAnimationFrame ensures layout is computed before GSAP reads DOM measurements
      const rafId = requestAnimationFrame(setup);
      return () => {
        cancelAnimationFrame(rafId);
        animationRef.current?.kill();
      };
    },
    { scope: itemRef, dependencies: [item.label, item.image, repetitions] }
  );

  const handleMouseEnter = contextSafe(
    (ev: React.MouseEvent<HTMLAnchorElement>) => {
      if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
        return;
      const rect = itemRef.current.getBoundingClientRect();
      const edge = findClosestEdge(
        ev.clientX - rect.left,
        ev.clientY - rect.top,
        rect.width,
        rect.height
      );
      gsap
        .timeline({ defaults: animationDefaults })
        .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
        .set(
          marqueeInnerRef.current,
          { y: edge === "top" ? "101%" : "-101%" },
          0
        )
        .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" }, 0);
    }
  );

  const handleMouseLeave = contextSafe(
    (ev: React.MouseEvent<HTMLAnchorElement>) => {
      if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
        return;
      const rect = itemRef.current.getBoundingClientRect();
      const edge = findClosestEdge(
        ev.clientX - rect.left,
        ev.clientY - rect.top,
        rect.width,
        rect.height
      );
      gsap
        .timeline({ defaults: animationDefaults })
        .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
        .to(
          marqueeInnerRef.current,
          { y: edge === "top" ? "101%" : "-101%" },
          0
        );
    }
  );

  return (
    <div
      ref={itemRef}
      className="flex-1 relative overflow-hidden"
      style={{
        borderTop: isFirst ? "none" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Static label */}
      <Link
        href={item.href}
        className="flex items-center justify-center h-full relative cursor-pointer uppercase no-underline font-semibold text-[3vh] md:text-[3.5vh] text-white/90 tracking-[0.05em]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="text-white/10 text-[2vh] font-mono mr-4 tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {item.label}
      </Link>

      {/* Marquee overlay */}
      <div
        ref={marqueeRef}
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none translate-y-[101%] bg-[#eafd67]"
      >
        <div ref={marqueeInnerRef} className="h-full w-fit flex">
          {[...Array(repetitions)].map((_, idx) => (
            <div
              className="marquee-part flex items-center flex-shrink-0"
              key={idx}
            >
              <span className="whitespace-nowrap uppercase font-semibold text-[3vh] md:text-[3.5vh] leading-[1] px-[1vw] text-[#050505]">
                {item.label}
              </span>
              {item.image && (
                <div
                  className="w-[140px] h-[5vh] mx-[1.5vw] rounded-[40px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TrendingListSection                                                */
/* ------------------------------------------------------------------ */

interface TrendingListSectionProps {
  keywords?: TrendingKeywordItem[];
  /** When true, removes outer padding (used when embedded in a grid) */
  embedded?: boolean;
}

export function TrendingListSection({
  keywords,
  embedded,
}: TrendingListSectionProps) {
  if (!keywords || keywords.length === 0) return null;

  const displayItems = keywords.slice(0, 5);

  return (
    <section
      className={embedded ? "h-full" : "py-16 lg:py-24 px-6 md:px-12 lg:px-20"}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-[2px] bg-[#eafd67]" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 font-sans font-medium">
            Trending
          </h2>
        </div>
        <Link
          href="/explore"
          className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-[#eafd67] transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Flowing menu list */}
      <div
        className="relative rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/[0.06]"
        style={{
          height: embedded ? "calc(100% - 52px)" : "clamp(320px, 50vh, 500px)",
        }}
      >
        <nav className="flex flex-col h-full">
          {displayItems.map((item, index) => (
            <FlowingMenuItem
              key={item.id}
              item={item}
              index={index}
              isFirst={index === 0}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}
