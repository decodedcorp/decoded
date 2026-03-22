"use client";

import { useState } from "react";

type SpotDotProps = {
  label: string;
  brand?: string;
  category?: string;
  accentColor?: string;
} & (
  | { mode: "percent"; x: number; y: number }
  | { mode: "pixel"; leftPx: number; topPx: number }
);

/**
 * Spot marker with hover tooltip showing brand, label, category.
 * Use mode="percent" for image-fill layouts, mode="pixel" for object-contain.
 */
export function SpotDot(props: SpotDotProps) {
  const { label, brand, category, accentColor } = props;
  const [hovered, setHovered] = useState(false);
  const dotColor = accentColor || "hsl(var(--primary))";

  const positionStyle =
    props.mode === "percent"
      ? {
          left: `${props.x * 100}%`,
          top: `${props.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }
      : {
          left: `${props.leftPx}px`,
          top: `${props.topPx}px`,
          transform: "translate(-50%, -50%)",
        };

  return (
    <div
      className="absolute z-10 pointer-events-auto cursor-pointer"
      style={positionStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse ring */}
      <span
        className="absolute inset-0 animate-ping rounded-full opacity-30"
        style={{ backgroundColor: dotColor, width: 20, height: 20, margin: -4 }}
      />
      {/* Dot */}
      <span
        className="relative block h-3 w-3 rounded-full border-2 border-white/80 shadow-md transition-transform duration-200"
        style={{
          backgroundColor: dotColor,
          transform: hovered ? "scale(1.4)" : "scale(1)",
        }}
      />
      {/* Tooltip - below dot to avoid clipping by overflow-hidden parent */}
      {hovered && (
        <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-background/95 px-3 py-1.5 text-xs shadow-lg border border-border/50 backdrop-blur-sm pointer-events-none z-[100]">
          {brand && (
            <span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {brand}
            </span>
          )}
          <span className="font-medium">{label}</span>
          {category && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              {category}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
