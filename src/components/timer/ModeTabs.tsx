import { Target, Coffee } from "lucide-react";
import { MODES, MODE_LABEL, type Mode } from "../../lib/time";
import { useTimerStore } from "../../stores/timerStore";

const ICON: Record<Mode, typeof Target> = {
  focus: Target,
  short_break: Coffee,
  long_break: Coffee,
};

/** Mode switcher (FR-T1). Frosted glass pill over the wallpaper. */
export function ModeTabs() {
  const mode = useTimerStore((s) => s.mode);
  const setMode = useTimerStore((s) => s.setMode);

  return (
    <div
      className="glass relative z-10 flex gap-0.5 rounded-[13px] p-1"
      role="tablist"
      aria-label="Timer mode"
    >
      {MODES.map((m) => {
        const on = mode === m;
        const Ico = ICON[m];
        return (
          <button
            key={m}
            role="tab"
            aria-selected={on}
            onClick={() => setMode(m)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-[9px] px-[18px] py-[9px] text-[13px] font-semibold transition-all"
            style={{
              background: on ? "var(--accent)" : "transparent",
              color: on ? "#fff" : "rgba(255,255,255,.66)",
              boxShadow: on ? "0 4px 14px rgba(0,0,0,.28)" : "none",
            }}
          >
            <Ico size={15} strokeWidth={2} />
            {MODE_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}
