import { useTimerStore, selectRemainingMs } from "../../stores/timerStore";
import { useSettings } from "../../stores/settingsStore";
import { formatMMSS, progress, durationMs, PHASE_WORD } from "../../lib/time";

const R = 140;
const C = 2 * Math.PI * R;

/** Progress ring + mm:ss display + phase label (SRS §6). */
export function TimerCard() {
  const timer = useTimerStore();
  const settings = useSettings();

  const remaining = selectRemainingMs(timer, settings);
  const total = durationMs(timer.mode, settings);
  const frac = progress(remaining, total);
  const offset = C * (1 - frac);
  const running = timer.status === "running";

  // Which focus session we're on, within the cycle, for the "x of N" label.
  const idx =
    timer.mode === "focus"
      ? Math.min(timer.focusCountInCycle + 1, settings.sessionsBeforeLongBreak)
      : timer.focusCountInCycle || settings.sessionsBeforeLongBreak;

  return (
    <div className="relative z-10 mt-9 mb-2 flex items-center justify-center">
      <svg width="320" height="320" viewBox="0 0 320 320" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="160" cy="160" r={R} fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="10" />
        <circle
          cx="160"
          cy="160"
          r={R}
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{
            transition: running
              ? "stroke-dashoffset 1s linear"
              : "stroke-dashoffset .4s var(--ease-std)",
            filter: "drop-shadow(0 0 10px rgba(255,255,255,.4))",
          }}
        />
      </svg>

      <div
        className="absolute flex flex-col items-center text-white"
        // Promote the text to its own GPU layer so WebKit rasterizes it once and
        // composites it over the ring — otherwise the per-second-animating,
        // drop-shadow-filtered SVG below forces glyph re-rasterization and the
        // label occasionally renders corrupted (e.g. "Long break" → "Shng break").
        style={{ transform: "translateZ(0)" }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 128,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            textShadow: "0 4px 30px rgba(0,0,0,.4)",
          }}
        >
          {formatMMSS(remaining)}
        </div>
        <div className="mt-1.5 flex items-center gap-2 whitespace-nowrap text-[13.5px] font-medium" style={{ color: "rgba(255,255,255,.78)" }}>
          <span>{PHASE_WORD[timer.mode]}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>
            {idx} of {settings.sessionsBeforeLongBreak}
          </span>
        </div>
      </div>
    </div>
  );
}
