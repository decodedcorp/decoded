"use client";

import type { GridItemSpot } from "./types";

interface QuickPeekCardProps {
  spots: GridItemSpot[];
  visible: boolean;
}

/**
 * Quick Peek card — shows list of detected items on hover.
 * Matches the design: dark card with brand/name/price rows.
 */
export function QuickPeekCard({ spots, visible }: QuickPeekCardProps) {
  if (spots.length === 0) return null;

  return (
    <div
      className="absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 z-30"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(-50%) translateX(${visible ? 0 : -8}px)`,
      }}
    >
      <div
        className="px-4 py-3 rounded-lg min-w-[200px] max-w-[260px]"
        style={{
          background: "rgba(15, 15, 15, 0.92)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(234,253,103,0.12)",
        }}
      >
        {/* Header */}
        <p
          className="text-[11px] font-semibold tracking-[0.12em] mb-2 pb-1.5"
          style={{
            color: "rgba(255,255,255,0.9)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Quick Peek
        </p>

        {/* Items list */}
        <div className="flex flex-col gap-1.5">
          {spots.slice(0, 4).map((spot, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-white/50 uppercase tracking-wider truncate">
                  {spot.brand}
                </p>
                <p className="text-[11px] text-white/80 leading-tight truncate">
                  {spot.label}
                </p>
              </div>
              {spot.price && (
                <p className="text-[11px] font-medium text-[#eafd67] whitespace-nowrap flex-shrink-0">
                  {spot.price}
                </p>
              )}
            </div>
          ))}
        </div>

        {spots.length > 4 && (
          <p className="text-[9px] text-white/30 mt-2">
            +{spots.length - 4} more items
          </p>
        )}
      </div>
    </div>
  );
}
