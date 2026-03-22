import { create } from "zustand";

export type FilterKey = "all" | "fashion" | "beauty" | "lifestyle" | "accessories" | "newjeanscloset" | "blackpinkk.style";

export const useFilterStore = create<{
  activeFilter: FilterKey;
  setActiveFilter: (f: FilterKey) => void;
  // Deprecated: use setActiveFilter instead
  setFilter: (f: FilterKey) => void;
}>((set) => ({
  activeFilter: "all",
  setActiveFilter: (f) => set({ activeFilter: f }),
  // Deprecated: use setActiveFilter instead
  setFilter: (f) => set({ activeFilter: f }),
}));
