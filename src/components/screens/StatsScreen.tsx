import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { localDay } from "../../lib/datetime";
import { loadStats, rangeBounds, shiftAnchor, type Range, type StatsData } from "../../lib/stats";
import { useTimerStore } from "../../stores/timerStore";
import { SummaryCards } from "../stats/SummaryCards";
import { FocusBarChart } from "../stats/FocusBarChart";
import { MonthHeatmap } from "../stats/MonthHeatmap";
import { TaskBreakdown } from "../stats/TaskBreakdown";

/** Statistics — Week/Month views with prev/next navigation (FR-S). */
export function StatsScreen() {
  const [range, setRange] = useState<Range>("week");
  const [anchor, setAnchor] = useState(() => new Date());
  const [data, setData] = useState<StatsData | null>(null);
  const dataVersion = useTimerStore((s) => s.dataVersion);
  const dateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void loadStats(range, anchor).then((d) => {
      if (alive) setData(d);
    });
    return () => {
      alive = false;
    };
  }, [range, anchor, dataVersion]);

  const { start, end } = rangeBounds(range, anchor);
  const rangeLabel =
    range === "week" ? `${format(start, "MMM d")} – ${format(end, "MMM d")}` : format(start, "MMMM yyyy");
  const atPresent = end >= new Date();

  return (
    <div className="sheet fade-up">
      <div className="sheet-head">
        <div>
          <h1 className="sheet-title">Your Activity</h1>
          <div className="sheet-sub">Focus time across the week and month</div>
        </div>
        <div className="seg">
          {(["week", "month"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`seg-btn capitalize${range === r ? " on" : ""}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="sheet-body">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setAnchor((a) => shiftAnchor(range, a, -1))} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "var(--ui-text-2)", background: "var(--ui-sunken)" }} aria-label="Previous">
              <ChevronLeft size={17} />
            </button>
            <span className="min-w-[150px] text-center text-[13.5px] font-semibold" style={{ color: "var(--ui-text)" }}>
              {rangeLabel}
            </span>
            <button onClick={() => setAnchor((a) => shiftAnchor(range, a, 1))} disabled={atPresent} className="flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ color: "var(--ui-text-2)", background: "var(--ui-sunken)" }} aria-label="Next">
              <ChevronRight size={17} />
            </button>
            <button
              onClick={() => {
                const el = dateRef.current;
                if (el?.showPicker) el.showPicker();
                else el?.focus();
              }}
              className="relative ml-1 flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: "var(--ui-text-2)", background: "var(--ui-sunken)" }}
              title="Jump to date"
              aria-label="Jump to date"
            >
              <CalendarDays size={16} />
              <input
                ref={dateRef}
                type="date"
                value={localDay(anchor)}
                max={localDay()}
                onChange={(e) => e.target.value && setAnchor(new Date(`${e.target.value}T00:00:00`))}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                tabIndex={-1}
                aria-label="Jump to date"
              />
            </button>
          </div>
        </div>

        {data && !data.everActive ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center" style={{ color: "var(--ui-text-3)" }}>
            <BarChart3 size={42} strokeWidth={1.5} />
            <div className="text-[15px] font-semibold" style={{ color: "var(--ui-text-2)" }}>
              You haven't done any focus sessions yet
            </div>
            <div className="max-w-[300px] text-[12.5px] leading-relaxed">
              Complete a focus session and your activity, streaks, and per-task breakdown will show up here.
            </div>
          </div>
        ) : data ? (
          <>
            <SummaryCards data={data} range={range} />
            {data.totalSessions === 0 ? (
              <div className="card flex flex-col items-center justify-center gap-1.5 py-12 text-center" style={{ color: "var(--ui-text-3)" }}>
                <div className="text-[13.5px] font-medium">No focus sessions this {range}</div>
                <div className="text-[12px]">Try another {range} with the arrows above.</div>
              </div>
            ) : range === "week" ? (
              <FocusBarChart data={data} />
            ) : (
              <MonthHeatmap data={data} />
            )}
            {data.perTask.length > 0 && <TaskBreakdown data={data} />}
          </>
        ) : null}
      </div>
    </div>
  );
}
