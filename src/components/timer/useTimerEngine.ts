import { useEffect } from "react";
import { useTimerStore, selectRemainingMs } from "../../stores/timerStore";
import { useSettings } from "../../stores/settingsStore";
import { formatMMSS, MODE_LABEL } from "../../lib/time";

/**
 * Mount once near the app root. Drives the timer:
 *  - a 250 ms interval that re-renders subscribers; remaining time is derived
 *    from the stored targetEnd, so the interval only triggers renders (FR-T6).
 *  - recomputes immediately on visibilitychange / window focus so sleep and
 *    webview throttling never cause drift (NFR-3).
 *  - keeps the window title in sync while running (FR-T8).
 */
export function useTimerEngine(): void {
  const tick = useTimerStore((s) => s.tick);
  const syncNow = useTimerStore((s) => s.syncNow);

  useEffect(() => {
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [tick]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") syncNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", syncNow);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", syncNow);
    };
  }, [syncNow]);

  // Window title: "12:34 · Focus — FocusFlow" while running, else "FocusFlow".
  const status = useTimerStore((s) => s.status);
  const mode = useTimerStore((s) => s.mode);
  const timer = useTimerStore();
  const settings = useSettings();
  useEffect(() => {
    const remaining = selectRemainingMs(timer, settings);
    document.title =
      status === "running"
        ? `${formatMMSS(remaining)} · ${MODE_LABEL[mode]} — FocusFlow`
        : "FocusFlow";
  }, [status, mode, timer, settings]);
}
