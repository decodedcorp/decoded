"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

const SIZE = 380;
const CX = SIZE / 2;
const OUTER_R = 182;
const INNER_R = 125;
const TEXT_R = 153;

interface NavItem {
  label: string;
  href: string;
  icon: string;
  /** Angle in degrees (0 = top, clockwise) */
  angle: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "HOME", href: "/", icon: "◎", angle: -45 },
  { label: "EXPLORE", href: "/explore", icon: "⊘", angle: 15 },
  { label: "UPLOAD", href: "/request/upload", icon: "✎", angle: 75 },
  { label: "TRY ON", href: "/lab/vton", icon: "✦", angle: 135 },
  { label: "SEARCH", href: "/search", icon: "⊕", angle: 195 },
  { label: "PROFILE", href: "/profile", icon: "⊛", angle: 255 },
];

function polarXY(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + Math.cos(rad) * radius,
    y: CX + Math.sin(rad) * radius,
  };
}

export function CircularNav() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ringRef.current) return;

    gsap.to(ringRef.current, {
      rotation: 360,
      duration: 80,
      ease: "none",
      repeat: -1,
    });

    return () => {
      gsap.killTweensOf(ringRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: SIZE, height: SIZE }}
    >
      {/* SVG rings */}
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="inner-neon" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <mask id="donut-mask">
            <circle cx={CX} cy={CX} r={OUTER_R} fill="white" />
            <circle cx={CX} cy={CX} r={INNER_R} fill="black" />
          </mask>
        </defs>

        {/* Dark donut band */}
        <circle
          cx={CX}
          cy={CX}
          r={OUTER_R}
          fill="rgba(10,10,10,0.85)"
          mask="url(#donut-mask)"
        />

        {/* Outer ring stroke */}
        <circle
          cx={CX}
          cy={CX}
          r={OUTER_R}
          fill="none"
          stroke="rgba(234,253,103,0.25)"
          strokeWidth="1"
        />

        {/* Inner glow */}
        <circle
          cx={CX}
          cy={CX}
          r={INNER_R}
          fill="none"
          stroke="#eafd67"
          strokeWidth="1.5"
          opacity={0.7}
          filter="url(#inner-neon)"
        />

        {/* Inner ring stroke */}
        <circle
          cx={CX}
          cy={CX}
          r={INNER_R}
          fill="none"
          stroke="rgba(234,253,103,0.4)"
          strokeWidth="1"
        />
      </svg>

      {/* Rotating nav labels */}
      <div
        ref={ringRef}
        className="absolute inset-0"
        style={{ transformOrigin: "center center" }}
      >
        {NAV_ITEMS.map((item) => {
          const { x, y } = polarXY(item.angle, TEXT_R);
          // Counter-rotate text so it follows the arc tangent
          const textRotation = item.angle;

          return (
            <Link
              key={`${item.label}-${item.angle}`}
              href={item.href}
              className="absolute flex items-center gap-1.5 hover:text-white transition-colors duration-200"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "rgba(234,253,103,0.85)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
