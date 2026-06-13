import { persistenceAvailable } from "./db";
import { allSessions, allTasks, clearAllData } from "./queries";
import { localIso } from "./datetime";

export type ExportFormat = "json" | "csv";

/* ----------------------------- formatting ---------------------------- */
/* Pure + testable. */

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsvSection(title: string, columns: string[], rows: Record<string, unknown>[]): string {
  const head = `# ${title}\n${columns.join(",")}`;
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")).join("\n");
  return rows.length ? `${head}\n${body}` : `${head}`;
}

const SESSION_COLS = ["id", "type", "started_at", "ended_at", "planned_minutes", "completed", "task_id"];
const TASK_COLS = ["id", "title", "task_date", "position", "est_pomodoros", "completed_at", "carried_from", "created_at"];

export function buildExport(
  format: ExportFormat,
  sessions: Record<string, unknown>[],
  tasks: Record<string, unknown>[]
): string {
  if (format === "json") {
    return JSON.stringify({ exportedAt: localIso(), sessions, tasks }, null, 2);
  }
  // CSV: two labelled sections in one file (sessions, then tasks).
  return `${toCsvSection("sessions", SESSION_COLS, sessions)}\n\n${toCsvSection("tasks", TASK_COLS, tasks)}\n`;
}

/* ------------------------------- actions ----------------------------- */

/** Gather all data, ask for a path, and write it (FR-X1). Returns the saved path or null. */
export async function exportData(format: ExportFormat): Promise<string | null> {
  if (!persistenceAvailable()) return null;
  const [sessions, tasks] = await Promise.all([allSessions(), allTasks()]);
  const contents = buildExport(
    format,
    sessions as unknown as Record<string, unknown>[],
    tasks as unknown as Record<string, unknown>[]
  );

  const { save } = await import("@tauri-apps/plugin-dialog");
  const { invoke } = await import("@tauri-apps/api/core");
  const ext = format === "json" ? "json" : "csv";
  const path = await save({
    defaultPath: `focusflow-export.${ext}`,
    filters: [{ name: format.toUpperCase(), extensions: [ext] }],
  });
  if (!path) return null; // user cancelled
  await invoke("save_text_file", { path, contents });
  return path;
}

/** Delete all stored data and user media, then reload to a clean state (FR-X2). */
export async function factoryReset(): Promise<void> {
  if (!persistenceAvailable()) return;
  await clearAllData();
  try {
    const { remove, BaseDirectory } = await import("@tauri-apps/plugin-fs");
    for (const dir of ["backgrounds", "sounds"]) {
      await remove(dir, { baseDir: BaseDirectory.AppData, recursive: true }).catch(() => {});
    }
  } catch {
    /* media dirs may not exist — ignore */
  }
  window.location.reload(); // re-hydrate every store from the now-empty DB
}
