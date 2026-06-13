import { useEffect, useRef, useState } from "react";
import { formatMMSS } from "../../lib/time";
import { closeBreakOverlay, escapeBreak } from "../../lib/system";

interface Props {
  primary: boolean;
  durationSecs: number;
  holdSecs: number;
}

/**
 * Full-screen break overlay content (FR-E1, FR-E5). Self-contained: reads its
 * config from props (passed via URL), counts down from a target timestamp
 * (NFR-3), auto-dismisses at zero (FR-E4), and offers an ESC-hold escape that
 * cannot be disabled. Uses no stores/DB — runs under the minimal `break`
 * capability (FR-E7).
 */
export function BreakOverlay({ primary, durationSecs, holdSecs }: Props) {
  const targetEnd = useRef(Date.now() + durationSecs * 1000);
  const [now, setNow] = useState(Date.now());
  const [holdProgress, setHoldProgress] = useState(0); // 0..1
  const holdStart = useRef<number | null>(null);

  // Countdown + auto-dismiss.
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (primary && t >= targetEnd.current) void closeBreakOverlay();
    }, 250);
    return () => window.clearInterval(id);
  }, [primary]);

  // ESC-hold escape (FR-E5). Hold for holdSecs → escape; release resets.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (holdStart.current == null) return;
      const p = Math.min(1, (Date.now() - holdStart.current) / (holdSecs * 1000));
      setHoldProgress(p);
      if (p >= 1) {
        holdStart.current = null;
        setHoldProgress(0);
        void escapeBreak();
        return;
      }
      raf = window.setTimeout(tick, 40);
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      if (holdStart.current == null) {
        holdStart.current = Date.now();
        tick();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      holdStart.current = null;
      window.clearTimeout(raf);
      setHoldProgress(0);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.clearTimeout(raf);
    };
  }, [holdSecs]);

  const remaining = Math.max(0, targetEnd.current - now);

  // Secondary monitors: dim blank only.
  if (!primary) {
    return <div className="flex h-screen w-screen items-center justify-center" style={{ background: "#05080a" }} />;
  }

  const R = 14;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="flex h-screen w-screen select-none flex-col items-center justify-center"
      style={{ background: "#05080a", color: "rgba(255,255,255,.92)" }}
    >
      <div className="text-[15px] font-medium uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,.45)" }}>
        Time for a break
      </div>
      <div
        className="my-4"
        style={{ fontFamily: "var(--font-display)", fontSize: 120, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}
      >
        {formatMMSS(remaining)}
      </div>
      <div className="max-w-[420px] text-center text-[14px]" style={{ color: "rgba(255,255,255,.5)" }}>
        Step away from the screen. The timer will bring you back.
      </div>

      {/* ESC-hold escape hint with radial progress */}
      <div className="absolute bottom-12 flex items-center gap-2.5 text-[12.5px]" style={{ color: "rgba(255,255,255,.4)" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="16" cy="16" r={R} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2.5" />
          <circle cx="16" cy="16" r={R} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - holdProgress)} />
        </svg>
        <span>Hold ESC for {holdSecs}s to skip the break</span>
      </div>
    </div>
  );
}
