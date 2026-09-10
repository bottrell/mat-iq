import type { PrescribedExercise } from './types.ts';

export interface LoggedSet {
  reps: number;
  weightLb?: number;
}

export type ProgressionOutcome = 'advance_load' | 'add_reps' | 'hold' | 'deload';

export interface ProgressionResult {
  outcome: ProgressionOutcome;
  /** What to prescribe next time. */
  next: PrescribedExercise;
  message: string;
}

/**
 * Double progression: work up within the rep range at a fixed load, and only
 * once every set reaches the top of the range does the weight go up.
 *
 * This is the right model for a grappler because it degrades gracefully. A bad
 * session after a hard open mat simply means you hold the load another week,
 * rather than failing a prescribed percentage of a max you tested when fresh.
 */
export function progress(
  prescribed: PrescribedExercise,
  logged: readonly LoggedSet[],
): ProgressionResult {
  const [minReps, maxReps] = prescribed.repRange;
  const current = prescribed.targetWeightLb;

  if (logged.length === 0) {
    return { outcome: 'hold', next: prescribed, message: 'No sets logged — prescription unchanged.' };
  }

  const completedSets = logged.slice(0, prescribed.sets);
  const allAtTop = completedSets.length >= prescribed.sets && completedSets.every((s) => s.reps >= maxReps);
  const missedMin = completedSets.filter((s) => s.reps < minReps).length;

  if (allAtTop) {
    const increment = prescribed.exercise.incrementLb;
    const next: PrescribedExercise = {
      ...prescribed,
      targetWeightLb: current !== undefined ? current + increment : undefined,
    };
    return {
      outcome: 'advance_load',
      next,
      message:
        current !== undefined
          ? `Every set hit ${maxReps} — add ${increment} lb and start back at ${minReps} reps.`
          : `Every set hit ${maxReps} — add load next session.`,
    };
  }

  // Two or more sets under the floor means the load is genuinely too heavy,
  // not just a tired day.
  if (missedMin >= 2) {
    const next: PrescribedExercise = {
      ...prescribed,
      targetWeightLb: current !== undefined ? Math.round((current * 0.9) / 5) * 5 : undefined,
    };
    return {
      outcome: 'deload',
      next,
      message: `Missed ${minReps} reps on ${missedMin} sets — drop 10% and build back up.`,
    };
  }

  return {
    outcome: 'add_reps',
    next: prescribed,
    message: `Stay at this weight and chase ${maxReps} reps on every set.`,
  };
}
