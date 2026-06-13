import { create } from "zustand";

export type View = "timer" | "tasks" | "stats" | "scene" | "sounds" | "settings";

interface UiState {
  view: View;
  setView: (v: View) => void;
}

export const useUi = create<UiState>((set) => ({
  view: "timer",
  setView: (view) => set({ view }),
}));
