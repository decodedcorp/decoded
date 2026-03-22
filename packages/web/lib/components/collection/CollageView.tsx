"use client";

import Image from "next/image";
import type { Pin } from "@/lib/stores/collectionStore";

interface CollageViewProps {
  pins: Pin[];
  onSelectPin: (id: string) => void;
}

/**
 * Collage/mosaic layout — alternating large + small tiles.
 * Pattern: 1 large (span 2 cols) + 2 small, repeated.
 */
export function CollageView({ pins, onSelectPin }: CollageViewProps) {
  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">No items for collage</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 px-3 py-3">
      {pins.map((pin, i) => {
        // Every 3rd item (0, 3, 6...) gets a large tile spanning 2 cols
        const isLarge = i % 3 === 0;

        return (
          <button
            key={pin.id}
            onClick={() => onSelectPin(pin.id)}
            className={`relative overflow-hidden rounded-lg group ${
              isLarge ? "col-span-2 row-span-2" : "col-span-1"
            }`}
            style={{ aspectRatio: isLarge ? "1" : "3/4" }}
          >
            <Image
              src={pin.imageUrl}
              alt={pin.title}
              fill
              sizes={isLarge ? "66vw" : "33vw"}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium line-clamp-1">
                {pin.title}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
