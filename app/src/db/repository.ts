import type { SQLiteDatabase } from 'expo-sqlite';
import type { BjjSession, ExperienceLevel, Goal, Intensity, Weekday } from '@mat-iq/engine';

export type Units = 'lb' | 'kg';

/** A mat session as stored — the engine's BjjSession plus its row id. */
export interface StoredSession extends BjjSession {
  id: number;
}

export interface StoredProfile {
  experience: ExperienceLevel;
  goals: Goal[];
  units: Units;
  bodyweightLb?: number;
  weightClassTargetLb?: number;
  workingWeightsLb: {
    squat?: number;
    hinge?: number;
    press?: number;
    row?: number;
  };
  liftDaysOverride?: number;
  onboardedAt?: string;
}

interface ProfileRow {
  experience: string;
  goals: string;
  units: string;
  bodyweight_lb: number | null;
  weight_class_target_lb: number | null;
  squat_lb: number | null;
  hinge_lb: number | null;
  press_lb: number | null;
  row_lb: number | null;
  lift_days_override: number | null;
  onboarded_at: string | null;
}

const orUndefined = (value: number | string | null): any => (value === null ? undefined : value);

export async function getProfile(db: SQLiteDatabase): Promise<StoredProfile | null> {
  const row = await db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1');
  if (!row) return null;

  return {
    experience: row.experience as ExperienceLevel,
    goals: JSON.parse(row.goals) as Goal[],
    units: row.units as Units,
    bodyweightLb: orUndefined(row.bodyweight_lb),
    weightClassTargetLb: orUndefined(row.weight_class_target_lb),
    workingWeightsLb: {
      squat: orUndefined(row.squat_lb),
      hinge: orUndefined(row.hinge_lb),
      press: orUndefined(row.press_lb),
      row: orUndefined(row.row_lb),
    },
    liftDaysOverride: orUndefined(row.lift_days_override),
    onboardedAt: orUndefined(row.onboarded_at),
  };
}

export async function saveProfile(db: SQLiteDatabase, profile: StoredProfile): Promise<void> {
  await db.runAsync(
    `INSERT INTO profile (
       id, experience, goals, units, bodyweight_lb, weight_class_target_lb,
       squat_lb, hinge_lb, press_lb, row_lb, lift_days_override, onboarded_at
     ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       experience = excluded.experience,
       goals = excluded.goals,
       units = excluded.units,
       bodyweight_lb = excluded.bodyweight_lb,
       weight_class_target_lb = excluded.weight_class_target_lb,
       squat_lb = excluded.squat_lb,
       hinge_lb = excluded.hinge_lb,
       press_lb = excluded.press_lb,
       row_lb = excluded.row_lb,
       lift_days_override = excluded.lift_days_override,
       onboarded_at = excluded.onboarded_at`,
    [
      profile.experience,
      JSON.stringify(profile.goals),
      profile.units,
      profile.bodyweightLb ?? null,
      profile.weightClassTargetLb ?? null,
      profile.workingWeightsLb.squat ?? null,
      profile.workingWeightsLb.hinge ?? null,
      profile.workingWeightsLb.press ?? null,
      profile.workingWeightsLb.row ?? null,
      profile.liftDaysOverride ?? null,
      profile.onboardedAt ?? null,
    ],
  );
}

export async function listSessions(db: SQLiteDatabase): Promise<StoredSession[]> {
  const rows = await db.getAllAsync<{
    id: number;
    day: number;
    rounds: number;
    intensity: string;
  }>('SELECT id, day, rounds, intensity FROM bjj_sessions ORDER BY day, id');

  return rows.map((r) => ({
    id: r.id,
    day: r.day as Weekday,
    rounds: r.rounds,
    intensity: r.intensity as Intensity,
  }));
}

export async function addSession(
  db: SQLiteDatabase,
  session: BjjSession,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO bjj_sessions (day, rounds, intensity) VALUES (?, ?, ?)',
    [session.day, session.rounds, session.intensity],
  );
  return result.lastInsertRowId;
}

export async function updateSession(
  db: SQLiteDatabase,
  id: number,
  changes: Partial<Pick<BjjSession, 'rounds' | 'intensity'>>,
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (changes.rounds !== undefined) {
    fields.push('rounds = ?');
    values.push(Math.max(0, changes.rounds));
  }
  if (changes.intensity !== undefined) {
    fields.push('intensity = ?');
    values.push(changes.intensity);
  }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE bjj_sessions SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteSession(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM bjj_sessions WHERE id = ?', [id]);
}

/** Wipes everything. Used by the reset action in settings. */
export async function resetAll(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DELETE FROM bjj_sessions; DELETE FROM profile;');
}
