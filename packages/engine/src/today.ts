import type { BjjSession, LiftSession, Routine, Weekday } from './types.ts';

/**
 * JavaScript weeks start on Sunday; training weeks start on Monday.
 * This is the only place that conversion should happen.
 */
export function weekdayFromDate(date: Date): Weekday {
  return ((date.getDay() + 6) % 7) as Weekday;
}

export type PlanKind = 'lift' | 'mat' | 'both' | 'rest';

export interface DayPlan {
  day: Weekday;
  kind: PlanKind;
  /** The programmed lift, when there is one. */
  lift?: LiftSession;
  /** Planned mat sessions for the day. Empty on a non-mat day. */
  matSessions: BjjSession[];
}

/** What the athlete is doing on a given weekday. */
export function planForDay(
  routine: Routine | null,
  matSessions: readonly BjjSession[],
  day: Weekday,
): DayPlan {
  const lift = routine?.sessions.find((s) => s.day === day);
  const mat = matSessions.filter((s) => s.day === day);

  const kind: PlanKind =
    lift && mat.length > 0 ? 'both' : lift ? 'lift' : mat.length > 0 ? 'mat' : 'rest';

  return { day, kind, lift, matSessions: mat };
}

export function planForDate(
  routine: Routine | null,
  matSessions: readonly BjjSession[],
  date: Date,
): DayPlan {
  return planForDay(routine, matSessions, weekdayFromDate(date));
}

export interface NextUp {
  day: Weekday;
  kind: Exclude<PlanKind, 'rest'>;
  /** 1 means tomorrow. */
  daysAway: number;
}

/**
 * The next day with anything on it, searching forward and wrapping the week.
 * Returns undefined when the week is entirely empty.
 */
export function nextTrainingDay(
  routine: Routine | null,
  matSessions: readonly BjjSession[],
  fromDay: Weekday,
): NextUp | undefined {
  for (let offset = 1; offset <= 7; offset++) {
    const day = ((fromDay + offset) % 7) as Weekday;
    const plan = planForDay(routine, matSessions, day);
    if (plan.kind !== 'rest') {
      return { day, kind: plan.kind, daysAway: offset };
    }
  }
  return undefined;
}

/** Total rounds planned for a day, across every session on it. */
export function plannedRounds(plan: DayPlan): number {
  return plan.matSessions.reduce((total, s) => total + s.rounds, 0);
}
