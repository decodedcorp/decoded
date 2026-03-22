"use client";

import { memo } from "react";
import { Users, ChevronRight } from "lucide-react";
import { useSearchStore } from "@decoded/shared";
import type { SearchResultItem } from "@decoded/shared/types/search";
import { PersonResultCard } from "./PersonResultCard";

interface PeopleResultSectionProps {
  people: SearchResultItem[];
  maxItems?: number;
  showSeeAll?: boolean;
}

/**
 * People search results section
 *
 * Features:
 * - Section header with icon
 * - List of PersonResultCards
 * - "See all" link to switch to People tab
 */
export const PeopleResultSection = memo(function PeopleResultSection({
  people,
  maxItems = 3,
  showSeeAll = true,
}: PeopleResultSectionProps) {
  const setActiveTab = useSearchStore((s) => s.setActiveTab);

  if (people.length === 0) {
    return null;
  }

  const displayedPeople = people.slice(0, maxItems);
  const hasMore = people.length > maxItems;

  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">People</h2>
        </div>
        {showSeeAll && hasMore && (
          <button
            onClick={() => setActiveTab("people")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            See all
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-1 bg-accent/20 rounded-lg">
        {displayedPeople.map((person) => (
          <PersonResultCard
            key={person.id}
            person={person}
            highlight={person.highlight?.artist_name}
          />
        ))}
      </div>
    </section>
  );
});
