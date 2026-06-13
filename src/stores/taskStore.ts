import { create } from "zustand";
import { localDay, localIso } from "../lib/datetime";
import {
  listTasks,
  insertTask,
  updateTask,
  deleteTask,
  reorderTasks,
  actualPomodoroCounts,
  unfinishedTasksBefore,
  type TaskRow,
} from "../lib/queries";
import { saveSetting, loadSettings } from "../lib/queries";

export interface Task {
  id: number;
  title: string;
  done: boolean;
  estPomodoros: number | null;
  actual: number;
  carriedFrom: string | null;
}

interface TaskState {
  date: string; // 'YYYY-MM-DD' currently viewed
  tasks: Task[];
  activeTaskId: number | null;
  carryCandidates: TaskRow[]; // unfinished from a prior day (FR-D4)

  hydrate: () => Promise<void>;
  load: (date: string) => Promise<void>;
  refreshCounts: () => Promise<void>;
  add: (title: string) => Promise<void>;
  toggleDone: (id: number) => void;
  editTitle: (id: number, title: string) => void;
  setEst: (id: number, n: number | null) => void;
  remove: (id: number) => void;
  reorder: (orderedIds: number[]) => void;
  setActive: (id: number | null) => void;
  carryOver: () => Promise<void>;
  goToday: () => void;
  goPrevDay: () => void;
  goNextDay: () => void;
}

const shiftDay = (date: string, delta: number): string => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return localDay(d);
};

const fromRow = (r: TaskRow, counts: Record<number, number>): Task => ({
  id: r.id,
  title: r.title,
  done: r.completed_at != null,
  estPomodoros: r.est_pomodoros,
  actual: counts[r.id] ?? 0,
  carriedFrom: r.carried_from,
});

let localId = -1; // ids for browser preview where the DB no-ops

export const useTaskStore = create<TaskState>((set, get) => ({
  date: localDay(),
  tasks: [],
  activeTaskId: null,
  carryCandidates: [],

  hydrate: async () => {
    try {
      const s = await loadSettings();
      const active = typeof s.activeTaskId === "number" ? s.activeTaskId : null;
      set({ activeTaskId: active });
    } catch {
      /* defaults */
    }
    await get().load(localDay());
  },

  load: async (date) => {
    const [rows, counts] = await Promise.all([listTasks(date), actualPomodoroCounts()]);
    const candidates = date === localDay() && rows.length === 0 ? await unfinishedTasksBefore(date) : [];
    set({ date, tasks: rows.map((r) => fromRow(r, counts)), carryCandidates: candidates });
  },

  refreshCounts: async () => {
    const counts = await actualPomodoroCounts();
    set((st) => ({ tasks: st.tasks.map((t) => ({ ...t, actual: counts[t.id] ?? t.actual })) }));
  },

  add: async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = (await insertTask(trimmed, get().date)) ?? localId--;
    set((st) => ({
      tasks: [...st.tasks, { id, title: trimmed, done: false, estPomodoros: null, actual: 0, carriedFrom: null }],
    }));
  },

  toggleDone: (id) => {
    let nowDone = false;
    set((st) => ({
      tasks: st.tasks.map((t) => (t.id === id ? ((nowDone = !t.done), { ...t, done: nowDone }) : t)),
    }));
    void updateTask(id, { completed_at: nowDone ? localIso() : null });
  },

  editTitle: (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    set((st) => ({ tasks: st.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t)) }));
    void updateTask(id, { title: trimmed });
  },

  setEst: (id, n) => {
    set((st) => ({ tasks: st.tasks.map((t) => (t.id === id ? { ...t, estPomodoros: n } : t)) }));
    void updateTask(id, { est_pomodoros: n });
  },

  remove: (id) => {
    set((st) => ({
      tasks: st.tasks.filter((t) => t.id !== id),
      activeTaskId: st.activeTaskId === id ? null : st.activeTaskId,
    }));
    void deleteTask(id);
  },

  reorder: (orderedIds) => {
    set((st) => {
      const byId = new Map(st.tasks.map((t) => [t.id, t]));
      return { tasks: orderedIds.map((id) => byId.get(id)!).filter(Boolean) };
    });
    void reorderTasks(orderedIds);
  },

  setActive: (id) => {
    const next = get().activeTaskId === id ? null : id;
    set({ activeTaskId: next });
    void saveSetting("activeTaskId", next);
  },

  carryOver: async () => {
    const { carryCandidates, date } = get();
    for (const c of carryCandidates) {
      await insertTask(c.title, date, c.est_pomodoros, c.task_date);
    }
    await get().load(date);
  },

  goToday: () => void get().load(localDay()),
  goPrevDay: () => void get().load(shiftDay(get().date, -1)),
  goNextDay: () => void get().load(shiftDay(get().date, 1)),
}));
