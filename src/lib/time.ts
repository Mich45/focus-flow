/**
 * Pure timer math. No React, no stores — trivially testable.
 *
 * Remaining time is always derived from a target end-timestamp (FR-T6/NFR-3),
 * never from accumulated ticks, so it stays correct across webview throttling
 * and system sleep.
 */

export type Mode = "focus" | "short_break" | "long_break";

export const MODES: Mode[] = ["focus", "short_break", "long_break"];

/** Minutes per mode. */
export interface Durations {
  focus: number;
  short_break: number;
  long_break: number;
}

/** Everything the cycle logic needs. */
export interface CycleSettings extends Durations {
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export const MS_PER_MIN = 60_000;

export function durationMs(mode: Mode, d: Durations): number {
  return d[mode] * MS_PER_MIN;
}

/** Milliseconds left until `targetEnd`, clamped at 0. */
export function remainingMs(targetEnd: number, now: number = Date.now()): number {
  return Math.max(0, targetEnd - now);
}

/** `mm:ss`, rounding up so the display hits 00:00 exactly when time is up. */
export function formatMMSS(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 0..1 elapsed fraction of the current session. */
export function progress(remaining: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (total - remaining) / total));
}

/**
 * Which mode follows the one that just finished.
 * `focusCountInCycle` is the running count of completed focus sessions in the
 * current cycle, taken AFTER incrementing for the focus session that just ended.
 */
export function nextMode(
  finished: Mode,
  focusCountInCycle: number,
  sessionsBeforeLongBreak: number
): Mode {
  if (finished === "focus") {
    return focusCountInCycle % sessionsBeforeLongBreak === 0
      ? "long_break"
      : "short_break";
  }
  return "focus";
}

/** Whether the upcoming mode should auto-start (FR-T5). */
export function shouldAutoStart(upcoming: Mode, s: CycleSettings): boolean {
  return upcoming === "focus" ? s.autoStartFocus : s.autoStartBreaks;
}

export const MODE_LABEL: Record<Mode, string> = {
  focus: "Focus",
  short_break: "Short Break",
  long_break: "Long Break",
};

export const PHASE_WORD: Record<Mode, string> = {
  focus: "Focus session",
  short_break: "Short break",
  long_break: "Long break",
};
