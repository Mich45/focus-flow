import { useTimerStore } from "../../stores/timerStore";
import { useSettings } from "../../stores/settingsStore";

/** Cycle progress dots — filled = completed focus sessions this cycle (FR-T4). */
export function SessionDots() {
  const focusCountInCycle = useTimerStore((s) => s.focusCountInCycle);
  const total = useSettings((s) => s.sessionsBeforeLongBreak);

  return (
    <div className="relative z-10 mt-[30px] flex gap-2" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-[9px] w-[9px] rounded-full transition-colors"
          style={{
            background: i < focusCountInCycle ? "var(--accent)" : "rgba(255,255,255,.26)",
          }}
        />
      ))}
    </div>
  );
}
