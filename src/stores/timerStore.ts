import { create } from "zustand";
import {
  type Mode,
  type CycleSettings,
  durationMs,
  remainingMs,
  nextMode,
  shouldAutoStart,
} from "../lib/time";
import { useSettings } from "./settingsStore";
import { useTaskStore } from "./taskStore";
import { insertSession, completeSession } from "../lib/queries";

export type TimerStatus = "idle" | "running" | "paused" | "finished";

interface TimerState {
  mode: Mode;
  status: TimerStatus;
  /** Epoch ms when the running session ends. Null unless running. */
  targetEnd: number | null;
  /** Remaining ms captured at pause. Null unless paused. */
  pausedRemainingMs: number | null;
  /** Completed focus sessions in the current cycle (resets after a long break). */
  focusCountInCycle: number;
  /** Monotonic count of sessions that ran to 100% — drives the end chime (FR-A6). */
  completions: number;
  /** Bumped AFTER a session row is finalized in the DB. Data views (stats, task
   *  tallies) key their refresh on this so they never read before the write
   *  commits — unlike `completions`, which fires synchronously for the chime. */
  dataVersion: number;
  /** Row id of the in-flight session, for finalizing it on end (FR-T9). */
  currentSessionId: number | null;
  /** Re-render heartbeat: bumped by tick() so derived remaining refreshes. */
  nowMs: number;

  start: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  skip: () => void;
  setMode: (mode: Mode) => void;
  /** Called ~4×/s by the engine; advances on completion (FR-T6). */
  tick: () => void;
  /** Recompute after sleep/throttle (visibilitychange, focus) (NFR-3). */
  syncNow: () => void;
}

const settings = (): CycleSettings => useSettings.getState();

export const useTimerStore = create<TimerState>((set, get) => {
  /** Persist a new session row for the mode now starting (focus links the active task, FR-D3). */
  function recordStart(mode: Mode) {
    const cfg = settings();
    const taskId = mode === "focus" ? useTaskStore.getState().activeTaskId : null;
    void insertSession({ type: mode, plannedMinutes: cfg[mode], taskId }).then((id) => {
      if (id != null) set({ currentSessionId: id });
    });
  }

  /** Finalize the in-flight session (completed = ran to 100%). Bump `dataVersion`
   *  only once the write has committed, so stats/task views re-query fresh data. */
  function recordEnd(completed: boolean) {
    const id = get().currentSessionId;
    set({ currentSessionId: null });
    if (id != null) {
      void completeSession(id, completed).then(() => {
        set({ dataVersion: get().dataVersion + 1 });
      });
    }
  }

  /** Move to the next mode in the cycle. `skipped` => current session incomplete. */
  function advance(skipped: boolean) {
    const s = get();
    const cfg = settings();

    recordEnd(!skipped); // the session that just ended

    let focusCountInCycle = s.focusCountInCycle;
    if (s.mode === "focus") focusCountInCycle += 1;

    const upcoming = nextMode(s.mode, focusCountInCycle, cfg.sessionsBeforeLongBreak);
    if (s.mode === "long_break") focusCountInCycle = 0; // long break closes the cycle

    const auto = !skipped && shouldAutoStart(upcoming, cfg);
    const now = Date.now();

    set({
      mode: upcoming,
      focusCountInCycle,
      completions: s.completions + (skipped ? 0 : 1), // natural completion → chime
      status: auto ? "running" : "idle",
      targetEnd: auto ? now + durationMs(upcoming, cfg) : null,
      pausedRemainingMs: null,
      nowMs: now,
    });

    if (auto) recordStart(upcoming);
  }

  return {
    mode: "focus",
    status: "idle",
    targetEnd: null,
    pausedRemainingMs: null,
    focusCountInCycle: 0,
    completions: 0,
    dataVersion: 0,
    currentSessionId: null,
    nowMs: Date.now(),

    start: () => {
      const s = get();
      const now = Date.now();
      if (s.status === "paused" && s.pausedRemainingMs != null) {
        set({
          status: "running",
          targetEnd: now + s.pausedRemainingMs,
          pausedRemainingMs: null,
          nowMs: now,
        });
        return; // resume keeps the same session row
      }
      set({
        status: "running",
        targetEnd: now + durationMs(s.mode, settings()),
        pausedRemainingMs: null,
        nowMs: now,
      });
      recordStart(s.mode);
    },

    pause: () => {
      const s = get();
      if (s.status !== "running" || s.targetEnd == null) return;
      set({
        status: "paused",
        pausedRemainingMs: remainingMs(s.targetEnd, Date.now()),
        targetEnd: null,
      });
    },

    toggle: () => {
      if (get().status === "running") get().pause();
      else get().start();
    },

    reset: () => {
      if (get().status !== "idle") recordEnd(false); // abandoned
      set({ status: "idle", targetEnd: null, pausedRemainingMs: null, nowMs: Date.now() });
    },

    skip: () => advance(true),

    setMode: (mode) => {
      if (get().status !== "idle") recordEnd(false); // abandoned
      set({ mode, status: "idle", targetEnd: null, pausedRemainingMs: null, nowMs: Date.now() });
    },

    tick: () => {
      const s = get();
      if (s.status !== "running" || s.targetEnd == null) return;
      if (Date.now() >= s.targetEnd) advance(false);
      else set({ nowMs: Date.now() });
    },

    syncNow: () => {
      const s = get();
      if (s.status !== "running" || s.targetEnd == null) return;
      if (Date.now() >= s.targetEnd) advance(false);
      else set({ nowMs: Date.now() });
    },
  };
});

/** Pure selector: ms left to show, valid in every status. */
export function selectRemainingMs(s: TimerState, cfg: CycleSettings): number {
  if (s.status === "running" && s.targetEnd != null) {
    return remainingMs(s.targetEnd, s.nowMs);
  }
  if (s.status === "paused" && s.pausedRemainingMs != null) {
    return s.pausedRemainingMs;
  }
  return durationMs(s.mode, cfg);
}
