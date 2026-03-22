"use client";

import { memo } from "react";
import { Search } from "lucide-react";
import { useSearchNavigation } from "../../hooks/useSearchURLSync";
import { usePopularKeywords } from "../../hooks/useSearch";

interface EmptySearchStateProps {
  query: string;
  type?: "all" | "people" | "media" | "items";
}

const TYPE_MESSAGES: Record<string, string> = {
  all: "No results found",
  people: "No people found",
  media: "No media found",
  items: "No items found",
};

/**
 * Empty search state component
 *
 * Features:
 * - "No results" message
 * - Helpful suggestions
 * - Popular keyword chips for quick searches
 */
export const EmptySearchState = memo(function EmptySearchState({
  query,
  type = "all",
}: EmptySearchStateProps) {
  const { navigateToSearch } = useSearchNavigation();
  const { data: keywordsData } = usePopularKeywords();
  const keywords = keywordsData?.keywords || [];

  const message = TYPE_MESSAGES[type] || TYPE_MESSAGES.all;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Message */}
      <h3 className="text-lg font-medium text-foreground mb-2">
        {message} for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Try different keywords or check your spelling. You can also browse our
        popular searches below.
      </p>

      {/* Popular Keywords */}
      {keywords.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {keywords.slice(0, 8).map(({ keyword }) => (
              <button
                key={keyword}
                onClick={() => navigateToSearch(keyword)}
                className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 text-foreground rounded-full transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
