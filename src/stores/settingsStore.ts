import { create } from "zustand";
import type { CycleSettings } from "../lib/time";
import { loadSettings, saveSetting } from "../lib/queries";

/**
 * Settings hydrate from SQLite on boot and write through on every change
 * (FR-C3). Durations are clamped to 1–120 min (FR-T2). Outside the Tauri
 * runtime the query helpers no-op, so the app runs on these defaults.
 */
export type BreakEnforcement = "every" | "long" | "off";

export interface SystemSettings {
  closeToTray: boolean; // FR-N5
  autostart: boolean; // FR-N4
  globalShortcut: string; // FR-N3 (accelerator string)
  strictMode: boolean; // FR-T7
  notifications: boolean; // FR-N1 toggle
  breakEnforcement: BreakEnforcement; // FR-E6
  escapeHoldSecs: number; // FR-E5 (3–10)
}

type AllSettings = CycleSettings & SystemSettings;

interface SettingsState extends AllSettings {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDuration: (mode: "focus" | "short_break" | "long_break", minutes: number) => void;
  set: (patch: Partial<AllSettings>) => void;
}

const PERSISTED_KEYS: (keyof AllSettings)[] = [
  "focus",
  "short_break",
  "long_break",
  "sessionsBeforeLongBreak",
  "autoStartBreaks",
  "autoStartFocus",
  "closeToTray",
  "autostart",
  "globalShortcut",
  "strictMode",
  "notifications",
  "breakEnforcement",
  "escapeHoldSecs",
];

export const useSettings = create<SettingsState>((set) => ({
  focus: 25,
  short_break: 5,
  long_break: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  closeToTray: true,
  autostart: false,
  globalShortcut: "CmdOrCtrl+Shift+P",
  strictMode: false,
  notifications: true,
  breakEnforcement: "every",
  escapeHoldSecs: 5,
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await loadSettings();
      const patch: Partial<AllSettings> = {};
      for (const k of PERSISTED_KEYS) {
        if (stored[k] !== undefined) (patch as Record<string, unknown>)[k] = stored[k];
      }
      set({ ...patch, hydrated: true });
    } catch {
      set({ hydrated: true }); // degrade to defaults; never block the UI
    }
  },

  setDuration: (mode, minutes) => {
    const v = Math.min(120, Math.max(1, Math.round(minutes)));
    set({ [mode]: v } as Partial<SettingsState>);
    void saveSetting(mode, v);
  },

  set: (patch) => {
    set(patch);
    for (const [k, v] of Object.entries(patch)) void saveSetting(k, v);
  },
}));
