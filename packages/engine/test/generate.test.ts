import { describe, expect, it } from 'vitest';
import { generateRoutine } from '../src/generate.ts';
import { hardDays } from '../src/fatigue.ts';
import type { BjjSession, LifterProfile } from '../src/types.ts';

const INTERMEDIATE: LifterProfile = {
  experience: 'intermediate',
  goals: ['strength'],
  workingWeightsLb: { squat: 225, hinge: 275, press: 155, row: 135 },
  bodyweightLb: 180,
};

const MWF_HARD: BjjSession[] = [
  { day: 0, rounds: 6, intensity: 'hard' },
  { day: 2, rounds: 6, intensity: 'hard' },
  { day: 4, rounds: 6, intensity: 'hard' },
];

describe('generateRoutine', () => {
  it('produces one session per recommended lift day', () => {
    const routine = generateRoutine(INTERMEDIATE, MWF_HARD);
    expect(routine.sessions).toHaveLength(routine.recommendedLiftDays);
  });

  it('honours a user override of the recommendation', () => {
    const routine = generateRoutine(INTERMEDIATE, MWF_HARD, { liftDaysOverride: 4 });
    expect(routine.sessions).toHaveLength(4);
    expect(routine.rationale.join(' ')).toContain('overrode');
  });

  it('gives every session at least one exercise', () => {
    const routine = generateRoutine(INTERMEDIATE, MWF_HARD);
    for (const session of routine.sessions) {
      expect(session.exercises.length).toBeGreaterThan(0);
    }
  });

  it('prescribes real starting weights from onboarding baselines', () => {
    const routine = generateRoutine(INTERMEDIATE, MWF_HARD);
    const withWeights = routine.sessions
      .flatMap((s) => s.exercises)
      .filter((e) => e.targetWeightLb !== undefined);
    expect(withWeights.length).toBeGreaterThan(0);
    for (const e of withWeights) {
      expect(e.targetWeightLb! % 5).toBe(0);
      expect(e.targetWeightLb!).toBeGreaterThan(0);
    }
  });

  it('omits target weights when onboarding gave no baseline', () => {
    const blank: LifterProfile = { ...INTERMEDIATE, workingWeightsLb: {} };
    const routine = generateRoutine(blank, MWF_HARD);
    const weighted = routine.sessions.flatMap((s) => s.exercises).filter((e) => e.targetWeightLb !== undefined);
    expect(weighted).toHaveLength(0);
  });

  it('strips grip work from any session before hard rolling', () => {
    // Force the bad case: only Sunday is free, and Monday is hard rolling.
    const routine = generateRoutine(
      { ...INTERMEDIATE, unavailableDays: [0, 1, 2, 3, 4, 5] },
      MWF_HARD,
      { liftDaysOverride: 1 },
    );
    const [session] = routine.sessions;
    expect(session!.day).toBe(6);
    expect(hardDays(MWF_HARD).has(0)).toBe(true);
    for (const prescribed of session!.exercises) {
      expect(prescribed.exercise.taxesGrip).toBe(false);
      expect(prescribed.exercise.fatigueCost).toBeLessThanOrEqual(3);
    }
  });

  it('adds conditioning work only when that is a goal', () => {
    const strengthOnly = generateRoutine(INTERMEDIATE, MWF_HARD);
    const withCond = generateRoutine({ ...INTERMEDIATE, goals: ['strength', 'conditioning'] }, MWF_HARD);

    const conditioningIn = (r: ReturnType<typeof generateRoutine>) =>
      r.sessions.flatMap((s) => s.exercises).filter((e) => e.exercise.pattern === 'conditioning');

    expect(conditioningIn(strengthOnly)).toHaveLength(0);
    expect(conditioningIn(withCond).length).toBeGreaterThan(0);
  });

  it('backs volume off as mat fatigue climbs', () => {
    const easyWeek: BjjSession[] = [{ day: 1, rounds: 3, intensity: 'light' }];
    const brutalWeek: BjjSession[] = [
      { day: 0, rounds: 10, intensity: 'hard' },
      { day: 1, rounds: 10, intensity: 'hard' },
      { day: 3, rounds: 10, intensity: 'hard' },
      { day: 5, rounds: 12, intensity: 'hard' },
    ];
    const easy = generateRoutine(INTERMEDIATE, easyWeek);
    const brutal = generateRoutine(INTERMEDIATE, brutalWeek);
    expect(brutal.sessions.length).toBeLessThan(easy.sessions.length);
  });

  it('caps a beginner below the maximum frequency', () => {
    const beginner: LifterProfile = { ...INTERMEDIATE, experience: 'beginner' };
    const noMat: BjjSession[] = [];
    expect(generateRoutine(beginner, noMat).sessions.length).toBeLessThanOrEqual(3);
    expect(generateRoutine(INTERMEDIATE, noMat).sessions.length).toBe(4);
  });

  it('gives beginners higher primary rep ranges than advanced lifters', () => {
    const beginner = generateRoutine({ ...INTERMEDIATE, experience: 'beginner' }, MWF_HARD);
    const advanced = generateRoutine({ ...INTERMEDIATE, experience: 'advanced' }, MWF_HARD);
    const topOfRange = (r: ReturnType<typeof generateRoutine>) =>
      r.sessions[0]!.exercises[0]!.repRange[1];
    expect(topOfRange(beginner)).toBeGreaterThan(topOfRange(advanced));
  });

  it('survives a week with no mat training at all', () => {
    const routine = generateRoutine(INTERMEDIATE, []);
    expect(routine.weeklyBjjFatigue).toBe(0);
    expect(routine.sessions.length).toBeGreaterThan(0);
  });

  it('estimates a plausible session length', () => {
    const routine = generateRoutine(INTERMEDIATE, MWF_HARD);
    for (const session of routine.sessions) {
      expect(session.estimatedMinutes).toBeGreaterThan(20);
      expect(session.estimatedMinutes).toBeLessThan(120);
    }
  });

  it('explains its choices', () => {
    expect(generateRoutine(INTERMEDIATE, MWF_HARD).rationale.length).toBeGreaterThan(0);
  });
});

describe('prescription units', () => {
  it('programs carries and holds in distance or time, never reps', () => {
    const routine = generateRoutine({ ...INTERMEDIATE, goals: ['strength', 'conditioning'] }, MWF_HARD, {
      liftDaysOverride: 4,
    });
    const nonRep = routine.sessions
      .flatMap((s) => s.exercises)
      .filter((e) => e.exercise.prescribedIn !== 'reps');

    expect(nonRep.length).toBeGreaterThan(0);
    for (const e of nonRep) {
      // A carry or hold prescribed as "3x8-12" would be nonsense.
      expect(e.repRange[0]).toBeGreaterThanOrEqual(20);
    }
  });

  it('keeps barbell work in reps', () => {
    const routine = generateRoutine(INTERMEDIATE, MWF_HARD);
    const squat = routine.sessions.flatMap((s) => s.exercises).find((e) => e.exercise.id === 'back-squat');
    expect(squat?.exercise.prescribedIn).toBe('reps');
    expect(squat?.repRange[1]).toBeLessThanOrEqual(12);
  });
});
