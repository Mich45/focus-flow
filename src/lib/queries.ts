import { getDb, persistenceAvailable } from "./db";
import { localIso, localDay } from "./datetime";
import type { Mode } from "./time";

/* ----------------------------- settings ------------------------------ */
/** key → JSON-encoded value (FR-C3). */

export async function loadSettings(): Promise<Record<string, unknown>> {
  if (!persistenceAvailable()) return {};
  const db = await getDb();
  const rows = await db.select<{ key: string; value: string }[]>(
    "SELECT key, value FROM settings"
  );
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  if (!persistenceAvailable()) return;
  const db = await getDb();
  await db.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) " +
      "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, JSON.stringify(value)]
  );
}

/* ------------------------------ sessions ----------------------------- */
/* One row per timer session; insert on start, finalize on end (FR-T9). */

export interface SessionStart {
  type: Mode;
  plannedMinutes: number;
  taskId?: number | null;
}

/** Insert a session at start; returns its id (or null when not persisting). */
export async function insertSession(s: SessionStart): Promise<number | null> {
  if (!persistenceAvailable()) return null;
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO sessions (type, started_at, planned_minutes, completed, task_id) " +
      "VALUES ($1, $2, $3, 0, $4)",
    [s.type, localIso(), s.plannedMinutes, s.taskId ?? null]
  );
  return res.lastInsertId ?? null;
}

/** Finalize a session: set ended_at and completed (1 = ran to 100%). */
export async function completeSession(id: number, completed: boolean): Promise<void> {
  if (!persistenceAvailable()) return;
  const db = await getDb();
  await db.execute("UPDATE sessions SET ended_at = $1, completed = $2 WHERE id = $3", [
    localIso(),
    completed ? 1 : 0,
    id,
  ]);
}

/* ----------------------------- export / reset ------------------------ */

export interface SessionRow {
  id: number;
  type: string;
  started_at: string;
  ended_at: string | null;
  planned_minutes: number;
  completed: number;
  task_id: number | null;
}

export async function allSessions(): Promise<SessionRow[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  return db.select<SessionRow[]>("SELECT * FROM sessions ORDER BY started_at");
}

export async function allTasks(): Promise<TaskRow[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  return db.select<TaskRow[]>("SELECT * FROM tasks ORDER BY task_date, position, id");
}

/** Wipe all rows from every table (factory reset, FR-X2). */
export async function clearAllData(): Promise<void> {
  if (!persistenceAvailable()) return;
  const db = await getDb();
  for (const t of ["sessions", "tasks", "media", "settings"]) {
    await db.execute(`DELETE FROM ${t}`);
  }
}

/* ------------------------------- stats ------------------------------- */
/* All derived from `sessions` at query time (FR-S7). Days are grouped by the
   LOCAL date — substr(...,1,10) of the offset-aware ISO string — so boundaries
   respect the user's timezone without UTC conversion. */

export interface DayMinutesRow {
  day: string;
  minutes: number;
  sessions: number;
}

/** Completed-focus minutes & session counts per local day in [start,end]. */
export async function focusByDay(start: string, end: string): Promise<DayMinutesRow[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  return db.select<DayMinutesRow[]>(
    "SELECT substr(started_at,1,10) AS day, " +
      "SUM(planned_minutes) AS minutes, COUNT(*) AS sessions FROM sessions " +
      "WHERE type='focus' AND completed=1 AND substr(started_at,1,10) BETWEEN $1 AND $2 " +
      "GROUP BY day",
    [start, end]
  );
}

/** Tasks completed (by completed_at local day) in [start,end]. */
export async function tasksCompletedBetween(start: string, end: string): Promise<number> {
  if (!persistenceAvailable()) return 0;
  const db = await getDb();
  const rows = await db.select<{ n: number }[]>(
    "SELECT COUNT(*) AS n FROM tasks WHERE completed_at IS NOT NULL " +
      "AND substr(completed_at,1,10) BETWEEN $1 AND $2",
    [start, end]
  );
  return rows[0]?.n ?? 0;
}

