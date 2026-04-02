"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import type { TrendingArtist } from "@/lib/hooks/useTrendingArtists";

interface ArtistProfileCardProps {
  artist: TrendingArtist;
  onClick?: (name: string) => void;
}

export const ArtistProfileCard = memo(function ArtistProfileCard({
  artist,
  onClick,
}: ArtistProfileCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onClick?.(artist.name)}
      className="flex flex-col items-center gap-2 flex-none w-[72px] md:w-[80px] group"
    >
      {/* Circular avatar */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-muted ring-2 ring-transparent group-hover:ring-[var(--mag-accent)] transition-all">
        {!imgError ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            fill
            sizes="64px"
            className="object-cover object-top"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[11px] font-medium text-foreground truncate w-full text-center">
        {artist.name}
      </span>

      {/* Post count */}
      <span className="text-[10px] text-muted-foreground -mt-1">
        {artist.postCount} posts
      </span>
    </button>
  );
});
