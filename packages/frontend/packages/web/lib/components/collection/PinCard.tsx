"use client";

import Image from "next/image";
import type { Pin } from "@/lib/stores/collectionStore";

interface PinCardProps {
  pin: Pin;
  onSelect: (id: string) => void;
}

export function PinCard({ pin, onSelect }: PinCardProps) {
  return (
    <button
      onClick={() => onSelect(pin.id)}
      className="group w-full text-left rounded-xl overflow-hidden bg-card border border-border/30 hover:border-border/60 transition-all hover:shadow-lg"
    >
      {/* Image with dynamic aspect ratio */}
      <div
        className="relative w-full overflow-hidden"
        style={{ paddingBottom: `${pin.aspectRatio * 100}%` }}
      >
        <Image
          src={pin.imageUrl}
          alt={pin.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Accent strip */}
        {pin.accentColor && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ backgroundColor: pin.accentColor }}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-medium line-clamp-2 leading-snug">
          {pin.title}
        </p>
        {pin.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pin.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
