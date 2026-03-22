import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CategoryType,
  ContextType,
  FilterBreadcrumb,
  FilterLevel,
  HierarchicalFilterSelection,
  HierarchicalFilterMultiSelection,
} from "../types/filter";

// ============================================
// Store State Interface
// ============================================
export interface HierarchicalFilterState
  extends HierarchicalFilterSelection,
    HierarchicalFilterMultiSelection {
  // Breadcrumb navigation
  breadcrumb: FilterBreadcrumb[];

  // UI state
  isFilterOpen: boolean;
  activeFilterLevel: FilterLevel | null;

  // Actions - Single selection
  setCategory: (category: CategoryType | null, label?: string) => void;
  setMedia: (mediaId: string | null, label?: string, labelKo?: string) => void;
  setCast: (castId: string | null, label?: string, labelKo?: string) => void;
  setContext: (contextType: ContextType | null, label?: string) => void;

  // Actions - Multi selection toggle
  toggleMediaSelection: (mediaId: string) => void;
  toggleCastSelection: (castId: string) => void;
  toggleContextSelection: (contextType: ContextType) => void;

  // Actions - Navigation
  clearAll: () => void;
  navigateToBreadcrumb: (level: number) => void;

  // Actions - UI state
  setFilterOpen: (open: boolean) => void;
  setActiveFilterLevel: (level: FilterLevel | null) => void;

  // Computed helpers
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

// ============================================
// Initial State
// ============================================
const initialState: Omit<
  HierarchicalFilterState,
  | "setCategory"
  | "setMedia"
  | "setCast"
  | "setContext"
  | "toggleMediaSelection"
  | "toggleCastSelection"
  | "toggleContextSelection"
  | "clearAll"
  | "navigateToBreadcrumb"
  | "setFilterOpen"
  | "setActiveFilterLevel"
  | "hasActiveFilters"
  | "getActiveFilterCount"
> = {
  // Single selection
  category: null,
  mediaId: null,
  castId: null,
  contextType: null,

  // Multi selection
  selectedMediaIds: [],
  selectedCastIds: [],
  selectedContextTypes: [],

  // Breadcrumb
  breadcrumb: [],

  // UI state
  isFilterOpen: false,
  activeFilterLevel: null,
};

// ============================================
// Category Labels (for breadcrumb)
// ============================================
const CATEGORY_LABELS: Record<CategoryType, { label: string; labelKo: string }> =
  {
    "K-POP": { label: "K-POP", labelKo: "케이팝" },
    "K-Drama": { label: "K-Drama", labelKo: "드라마" },
    "K-Movie": { label: "K-Movie", labelKo: "영화" },
    "K-Variety": { label: "K-Variety", labelKo: "예능" },
    "K-Fashion": { label: "K-Fashion", labelKo: "패션" },
  };

const CONTEXT_LABELS: Record<ContextType, { label: string; labelKo: string }> = {
  airport: { label: "Airport", labelKo: "공항패션" },
  stage: { label: "Stage", labelKo: "무대" },
  mv: { label: "Music Video", labelKo: "뮤비" },
  drama_scene: { label: "Drama", labelKo: "드라마" },
  variety: { label: "Variety", labelKo: "예능" },
  photoshoot: { label: "Photoshoot", labelKo: "화보" },
  daily: { label: "Daily", labelKo: "일상" },
  event: { label: "Event", labelKo: "행사" },
};

// ============================================
// Store Implementation
// ============================================
export const useHierarchicalFilterStore = create<HierarchicalFilterState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========== Single Selection Actions ==========

      setCategory: (category, label) =>
        set((state) => {
          if (category === null) {
            return {
              ...initialState,
              isFilterOpen: state.isFilterOpen,
              activeFilterLevel: state.activeFilterLevel,
            };
          }

          const categoryLabels = CATEGORY_LABELS[category];
          const breadcrumb: FilterBreadcrumb[] = [
            {
              level: 1,
              type: "category",
              id: category,
              label: label || categoryLabels.label,
              labelKo: categoryLabels.labelKo,
            },
          ];

          return {
            category,
            mediaId: null,
            castId: null,
            contextType: null,
            selectedMediaIds: [],
            selectedCastIds: [],
            selectedContextTypes: [],
            breadcrumb,
          };
        }),

      setMedia: (mediaId, label, labelKo) =>
        set((state) => {
          if (mediaId === null) {
            // Clear media and below, keep category
            const breadcrumb = state.breadcrumb.filter((b) => b.level < 2);
            return {
              mediaId: null,
              castId: null,
              contextType: null,
              selectedCastIds: [],
              selectedContextTypes: [],
              breadcrumb,
            };
          }

          const breadcrumb: FilterBreadcrumb[] = [
            ...state.breadcrumb.filter((b) => b.level < 2),
            {
              level: 2,
              type: "media",
              id: mediaId,
              label: label || mediaId,
              labelKo: labelKo || label || mediaId,
            },
          ];

          return {
            mediaId,
            castId: null,
            contextType: null,
            selectedCastIds: [],
            selectedContextTypes: [],
            breadcrumb,
          };
        }),

      setCast: (castId, label, labelKo) =>
        set((state) => {
          if (castId === null) {
            // Clear cast and below, keep category + media
            const breadcrumb = state.breadcrumb.filter((b) => b.level < 3);
            return {
              castId: null,
              contextType: null,
              selectedContextTypes: [],
              breadcrumb,
            };
          }

          const breadcrumb: FilterBreadcrumb[] = [
            ...state.breadcrumb.filter((b) => b.level < 3),
            {
              level: 3,
              type: "cast",
              id: castId,
              label: label || castId,
              labelKo: labelKo || label || castId,
            },
          ];

          return {
            castId,
            contextType: null,
            selectedContextTypes: [],
            breadcrumb,
          };
        }),

      setContext: (contextType, label) =>
        set((state) => {
          if (contextType === null) {
            // Clear context, keep category + media + cast
            const breadcrumb = state.breadcrumb.filter((b) => b.level < 4);
            return {
              contextType: null,
              breadcrumb,
            };
          }

          const contextLabels = CONTEXT_LABELS[contextType];
          const breadcrumb: FilterBreadcrumb[] = [
            ...state.breadcrumb.filter((b) => b.level < 4),
            {
              level: 4,
              type: "context",
              id: contextType,
              label: label || contextLabels.label,
              labelKo: contextLabels.labelKo,
            },
          ];

          return {
            contextType,
            breadcrumb,
          };
        }),

      // ========== Multi Selection Toggle Actions ==========

      toggleMediaSelection: (mediaId) =>
        set((state) => {
          const isSelected = state.selectedMediaIds.includes(mediaId);
          return {
            selectedMediaIds: isSelected
              ? state.selectedMediaIds.filter((id) => id !== mediaId)
              : [...state.selectedMediaIds, mediaId],
          };
        }),

      toggleCastSelection: (castId) =>
        set((state) => {
          const isSelected = state.selectedCastIds.includes(castId);
          return {
            selectedCastIds: isSelected
              ? state.selectedCastIds.filter((id) => id !== castId)
              : [...state.selectedCastIds, castId],
          };
        }),

      toggleContextSelection: (contextType) =>
        set((state) => {
          const isSelected = state.selectedContextTypes.includes(contextType);
          return {
            selectedContextTypes: isSelected
              ? state.selectedContextTypes.filter((t) => t !== contextType)
              : [...state.selectedContextTypes, contextType],
          };
        }),

      // ========== Navigation Actions ==========

      clearAll: () =>
        set((state) => ({
          ...initialState,
          isFilterOpen: state.isFilterOpen,
          activeFilterLevel: null,
        })),

      navigateToBreadcrumb: (level) =>
        set((state) => {
          const breadcrumb = state.breadcrumb.filter((b) => b.level <= level);

          // Clear selections below the navigated level
          const updates: Partial<HierarchicalFilterState> = { breadcrumb };

          if (level < 4) {
            updates.contextType = null;
            updates.selectedContextTypes = [];
          }
          if (level < 3) {
            updates.castId = null;
            updates.selectedCastIds = [];
          }
          if (level < 2) {
            updates.mediaId = null;
            updates.selectedMediaIds = [];
          }
          if (level < 1) {
            updates.category = null;
          }

          return updates;
        }),

      // ========== UI State Actions ==========

      setFilterOpen: (open) => set({ isFilterOpen: open }),

      setActiveFilterLevel: (level) => set({ activeFilterLevel: level }),

      // ========== Computed Helpers ==========

      hasActiveFilters: () => {
        const state = get();
        return !!(
          state.category ||
          state.mediaId ||
          state.castId ||
          state.contextType ||
          state.selectedMediaIds.length > 0 ||
          state.selectedCastIds.length > 0 ||
          state.selectedContextTypes.length > 0
        );
      },

      getActiveFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.category) count++;
        if (state.mediaId) count++;
        if (state.castId) count++;
        if (state.contextType) count++;
        count += state.selectedMediaIds.length;
        count += state.selectedCastIds.length;
        count += state.selectedContextTypes.length;
        return count;
      },
    }),
    {
      name: "hierarchical-filter-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        category: state.category,
        mediaId: state.mediaId,
        castId: state.castId,
        contextType: state.contextType,
        selectedMediaIds: state.selectedMediaIds,
        selectedCastIds: state.selectedCastIds,
        selectedContextTypes: state.selectedContextTypes,
        breadcrumb: state.breadcrumb,
      }),
    }
  )
);

// ============================================
// Export Context Labels for UI
// ============================================
export { CATEGORY_LABELS, CONTEXT_LABELS };
