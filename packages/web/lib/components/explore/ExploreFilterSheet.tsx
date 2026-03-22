"use client";

import { useState } from "react";
import { BottomSheet } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { useHierarchicalFilterStore } from "@decoded/shared/stores/hierarchicalFilterStore";
import {
  getMockCategories,
  getMockMediaByCategory,
  getMockCastByMedia,
  getMockContextOptions,
} from "@decoded/shared/data/mockFilterData";
import type {
  CategoryType,
  ContextType,
  FilterLevel,
} from "@decoded/shared/types/filter";

export interface ExploreFilterSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ExploreFilterSheet({ open, onClose }: ExploreFilterSheetProps) {
  const {
    category,
    mediaId,
    castId,
    contextType,
    setCategory,
    setMedia,
    setCast,
    setContext,
    clearAll,
  } = useHierarchicalFilterStore();

  const [activeLevel, setActiveLevel] = useState<FilterLevel>(1);

  const categories = getMockCategories();
  const mediaOptions = category ? getMockMediaByCategory(category) : [];
  const castOptions = mediaId ? getMockCastByMedia(mediaId) : [];
  const contextOptions = getMockContextOptions();

  const levels: { id: FilterLevel; label: string; enabled: boolean }[] = [
    { id: 1, label: "Category", enabled: true },
    { id: 2, label: "Media", enabled: !!category },
    { id: 3, label: "Cast", enabled: !!mediaId },
    { id: 4, label: "Context", enabled: !!castId },
  ];

  return (
    <BottomSheet
      isOpen={open}
      onClose={onClose}
      snapPoints={[0.5, 0.8]}
      defaultSnapPoint={0.5}
      title="Filters"
    >
      <div className="space-y-4">
        {/* Level tabs */}
        <div className="flex gap-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => level.enabled && setActiveLevel(level.id)}
              disabled={!level.enabled}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                activeLevel === level.id
                  ? "bg-primary text-primary-foreground"
                  : level.enabled
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/50 text-muted-foreground/50"
              )}
            >
              {level.label}
            </button>
          ))}
        </div>

        {/* Level content */}
        <div className="flex flex-wrap gap-2">
          {activeLevel === 1 &&
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setActiveLevel(2);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  category === cat.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-accent"
                )}
              >
                {cat.label}
              </button>
            ))}

          {activeLevel === 2 &&
            mediaOptions.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMedia(m.id, m.name, m.nameKo);
                  setActiveLevel(3);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  mediaId === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-accent"
                )}
              >
                {m.name}
              </button>
            ))}

          {activeLevel === 3 &&
            castOptions.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCast(c.id, c.name, c.nameKo);
                  setActiveLevel(4);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  castId === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-accent"
                )}
              >
                {c.name}
              </button>
            ))}

          {activeLevel === 4 &&
            contextOptions.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setContext(ct.id, ct.label)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium border transition-colors",
                  contextType === ct.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-accent"
                )}
              >
                {ct.label}
              </button>
            ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            onClick={() => {
              clearAll();
              setActiveLevel(1);
            }}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
