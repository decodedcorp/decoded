"use client";

/**
 * Paper texture grain overlay — fixed fullscreen SVG noise filter.
 */
export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ opacity: 0.04 }}
    >
      <svg width="100%" height="100%">
        <filter id="main-c-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#main-c-grain)" />
      </svg>
    </div>
  );
}
