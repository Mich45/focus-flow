import { useEffect, useRef } from "react";
import { useTimerStore } from "../../stores/timerStore";
import { useSettings, type BreakEnforcement } from "../../stores/settingsStore";
import { showBreakOverlay, closeBreakOverlay, onTrayEvent } from "../../lib/system";
import type { Mode } from "../../lib/time";

function enforces(e: BreakEnforcement, mode: Mode): boolean {
  if (e === "off") return false;
  if (e === "long") return mode === "long_break";
  return mode === "short_break" || mode === "long_break";
}

/**
 * Drives break enforcement from the main window (FR-E4/E6). When a focus session
 * completes and enforcement applies, force the break to run and show the overlay;
 * when the break ends, close it. Listens for the overlay's ESC escape (FR-E5).
 * The overlay invoke wrappers no-op outside Tauri, so the browser just runs the
 * break normally.
 */
export function useBreakEnforcement(): void {
  const completions = useTimerStore((s) => s.completions);
  const prev = useRef(completions);

  useEffect(() => {
    if (completions <= prev.current) {
      prev.current = completions;
      return;
    }
    prev.current = completions;

    const t = useTimerStore.getState();
    const s = useSettings.getState();

    if (t.mode !== "focus") {
      // A focus session just completed — we're now in a break.
      if (enforces(s.breakEnforcement, t.mode)) {
        if (t.status !== "running") t.start(); // enforcement forces the break to run
        const minutes = t.mode === "long_break" ? s.long_break : s.short_break;
        void showBreakOverlay(minutes * 60, s.escapeHoldSecs);
      }
    } else {
      // A break just completed — back to focus; tear down the overlay (FR-E4).
      void closeBreakOverlay();
    }
  }, [completions]);

  // ESC escape from the overlay → record the break incomplete and resume (FR-E5).
  useEffect(() => {
    let active = true;
    let unlisten = () => {};
    void onTrayEvent("break://escaped", () => {
      const t = useTimerStore.getState();
      if (t.mode !== "focus") t.skip();
    }).then((f) => {
      if (active) unlisten = f;
      else f();
    });
    return () => {
      active = false;
      unlisten();
    };
  }, []);
}
