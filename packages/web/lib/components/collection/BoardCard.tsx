"use client";

import Image from "next/image";
import type { Board } from "@/lib/stores/collectionStore";

interface BoardCardProps {
  board: Board;
}

/**
 * Board preview card with 2x2 cover mosaic.
 */
export function BoardCard({ board }: BoardCardProps) {
  const images = board.coverImages.slice(0, 4);
  // Fill to 4 slots with placeholder
  while (images.length < 4) {
    images.push("");
  }

  return (
    <div className="group rounded-xl overflow-hidden bg-card border border-border/30 hover:border-border/60 transition-all hover:shadow-lg cursor-pointer">
      {/* 2x2 mosaic grid */}
      <div className="grid grid-cols-2 gap-px bg-border/20 aspect-square">
        {images.map((url, i) => (
          <div key={i} className="relative bg-muted overflow-hidden">
            {url ? (
              <Image
                src={url}
                alt=""
                fill
                sizes="(max-width: 640px) 25vw, 15vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}
          </div>
        ))}
      </div>

      {/* Board info */}
      <div className="p-3">
        <p className="text-sm font-semibold">{board.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {board.pinCount} pins
        </p>
      </div>
    </div>
  );
}
