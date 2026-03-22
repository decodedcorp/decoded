"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "trending" | "recent" | "popular";

interface SortOptionConfig {
  id: SortOption;
  label: string;
}

const SORT_OPTIONS: SortOptionConfig[] = [
  { id: "trending", label: "Trending" },
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Popular" },
];

export interface ExploreSortControlsProps {
  value?: SortOption;
  onChange?: (value: SortOption) => void;
  className?: string;
}

export function ExploreSortControls({
  value: controlledValue,
  onChange,
  className,
}: ExploreSortControlsProps) {
  const [internalValue, setInternalValue] = useState<SortOption>("trending");
  const activeSort = controlledValue ?? internalValue;

  const handleChange = (sort: SortOption) => {
    setInternalValue(sort);
    onChange?.(sort);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => handleChange(option.id)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            activeSort === option.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
