"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";

/**
 * Background "DECODED" watermark typography.
 *
 * - 3 rows edge-to-edge across viewport width
 * - Thin serif, gray fill
 * - Uses SVG text with textLength to guarantee full-width stretch
 */
export function DecodedTypography() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const rows = containerRef.current.querySelectorAll(".typo-row");

    const ctx = gsap.context(() => {
      gsap.from(rows, {
        opacity: 0,
        y: 30,
        duration: 1.4,
        stagger: 0.2,
        ease: "power2.out",
      });

      rows.forEach((row, i) => {
        gsap.to(row, {
          x: i % 2 === 0 ? -15 : 15,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex flex-col justify-center">
        {[0, 1, 2].map((i) => (
          <svg
            key={i}
            className="typo-row w-full"
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
            style={{ display: "block", overflow: "visible" }}
          >
            <text
              x="500"
              y="170"
              textAnchor="middle"
              textLength="1000"
              lengthAdjust="spacing"
              style={{
                fontSize: "240px",
                fontWeight: 300,
                letterSpacing: "-0.02em",
                fill: "#333",
                fontFamily:
                  "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              }}
            >
              DECODED
            </text>
          </svg>
        ))}
      </div>
    </div>
  );
}
