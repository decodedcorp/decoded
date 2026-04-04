import { create } from "zustand";

interface ActiveSpotState {
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
}

export const useActiveSpotStore = create<ActiveSpotState>((set) => ({
  activeIndex: null,
  setActiveIndex: (index) => set({ activeIndex: index }),
}));
