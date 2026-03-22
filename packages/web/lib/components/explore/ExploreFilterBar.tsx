"use client";

import { useState, useMemo } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import { useTrackEvent } from "@/lib/hooks/useTrackEvent";
import {
  getMockCategories,
  getMockMediaByCategory,
  getMockCastByMedia,
  getMockContextOptions,
} from "@decoded/shared/data/mockFilterData";
import type { CategoryType, ContextType } from "@decoded/shared/types/filter";
import { FilterChip } from "./FilterChip";
import { ExploreSortControls, type SortOption } from "./ExploreSortControls";

export interface ExploreFilterBarProps {
  onSortChange?: (sort: SortOption) => void;
  className?: string;
}

export function ExploreFilterBar({
  onSortChange,
  className,
}: ExploreFilterBarProps) {
  const {
    category,
    mediaId,
    castId,
    contextType,
    breadcrumb,
    setCategory,
    setMedia,
    setCast,
    setContext,
    clearAll,
    hasActiveFilters,
    activeFilterLevel,
    setActiveFilterLevel,
  } = useHierarchicalFilterStore();
  const track = useTrackEvent();

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const categories = getMockCategories();
  const mediaOptions = category ? getMockMediaByCategory(category) : [];
  const castOptions = mediaId ? getMockCastByMedia(mediaId) : [];
  const contextOptions = getMockContextOptions();

  const activeFilters = hasActiveFilters();

  const toggleDropdown = (level: number) => {
    setOpenDropdown(openDropdown === level ? null : level);
  };

  const handleCategorySelect = (cat: CategoryType) => {
    setCategory(cat);
    setOpenDropdown(null);
    track({
      event_type: "category_filter",
      metadata: { category_id: cat, category_name: cat },
    });
  };

  const handleMediaSelect = (id: string, name: string, nameKo: string) => {
    setMedia(id, name, nameKo);
    setOpenDropdown(null);
  };

  const handleCastSelect = (id: string, name: string, nameKo: string) => {
    setCast(id, name, nameKo);
    setOpenDropdown(null);
  };

  const handleContextSelect = (ct: ContextType, label: string) => {
    setContext(ct, label);
    setOpenDropdown(null);
  };

  // Current labels for dropdown buttons
  const categoryLabel =
    breadcrumb.find((b) => b.level === 1)?.label || "Category";
  const mediaLabel = breadcrumb.find((b) => b.level === 2)?.label || "Media";
  const castLabel = breadcrumb.find((b) => b.level === 3)?.label || "Cast";
  const contextLabel =
    breadcrumb.find((b) => b.level === 4)?.label || "Context";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter bar row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Category dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => toggleDropdown(1)}
            aria-expanded={openDropdown === 1}
            aria-haspopup="listbox"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
              category
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {categoryLabel}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                openDropdown === 1 && "rotate-180"
              )}
            />
          </button>
          {openDropdown === 1 && (
            <div
              role="listbox"
              className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1"
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  role="option"
                  aria-selected={category === cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between",
                    category === cat.id && "text-primary font-medium"
                  )}
                >
                  <span>{cat.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {cat.postCount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Media dropdown (visible when category selected) */}
        {category && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => toggleDropdown(2)}
              aria-expanded={openDropdown === 2}
              aria-haspopup="listbox"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                mediaId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {mediaLabel}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  openDropdown === 2 && "rotate-180"
                )}
              />
            </button>
            {openDropdown === 2 && (
              <div
                role="listbox"
                className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-lg border border-border bg-card shadow-lg py-1 max-h-[240px] overflow-y-auto"
              >
                {mediaOptions.map((m) => (
                  <button
                    key={m.id}
                    role="option"
                    aria-selected={mediaId === m.id}
                    onClick={() => handleMediaSelect(m.id, m.name, m.nameKo)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between",
                      mediaId === m.id && "text-primary font-medium"
                    )}
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.postCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cast dropdown (visible when media selected) */}
        {mediaId && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => toggleDropdown(3)}
              aria-expanded={openDropdown === 3}
              aria-haspopup="listbox"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                castId
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {castLabel}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  openDropdown === 3 && "rotate-180"
                )}
              />
            </button>
            {openDropdown === 3 && (
              <div
                role="listbox"
                className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1 max-h-[240px] overflow-y-auto"
              >
                {castOptions.map((c) => (
                  <button
                    key={c.id}
                    role="option"
                    aria-selected={castId === c.id}
                    onClick={() => handleCastSelect(c.id, c.name, c.nameKo)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between",
                      castId === c.id && "text-primary font-medium"
                    )}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.postCount}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Context dropdown (visible when cast selected) */}
        {castId && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => toggleDropdown(4)}
              aria-expanded={openDropdown === 4}
              aria-haspopup="listbox"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
                contextType
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {contextLabel}
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  openDropdown === 4 && "rotate-180"
                )}
              />
            </button>
            {openDropdown === 4 && (
              <div
                role="listbox"
                className="absolute top-full left-0 mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg py-1"
              >
                {contextOptions.map((ct) => (
                  <button
                    key={ct.id}
                    role="option"
                    aria-selected={contextType === ct.id}
                    onClick={() => handleContextSelect(ct.id, ct.label)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                      contextType === ct.id && "text-primary font-medium"
                    )}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separator + Sort */}
        <div className="ml-auto flex-shrink-0">
          <ExploreSortControls onChange={onSortChange} />
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {breadcrumb.map((b) => (
            <FilterChip
              key={`${b.type}-${b.id}`}
              label={b.label}
              onRemove={() => {
                if (b.level === 1) setCategory(null);
                else if (b.level === 2) setMedia(null);
                else if (b.level === 3) setCast(null);
                else if (b.level === 4) setContext(null);
              }}
            />
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
