"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Film } from "lucide-react";
import type { SearchResultItem } from "@decoded/shared/types/search";

interface MediaResultCardProps {
  media: SearchResultItem;
  highlight?: string;
}

const MEDIA_TYPE_LABELS: Record<string, string> = {
  drama: "Drama",
  movie: "Movie",
  mv: "MV",
  youtube: "YouTube",
  variety: "Variety",
};

/**
 * Media result card
 *
 * Displays:
 * - Poster (60x80)
 * - Title (with highlight if matching query)
 * - Type, year, and item count
 * - Navigation arrow
 */
export const MediaResultCard = memo(function MediaResultCard({
  media,
  highlight,
}: MediaResultCardProps) {
  const imageUrl = media.poster_url || media.image_url;
  const title = media.media_source?.title || "Unknown";
  const mediaType = media.media_type || media.media_source?.type;
  const typeLabel = mediaType ? MEDIA_TYPE_LABELS[mediaType] || mediaType : "";
  const year = media.year;
  const itemCount = media.item_count ?? 0;

  // Build highlighted title if highlight data exists
  const displayTitle = highlight ? (
    <span dangerouslySetInnerHTML={{ __html: highlight }} />
  ) : (
    title
  );

  // Build subtitle parts
  const subtitleParts = [typeLabel, year, `${itemCount} items`].filter(Boolean);

  return (
    <Link
      href={`/media/${media.id}`}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      {/* Poster */}
      <div className="relative w-[60px] h-[80px] rounded-md overflow-hidden bg-muted flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="60px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate [&_em]:text-primary [&_em]:not-italic [&_em]:font-semibold">
          {displayTitle}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {subtitleParts.join(" • ")}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </Link>
  );
});
