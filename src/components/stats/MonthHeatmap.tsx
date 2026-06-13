import { getDay, format } from "date-fns";
import type { StatsData } from "../../lib/stats";
import { localDay } from "../../lib/datetime";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

const level = (m: number) => (m <= 0 ? 0 : m < 40 ? 1 : m < 80 ? 2 : m < 130 ? 3 : 4);
const heatColor = (lv: number) => {
  if (lv === 0) return "var(--ui-sunken)";
  const a = [0, 0.28, 0.5, 0.74, 1][lv];
  return `color-mix(in srgb, var(--accent) ${a * 100}%, transparent)`;
};

/** Calendar heatmap of daily focus minutes (FR-S3). */
export function MonthHeatmap({ data }: { data: StatsData }) {
  const today = localDay();
  const first = new Date(`${data.days[0]?.day ?? data.start}T00:00:00`);
  const lead = (getDay(first) + 6) % 7; // Mon = 0
  const cells: ({ day: string; n: number } | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...data.days.map((d) => ({ day: d.day, n: d.minutes })),
  ];
  const activeDays = data.days.filter((d) => d.minutes > 0).length;

  return (
    <div className="card p-[18px_20px_16px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[14px] font-bold" style={{ color: "var(--ui-text)" }}>
          {format(first, "MMMM yyyy")}
        </div>
        <div className="text-[12px]" style={{ color: "var(--ui-text-3)" }}>
          {activeDays} active days
        </div>
      </div>

      <div className="grid max-w-[340px] grid-cols-7 gap-1.5">
        {DOW.map((d, i) => (
          <div key={`h${i}`} className="mb-0.5 text-center text-[10.5px] font-semibold" style={{ color: "var(--ui-text-3)" }}>
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={`b${i}`} />;
          const future = c.day > today;
          const isToday = c.day === today;
          const lv = level(c.n);
          return (
            <div
              key={c.day}
              title={`${format(new Date(`${c.day}T00:00:00`), "MMM d")}: ${c.n} min`}
              className="flex items-start justify-end p-[3px]"
              style={{
                aspectRatio: "1",
                borderRadius: 6,
                background: future ? "transparent" : heatColor(lv),
                border: isToday
                  ? "1.6px solid var(--accent)"
                  : future
                    ? "none"
                    : "0.5px solid var(--ui-border)",
              }}
            >
              <span className="text-[9px] font-semibold" style={{ color: lv >= 3 ? "#fff" : "var(--ui-text-3)" }}>
                {Number(c.day.slice(8))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--ui-text-3)" }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((lv) => (
          <span key={lv} className="h-[13px] w-[13px] rounded-[4px]" style={{ background: heatColor(lv), border: lv === 0 ? "0.5px solid var(--ui-border)" : "none" }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
