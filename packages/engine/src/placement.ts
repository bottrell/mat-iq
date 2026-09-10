import { fatigueByDay, hardDays } from './fatigue.ts';
import type { BjjSession, Weekday } from './types.ts';

const ALL_DAYS: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const nextDay = (day: Weekday): Weekday => ((day + 1) % 7) as Weekday;

/** Doubling up on a mat day is mildly discouraged, never forbidden. */
const SAME_DAY_MAT_WEIGHT = 0.3;

/** Must dominate every other term: this is the one thing we refuse to do. */
const BEFORE_HARD_PENALTY = 20;

/**
 * Cost of lifting on a given day. Lower is better.
 *
 * Two rules drive this, both aimed at protecting mat performance:
 *  1. Lifting the day *before* hard rolling is the worst option — you show up to
 *     open mat already stiff and weak. This dominates the scoring.
 *  2. Lifting on a day you already train costs something, but far less than
 *     compromising tomorrow's session. Stacking hard days and leaving easy days
 *     genuinely easy is the better pattern.
 *
 * The weights matter: the before-hard penalty has to outrank a full day of mat
 * fatigue, or a heavy Mon/Wed/Fri week makes Tuesday look cheaper than Monday
 * and the engine inverts rule 1.
 */
function dayCost(day: Weekday, sessions: readonly BjjSession[]): number {
  const byDay = fatigueByDay(sessions);
  const hard = hardDays(sessions);

  let cost = byDay[day] * SAME_DAY_MAT_WEIGHT;

  const tomorrow = nextDay(day);
  if (hard.has(tomorrow)) {
    cost += BEFORE_HARD_PENALTY;
  } else if (byDay[tomorrow] > 0) {
    cost += byDay[tomorrow] * 0.3;
  }

  return cost;
}

/**
 * Choose which weekdays to lift on.
 *
 * Greedy: repeatedly take the cheapest remaining day, penalising adjacency to
 * days already chosen so sessions spread across the week rather than clumping.
 */
export function placeLiftDays(
  sessions: readonly BjjSession[],
  liftDays: number,
  unavailable: readonly Weekday[] = [],
): Weekday[] {
  const excluded = new Set(unavailable);
  const candidates = ALL_DAYS.filter((d) => !excluded.has(d));
  const chosen: Weekday[] = [];

  const wanted = Math.min(liftDays, candidates.length);

  while (chosen.length < wanted) {
    let best: Weekday | undefined;
    let bestCost = Infinity;

    for (const day of candidates) {
      if (chosen.includes(day)) continue;

      let cost = dayCost(day, sessions);
      // Spacing: adjacent to an already-chosen day is discouraged, but allowed
      // when the week is busy enough that nothing else is left.
      for (const taken of chosen) {
        const gap = Math.min(Math.abs(day - taken), 7 - Math.abs(day - taken));
        if (gap === 1) cost += 3;
        if (gap === 0) cost += 100;
      }

      if (cost < bestCost) {
        bestCost = cost;
        best = day;
      }
    }

    if (best === undefined) break;
    chosen.push(best);
  }

  return chosen.sort((a, b) => a - b);
}
