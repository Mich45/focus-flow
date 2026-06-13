import { useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { format, isToday, isYesterday, isTomorrow } from "date-fns";
import { useTaskStore } from "../../stores/taskStore";
import { localDay } from "../../lib/datetime";

export function DaySwitcher() {
  const date = useTaskStore((s) => s.date);
  const load = useTaskStore((s) => s.load);
  const goPrev = useTaskStore((s) => s.goPrevDay);
  const goNext = useTaskStore((s) => s.goNextDay);
  const goToday = useTaskStore((s) => s.goToday);
  const dateRef = useRef<HTMLInputElement>(null);

  const d = new Date(`${date}T00:00:00`);
  const label = isToday(d)
    ? "Today"
    : isYesterday(d)
      ? "Yesterday"
      : isTomorrow(d)
        ? "Tomorrow"
        : format(d, "EEE, MMM d");
  const atToday = date === localDay();

  const openPicker = () => {
    const el = dateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  return (
    <div className="flex items-center gap-1.5">
      {!atToday && (
        <button onClick={goToday} className="btn btn-ghost mr-1 !py-1.5 !text-[12px]">
          Today
        </button>
      )}
      <button onClick={goPrev} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "var(--ui-text-2)", background: "var(--ui-sunken)" }} aria-label="Previous day">
        <ChevronLeft size={17} />
      </button>

      <button
        onClick={openPicker}
        className="relative flex min-w-[110px] items-center justify-center gap-1.5 rounded-lg px-2 py-1 text-[13.5px] font-semibold"
        style={{ color: "var(--ui-text)" }}
        title="Pick a date"
      >
        <CalendarDays size={14} style={{ color: "var(--ui-text-3)" }} />
        {label}
        {/* native date input drives the jump; visually hidden but focusable */}
        <input
          ref={dateRef}
          type="date"
          value={date}
          max={localDay()}
          onChange={(e) => e.target.value && void load(e.target.value)}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          tabIndex={-1}
          aria-label="Jump to date"
        />
      </button>

      <button onClick={goNext} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "var(--ui-text-2)", background: "var(--ui-sunken)" }} aria-label="Next day">
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
