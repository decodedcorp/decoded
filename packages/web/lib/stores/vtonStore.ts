import { create } from "zustand";

export interface VtonPreloadItem {
  id: string;
  title: string;
  thumbnail_url: string;
  description: string | null;
  keywords: string[] | null;
}

export interface VtonBackgroundJob {
  id: string;
  personPreview: string;
  personImageBase64: string;
  selectedItems: VtonPreloadItem[];
  resultImage: string | null;
  latencyMs: number | null;
  error: string | null;
  status: "processing" | "done" | "error";
}

interface VtonState {
  isOpen: boolean;
  sourcePostId: string | null;
  preloadedItems: VtonPreloadItem[];
  backgroundJob: VtonBackgroundJob | null;
  open: () => void;
  openWithItems: (postId: string, items: VtonPreloadItem[]) => void;
  /** Reopen modal without clearing state — used when background job is active */
  reopen: () => void;
  close: () => void;
  startBackgroundJob: (
    personPreview: string,
    personImageBase64: string,
    selectedItems: VtonPreloadItem[]
  ) => string;
  completeBackgroundJob: (
    resultImage: string,
    latencyMs: number | null
  ) => void;
  failBackgroundJob: (error: string) => void;
  clearBackgroundJob: () => void;
}

let jobCounter = 0;

export const useVtonStore = create<VtonState>((set) => ({
  isOpen: false,
  sourcePostId: null,
  preloadedItems: [],
  backgroundJob: null,
  open: () => set({ isOpen: true, sourcePostId: null, preloadedItems: [] }),
  openWithItems: (postId, items) =>
    set({ isOpen: true, sourcePostId: postId, preloadedItems: items }),
  reopen: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  startBackgroundJob: (personPreview, personImageBase64, selectedItems) => {
    const id = `vton-${++jobCounter}`;
    set({
      backgroundJob: {
        id,
        personPreview,
        personImageBase64,
        selectedItems,
        resultImage: null,
        latencyMs: null,
        error: null,
        status: "processing",
      },
    });
    return id;
  },
  completeBackgroundJob: (resultImage, latencyMs) =>
    set((state) => ({
      backgroundJob: state.backgroundJob
        ? { ...state.backgroundJob, resultImage, latencyMs, status: "done" }
        : null,
    })),
  failBackgroundJob: (error) =>
    set((state) => ({
      backgroundJob: state.backgroundJob
        ? { ...state.backgroundJob, error, status: "error" }
        : null,
    })),
  clearBackgroundJob: () => set({ backgroundJob: null }),
}));
