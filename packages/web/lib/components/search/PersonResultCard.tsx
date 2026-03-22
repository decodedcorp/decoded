"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import type { SearchResultItem } from "@decoded/shared/types/search";

interface PersonResultCardProps {
  person: SearchResultItem;
  highlight?: string;
}

/**
 * Person result card
 *
 * Displays:
 * - Avatar (48x48)
 * - Name (with highlight if matching query)
 * - Category and item count
 * - Navigation arrow
 */
export const PersonResultCard = memo(function PersonResultCard({
  person,
  highlight,
}: PersonResultCardProps) {
  const imageUrl = person.profile_image_url || person.image_url;
  const name = person.artist_name || "Unknown";
  const category = person.category || "Unknown";
  const itemCount = person.item_count ?? 0;

  // Build highlighted name if highlight data exists
  const displayName = highlight ? (
    <span dangerouslySetInnerHTML={{ __html: highlight }} />
  ) : (
    name
  );

  return (
    <Link
      href={`/cast/${person.id}`}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground truncate [&_em]:text-primary [&_em]:not-italic [&_em]:font-semibold">
          {displayName}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {category} • {itemCount} items
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
    </Link>
  );
});
