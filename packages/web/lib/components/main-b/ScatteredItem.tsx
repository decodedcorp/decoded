"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QuickPeekCard } from "./QuickPeekCard";
import type { GridItemData, ScatteredPosition } from "./types";

interface ScatteredItemProps {
  item: GridItemData;
  position: ScatteredPosition;
  index: number;
}

/**
 * Single scattered fashion image.
 * No text labels — only image with spot markers on hover and Quick Peek card.
 */
export function ScatteredItem({ item, position, index }: ScatteredItemProps) {
  const [hovered, setHovered] = useState(false);
  const spots = item.spots || [];

  return (
    <div
      className="scattered-item absolute group"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: hovered ? 20 : position.zIndex,
        transform: `rotate(${position.rotate}deg)`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={item.link} className="block relative">
        {/* Image */}
        <div
          className="relative overflow-hidden rounded-sm transition-transform duration-500 ease-out"
          style={{
            transform: hovered ? "scale(1.05)" : "scale(1)",
            aspectRatio:
              item.aspectRatio && item.aspectRatio > 0
                ? `1 / ${item.aspectRatio}`
                : "3 / 4",
          }}
        >
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="(max-width:768px) 30vw, 20vw"
            className="object-cover"
            style={{
              filter: hovered ? "brightness(1.05)" : "brightness(0.85)",
              transition: "filter 0.5s ease",
            }}
          />

          {/* Spot markers — small dots at item positions */}
          {spots.map((spot, si) => (
            <div
              key={si}
              className="absolute transition-all duration-300"
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: "translate(-50%, -50%)",
                opacity: hovered ? 1 : 0.4,
              }}
            >
              {/* Pulsing ring */}
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  width: 16,
                  height: 16,
                  marginLeft: -8,
                  marginTop: -8,
                  background: "rgba(234,253,103,0.3)",
                  opacity: hovered ? 0.6 : 0,
                }}
              />
              {/* Dot */}
              <div
                className="w-2 h-2 rounded-full border"
                style={{
                  background: hovered
                    ? "rgba(234,253,103,0.9)"
                    : "rgba(255,255,255,0.5)",
                  borderColor: hovered
                    ? "rgba(234,253,103,0.5)"
                    : "rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          ))}
        </div>
      </Link>

      {/* Quick Peek card on hover — shows all items */}
      {spots.length > 0 && <QuickPeekCard spots={spots} visible={hovered} />}
    </div>
  );
}
