import { describe, expect, it } from 'vitest';
import { generateRoutine } from '../src/generate.ts';
import {
  nextTrainingDay,
  planForDate,
  planForDay,
  plannedRounds,
  weekdayFromDate,
} from '../src/today.ts';
import type { BjjSession, LifterProfile, Routine } from '../src/types.ts';

const PROFILE: LifterProfile = {
  experience: 'intermediate',
  goals: ['strength'],
  workingWeightsLb: { squat: 225, hinge: 275, press: 155, row: 135 },
};

const MWF_HARD: BjjSession[] = [
  { day: 0, rounds: 6, intensity: 'hard' },
  { day: 2, rounds: 6, intensity: 'hard' },
  { day: 4, rounds: 6, intensity: 'hard' },
];

describe('weekdayFromDate', () => {
  it('treats Monday as the start of the training week', () => {
    // 2026-09-07 is a Monday.
    expect(weekdayFromDate(new Date(2026, 8, 7))).toBe(0);
    expect(weekdayFromDate(new Date(2026, 8, 8))).toBe(1);
    expect(weekdayFromDate(new Date(2026, 8, 12))).toBe(5);
  });

  it('maps Sunday to the end of the week, not the start', () => {
    // 2026-09-13 is a Sunday. Getting this wrong shifts the whole schedule.
    expect(weekdayFromDate(new Date(2026, 8, 13))).toBe(6);
  });
});

describe('planForDay', () => {
  const routine = generateRoutine(PROFILE, MWF_HARD);

  it('reports a rest day when nothing is scheduled', () => {
    const liftDays = new Set(routine.sessions.map((s) => s.day));
    const matDays = new Set(MWF_HARD.map((s) => s.day));
    const emptyDay = ([0, 1, 2, 3, 4, 5, 6] as const).find(
      (d) => !liftDays.has(d) && !matDays.has(d),
    );

    expect(emptyDay).toBeDefined();
    const plan = planForDay(routine, MWF_HARD, emptyDay!);
    expect(plan.kind).toBe('rest');
    expect(plan.lift).toBeUndefined();
    expect(plan.matSessions).toHaveLength(0);
  });

  it('reports a mat day with its sessions', () => {
    const plan = planForDay(routine, MWF_HARD, 0);
    expect(plan.matSessions).toHaveLength(1);
    expect(['mat', 'both']).toContain(plan.kind);
  });

  it('reports a lift day', () => {
    const liftDay = routine.sessions[0]!.day;
    const plan = planForDay(routine, MWF_HARD, liftDay);
    expect(plan.lift).toBeDefined();
    expect(['lift', 'both']).toContain(plan.kind);
  });

  it('reports "both" when a lift lands on a mat day', () => {
    const matOnly: BjjSession[] = [{ day: 3, rounds: 5, intensity: 'medium' }];
    const r = generateRoutine(PROFILE, matOnly, { liftDaysOverride: 7 });
    const plan = planForDay(r, matOnly, 3);
    expect(plan.kind).toBe('both');
    expect(plan.lift).toBeDefined();
    expect(plan.matSessions).toHaveLength(1);
  });

  it('handles a null routine — before onboarding there is no program', () => {
    const plan = planForDay(null, MWF_HARD, 0);
    expect(plan.kind).toBe('mat');
    expect(plan.lift).toBeUndefined();
  });

  it('is rest when there is neither routine nor mat schedule', () => {
    expect(planForDay(null, [], 3).kind).toBe('rest');
  });
});

describe('planForDate', () => {
  it('resolves a calendar date to that weekday plan', () => {
    const routine = generateRoutine(PROFILE, MWF_HARD);
    // Monday 2026-09-07 is a hard mat day.
    const plan = planForDate(routine, MWF_HARD, new Date(2026, 8, 7));
    expect(plan.day).toBe(0);
    expect(plan.matSessions).toHaveLength(1);
  });
});

describe('nextTrainingDay', () => {
  const routine = generateRoutine(PROFILE, MWF_HARD);

  it('finds the next day with something on it', () => {
    const next = nextTrainingDay(routine, MWF_HARD, 0);
    expect(next).toBeDefined();
    expect(next!.daysAway).toBeGreaterThan(0);
    expect(next!.kind).not.toBe('rest');
  });

  it('wraps around the end of the week', () => {
    const sundayOnly: BjjSession[] = [{ day: 6, rounds: 5, intensity: 'medium' }];
    // Searching forward from Sunday itself must wrap to next Sunday, 7 days out.
    const next = nextTrainingDay(null, sundayOnly, 6);
    expect(next).toEqual({ day: 6, kind: 'mat', daysAway: 7 });
  });

  it('returns undefined for a completely empty week', () => {
    expect(nextTrainingDay(null, [], 0)).toBeUndefined();
  });

  it('never reports today as the next day', () => {
    const next = nextTrainingDay(routine, MWF_HARD, 0);
    expect(next!.daysAway).toBeGreaterThanOrEqual(1);
  });
});

describe('plannedRounds', () => {
  it('sums rounds across every session that day', () => {
    const doubled: BjjSession[] = [
      { day: 1, rounds: 5, intensity: 'medium' },
      { day: 1, rounds: 4, intensity: 'light' },
    ];
    expect(plannedRounds(planForDay(null, doubled, 1))).toBe(9);
  });

  it('is zero on a lift-only day', () => {
    const routine: Routine = generateRoutine(PROFILE, MWF_HARD);
    const liftDay = routine.sessions[0]!.day;
    const plan = planForDay(routine, [], liftDay);
    expect(plannedRounds(plan)).toBe(0);
  });
});
