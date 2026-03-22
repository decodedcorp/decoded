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

// Mock pin data derived from magazine issues + extra items
const MOCK_PINS: Pin[] = [
  {
    id: "pin-1",
    imageUrl: "https://picsum.photos/seed/pin-1/400/600",
    title: "Quiet Luxury Decoded",
    tags: ["Quiet Luxury", "Old Money", "Cashmere"],
    savedAt: "2026-01-10T06:00:00Z",
    boardId: "board-luxury",
    aspectRatio: 1.5,
    accentColor: "#c9a96e",
  },
  {
    id: "pin-2",
    imageUrl: "https://picsum.photos/seed/pin-2/400/400",
    title: "Street Meets Atelier",
    tags: ["Streetwear", "High Fashion", "Contrast"],
    savedAt: "2026-01-24T06:00:00Z",
    boardId: "board-street",
    aspectRatio: 1.0,
    accentColor: "#ff3366",
  },
  {
    id: "pin-3",
    imageUrl: "https://picsum.photos/seed/pin-3/400/550",
    title: "The Denim Issue",
    tags: ["Denim", "Workwear", "Indigo"],
    savedAt: "2026-02-07T06:00:00Z",
    boardId: "board-casual",
    aspectRatio: 1.375,
    accentColor: "#4a90d9",
  },
  {
    id: "pin-4",
    imageUrl: "https://picsum.photos/seed/pin-4/400/700",
    title: "Neon Noir",
    tags: ["Cyberpunk", "Neon", "Night"],
    savedAt: "2026-02-21T06:00:00Z",
    boardId: "board-street",
    aspectRatio: 1.75,
    accentColor: "#00ff88",
  },
  {
    id: "pin-5",
    imageUrl: "https://picsum.photos/seed/pin-5/400/500",
    title: "Soft Power",
    tags: ["Soft", "Pastel", "Gender Fluid"],
    savedAt: "2026-03-03T06:00:00Z",
    boardId: "board-luxury",
    aspectRatio: 1.25,
    accentColor: "#d4a0ff",
  },
  {
    id: "pin-6",
    imageUrl: "https://picsum.photos/seed/pin-6/400/650",
    title: "Minimalist Summer",
    tags: ["Minimal", "Summer", "Linen"],
    savedAt: "2026-03-05T06:00:00Z",
    boardId: "board-casual",
    aspectRatio: 1.625,
    accentColor: "#e8d5b7",
  },
  {
    id: "pin-7",
    imageUrl: "https://picsum.photos/seed/pin-7/400/450",
    title: "Tokyo After Dark",
    tags: ["Japanese", "Night", "Urban"],
    savedAt: "2026-03-07T06:00:00Z",
    boardId: "board-street",
    aspectRatio: 1.125,
    accentColor: "#ff6b35",
  },
  {
    id: "pin-8",
    imageUrl: "https://picsum.photos/seed/pin-8/400/520",
    title: "Coastal Elegance",
    tags: ["Resort", "Coastal", "Luxury"],
    savedAt: "2026-03-09T06:00:00Z",
    boardId: "board-luxury",
    aspectRatio: 1.3,
    accentColor: "#5bb5d5",
  },
];

const MOCK_BOARDS: Board[] = [
  {
    id: "board-luxury",
    name: "Luxury Picks",
    coverImages: [
      "https://picsum.photos/seed/pin-1/400/600",
      "https://picsum.photos/seed/pin-5/400/500",
      "https://picsum.photos/seed/pin-8/400/520",
    ],
    pinCount: 3,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "board-street",
    name: "Street Style",
    coverImages: [
      "https://picsum.photos/seed/pin-2/400/400",
      "https://picsum.photos/seed/pin-4/400/700",
      "https://picsum.photos/seed/pin-7/400/450",
    ],
    pinCount: 3,
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "board-casual",
    name: "Casual Vibes",
    coverImages: [
      "https://picsum.photos/seed/pin-3/400/550",
      "https://picsum.photos/seed/pin-6/400/650",
    ],
    pinCount: 2,
    createdAt: "2026-02-01T00:00:00Z",
  },
];

export const useCollectionStore = create<CollectionState>((set) => ({
  tab: "pins",
  pins: [],
  boards: [],
  isLoading: false,
  selectedPinId: null,

  setTab: (tab) => set({ tab }),
  setSelectedPinId: (id) => set({ selectedPinId: id }),

  loadCollection: async () => {
    set({ isLoading: true });
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));
    set({ pins: MOCK_PINS, boards: MOCK_BOARDS, isLoading: false });
  },

  removePin: (id) =>
    set((state) => ({
      pins: state.pins.filter((p) => p.id !== id),
    })),
}));
