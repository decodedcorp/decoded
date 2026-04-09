import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;

  if (q) {
    const title = `"${q}" — Search Results`;
    const description = `Search results for "${q}" on Decoded — discover styles, outfits, and fashion items.`;
    return {
      title,
      description,
      alternates: {
        canonical: `${SITE_URL}/explore?q=${encodeURIComponent(q)}`,
      },
      openGraph: { title, description },
      robots: { index: false, follow: true }, // Don't index search result pages
    };
  }

  return {
    title: "Explore Styles",
    description:
      "Explore trending styles, outfits, and fashion items — AI-powered style search engine.",
    alternates: { canonical: `${SITE_URL}/explore` },
  };
}

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

  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreClient initialQuery={q ?? ""} />
    </Suspense>
  );
}
