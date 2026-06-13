-- FocusFlow initial schema (SRS §5). Timestamps are ISO 8601 strings with the
-- local UTC offset so day-boundary stats respect the user's timezone.

-- One row per timer session (focus or break).
CREATE TABLE sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT NOT NULL CHECK (type IN ('focus','short_break','long_break')),
  started_at      TEXT NOT NULL,
  ended_at        TEXT,
  planned_minutes INTEGER NOT NULL,
  completed       INTEGER NOT NULL DEFAULT 0,
  task_id         INTEGER REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE TABLE tasks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  task_date       TEXT NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  est_pomodoros   INTEGER,
  completed_at    TEXT,
  carried_from    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE media (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  kind            TEXT NOT NULL CHECK (kind IN ('audio','image')),
  source          TEXT NOT NULL CHECK (source IN ('bundled','user')),
  name            TEXT NOT NULL,
  path            TEXT NOT NULL
);

CREATE TABLE settings (
  key             TEXT PRIMARY KEY,
  value           TEXT NOT NULL
);

CREATE INDEX idx_sessions_started ON sessions(started_at);
CREATE INDEX idx_tasks_date ON tasks(task_date);
