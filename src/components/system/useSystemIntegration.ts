import { useEffect, useRef } from "react";
import { useSettings } from "../../stores/settingsStore";
import { useTimerStore, selectRemainingMs } from "../../stores/timerStore";
import { formatMMSS, MODE_LABEL } from "../../lib/time";
import { ensureNotificationPermission, notify } from "../../lib/notify";
import {
  setCloseToTray,
  updateTrayTooltip,
  onTrayEvent,
  registerGlobalShortcut,
  unregisterAllShortcuts,
  syncAutostart,
} from "../../lib/system";

/** Strict mode blocks pause/skip during a running focus session (FR-T7). */
function strictBlocked(): boolean {
  const { strictMode } = useSettings.getState();
  const { status, mode } = useTimerStore.getState();
  return strictMode && mode === "focus" && status === "running";
}
function guardedToggle() {
  if (strictBlocked()) return;
  useTimerStore.getState().toggle();
}
function guardedSkip() {
  if (strictBlocked()) return;
  useTimerStore.getState().skip();
}

/**
 * Connects the timer to OS integration: tray menu actions, the start/pause
 * global shortcut, autostart, close-to-tray, end-of-session notifications, and
 * the tray tooltip countdown (FR-N1–N5, FR-T8). All no-op outside Tauri.
 */
export function useSystemIntegration(): void {
  const closeToTray = useSettings((s) => s.closeToTray);
  const autostart = useSettings((s) => s.autostart);
  const globalShortcut = useSettings((s) => s.globalShortcut);
  const notifications = useSettings((s) => s.notifications);
  const completions = useTimerStore((s) => s.completions);
  const timer = useTimerStore();
  const settings = useSettings();

  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  useEffect(() => {
    void setCloseToTray(closeToTray);
  }, [closeToTray]);

  useEffect(() => {
    void syncAutostart(autostart);
  }, [autostart]);

  useEffect(() => {
    void registerGlobalShortcut(globalShortcut, guardedToggle);
    return () => {
      void unregisterAllShortcuts();
    };
  }, [globalShortcut]);

  // Tray menu actions push events the frontend handles.
  useEffect(() => {
    let active = true;
    let unlisten: (() => void)[] = [];
    void Promise.all([
      onTrayEvent("tray://start-pause", guardedToggle),
      onTrayEvent("tray://skip", guardedSkip),
    ]).then((fns) => {
      if (active) unlisten = fns;
      else fns.forEach((f) => f());
    });
    return () => {
      active = false;
      unlisten.forEach((f) => f());
    };
  }, []);

  // End-of-session notification, naming the next session (FR-N1).
  const prevCompletions = useRef(completions);
  useEffect(() => {
    if (completions > prevCompletions.current && notifications) {
      const mode = useTimerStore.getState().mode;
      void notify("Session complete", `Time for ${MODE_LABEL[mode].toLowerCase()}.`);
    }
    prevCompletions.current = completions;
  }, [completions, notifications]);

  // Tray tooltip countdown while running (FR-T8); only push on change.
  const lastTip = useRef("");
  useEffect(() => {
    const remaining = selectRemainingMs(timer, settings);
    const tip =
      timer.status === "running"
        ? `${formatMMSS(remaining)} · ${MODE_LABEL[timer.mode]}`
        : "FocusFlow";
    if (tip !== lastTip.current) {
      lastTip.current = tip;
      void updateTrayTooltip(tip);
    }
  });
}
