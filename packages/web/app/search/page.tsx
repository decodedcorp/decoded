import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPageClient } from "./SearchPageClient";

export const metadata: Metadata = {
  title: "Search | Decoded",
  description: "Search for people, media, and items on Decoded",
};

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const tab = typeof params.tab === "string" ? params.tab : "all";

  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageClient initialQuery={query} initialTab={tab} />
    </Suspense>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search input skeleton */}
        <div className="h-12 bg-muted rounded-lg animate-pulse mb-6" />

        {/* Tabs skeleton */}
        <div className="flex gap-4 border-b border-border mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-20 bg-muted rounded animate-pulse" />
          ))}
        </div>

        {/* Results skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
