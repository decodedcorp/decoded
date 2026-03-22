/**
 * Magazine Store - Zustand state for collection bookshelf feature
 *
 * Originally managed daily editorial, personal issue, and collection state.
 * Magazine routes removed — store now only serves the collection bookshelf (SCR-COL-01).
 */

import { create } from "zustand";
import type { MagazineIssue } from "../components/collection/types";

interface MagazineState {
  // Collection (SCR-COL-01)
  collectionIssues: MagazineIssue[];
  activeIssueId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCollection: () => Promise<void>;
  setActiveIssueId: (id: string | null) => void;
  removeFromCollection: (id: string) => void;
  clearError: () => void;
}

export const useMagazineStore = create<MagazineState>((set) => ({
  // Initial state
  collectionIssues: [],
  activeIssueId: null,
  isLoading: false,
  error: null,

  /**
   * Load collection issues.
   * TODO: Replace with real API call when backend is ready.
   */
  loadCollection: async () => {
    set({ isLoading: true, error: null });
    try {
      // No mock data — returns empty collection until API is wired
      set({ collectionIssues: [], isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load collection";
      set({ error: message, isLoading: false });
    }
  },

  setActiveIssueId: (id: string | null) => {
    set({ activeIssueId: id });
  },

  removeFromCollection: (id: string) => {
    set((state) => ({
      collectionIssues: state.collectionIssues.filter(
        (issue) => issue.id !== id
      ),
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));
