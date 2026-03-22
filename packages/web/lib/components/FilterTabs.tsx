"use client";

import React from "react";
import { useFilterStore } from "../stores/filterStore";

const filters = [
  {
    key: "all",
    label: "All",
    className:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 dark:bg-secondary/50",
  },
  {
    key: "newjeanscloset",
    label: "NewJeans",
    className:
      "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-100",
  },
  {
    key: "blackpinkk.style",
    label: "BLACKPINK",
    className:
      "bg-pink-100 text-pink-900 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-100",
  },
] as const;

export function FilterTabs() {
  const active = useFilterStore((s) => s.activeFilter);
  const setFilter = useFilterStore((s) => s.setFilter);

  return (
    <div
      role="tablist"
      aria-label="Content filters"
      className="flex items-center gap-1"
    >
      {filters.map((f) => {
        const isActive = active === f.key;
        return (
          <button
            key={f.key}
            role="tab"
            aria-selected={isActive}
            aria-pressed={isActive}
            onClick={() => setFilter(f.key)}
            className={`h-8 px-3 py-1 rounded-full text-sm lowercase transition-all duration-150 ease-out
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                        ${f.className}
                        ${
                          isActive
                            ? "scale-105 font-semibold opacity-100 shadow-sm ring-2 ring-background"
                            : "opacity-80 hover:opacity-100"
                        }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
