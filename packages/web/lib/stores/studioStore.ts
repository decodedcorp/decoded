import { create } from "zustand";
import type { Application } from "@splinetool/runtime";

export type CameraState = "loading" | "entry" | "browse" | "focused" | "exit";

interface StudioState {
  cameraState: CameraState;
  focusedIssueId: string | null;
  entryComplete: boolean;
  splineLoaded: boolean;
  splineApp: Application | null;

  // Primitive setters
  setCameraState: (state: CameraState) => void;
  setFocusedIssueId: (id: string | null) => void;
  setEntryComplete: (complete: boolean) => void;
  setSplineLoaded: (loaded: boolean) => void;
  setSplineApp: (app: Application | null) => void;

  // Semantic actions (camera state machine transitions)
  focusIssue: (id: string) => void;
  unfocus: () => void;

  reset: () => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  cameraState: "loading",
  focusedIssueId: null,
  entryComplete: false,
  splineLoaded: false,
  splineApp: null,

  setCameraState: (state) => set({ cameraState: state }),
  setFocusedIssueId: (id) => set({ focusedIssueId: id }),
  setEntryComplete: (complete) => set({ entryComplete: complete }),
  setSplineLoaded: (loaded) => set({ splineLoaded: loaded }),
  setSplineApp: (app) => set({ splineApp: app }),

  // Focus an issue: set focusedIssueId + transition camera to "focused"
  focusIssue: (id) => set({ focusedIssueId: id, cameraState: "focused" }),

  // Unfocus: clear focusedIssueId + return camera to "browse"
  unfocus: () => set({ focusedIssueId: null, cameraState: "browse" }),

  reset: () =>
    set({
      cameraState: "loading",
      focusedIssueId: null,
      entryComplete: false,
      splineLoaded: false,
      splineApp: null,
    }),
}));
