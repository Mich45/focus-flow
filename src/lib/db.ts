import Database from "@tauri-apps/plugin-sql";

/**
 * True only inside the Tauri runtime. In a plain browser (preview/dev of the
 * UI) there is no SQL plugin, so persistence is skipped and the app runs with
 * in-memory defaults. Every query helper guards on this.
 */
export function persistenceAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

let dbPromise: Promise<Database> | null = null;

/** Lazily open `focusflow.db`, with WAL + FK enforcement. Migrations run in Rust. */
export function getDb(): Promise<Database> {
  if (!persistenceAvailable()) {
    return Promise.reject(new Error("SQL not available outside the Tauri runtime"));
  }
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:focusflow.db").then(async (db) => {
      // WAL: unexpected shutdown loses at most the in-flight write (NFR-5).
      await db.execute("PRAGMA journal_mode=WAL;");
      await db.execute("PRAGMA foreign_keys=ON;");
      return db;
    });
  }
  return dbPromise;
}
