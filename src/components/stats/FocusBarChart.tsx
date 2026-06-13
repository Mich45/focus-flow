import { format } from "date-fns";
import type { StatsData } from "../../lib/stats";
import { localDay } from "../../lib/datetime";

const hours = (m: number) => (m / 60).toFixed(1);
const DOW = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Daily focus-minutes bars (FR-S2). Hand-rolled CSS instead of Recharts:
 * matches the design pixel-for-pixel, keeps the bundle lean, and the heatmap
 * is hand-rolled too — consistent.
 */
export function FocusBarChart({ data }: { data: StatsData }) {
  const today = localDay();
  const max = Math.max(60, ...data.days.map((d) => d.minutes));
  const sessions = data.totalSessions;

  return (
    <div className="card mb-[18px] p-[18px_20px_14px]">
      <div className="mb-[18px] flex items-center justify-between">
        <div className="text-[14px] font-bold" style={{ color: "var(--ui-text)" }}>This week</div>
        <div className="text-[12px]" style={{ color: "var(--ui-text-3)" }}>
          {hours(data.totalMinutes)}h total · {sessions} sessions
        </div>
      </div>
      <div className="flex h-[150px] items-end gap-3.5">
        {data.days.map((d, i) => {
          const isToday = d.day === today;
          const future = d.day > today;
          const h = Math.max((d.minutes / max) * 100, d.minutes > 0 ? 6 : 0);
          return (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-2">
              <div className="mx-auto flex w-full max-w-[46px] flex-1 items-end">
                <div
                  title={`${d.minutes} min`}
                  style={{
                    width: "100%",
                    height: `${h}%`,
                    minHeight: d.minutes > 0 ? 6 : 0,
                    borderRadius: "6px 6px 3px 3px",
                    background: isToday
                      ? "var(--accent)"
                      : future
                        ? "var(--ui-sunken)"
                        : "color-mix(in srgb, var(--accent) 42%, transparent)",
                    border: future ? "1px dashed var(--ui-border-2)" : "none",
                    transition: "height .5s var(--ease-decel)",
                    animation: `fadeUp .5s ${i * 0.05}s both`,
                  }}
                />
              </div>
              <div className="text-[11.5px] font-semibold" style={{ color: isToday ? "var(--accent)" : "var(--ui-text-3)" }}>
                {DOW[i] ?? format(new Date(`${d.day}T00:00:00`), "d")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
