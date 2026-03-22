"use client";

import type { Pin } from "@/lib/stores/collectionStore";
import { PinCard } from "./PinCard";

interface PinGridProps {
  pins: Pin[];
  onSelectPin: (id: string) => void;
}

/**
 * Pinterest-style masonry grid using CSS columns.
 * 2 columns on mobile, 3 on tablet, 4 on desktop.
 */
export function PinGrid({ pins, onSelectPin }: PinGridProps) {
  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">No pins yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Save items to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 px-3 py-3">
      {pins.map((pin) => (
        <div key={pin.id} className="break-inside-avoid mb-3">
          <PinCard pin={pin} onSelect={onSelectPin} />
        </div>
      ))}
    </div>
  );
}
