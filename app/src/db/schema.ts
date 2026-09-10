import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schema migrations, applied in order. `user_version` tracks how far we've got,
 * so a returning user only runs what's new.
 *
 * Weights are always stored in pounds. The kg toggle is a display concern and
 * converts at the edges — storing both units invites drift.
 */
const MIGRATIONS: string[] = [
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
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.execAsync(MIGRATIONS[version]!);
    // PRAGMA does not accept bound parameters, and version is a loop counter,
    // never user input.
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}
