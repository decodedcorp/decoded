"use client";

import { useState, useRef, useEffect, memo } from "react";
import { ChevronDown } from "lucide-react";
import { useFilterStore, type FilterKey } from "@/lib/stores/filterStore";

interface FilterOption {
  id: FilterKey;
  label: string;
}

const filterOptions: FilterOption[] = [
  { id: "all", label: "All" },
  { id: "newjeanscloset", label: "NewJeans" },
  { id: "blackpinkk.style", label: "BLACKPINK" },
];

interface SimpleFilterDropdownProps {
  className?: string;
}

/**
 * SimpleFilterDropdown - Minimal single-level filter dropdown
 *
 * Features:
 * - Simple category selection
 * - Click-outside to close
 * - Connected to filterStore
 */
export const SimpleFilterDropdown = memo(
  ({ className = "" }: SimpleFilterDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const activeFilter = useFilterStore((state) => state.activeFilter);
    const setFilter = useFilterStore((state) => state.setFilter);
    const ref = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Escape key handler
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const selectedLabel =
      filterOptions.find((opt) => opt.id === activeFilter)?.label || "All";

    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selectedLabel}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div
            className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
            role="listbox"
          >
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setFilter(option.id);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                  activeFilter === option.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
                role="option"
                aria-selected={activeFilter === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

SimpleFilterDropdown.displayName = "SimpleFilterDropdown";