/** Focus minutes per task over [start,end] (FR-S5). */
export async function perTaskMinutes(
  start: string,
  end: string
): Promise<{ title: string; minutes: number }[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  return db.select<{ title: string; minutes: number }[]>(
    "SELECT t.title AS title, SUM(s.planned_minutes) AS minutes FROM sessions s " +
      "JOIN tasks t ON s.task_id = t.id " +
      "WHERE s.type='focus' AND s.completed=1 AND substr(s.started_at,1,10) BETWEEN $1 AND $2 " +
      "GROUP BY t.id ORDER BY minutes DESC",
    [start, end]
  );
}

/** Distinct local days with ≥1 completed focus session — for streaks (FR-S4). */
export async function distinctFocusDays(): Promise<string[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  const rows = await db.select<{ day: string }[]>(
    "SELECT DISTINCT substr(started_at,1,10) AS day FROM sessions " +
      "WHERE type='focus' AND completed=1 ORDER BY day"
  );
  return rows.map((r) => r.day);
}

/* ------------------------------- tasks ------------------------------- */
/* CRUD helpers; the task UI/store lands in Phase 5 (FR-D). */

export interface TaskRow {
  id: number;
  title: string;
  task_date: string;
  position: number;
  est_pomodoros: number | null;
  completed_at: string | null;
  carried_from: string | null;
  created_at: string;
}

export async function listTasks(date: string = localDay()): Promise<TaskRow[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  return db.select<TaskRow[]>(
    "SELECT * FROM tasks WHERE task_date = $1 ORDER BY position, id",
    [date]
  );
}

export async function insertTask(
  title: string,
  date: string = localDay(),
  estPomodoros: number | null = null,
  carriedFrom: string | null = null
): Promise<number | null> {
  if (!persistenceAvailable()) return null;
  const db = await getDb();
  const res = await db.execute(
    "INSERT INTO tasks (title, task_date, position, est_pomodoros, carried_from) " +
      "VALUES ($1, $2, (SELECT COALESCE(MAX(position) + 1, 0) FROM tasks WHERE task_date = $2), $3, $4)",
    [title, date, estPomodoros, carriedFrom]
  );
  return res.lastInsertId ?? null;
}

/** Completed focus sessions per task → the "actual" pomodoro tally (FR-D2). */
export async function actualPomodoroCounts(): Promise<Record<number, number>> {
  if (!persistenceAvailable()) return {};
  const db = await getDb();
  const rows = await db.select<{ task_id: number; n: number }[]>(
    "SELECT task_id, COUNT(*) AS n FROM sessions " +
      "WHERE type='focus' AND completed=1 AND task_id IS NOT NULL GROUP BY task_id"
  );
  const out: Record<number, number> = {};
  for (const r of rows) out[r.task_id] = r.n;
  return out;
}

/** Persist a new task ordering (FR-D1). */
export async function reorderTasks(orderedIds: number[]): Promise<void> {
  if (!persistenceAvailable()) return;
  const db = await getDb();
  await Promise.all(
    orderedIds.map((id, i) => db.execute("UPDATE tasks SET position = $1 WHERE id = $2", [i, id]))
  );
}

/** The most recent day before `date` that still has unfinished tasks (FR-D4). */
export async function unfinishedTasksBefore(date: string = localDay()): Promise<TaskRow[]> {
  if (!persistenceAvailable()) return [];
  const db = await getDb();
  const day = await db.select<{ task_date: string }[]>(
    "SELECT task_date FROM tasks WHERE completed_at IS NULL AND task_date < $1 " +
      "ORDER BY task_date DESC LIMIT 1",
    [date]
  );
  if (day.length === 0) return [];
  return db.select<TaskRow[]>(
    "SELECT * FROM tasks WHERE task_date = $1 AND completed_at IS NULL ORDER BY position, id",
    [day[0].task_date]
  );
}

export async function updateTask(
  id: number,
  patch: Partial<Pick<TaskRow, "title" | "position" | "est_pomodoros" | "completed_at">>
): Promise<void> {
  if (!persistenceAvailable()) return;
  const entries = Object.entries(patch);
  if (entries.length === 0) return;
  const db = await getDb();
  const sets = entries.map(([k], i) => `${k} = $${i + 2}`).join(", ");
  await db.execute(`UPDATE tasks SET ${sets} WHERE id = $1`, [id, ...entries.map(([, v]) => v)]);
}

export async function deleteTask(id: number): Promise<void> {
  if (!persistenceAvailable()) return;
  const db = await getDb();
  await db.execute("DELETE FROM tasks WHERE id = $1", [id]);
}
