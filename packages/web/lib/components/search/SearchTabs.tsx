"use client";

import { memo } from "react";
import { useSearchStore } from "@decoded/shared";
import type { SearchTab, SearchFacets } from "@decoded/shared/types/search";
import { Tabs, TabItem } from "@/lib/design-system";

interface SearchTabsProps {
  facets?: SearchFacets;
  totalCount?: number;
  className?: string;
}

interface TabConfig {
  id: SearchTab;
  label: string;
  getCount?: (facets: SearchFacets, totalCount?: number) => number | undefined;
}

const TABS: TabConfig[] = [
  {
    id: "all",
    label: "All",
    getCount: (_, totalCount) => totalCount,
  },
  {
    id: "people",
    label: "People",
    // People count would come from a separate facet if available
    getCount: () => undefined,
  },
  {
    id: "media",
    label: "Media",
    getCount: (facets) =>
      Object.values(facets.media_type).reduce((sum, count) => sum + count, 0),
  },
  {
    id: "items",
    label: "Items",
    getCount: (facets) =>
      Object.values(facets.category).reduce((sum, count) => sum + count, 0),
  },
];

/**
 * Search result tabs with animated sliding underline
 *
 * Features:
 * - All, People, Media, Items tabs
 * - Result counts in "Label (count)" format
 * - Animated sliding underline indicator between active tabs
 * - Active state styling per decoded.pen spec
 */
export const SearchTabs = memo(function SearchTabs({
  facets,
  totalCount,
  className = "",
}: SearchTabsProps) {
  const activeTab = useSearchStore((s) => s.activeTab);
  const setActiveTab = useSearchStore((s) => s.setActiveTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as SearchTab)}
      layoutId="search-tab-underline"
      className={className}
    >
      {TABS.map((tab) => {
        const count =
          facets && tab.getCount ? tab.getCount(facets, totalCount) : undefined;

        return (
          <TabItem key={tab.id} value={tab.id} count={count}>
            {tab.label}
          </TabItem>
        );
      })}
    </Tabs>
  );
});
