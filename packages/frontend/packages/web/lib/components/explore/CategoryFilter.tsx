"use client";

import { cn } from "@/lib/utils";
import { useFilterStore, type FilterKey } from "@/lib/stores/filterStore";

const categories: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Beauty" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "accessories", label: "Accessories" },
];

export function CategoryFilter() {
  const { activeFilter, setActiveFilter } = useFilterStore();

  return (
    <div className="px-4 md:px-6 lg:px-8 pb-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveFilter(category.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeFilter === category.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
