"use client";

import { useRef, useLayoutEffect, useEffect } from "react";
import { gsap } from "gsap";
import type { ScanItem } from "./types";

interface ImageLayerProps {
  photoUrl: string;
  items: ScanItem[];
  onBoxRefsChange?: (map: Partial<Record<string, HTMLDivElement>>) => void;
  mockId?: string;
  shouldAnimate?: boolean;
}

export default function ImageLayer({
  photoUrl,
  items,
  onBoxRefsChange,
  mockId = "1",
  shouldAnimate = false,
}: ImageLayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boxRefs = useRef<Partial<Record<string, HTMLDivElement>>>({});
  const pathRefs = useRef<Partial<Record<string, SVGPathElement>>>({});

  // 박스 ref를 부모로 올려주기
  useLayoutEffect(() => {
    if (!onBoxRefsChange) return;
    onBoxRefsChange(boxRefs.current);
  }, [onBoxRefsChange, items]);

  // SVG 박스 그리기 애니메이션
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current || !svgRef.current) return;
    if (!shouldAnimate) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip animation, show boxes immediately
      items.forEach((item) => {
        const path = pathRefs.current[item.id];
        if (path) {
          gsap.set(path, { strokeDashoffset: 0 });
        }
      });
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const ctx = gsap.context(() => {
      items.forEach((item, index) => {
        const path = pathRefs.current[item.id];
        if (!path) return;

        const box = item.box;
        // Calculate actual pixel dimensions
        const width = (containerRect.width * box.width) / 100;
        const height = (containerRect.height * box.height) / 100;
        const perimeter = 2 * (width + height);

        // Set initial dash array
        gsap.set(path, {
          strokeDasharray: perimeter,
          strokeDashoffset: perimeter,
        });

        // Determine animation direction based on mockId
        let animationConfig: gsap.TweenVars;

        if (mockId === "1") {
          // Mock 1: Top to bottom (clockwise from top-left)
          animationConfig = {
            strokeDashoffset: 0,
            duration: 0.6,
            delay: index * 0.1 + 0.2, // Start after scan line begins
            ease: "power2.out",
          };
        } else if (mockId === "2") {
          // Mock 2: Left to right (clockwise from top-left)
          animationConfig = {
            strokeDashoffset: 0,
            duration: 0.5,
            delay: index * 0.15 + 0.2,
            ease: "power1.inOut",
          };
        } else {
          // Mock 3: Diagonal (start from top-right, draw diagonally)
          const startOffset = perimeter * 0.25; // Start from top-right corner
          gsap.set(path, { strokeDashoffset: startOffset });
          animationConfig = {
            strokeDashoffset: startOffset - perimeter,
            duration: 0.7,
            delay: index * 0.12 + 0.2,
            ease: "power2.inOut",
          };
        }

        gsap.to(path, animationConfig);
      });
    }, containerRef);

    return () => ctx.revert();
  }, [items, mockId, shouldAnimate]);

  // Create SVG path for each box (using percentage coordinates)
  const createBoxPath = (box: ScanItem["box"]): string => {
    const x = box.left;
    const y = box.top;
    const w = box.width;
    const h = box.height;

    // Create rectangle path (clockwise from top-left) using percentage coordinates
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-zinc-900">
      <img
        src={photoUrl}
        alt="scan target"
        className="w-full h-full object-contain opacity-80"
      />

      {/* SVG layer for box drawing animation */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-5"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        role="presentation"
      >
        {items.map((item) => (
          <path
            key={item.id}
            ref={(el) => {
              if (el) {
                pathRefs.current[item.id] = el;
              } else {
                delete pathRefs.current[item.id];
              }
            }}
            d={createBoxPath(item.box)}
            fill="none"
            stroke="#d9fc69"
            strokeWidth="0.3"
            strokeOpacity="0.8"
            className="fs-svg-box"
          />
        ))}
      </svg>

      {/* Original div boxes (for refs and connector calculations) */}
      {items.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) {
              boxRefs.current[item.id] = el;
            } else {
              delete boxRefs.current[item.id];
            }
            // ref 변경 시 부모에 알림
            if (onBoxRefsChange) {
              onBoxRefsChange(boxRefs.current);
            }
          }}
          className="fs-box absolute border-2 border-[#d9fc69]/80 rounded-sm pointer-events-none opacity-0 transition-none"
          style={{
            top: `${item.box.top}%`,
            left: `${item.box.left}%`,
            width: `${item.box.width}%`,
            height: `${item.box.height}%`,
          }}
          aria-hidden="true"
          role="presentation"
        />
      ))}
    </div>
  );
}
