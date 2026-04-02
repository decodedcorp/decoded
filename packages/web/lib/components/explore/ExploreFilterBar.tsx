"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import {
  MOCK_MEDIA,
  getMockCastByMedia,
} from "@decoded/shared/data/mockFilterData";
import { FilterChip } from "./FilterChip";

export interface ExploreFilterBarProps {
  className?: string;
}

const allMediaOptions = Object.values(MOCK_MEDIA).flat();

export function ExploreFilterBar({ className }: ExploreFilterBarProps) {
  const {
    mediaId,
    castId,
    breadcrumb,
    setMedia,
    setCast,
    clearAll,
    hasActiveFilters,
  } = useHierarchicalFilterStore();

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openDropdown === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const castOptions = mediaId ? getMockCastByMedia(mediaId) : [];
  const activeFilters = hasActiveFilters();

  const toggleDropdown = (level: number) => {
    setOpenDropdown(openDropdown === level ? null : level);
  };

  const handleMediaSelect = (id: string, name: string, nameKo: string) => {
    setMedia(id, name, nameKo);
    setOpenDropdown(null);
  };

  const handleCastSelect = (id: string, name: string, nameKo: string) => {
    setCast(id, name, nameKo);
    setOpenDropdown(null);
  };

  const mediaLabel = breadcrumb.find((b) => b.level === 2)?.label || "Media";
  const castLabel = breadcrumb.find((b) => b.level === 3)?.label || "Cast";

  return (
    <div ref={dropdownRef} className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Media dropdown */}
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
              {allMediaOptions.map((m) => (
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
      </div>

      {/* Active filter chips */}
      {activeFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {breadcrumb
            .filter((b) => b.level === 2 || b.level === 3)
            .map((b) => (
              <FilterChip
                key={`${b.type}-${b.id}`}
                label={b.label}
                onRemove={() => {
                  if (b.level === 2) setMedia(null);
                  else if (b.level === 3) setCast(null);
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
