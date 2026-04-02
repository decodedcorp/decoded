"use client";

import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import { useTrendingArtists } from "@/lib/hooks/useTrendingArtists";
import { ArtistProfileCard } from "./ArtistProfileCard";

export function TrendingArtistsSection() {
  const { data: artists, isLoading } = useTrendingArtists(7, 10);
  const setCast = useHierarchicalFilterStore((s) => s.setCast);

  // Hide section when loading or when there are fewer than 3 trending artists
  if (isLoading || !artists || artists.length < 3) {
    return null;
  }

  const handleArtistClick = (name: string) => {
    // Pass artist_name as castId, label, and labelKo for filter display
    setCast(name, name, name);
  };

  return (
    <section className="px-4 py-3 border-b border-border flex-shrink-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Trending Artists
      </p>
      {/* Horizontal scroll container with hidden scrollbar */}
      <div
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
        {artists.map((artist) => (
          <div key={artist.name} className="snap-center">
            <ArtistProfileCard artist={artist} onClick={handleArtistClick} />
          </div>
        ))}
      </div>
    </section>
  );
}
