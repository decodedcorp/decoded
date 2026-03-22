"use client";

import { useEffect, useRef, type FC, type ReactNode } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import type { ItemCardData } from "./ItemCard";

/* ------------------------------------------------------------------ */
/*  GridMotion — mouse-reactive tilted grid background                 */
/* ------------------------------------------------------------------ */

interface GridMotionProps {
  items?: (string | ReactNode)[];
  gradientColor?: string;
}

const GridMotion: FC<GridMotionProps> = ({
  items = [],
  gradientColor = "#050505",
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseXRef = useRef<number>(
    typeof window !== "undefined" ? window.innerWidth / 2 : 0
  );

  const totalItems = 28;
  const defaultItems = Array.from(
    { length: totalItems },
    (_, i) => `Item ${i + 1}`
  );
  const combinedItems =
    items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
    };

    const updateMotion = () => {
      const maxMoveAmount = 300;
      const baseDuration = 0.8;
      const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          const moveAmount =
            ((mouseXRef.current / window.innerWidth) * maxMoveAmount -
              maxMoveAmount / 2) *
            direction;

          gsap.to(row, {
            x: moveAmount,
            duration:
              baseDuration + inertiaFactors[index % inertiaFactors.length],
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      });
    };

    const removeLoop = gsap.ticker.add(updateMotion);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      removeLoop();
    };
  }, []);

  return (
    <div ref={gridRef} className="h-full w-full overflow-hidden">
      <section
        className="w-full h-full overflow-hidden relative flex items-center justify-center"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="gap-3 flex-none relative w-[150vw] h-[150vh] grid grid-rows-4 grid-cols-1 rotate-[-15deg] origin-center z-[2]">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-3 grid-cols-7"
              style={{ willChange: "transform" }}
              ref={(el) => {
                if (el) rowRefs.current[rowIndex] = el;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];
                return (
                  <div key={itemIndex} className="relative">
                    <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#111] flex items-center justify-center">
                      {typeof content === "string" &&
                      content.startsWith("http") ? (
                        <div
                          className="w-full h-full bg-cover bg-center absolute inset-0"
                          style={{ backgroundImage: `url(${content})` }}
                        />
                      ) : (
                        <div className="p-4 text-center z-[1] text-white/20 text-sm font-medium">
                          {content}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  GridMotionSection — "STYLE RADAR" with item images                 */
/* ------------------------------------------------------------------ */

interface GridMotionSectionProps {
  items?: ItemCardData[];
}

export function GridMotionSection({ items }: GridMotionSectionProps) {
  // Build grid items: mix item images + accent text labels
  const gridItems: (string | ReactNode)[] = [];

  if (items && items.length > 0) {
    // Fill 28 slots with item images + brand name text alternating
    for (let i = 0; i < 28; i++) {
      const item = items[i % items.length];
      if (i % 3 === 0 && item.imageUrl) {
        // Image slot
        gridItems.push(item.imageUrl);
      } else if (i % 3 === 1) {
        // Brand text slot
        gridItems.push(
          <span
            key={`brand-${i}`}
            className="text-[#eafd67]/30 text-xs uppercase tracking-[0.2em] font-bold"
          >
            {item.brand}
          </span>
        );
      } else if (item.imageUrl) {
        gridItems.push(item.imageUrl);
      } else {
        gridItems.push(
          <span
            key={`name-${i}`}
            className="text-white/10 text-xs uppercase tracking-wider"
          >
            {item.name}
          </span>
        );
      }
    }
  }

  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Grid Motion background */}
      <GridMotion items={gridItems} gradientColor="#050505" />

      {/* Radial vignette overlay */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 30%, #050505 100%)",
        }}
      />

      {/* Center overlay content */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center pointer-events-none">
        {/* Accent line */}
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-[1.5px] bg-[#eafd67]" />
          <p className="text-[10px] md:text-xs uppercase tracking-[0.35em] text-[#eafd67]/80 font-sans">
            Style Radar
          </p>
          <span className="w-10 h-[1.5px] bg-[#eafd67]" />
        </div>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center leading-[1.1] mb-3">
          Discover
          <br />
          <span className="bg-gradient-to-r from-white via-[#eafd67] to-white bg-clip-text text-transparent">
            What&apos;s Hot
          </span>
        </h2>

        <p
          className="text-sm md:text-base text-white/50 text-center max-w-sm mb-8 font-light"
          style={{ textShadow: "0 1px 20px rgba(0,0,0,0.7)" }}
        >
          AI가 감지한 트렌딩 아이템을 탐색하세요
        </p>

        <Link
          href="/explore"
          className="pointer-events-auto relative px-8 py-3 text-sm font-semibold tracking-[0.15em] uppercase
            text-black rounded-full bg-[#eafd67] hover:bg-white
            transition-all duration-500 ease-out
            shadow-[0_0_30px_rgba(234,253,103,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          Explore Items
        </Link>
      </div>
    </section>
  );
}
