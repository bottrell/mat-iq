import type { BjjSession, Intensity, Weekday } from './types.ts';

/**
 * Cost of simply attending a session — warmup, drilling, technique, being thrown
 * around — before any rolling. A drilling-only session (0 rounds) costs just this.
 */
const ATTENDANCE_COST: Record<Intensity, number> = {
  light: 0.5,
  medium: 1.0,
  hard: 1.5,
};

/** Marginal cost of each competitive round at a given intensity. */
const ROUND_COST: Record<Intensity, number> = {
  light: 0.4,
  medium: 0.9,
  hard: 1.5,
};

/**
 * Systemic fatigue from one mat session, in arbitrary but consistent units.
 * Calibration reference: six hard rounds ~= 10.5, six medium rounds ~= 6.4.
 */
export function sessionFatigue(session: BjjSession): number {
  const rounds = Math.max(0, session.rounds);
  return ATTENDANCE_COST[session.intensity] + rounds * ROUND_COST[session.intensity];
}

/** Total mat fatigue across a training week. */
export function weeklyFatigue(sessions: readonly BjjSession[]): number {
  return sessions.reduce((total, s) => total + sessionFatigue(s), 0);
}

/** Mat fatigue indexed by weekday, summing multiple sessions on the same day. */
export function fatigueByDay(sessions: readonly BjjSession[]): Record<Weekday, number> {
  const byDay = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<Weekday, number>;
  for (const session of sessions) {
    byDay[session.day] += sessionFatigue(session);
  }
  return byDay;
}

/** True when any session that day was rolled hard. */
export function hardDays(sessions: readonly BjjSession[]): Set<Weekday> {
  const days = new Set<Weekday>();
  for (const s of sessions) {
    if (s.intensity === 'hard' && s.rounds > 0) days.add(s.day);
  }
  return days;
}
