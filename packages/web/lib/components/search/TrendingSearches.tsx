"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendingSearchesProps {
  onSelect: (query: string) => void;
  className?: string;
}

const MOCK_TRENDING = [
  "NewJeans airport fashion",
  "Jennie Chanel",
  "IVE Wonyoung outfit",
  "aespa Karina",
  "LE SSERAFIM Coachella",
  "BLACKPINK Lisa",
  "Lovely Runner style",
  "K-Drama accessories",
  "Minji streetwear",
  "Rose Saint Laurent",
  "Winter aespa makeup",
  "Haerin casual",
];

export function TrendingSearches({
  onSelect,
  className,
}: TrendingSearchesProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-orange-500" />
        <h2 className="text-sm font-medium text-foreground">
          Trending Searches
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {MOCK_TRENDING.map((term) => (
          <button
            key={term}
            onClick={() => onSelect(term)}
            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
