import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RecentSearchesStore } from "../types/search";

const MAX_RECENT_SEARCHES = 10;
const STORAGE_KEY = "decoded-recent-searches";

export const useRecentSearchesStore = create<RecentSearchesStore>()(
  persist(
    (set, get) => ({
      // State
      searches: [],
      maxItems: MAX_RECENT_SEARCHES,

      // Actions
      addSearch: (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        set((state) => {
          // Remove duplicate if exists
          const filtered = state.searches.filter(
            (s) => s.toLowerCase() !== trimmed.toLowerCase()
          );
          // Add to beginning and limit to maxItems
          const updated = [trimmed, ...filtered].slice(0, state.maxItems);
          return { searches: updated };
        });
      },

      removeSearch: (query: string) => {
        set((state) => ({
          searches: state.searches.filter(
            (s) => s.toLowerCase() !== query.toLowerCase()
          ),
        }));
      },

      clearAll: () => {
        set({ searches: [] });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ searches: state.searches }),
    }
  )
);

// Re-export type for convenience
export type { RecentSearchesStore };
