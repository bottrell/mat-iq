import { DatabaseSync } from 'node:sqlite';
import { beforeEach, describe, expect, it } from 'vitest';
import { MIGRATIONS } from '../src/db/schema.ts';
import { localDateKey, WORKOUT_SUMMARY_SQL } from '../src/db/logs.ts';

/**
 * expo-sqlite only runs on a device, so these exercise the schema itself
 * against Node's SQLite. Same SQL, same constraint engine — enough to catch
 * invalid DDL and constraints that silently do nothing.
 */
function migrated(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  for (const migration of MIGRATIONS) db.exec(migration);
  return db;
}

// sqlite_sequence is created by SQLite itself for AUTOINCREMENT columns.
const tableNames = (db: DatabaseSync): string[] =>
  (
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[]
  )
    .map((r) => r.name)
    .sort();

describe('migrations', () => {
  it('apply cleanly from an empty database', () => {
    expect(tableNames(migrated())).toEqual(
      ['bjj_sessions', 'logged_sets', 'mat_logs', 'profile', 'workout_logs'].sort(),
    );
  });

  it('are each independently valid, applied in order', () => {
    const db = new DatabaseSync(':memory:');
    for (const migration of MIGRATIONS) {
      expect(() => db.exec(migration)).not.toThrow();
    }
  });

  it('cannot be applied twice — a re-run would mean a version-tracking bug', () => {
    const db = migrated();
    expect(() => db.exec(MIGRATIONS[0]!)).toThrow();
  });
});

describe('constraints', () => {
  let db: DatabaseSync;
  beforeEach(() => {
    db = migrated();
  });

  const insertWorkout = () =>
    db
      .prepare('INSERT INTO workout_logs (date, day, label, started_at) VALUES (?, ?, ?, ?)')
      .run('2026-09-09', 2, 'Full Body A', '2026-09-09T18:00:00Z');

  it('rejects a weekday outside 0-6', () => {
    expect(() =>
      db
        .prepare('INSERT INTO workout_logs (date, day, label, started_at) VALUES (?, ?, ?, ?)')
        .run('2026-09-09', 9, 'Bad', 'now'),
    ).toThrow();
  });

  it('rejects an unknown mat session type', () => {
    expect(() =>
      db
        .prepare(
          'INSERT INTO mat_logs (date, day, rounds, intensity, session_type, logged_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run('2026-09-09', 2, 5, 'medium', 'wrestling', 'now'),
    ).toThrow();
  });

  it('rejects an unknown intensity', () => {
    expect(() =>
      db
        .prepare(
          'INSERT INTO mat_logs (date, day, rounds, intensity, session_type, logged_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run('2026-09-09', 2, 5, 'brutal', 'gi', 'now'),
    ).toThrow();
  });

  it('accepts every session type the app offers', () => {
    for (const type of ['gi', 'nogi', 'open_mat', 'drilling']) {
      expect(() =>
        db
          .prepare(
            'INSERT INTO mat_logs (date, day, rounds, intensity, session_type, logged_at) VALUES (?, ?, ?, ?, ?, ?)',
          )
          .run('2026-09-09', 2, 5, 'medium', type, 'now'),
      ).not.toThrow();
    }
  });

  it('rejects negative rounds and reps', () => {
    expect(() =>
      db
        .prepare(
          'INSERT INTO mat_logs (date, day, rounds, intensity, session_type, logged_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .run('2026-09-09', 2, -3, 'medium', 'gi', 'now'),
    ).toThrow();
  });

  it('refuses a set that belongs to no workout', () => {
    expect(() =>
      db
        .prepare(
          `INSERT INTO logged_sets
             (workout_log_id, exercise_id, exercise_name, set_index, reps, prescribed_in, logged_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(999, 'back-squat', 'Back Squat', 0, 5, 'reps', 'now'),
    ).toThrow();
  });

  it('deletes a workout\'s sets along with it', () => {
    insertWorkout();
    db.prepare(
      `INSERT INTO logged_sets
         (workout_log_id, exercise_id, exercise_name, set_index, reps, prescribed_in, logged_at)
       VALUES (1, 'back-squat', 'Back Squat', 0, 5, 'reps', 'now')`,
    ).run();

    expect((db.prepare('SELECT COUNT(*) AS n FROM logged_sets').get() as any).n).toBe(1);
    db.prepare('DELETE FROM workout_logs WHERE id = 1').run();
    expect((db.prepare('SELECT COUNT(*) AS n FROM logged_sets').get() as any).n).toBe(0);
  });

  it('allows only one profile row', () => {
    const insert = db.prepare(
      'INSERT INTO profile (id, experience, goals) VALUES (?, ?, ?)',
    );
    insert.run(1, 'intermediate', '["strength"]');
    expect(() => insert.run(2, 'beginner', '["strength"]')).toThrow();
  });
});

describe('localDateKey', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(localDateKey(new Date(2026, 8, 9, 21, 30))).toBe('2026-09-09');
  });

  it('pads single-digit months and days', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses the local day, not UTC — a late workout stays on today', () => {
    // 11pm local. toISOString() would roll this into tomorrow in any timezone
    // west of UTC, filing the workout under the wrong day.
    const lateNight = new Date(2026, 8, 9, 23, 0);
    expect(localDateKey(lateNight)).toBe('2026-09-09');
  });
});

describe('workout summaries', () => {
  let db: DatabaseSync;

  const addSet = (
    exerciseId: string,
    reps: number,
    weightLb: number | null,
    prescribedIn: string,
  ) =>
    db
      .prepare(
        `INSERT INTO logged_sets
           (workout_log_id, exercise_id, exercise_name, set_index, reps, weight_lb, prescribed_in, logged_at)
         VALUES (1, ?, ?, 0, ?, ?, ?, 'now')`,
      )
      .run(exerciseId, exerciseId, reps, weightLb, prescribedIn);

  const summary = () =>
    db.prepare(WORKOUT_SUMMARY_SQL.replace('{where}', '')).get() as {
      set_count: number;
      total_reps: number;
      volume_lb: number;
    };

  beforeEach(() => {
    db = migrated();
    db.prepare(
      "INSERT INTO workout_logs (date, day, label, started_at) VALUES ('2026-09-09', 2, 'Full Body A', 'now')",
    ).run();
  });

  it('reports zeroes for a workout with no sets rather than dropping it', () => {
    // A LEFT JOIN is load-bearing here: an INNER JOIN would hide the workout.
    expect(summary()).toMatchObject({ set_count: 0, total_reps: 0, volume_lb: 0 });
  });

  it('sums volume as reps times weight', () => {
    addSet('back-squat', 5, 225, 'reps');
    addSet('back-squat', 5, 225, 'reps');
    expect(summary().volume_lb).toBe(2250);
  });

  it('excludes carries and holds from volume', () => {
    // 40 yards of a carry is not 40 "reps" of load moved. Counting seconds and
    // yards as volume would inflate the number into meaninglessness.
    addSet('back-squat', 5, 200, 'reps');
    addSet('farmers-carry', 40, 70, 'yards');
    addSet('plate-pinch', 30, 45, 'seconds');
    expect(summary().volume_lb).toBe(1000);
  });

  it('counts every set and rep regardless of unit', () => {
    addSet('back-squat', 5, 200, 'reps');
    addSet('farmers-carry', 40, 70, 'yards');
    expect(summary()).toMatchObject({ set_count: 2, total_reps: 45 });
  });

  it('treats bodyweight sets as zero volume, not null', () => {
    addSet('pull-up', 8, null, 'reps');
    expect(summary().volume_lb).toBe(0);
  });
});
