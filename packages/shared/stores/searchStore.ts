import { create } from "zustand";
import type {
  SearchTab,
  SearchFilters,
  SearchStore,
  SearchCategory,
  SearchMediaType,
  SearchContext,
  SearchSortOption,
} from "../types/search";

const DEFAULT_FILTERS: SearchFilters = {
  category: undefined,
  mediaType: undefined,
  context: undefined,
  hasAdopted: undefined,
  sort: "relevant",
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  // State
  query: "",
  debouncedQuery: "",
  activeTab: "all",
  filters: { ...DEFAULT_FILTERS },
  page: 1,

  // Actions
  setQuery: (query) => set({ query }),
  setDebouncedQuery: (debouncedQuery) => set({ debouncedQuery }),
  setActiveTab: (activeTab) => set({ activeTab, page: 1 }), // Reset page on tab change
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      page: 1, // Reset page on filter change
    })),
  setPage: (page) => set({ page }),

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS }, page: 1 }),

  resetAll: () =>
    set({
      query: "",
      debouncedQuery: "",
      activeTab: "all",
      filters: { ...DEFAULT_FILTERS },
      page: 1,
    }),

  // URL sync helpers
  getURLParams: () => {
    const state = get();
    const params = new URLSearchParams();

    if (state.debouncedQuery) params.set("q", state.debouncedQuery);
    if (state.activeTab !== "all") params.set("tab", state.activeTab);
    if (state.filters.category) params.set("category", state.filters.category);
    if (state.filters.mediaType)
      params.set("media_type", state.filters.mediaType);
    if (state.filters.context) params.set("context", state.filters.context);
    if (state.filters.hasAdopted !== undefined)
      params.set("has_adopted", String(state.filters.hasAdopted));
    if (state.filters.sort && state.filters.sort !== "relevant")
      params.set("sort", state.filters.sort);
    if (state.page > 1) params.set("page", String(state.page));

    return params;
  },

  setFromURLParams: (params) => {
    const query = params.get("q") || "";
    const tab = (params.get("tab") as SearchTab) || "all";
    const category = params.get("category") as SearchCategory | undefined;
    const mediaType = params.get("media_type") as SearchMediaType | undefined;
    const context = params.get("context") as SearchContext | undefined;
    const hasAdoptedStr = params.get("has_adopted");
    const hasAdopted =
      hasAdoptedStr !== null ? hasAdoptedStr === "true" : undefined;
    const sort = (params.get("sort") as SearchSortOption) || "relevant";
    const page = parseInt(params.get("page") || "1", 10);

    set({
      query,
      debouncedQuery: query,
      activeTab: tab,
      filters: {
        category,
        mediaType,
        context,
        hasAdopted,
        sort,
      },
      page: isNaN(page) || page < 1 ? 1 : page,
    });
  },
}));

// Re-export types for convenience
export type { SearchTab, SearchFilters, SearchStore };
