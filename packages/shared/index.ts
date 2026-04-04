// Supabase client
export {
  initSupabase,
  getSupabaseClient,
  isSupabaseInitialized,
} from "./supabase/client";
export type { Database } from "./supabase/types";

// API functions
export * from "./api/search";

// Hooks
export {
  useLatestImages,
  useImageById,
  useFilteredImages,
  useInfiniteFilteredImages,
  useRelatedImagesByAccount,
} from "./hooks/useImages";
export { useDebounce } from "./hooks/useDebounce";

// Stores
export { useFilterStore } from "./stores/filterStore";
export type { FilterKey } from "./stores/filterStore";
export { useSearchStore } from "./stores/searchStore";
export type {
  SearchTab,
  SearchFilters,
  SearchStore,
} from "./stores/searchStore";
export { useRecentSearchesStore } from "./stores/recentSearchesStore";
export type { RecentSearchesStore } from "./stores/recentSearchesStore";
// Types
export * from "./types/filter";
export * from "./types/search";

// Query functions (for direct use)
export {
  fetchLatestImages,
  fetchImageById,
  fetchFilteredImages,
  fetchImagesByPostImage,
  fetchRelatedImagesByAccount,
  fetchUnifiedImages,
  encodeCursor,
  decodeCursor,
} from "./supabase/queries/images";

export type {
  ImageRow,
  ImageDetail,
  ImagePage,
  ImagePageWithPostId,
  ImageWithPostId,
  CategoryFilter,
  FetchFilteredImagesParams,
  PostImageRow,
  PostSource,
} from "./supabase/queries/images";

export { fetchItemsByImageId } from "./supabase/queries/items";
export type { ItemRow } from "./supabase/queries/items";

export { fetchMainBPost } from "./supabase/queries/main-b";
export type {
  MainBData,
  MainBPost,
  MainBItem,
  MainBRelatedPost,
} from "./supabase/queries/main-b";
