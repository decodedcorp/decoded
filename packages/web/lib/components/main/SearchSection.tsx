"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRecentSearchesStore } from "@decoded/shared";
import { useSearchNavigation } from "../../hooks/useSearchURLSync";
import { usePopularKeywords } from "../../hooks/useSearch";

// Fallback keywords if API fails
const fallbackKeywords = [
  { keyword: "뉴진스 다니엘", count: 0 },
  { keyword: "나이키", count: 0 },
  { keyword: "뉴진스 혜인", count: 0 },
  { keyword: "블랙핑크 지수", count: 0 },
  { keyword: "아디다스", count: 0 },
];

export function SearchSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const { navigateToSearch } = useSearchNavigation();
  const addRecentSearch = useRecentSearchesStore((s) => s.addSearch);

  // Fetch popular keywords from API
  const { data: keywordsData } = usePopularKeywords();
  const keywords = keywordsData?.keywords?.slice(0, 7) || fallbackKeywords;

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      addRecentSearch(trimmed);
      navigateToSearch(trimmed);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleKeywordClick = (keyword: string) => {
    handleSearch(keyword);
  };

  return (
    <section className="py-8 md:py-12 px-4 md:px-6 lg:px-8 bg-background">
      <div className="max-w-3xl mx-auto">
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="아티스트, 브랜드로 검색해보세요"
            className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-full
                     text-base text-foreground placeholder:text-muted-foreground
                     focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring
                     transition-colors"
          />
        </form>

        {/* Trending Keywords */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
          {keywords.map((item) => (
            <button
              key={item.keyword}
              type="button"
              onClick={() => handleKeywordClick(item.keyword)}
              className="px-4 py-2 bg-muted text-muted-foreground text-sm rounded-full
                       hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {item.keyword}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
