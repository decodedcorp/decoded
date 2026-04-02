import { create } from "zustand";

export type CollectionTab = "pins" | "boards" | "collage";

export interface Pin {
  id: string;
  imageUrl: string;
  title: string;
  tags: string[];
  savedAt: string;
  boardId?: string;
  aspectRatio: number; // height / width for masonry
  accentColor?: string;
}

export interface Board {
  id: string;
  name: string;
  coverImages: string[]; // up to 4 preview images
  pinCount: number;
  createdAt: string;
}

interface CollectionState {
  tab: CollectionTab;
  pins: Pin[];
  boards: Board[];
  isLoading: boolean;
  selectedPinId: string | null;

  setTab: (tab: CollectionTab) => void;
  setSelectedPinId: (id: string | null) => void;
  loadCollection: () => Promise<void>;
  removePin: (id: string) => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  tab: "pins",
  pins: [],
  boards: [],
  isLoading: false,
  selectedPinId: null,

  setTab: (tab) => set({ tab }),
  setSelectedPinId: (id) => set({ selectedPinId: id }),

  loadCollection: async () => {
    /* mock data removed */
  },

  removePin: (id) =>
    set((state) => ({
      pins: state.pins.filter((p) => p.id !== id),
    })),
}));
