"use client";

import { memo } from "react";
import { Loader2 } from "lucide-react";
import { useSearchStore } from "@decoded/shared";
import type {
  SearchResponse,
  GroupedSearchResults,
} from "@decoded/shared/types/search";
import { PeopleResultSection } from "./PeopleResultSection";
import { MediaResultSection } from "./MediaResultSection";
import { ItemResultSection } from "./ItemResultSection";
import { EmptySearchState } from "./EmptySearchState";

interface SearchResultsProps {
  data?: SearchResponse;
  groupedData?: GroupedSearchResults;
  isLoading?: boolean;
  isError?: boolean;
  query: string;
}

/**
 * Search results container
 *
 * Features:
 * - Shows results based on active tab
 * - Loading state
 * - Empty state
 * - Error state
 */
export const SearchResults = memo(function SearchResults({
  data,
  groupedData,
  isLoading,
  isError,
  query,
}: SearchResultsProps) {
  const activeTab = useSearchStore((s) => s.activeTab);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state (no query)
  if (!query || query.length < 2) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Enter at least 2 characters to search
      </div>
    );
  }

  // Empty state (no results)
  if (!data || data.data.length === 0) {
    return <EmptySearchState query={query} />;
  }

  // Render based on active tab
  switch (activeTab) {
    case "all":
      return (
        <AllTabResults groupedData={groupedData} data={data} query={query} />
      );
    case "people":
      return (
        <PeopleTabResults people={groupedData?.people || []} query={query} />
      );
    case "media":
      return <MediaTabResults media={groupedData?.media || []} query={query} />;
    case "items":
      return <ItemsTabResults items={groupedData?.items || []} query={query} />;
    default:
      return null;
  }
});

// ============================================================
// Tab-specific Result Views
// ============================================================

interface AllTabResultsProps {
  groupedData?: GroupedSearchResults;
  data?: SearchResponse;
  query: string;
}

const AllTabResults = memo(function AllTabResults({
  groupedData,
  query,
}: AllTabResultsProps) {
  if (!groupedData) {
    return <EmptySearchState query={query} />;
  }

  const { people, media, items } = groupedData;
  const hasAnyResults =
    people.length > 0 || media.length > 0 || items.length > 0;

  if (!hasAnyResults) {
    return <EmptySearchState query={query} />;
  }

  return (
    <div className="py-4">
      <PeopleResultSection people={people} maxItems={3} showSeeAll />
      <MediaResultSection media={media} maxItems={3} showSeeAll />
      <ItemResultSection items={items} maxItems={6} showSeeAll />
    </div>
  );
});

interface PeopleTabResultsProps {
  people: SearchResultItem[];
  query: string;
}

import type { SearchResultItem } from "@decoded/shared/types/search";
import { PersonResultCard } from "./PersonResultCard";

const PeopleTabResults = memo(function PeopleTabResults({
  people,
  query,
}: PeopleTabResultsProps) {
  if (people.length === 0) {
    return <EmptySearchState query={query} type="people" />;
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {people.map((person) => (
          <PersonResultCard
            key={person.id}
            person={person}
            highlight={person.highlight?.artist_name}
          />
        ))}
      </div>
    </div>
  );
});

interface MediaTabResultsProps {
  media: SearchResultItem[];
  query: string;
}

import { MediaResultCard } from "./MediaResultCard";

const MediaTabResults = memo(function MediaTabResults({
  media,
  query,
}: MediaTabResultsProps) {
  if (media.length === 0) {
    return <EmptySearchState query={query} type="media" />;
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item) => (
          <MediaResultCard
            key={item.id}
            media={item}
            highlight={item.highlight?.title}
          />
        ))}
      </div>
    </div>
  );
});

interface ItemsTabResultsProps {
  items: SearchResultItem[];
  query: string;
}

const ItemsTabResults = memo(function ItemsTabResults({
  items,
  query,
}: ItemsTabResultsProps) {
  if (items.length === 0) {
    return <EmptySearchState query={query} type="items" />;
  }

  return (
    <div className="py-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {items.map((item) => (
          <ItemThumbnail key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
});

// Import ItemThumbnail from ItemResultSection for reuse
import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

const ItemThumbnail = memo(function ItemThumbnail({
  item,
}: {
  item: SearchResultItem;
}) {
  const imageUrl = item.thumbnail_url || item.image_url;
  const alt = item.product_name || item.brand || "Item";

  return (
    <Link
      href={`/post/${item.id}`}
      className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>
      )}

      {(item.brand || item.product_name) && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <div className="text-white truncate">
            {item.brand && (
              <p className="text-[10px] font-medium uppercase tracking-wide">
                {item.brand}
              </p>
            )}
            {item.product_name && (
              <p className="text-xs truncate">{item.product_name}</p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
});
