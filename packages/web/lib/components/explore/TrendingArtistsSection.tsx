"use client";

import { useTrendingArtists } from "@/lib/hooks/useTrendingArtists";
import { ArtistProfileCard } from "./ArtistProfileCard";

export function TrendingArtistsSection() {
  const { data: artists, isLoading } = useTrendingArtists(7, 10);

  // Show skeleton placeholder during loading to prevent layout shift
  if (isLoading) {
    return (
      <section className="px-4 py-3 border-b border-border flex-shrink-0 h-[72px] animate-pulse">
        <div className="h-2.5 w-24 bg-muted rounded mb-2" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  // Hide section when there are fewer than 3 trending artists
  if (!artists || artists.length < 3) {
    return null;
  }

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
            <ArtistProfileCard artist={artist} />
          </div>
        ))}
      </div>
    </section>
  );
}
