"use client";

import { memo } from "react";
import { Film, ChevronRight } from "lucide-react";
import { useSearchStore } from "@decoded/shared";
import type { SearchResultItem } from "@decoded/shared/types/search";
import { MediaResultCard } from "./MediaResultCard";

interface MediaResultSectionProps {
  media: SearchResultItem[];
  maxItems?: number;
  showSeeAll?: boolean;
}

/**
 * Media search results section
 *
 * Features:
 * - Section header with icon
 * - List of MediaResultCards
 * - "See all" link to switch to Media tab
 */
export const MediaResultSection = memo(function MediaResultSection({
  media,
  maxItems = 3,
  showSeeAll = true,
}: MediaResultSectionProps) {
  const setActiveTab = useSearchStore((s) => s.setActiveTab);

  if (media.length === 0) {
    return null;
  }

  const displayedMedia = media.slice(0, maxItems);
  const hasMore = media.length > maxItems;

  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Media</h2>
        </div>
        {showSeeAll && hasMore && (
          <button
            onClick={() => setActiveTab("media")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            See all
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-1 bg-accent/20 rounded-lg">
        {displayedMedia.map((item) => (
          <MediaResultCard
            key={item.id}
            media={item}
            highlight={item.highlight?.title}
          />
        ))}
      </div>
    </section>
  );
});
