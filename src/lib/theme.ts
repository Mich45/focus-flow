import type { Mode } from "./time";
import type { ThemeChoice } from "../stores/appearanceStore";

/** Brand accent used everywhere when per-mode accent is off. */
export const ACCENT_DEFAULT = "#2D6A4F";

/** Per-mode accent palette (FR-C4): warm focus, calm breaks. */
const MODE_ACCENT: Record<Mode, string> = {
  focus: "#C2410C",
  short_break: "#2D6A4F",
  long_break: "#1B4332",
};

export function accentFor(mode: Mode, followsMode: boolean): string {
  return followsMode ? MODE_ACCENT[mode] : ACCENT_DEFAULT;
}

/** Resolve "system" against the OS preference. */
export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return choice;
}
