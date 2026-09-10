import type { SQLiteDatabase } from 'expo-sqlite';
import type { Exercise, Intensity, Weekday } from '@mat-iq/engine';

/** What kind of mat session it actually was. Logged, never planned. */
export type SessionType = 'gi' | 'nogi' | 'open_mat' | 'drilling';

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  gi: 'Gi',
  nogi: 'No-Gi',
  open_mat: 'Open Mat',
  drilling: 'Drilling',
};

export interface WorkoutLog {
  id: number;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  day: Weekday;
  label: string;
  startedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface LoggedSet {
  id: number;
  workoutLogId: number;
  exerciseId: string;
  exerciseName: string;
  setIndex: number;
  reps: number;
  weightLb?: number;
  prescribedIn: Exercise['prescribedIn'];
  loggedAt: string;
}

export interface MatLog {
  id: number;
  date: string;
  day: Weekday;
  rounds: number;
  intensity: Intensity;
  sessionType: SessionType;
  notes?: string;
  loggedAt: string;
}

/** Local calendar day, not UTC — a 9pm workout must not land on tomorrow. */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const undef = <T>(value: T | null): T | undefined => (value === null ? undefined : value);

// ---------------------------------------------------------------- workouts

export async function startWorkout(
  db: SQLiteDatabase,
  input: { date: string; day: Weekday; label: string },
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO workout_logs (date, day, label, started_at) VALUES (?, ?, ?, ?)',
    [input.date, input.day, input.label, new Date().toISOString()],
  );
  return result.lastInsertRowId;
}

/** The workout still in progress, if any. Only one is allowed at a time. */
export async function activeWorkout(db: SQLiteDatabase): Promise<WorkoutLog | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM workout_logs WHERE completed_at IS NULL ORDER BY id DESC LIMIT 1',
  );
  return row ? toWorkoutLog(row) : null;
}

export async function completeWorkout(
  db: SQLiteDatabase,
  id: number,
  notes?: string,
): Promise<void> {
  await db.runAsync('UPDATE workout_logs SET completed_at = ?, notes = ? WHERE id = ?', [
    new Date().toISOString(),
    notes ?? null,
    id,
  ]);
}

/** Abandoning a workout removes it and its sets rather than leaving a stub. */
export async function discardWorkout(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM workout_logs WHERE id = ?', [id]);
}

export async function listWorkouts(
  db: SQLiteDatabase,
  options: { from?: string; to?: string; completedOnly?: boolean } = {},
): Promise<WorkoutLog[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (options.completedOnly) where.push('completed_at IS NOT NULL');
  if (options.from) {
    where.push('date >= ?');
    params.push(options.from);
  }
  if (options.to) {
    where.push('date <= ?');
    params.push(options.to);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM workout_logs ${clause} ORDER BY date DESC, id DESC`,
    params,
  );
  return rows.map(toWorkoutLog);
}

// -------------------------------------------------------------------- sets

export async function logSet(
  db: SQLiteDatabase,
  input: Omit<LoggedSet, 'id' | 'loggedAt'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO logged_sets
       (workout_log_id, exercise_id, exercise_name, set_index, reps, weight_lb, prescribed_in, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.workoutLogId,
      input.exerciseId,
      input.exerciseName,
      input.setIndex,
      input.reps,
      input.weightLb ?? null,
      input.prescribedIn,
      new Date().toISOString(),
    ],
  );
  return result.lastInsertRowId;
}

export async function deleteSet(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM logged_sets WHERE id = ?', [id]);
}

export async function listSets(db: SQLiteDatabase, workoutLogId: number): Promise<LoggedSet[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM logged_sets WHERE workout_log_id = ? ORDER BY id',
    [workoutLogId],
  );
  return rows.map(
    (r): LoggedSet => ({
      id: r.id,
      workoutLogId: r.workout_log_id,
      exerciseId: r.exercise_id,
      exerciseName: r.exercise_name,
      setIndex: r.set_index,
      reps: r.reps,
      weightLb: undef(r.weight_lb),
      prescribedIn: r.prescribed_in,
      loggedAt: r.logged_at,
    }),
  );
}

// ---------------------------------------------------------------- mat logs

export async function logMatSession(
  db: SQLiteDatabase,
  input: Omit<MatLog, 'id' | 'loggedAt'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO mat_logs (date, day, rounds, intensity, session_type, notes, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.date,
      input.day,
      input.rounds,
      input.intensity,
      input.sessionType,
      input.notes ?? null,
      new Date().toISOString(),
    ],
  );
  return result.lastInsertRowId;
}

export async function deleteMatLog(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM mat_logs WHERE id = ?', [id]);
}

export async function listMatLogs(
  db: SQLiteDatabase,
  options: { from?: string; to?: string } = {},
): Promise<MatLog[]> {
  const where: string[] = [];
  const params: string[] = [];

  if (options.from) {
    where.push('date >= ?');
    params.push(options.from);
  }
  if (options.to) {
    where.push('date <= ?');
    params.push(options.to);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM mat_logs ${clause} ORDER BY date DESC, id DESC`,
    params,
  );
  return rows.map(
    (r): MatLog => ({
      id: r.id,
      date: r.date,
      day: r.day as Weekday,
      rounds: r.rounds,
      intensity: r.intensity as Intensity,
      sessionType: r.session_type as SessionType,
      notes: undef(r.notes),
      loggedAt: r.logged_at,
    }),
  );
}

function toWorkoutLog(row: any): WorkoutLog {
  return {
    id: row.id,
    date: row.date,
    day: row.day as Weekday,
    label: row.label,
    startedAt: row.started_at,
    completedAt: undef(row.completed_at),
    notes: undef(row.notes),
  };
}
