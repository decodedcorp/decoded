/**
 * D-02 Hierarchical Filter Types
 * 4-level drill-down filter: Category -> Media -> Cast -> Context
 */

// ============================================
// Level 1: Category Types
// ============================================
export type CategoryType =
  | "K-POP"
  | "K-Drama"
  | "K-Movie"
  | "K-Variety"
  | "K-Fashion";

export interface CategoryOption {
  id: CategoryType;
  label: string;
  labelKo: string;
  postCount: number;
}

// ============================================
// Level 2: Media Types (Group/Show/Drama/Movie)
// ============================================
export type MediaType = "group" | "show" | "drama" | "movie";

export interface MediaOption {
  id: string;
  name: string;
  nameKo: string;
  type: MediaType;
  category: CategoryType;
  imageUrl: string | null;
  postCount: number;
}

// ============================================
// Level 3: Cast Types (Person/Member)
// ============================================
export interface CastOption {
  id: string;
  name: string;
  nameKo: string;
  profileImageUrl: string | null;
  postCount: number;
}

// ============================================
// Level 4: Context Types
// ============================================
export type ContextType =
  | "airport"
  | "stage"
  | "mv"
  | "drama_scene"
  | "variety"
  | "photoshoot"
  | "daily"
  | "event";

export interface ContextOption {
  id: ContextType;
  label: string;
  labelKo: string;
}

// ============================================
// Breadcrumb Navigation
// ============================================
export type FilterLevel = 1 | 2 | 3 | 4;
export type FilterLevelType = "category" | "media" | "cast" | "context";

export interface FilterBreadcrumb {
  level: FilterLevel;
  type: FilterLevelType;
  id: string;
  label: string;
  labelKo: string;
}

// ============================================
// Filter State Types
// ============================================
export interface HierarchicalFilterSelection {
  // Single selection (current drill-down path)
  category: CategoryType | null;
  mediaId: string | null;
  castId: string | null;
  contextType: ContextType | null;
}

export interface HierarchicalFilterMultiSelection {
  // Multi-selection within same level
  selectedMediaIds: string[];
  selectedCastIds: string[];
  selectedContextTypes: ContextType[];
}

// ============================================
// Legacy Filter (for backward compatibility)
// ============================================
export type LegacyFilterKey = "all" | "newjeanscloset" | "blackpinkk.style";

// ============================================
// API Query Parameters
// ============================================
export interface HierarchicalFilterParams {
  category?: CategoryType;
  mediaId?: string;
  mediaIds?: string[];
  castId?: string;
  castIds?: string[];
  contextType?: ContextType;
  contextTypes?: ContextType[];
}
