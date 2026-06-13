import { Clock, Flame, CheckCircle2, Zap } from "lucide-react";
import type { StatsData, Range } from "../../lib/stats";

const hours = (m: number) => (m / 60).toFixed(1);

/** Focus time · sessions · tasks · streak (FR-S2, FR-S4). */
export function SummaryCards({ data, range }: { data: StatsData; range: Range }) {
  const cards = [
    { icon: Clock, label: range === "week" ? "This week" : "This month", value: `${hours(data.totalMinutes)}h`, sub: `${data.totalSessions} focus sessions`, wash: "var(--success-wash)" },
    { icon: Zap, label: "Sessions", value: String(data.totalSessions), sub: "completed focus blocks", wash: "var(--green-tint)" },
    { icon: CheckCircle2, label: "Tasks done", value: String(data.tasksCompleted), sub: "in this period", wash: "var(--green-tint-2)" },
    { icon: Flame, label: "Day streak", value: String(data.currentStreak), sub: data.bestStreak > 0 ? `best: ${data.bestStreak} days` : "start today", wash: "var(--warning-wash)" },
  ];

  return (
    <div className="mb-[22px] flex gap-3">
      {cards.map((c) => {
        const Ico = c.icon;
        return (
          <div key={c.label} className="card min-w-0 flex-1 p-[14px_16px]">
            <div className="mb-2.5 flex items-center gap-2" style={{ color: "var(--ui-text-2)" }}>
              <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px]" style={{ background: c.wash, color: "var(--accent)" }}>
                <Ico size={15} />
              </span>
              <span className="whitespace-nowrap text-[12px] font-semibold">{c.label}</span>
            </div>
            <div className="text-[26px] font-bold leading-none" style={{ fontFamily: "var(--font-display)", color: "var(--ui-text)", letterSpacing: "-.01em" }}>
              {c.value}
            </div>
            <div className="mt-[5px] text-[11.5px]" style={{ color: "var(--ui-text-3)" }}>
              {c.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
