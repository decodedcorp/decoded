"use client";

import { memo, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useFilterStore, type FilterKey } from "../stores/filterStore";

interface FilterOption {
  id: FilterKey;
  label: string;
}

const filterOptions: FilterOption[] = [
  { id: "all", label: "All" },
  { id: "newjeanscloset", label: "NewJeans" },
  { id: "blackpinkk.style", label: "BLACKPINK" },
];

interface SidebarFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SidebarFilterPanel - Slide-out filter panel for desktop sidebar
 *
 * Features:
 * - Slides out from sidebar on Filter click
 * - Filter options as list
 * - Click outside / ESC to close
 */
export const SidebarFilterPanel = memo(
  ({ isOpen, onClose }: SidebarFilterPanelProps) => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Filter store
    const activeFilter = useFilterStore((state) => state.activeFilter);
    const setFilter = useFilterStore((state) => state.setFilter);

    // Click outside handler
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        // Don't close if clicking inside the sidebar (parent handles toggle)
        const sidebar = document.querySelector(
          '[aria-label="Main navigation"]'
        );
        if (sidebar?.contains(e.target as Node)) {
          return;
        }

        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      };

      if (isOpen) {
        const timeoutId = setTimeout(() => {
          document.addEventListener("mousedown", handleClickOutside);
        }, 0);

        return () => {
          clearTimeout(timeoutId);
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen, onClose]);

    // Escape key handler
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
      }
    }, [isOpen, onClose]);

    return (
      <div
        ref={panelRef}
        className={`fixed top-0 h-screen z-40 hidden md:block
                    left-14 lg:left-[200px]
                    w-[240px] bg-background border-r border-border
                    shadow-lg
                    transition-transform duration-200 ease-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Filter</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close filter panel"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Filter Options */}
        <div className="p-3">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wide">
            Source
          </h3>
          <div className="space-y-0.5">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
                  activeFilter === option.id
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

SidebarFilterPanel.displayName = "SidebarFilterPanel";
