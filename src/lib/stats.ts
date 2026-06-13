import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  addMonths,
} from "date-fns";
import { localDay } from "./datetime";
import { focusByDay, tasksCompletedBetween, perTaskMinutes, distinctFocusDays } from "./queries";

export type Range = "week" | "month";

export interface DayStat {
  day: string; // YYYY-MM-DD
  minutes: number;
  sessions: number;
}
export interface StatsData {
  start: string;
  end: string;
  days: DayStat[];
  totalMinutes: number;
  totalSessions: number;
  tasksCompleted: number;
  currentStreak: number;
  bestStreak: number;
  perTask: { title: string; minutes: number }[];
  everActive: boolean; // any completed focus session, ever
}

const WEEK_OPTS = { weekStartsOn: 1 as const };

export function rangeBounds(range: Range, anchor: Date): { start: Date; end: Date } {
  return range === "week"
    ? { start: startOfWeek(anchor, WEEK_OPTS), end: endOfWeek(anchor, WEEK_OPTS) }
    : { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

export function shiftAnchor(range: Range, anchor: Date, delta: number): Date {
  return range === "week" ? addWeeks(anchor, delta) : addMonths(anchor, delta);
}

function addDaysStr(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return localDay(d);
}
function isConsecutive(a: string, b: string): boolean {
  return addDaysStr(a, 1) === b;
}

/** Current (ending today) and best consecutive-day streaks (FR-S4). */
export function computeStreaks(days: string[]): { current: number; best: number } {
  if (days.length === 0) return { current: 0, best: 0 };
  const set = new Set(days);
  const sorted = [...new Set(days)].sort();

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && isConsecutive(prev, d) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  let current = 0;
  let cursor = localDay();
  while (set.has(cursor)) {
    current += 1;
    cursor = addDaysStr(cursor, -1);
  }
  return { current, best };
}

export async function loadStats(range: Range, anchor: Date): Promise<StatsData> {
  const { start, end } = rangeBounds(range, anchor);
  const startKey = localDay(start);
  const endKey = localDay(end);
  const dayList = eachDayOfInterval({ start, end }).map(localDay);

  // Always read real data; with no DB (browser preview) the queries return empty
  // and the UI shows the genuine "no sessions yet" state.
  const [byDay, tasksCompleted, perTask, allDays] = await Promise.all([
    focusByDay(startKey, endKey),
    tasksCompletedBetween(startKey, endKey),
    perTaskMinutes(startKey, endKey),
    distinctFocusDays(),
  ]);

  const map = new Map(byDay.map((r) => [r.day, r]));
  const days: DayStat[] = dayList.map((day) => {
    const r = map.get(day);
    return { day, minutes: r?.minutes ?? 0, sessions: r?.sessions ?? 0 };
  });
  const { current, best } = computeStreaks(allDays);

  return {
    start: startKey,
    end: endKey,
    days,
    totalMinutes: days.reduce((a, d) => a + d.minutes, 0),
    totalSessions: days.reduce((a, d) => a + d.sessions, 0),
    tasksCompleted,
    currentStreak: current,
    bestStreak: best,
    perTask,
    everActive: allDays.length > 0,
  };
}
