import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schema migrations, applied in order. `user_version` tracks how far we've got,
 * so a returning user only runs what's new.
 *
 * Weights are always stored in pounds. The kg toggle is a display concern and
 * converts at the edges — storing both units invites drift.
 */
export const MIGRATIONS: string[] = [
  // v1: profile and mat schedule
  `
  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    experience TEXT NOT NULL,
    goals TEXT NOT NULL,
    units TEXT NOT NULL DEFAULT 'lb',
    bodyweight_lb REAL,
    weight_class_target_lb REAL,
    squat_lb REAL,
    hinge_lb REAL,
    press_lb REAL,
    row_lb REAL,
    lift_days_override INTEGER,
    onboarded_at TEXT
  );

  CREATE TABLE bjj_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
    rounds INTEGER NOT NULL CHECK (rounds >= 0),
    intensity TEXT NOT NULL CHECK (intensity IN ('light', 'medium', 'hard'))
  );

  CREATE INDEX bjj_sessions_day ON bjj_sessions (day);
  `,

  // v2: completed work. Logs are a record of what happened and never rewrite
  // the plan — see "Planned vs logged" in the README.
  `
  CREATE TABLE workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
    label TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    notes TEXT
  );

  CREATE TABLE logged_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_log_id INTEGER NOT NULL REFERENCES workout_logs (id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    set_index INTEGER NOT NULL,
    reps INTEGER NOT NULL CHECK (reps >= 0),
    weight_lb REAL,
    prescribed_in TEXT NOT NULL CHECK (prescribed_in IN ('reps', 'seconds', 'yards')),
    logged_at TEXT NOT NULL
  );

  CREATE TABLE mat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
    rounds INTEGER NOT NULL CHECK (rounds >= 0),
    intensity TEXT NOT NULL CHECK (intensity IN ('light', 'medium', 'hard')),
    session_type TEXT NOT NULL CHECK (session_type IN ('gi', 'nogi', 'open_mat', 'drilling')),
    notes TEXT,
    logged_at TEXT NOT NULL
  );

  CREATE INDEX workout_logs_date ON workout_logs (date);
  CREATE INDEX mat_logs_date ON mat_logs (date);
  CREATE INDEX logged_sets_workout ON logged_sets (workout_log_id);
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  // Declared ON DELETE CASCADE is inert in SQLite without this.
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.execAsync(MIGRATIONS[version]!);
    // PRAGMA does not accept bound parameters, and version is a loop counter,
    // never user input.
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}
