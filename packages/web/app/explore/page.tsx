import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";
import { buildArtistProfileMap } from "@/lib/supabase/queries/warehouse-entities.server";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

function ExploreSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] px-4 pt-20">
      <div className="mx-auto max-w-7xl">
        {/* Search bar skeleton */}
        <div className="mb-8 h-12 w-full animate-pulse rounded-lg bg-white/5" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-white/5"
              style={{ aspectRatio: "3/4" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;

  // Fetch artist/group profile images from warehouse (server-side)
  const artistProfileMap = await buildArtistProfileMap();
  const artistProfiles: Record<
    string,
    { name: string; profileImageUrl: string | null }
  > = {};
  artistProfileMap.forEach((value, key) => {
    artistProfiles[key] = value;
  });

  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreClient
        hasMagazine
        initialQuery={q ?? ""}
        artistProfiles={artistProfiles}
      />
    </Suspense>
  );
}
