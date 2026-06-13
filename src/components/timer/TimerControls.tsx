import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useTimerStore } from "../../stores/timerStore";
import { useSettings } from "../../stores/settingsStore";

/** Reset · Start/Pause · Skip (FR-T3). Strict mode locks pause/skip mid-focus (FR-T7). */
export function TimerControls() {
  const status = useTimerStore((s) => s.status);
  const mode = useTimerStore((s) => s.mode);
  const toggle = useTimerStore((s) => s.toggle);
  const reset = useTimerStore((s) => s.reset);
  const skip = useTimerStore((s) => s.skip);
  const strictMode = useSettings((s) => s.strictMode);
  const running = status === "running";

  // During a running focus session, strict mode disables pause & skip and makes
  // reset require confirmation.
  const locked = strictMode && mode === "focus" && running;

  const onReset = () => {
    if (locked && !window.confirm("Strict mode is on. Reset this focus session?")) return;
    reset();
  };

  return (
    <div className="relative z-10 flex items-center gap-[18px]">
      <button
        onClick={onReset}
        title="Reset"
        aria-label="Reset"
        className="glass flex h-[52px] w-[52px] items-center justify-center rounded-full transition active:scale-95"
        style={{ color: "rgba(255,255,255,.85)" }}
      >
        <RotateCcw size={20} />
      </button>

      <button
        onClick={() => !locked && toggle()}
        disabled={locked}
        aria-label={running ? "Pause" : "Start"}
        title={locked ? "Strict mode: stay focused" : running ? "Pause" : "Start"}
        className="flex h-[60px] min-w-[168px] items-center justify-center gap-2.5 rounded-full text-[17px] font-bold text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: "var(--accent)", boxShadow: "0 10px 30px rgba(0,0,0,.34)" }}
      >
        {running ? <Pause size={22} strokeWidth={2.2} /> : <Play size={22} strokeWidth={2.2} />}
        {running ? "Pause" : "Start"}
      </button>

      <button
        onClick={() => !locked && skip()}
        disabled={locked}
        title={locked ? "Strict mode: stay focused" : "Skip"}
        aria-label="Skip"
        className="glass flex h-[52px] w-[52px] items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ color: "rgba(255,255,255,.85)" }}
      >
        <SkipForward size={20} />
      </button>
    </div>
  );
}
