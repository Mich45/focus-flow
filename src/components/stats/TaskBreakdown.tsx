import type { StatsData } from "../../lib/stats";

const hours = (m: number) => (m / 60).toFixed(1);

/** Focus minutes per task for the period (FR-S5). */
export function TaskBreakdown({ data }: { data: StatsData }) {
  if (data.perTask.length === 0) return null;
  const max = Math.max(...data.perTask.map((t) => t.minutes), 1);

  return (
    <div className="card mt-[18px] p-[18px_20px]">
      <div className="mb-3.5 text-[14px] font-bold" style={{ color: "var(--ui-text)" }}>
        By task
      </div>
      <div className="flex flex-col gap-2.5">
        {data.perTask.slice(0, 8).map((t) => (
          <div key={t.title} className="flex items-center gap-3">
            <span className="w-[40%] min-w-0 truncate text-[13px]" style={{ color: "var(--ui-text)" }} title={t.title}>
              {t.title}
            </span>
            <span className="h-[8px] flex-1 overflow-hidden rounded-full" style={{ background: "var(--ui-sunken)" }}>
              <span className="block h-full rounded-full" style={{ width: `${(t.minutes / max) * 100}%`, background: "var(--accent)" }} />
            </span>
            <span className="w-12 text-right text-[12px] tabular-nums" style={{ color: "var(--ui-text-2)" }}>
              {hours(t.minutes)}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
