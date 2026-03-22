/**
 * Search API Types
 *
 * Based on API spec: docs/api/search.md
 */

// ============================================================
// Search Tabs
// ============================================================

export type SearchTab = "all" | "people" | "media" | "items";

// ============================================================
// Search Filters
// ============================================================

export type SearchCategory = "fashion" | "living" | "tech" | "beauty";
export type SearchMediaType = "drama" | "movie" | "mv" | "youtube" | "variety";
export type SearchContext =
  | "airport"
  | "stage"
  | "mv"
  | "red_carpet"
  | "photoshoot"
  | "interview"
  | "daily";
export type SearchSortOption = "relevant" | "recent" | "popular" | "solution_count";

export interface SearchFilters {
  category?: SearchCategory;
  mediaType?: SearchMediaType;
  context?: SearchContext;
  hasAdopted?: boolean;
  sort?: SearchSortOption;
}

// ============================================================
// Search Request Parameters
// ============================================================

export interface SearchParams {
  q: string;
  category?: SearchCategory;
  media_type?: SearchMediaType;
  context?: SearchContext;
  has_adopted?: boolean;
  sort?: SearchSortOption;
  page?: number;
  limit?: number;
}

// ============================================================
// Search Response Types
// ============================================================

export interface MediaSource {
  type: SearchMediaType;
  title: string;
}

export interface SearchHighlight {
  artist_name?: string;
  title?: string;
  query?: string;
}

export interface SearchResultItem {
  id: string;
  type: "post" | "person" | "media" | "item";
  image_url: string;
  artist_name?: string;
  group_name?: string | null;
  context?: SearchContext;
  media_source?: MediaSource;
  spot_count?: number;
  view_count?: number;
  highlight?: SearchHighlight;
  // Person specific
  profile_image_url?: string;
  category?: string;
  item_count?: number;
  // Media specific
  poster_url?: string;
  media_type?: SearchMediaType;
  year?: number;
  // Item specific
  thumbnail_url?: string;
  brand?: string;
  product_name?: string;
}

export interface SearchFacets {
  category: Record<SearchCategory, number>;
  media_type: Record<SearchMediaType, number>;
  context: Record<SearchContext, number>;
}

export interface SearchPagination {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface SearchResponse {
  data: SearchResultItem[];
  facets: SearchFacets;
  pagination: SearchPagination;
  query: string;
  took_ms: number;
}

// ============================================================
// Grouped Search Results (for "All" tab display)
// ============================================================

export interface GroupedSearchResults {
  people: SearchResultItem[];
  media: SearchResultItem[];
  items: SearchResultItem[];
  totalCount: number;
}

// ============================================================
// Popular Search Types
// ============================================================

export interface PopularSearch {
  rank: number;
  query: string;
  search_count: number;
}

export interface PopularSearchesResponse {
  data: PopularSearch[];
}

// ============================================================
// Recent Search Types
// ============================================================

export interface RecentSearch {
  id: string;
  query: string;
  searched_at: string;
}

export interface RecentSearchesResponse {
  data: RecentSearch[];
}

// ============================================================
// Popular Keywords Types
// ============================================================

export interface PopularKeyword {
  keyword: string;
  count: number;
}

export interface PopularKeywordsResponse {
  keywords: PopularKeyword[];
}

// ============================================================
// Search Store State
// ============================================================

export interface SearchState {
  query: string;
  debouncedQuery: string;
  activeTab: SearchTab;
  filters: SearchFilters;
  page: number;
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setDebouncedQuery: (query: string) => void;
  setActiveTab: (tab: SearchTab) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  resetAll: () => void;
  // URL sync helpers
  getURLParams: () => URLSearchParams;
  setFromURLParams: (params: URLSearchParams) => void;
}

export type SearchStore = SearchState & SearchActions;

// ============================================================
// Recent Searches Store State
// ============================================================

export interface RecentSearchesState {
  searches: string[];
  maxItems: number;
}

export interface RecentSearchesActions {
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearAll: () => void;
}

export type RecentSearchesStore = RecentSearchesState & RecentSearchesActions;
