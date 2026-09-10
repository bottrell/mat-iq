import { EXERCISES } from './exercises.ts';
import { fatigueByDay, hardDays, weeklyFatigue } from './fatigue.ts';
import { recommendLiftDays } from './frequency.ts';
import { placeLiftDays } from './placement.ts';
import type {
  BjjSession,
  Exercise,
  Goal,
  LifterProfile,
  LiftSession,
  MainLift,
  MovementPattern,
  PrescribedExercise,
  Routine,
  Weekday,
} from './types.ts';
import { WEEKDAY_NAMES } from './types.ts';

interface Slot {
  pattern: MovementPattern;
  role: 'primary' | 'accessory';
}

interface Template {
  label: string;
  slots: Slot[];
}

const FULL_BODY_A: Template = {
  label: 'Full Body A',
  slots: [
    { pattern: 'squat', role: 'primary' },
    { pattern: 'press', role: 'primary' },
    { pattern: 'row', role: 'accessory' },
    { pattern: 'core', role: 'accessory' },
  ],
};

const FULL_BODY_B: Template = {
  label: 'Full Body B',
  slots: [
    { pattern: 'hinge', role: 'primary' },
    { pattern: 'vertical_pull', role: 'primary' },
    { pattern: 'press', role: 'accessory' },
    { pattern: 'carry', role: 'accessory' },
  ],
};

const FULL_BODY_C: Template = {
  label: 'Full Body C',
  slots: [
    { pattern: 'squat', role: 'primary' },
    { pattern: 'row', role: 'primary' },
    { pattern: 'grip', role: 'accessory' },
    { pattern: 'core', role: 'accessory' },
  ],
};

const UPPER: Template = {
  label: 'Upper',
  slots: [
    { pattern: 'press', role: 'primary' },
    { pattern: 'row', role: 'primary' },
    { pattern: 'vertical_pull', role: 'accessory' },
    { pattern: 'grip', role: 'accessory' },
  ],
};

const LOWER: Template = {
  label: 'Lower',
  slots: [
    { pattern: 'squat', role: 'primary' },
    { pattern: 'hinge', role: 'primary' },
    { pattern: 'core', role: 'accessory' },
    { pattern: 'carry', role: 'accessory' },
  ],
};

/**
 * Full body dominates at low frequency: with two or three sessions a week you
 * cannot afford to split the body up and hit anything often enough to progress.
 */
function templatesFor(days: number): Template[] {
  switch (days) {
    case 1:
      return [FULL_BODY_A];
    case 2:
      return [FULL_BODY_A, FULL_BODY_B];
    case 3:
      return [FULL_BODY_A, FULL_BODY_B, FULL_BODY_C];
    default:
      return [UPPER, LOWER, { ...UPPER, label: 'Upper B' }, { ...LOWER, label: 'Lower B' }];
  }
}

/** Which onboarding baseline, if any, informs a given exercise. */
const PATTERN_TO_MAIN_LIFT: Partial<Record<MovementPattern, MainLift>> = {
  squat: 'squat',
  hinge: 'hinge',
  press: 'press',
  row: 'row',
};

interface RepScheme {
  sets: number;
  repRange: readonly [number, number];
}

function repScheme(
  role: Slot['role'],
  goals: readonly Goal[],
  experience: LifterProfile['experience'],
  prescribedIn: Exercise['prescribedIn'],
): RepScheme {
  // Carries and holds progress by distance and time before load, so their
  // "rep range" is measured in yards and seconds respectively.
  if (prescribedIn === 'yards') return { sets: 3, repRange: [30, 50] };
  if (prescribedIn === 'seconds') return { sets: 3, repRange: [20, 40] };

  if (role === 'accessory') {
    return { sets: 3, repRange: [8, 12] };
  }
  // Beginners keep reps higher on primaries: more practice per session and a
  // far more forgiving margin for technique breaking down under fatigue.
  if (experience === 'beginner') {
    return { sets: 3, repRange: [5, 8] };
  }
  return goals.includes('strength')
    ? { sets: 4, repRange: [4, 6] }
    : { sets: 3, repRange: [6, 10] };
}

const roundTo5 = (weight: number): number => Math.round(weight / 5) * 5;

/**
 * Estimate a starting load from the onboarding baseline, which the user gave as
 * the weight they use for a hard set of 5-8 reps. Double progression corrects
 * any error within a couple of sessions, so this only has to be close.
 */
function targetWeight(baselineLb: number, repRange: readonly [number, number]): number {
  const BASELINE_REPS = 6.5;
  const estimated1RM = baselineLb * (1 + BASELINE_REPS / 30);
  const midpoint = (repRange[0] + repRange[1]) / 2;
  return roundTo5(estimated1RM / (1 + midpoint / 30));
}

interface SelectionContext {
  used: Set<string>;
  avoidGrip: boolean;
  fatigueCap: number;
}

function selectExercise(slot: Slot, ctx: SelectionContext): Exercise | undefined {
  const candidates = EXERCISES.filter((e) => e.pattern === slot.pattern)
    .filter((e) => e.fatigueCost <= ctx.fatigueCap)
    .filter((e) => !(ctx.avoidGrip && e.taxesGrip));

  // Prefer unused exercises so a week has variety, but repeat rather than
  // leaving a slot empty.
  const fresh = candidates.filter((e) => !ctx.used.has(e.id));
  const pool = fresh.length > 0 ? fresh : candidates;
  if (pool.length === 0) return undefined;

  // Primaries take the heaviest option available, accessories the lightest.
  const sorted = [...pool].sort((a, b) => b.fatigueCost - a.fatigueCost);
  return slot.role === 'primary' ? sorted[0] : sorted[sorted.length - 1];
}

export interface GenerateOptions {
  /** Overrides the engine's own frequency recommendation. */
  liftDaysOverride?: number;
}

export function generateRoutine(
  profile: LifterProfile,
  bjj: readonly BjjSession[],
  options: GenerateOptions = {},
): Routine {
  const totalFatigue = weeklyFatigue(bjj);
  const recommendation = recommendLiftDays(totalFatigue, profile);
  const liftDays = options.liftDaysOverride ?? recommendation.days;

  const days = placeLiftDays(bjj, liftDays, profile.unavailableDays ?? []);
  const templates = templatesFor(days.length);
  const byDay = fatigueByDay(bjj);
  const hard = hardDays(bjj);

  const rationale: string[] = [recommendation.reason];
  if (options.liftDaysOverride !== undefined && options.liftDaysOverride !== recommendation.days) {
    rationale.push(`You overrode the recommendation to ${options.liftDaysOverride} days.`);
  }

  const used = new Set<string>();
  const sessions: LiftSession[] = days.map((day, index) => {
    const template = templates[index % templates.length]!;
    const tomorrow = ((day + 1) % 7) as Weekday;
    const beforeHardMat = hard.has(tomorrow);
    const sameDayMat = byDay[day] > 0;

    if (beforeHardMat) {
      rationale.push(
        `${WEEKDAY_NAMES[day]} sits before hard rolling — grip work is pulled and loads are kept submaximal.`,
      );
    }
    if (sameDayMat) {
      rationale.push(`${WEEKDAY_NAMES[day]} doubles up with mat time; lift after training, not before.`);
    }

    const ctx: SelectionContext = {
      used,
      avoidGrip: beforeHardMat,
      fatigueCap: beforeHardMat ? 3 : 5,
    };

    const exercises: PrescribedExercise[] = [];
    for (const slot of template.slots) {
      const exercise = selectExercise(slot, ctx);
      if (!exercise) continue;
      used.add(exercise.id);

      const scheme = repScheme(slot.role, profile.goals, profile.experience, exercise.prescribedIn);
      const mainLift = PATTERN_TO_MAIN_LIFT[exercise.pattern];
      const baseline = mainLift ? profile.workingWeightsLb[mainLift] : undefined;

      exercises.push({
        exercise,
        sets: scheme.sets,
        repRange: scheme.repRange,
        targetWeightLb:
          baseline !== undefined && slot.role === 'primary'
            ? targetWeight(baseline, scheme.repRange)
            : undefined,
        notes: beforeHardMat ? 'Leave two reps in reserve — you roll hard tomorrow.' : undefined,
      });
    }

    if (profile.goals.includes('conditioning')) {
      const finisher = EXERCISES.find(
        (e) => e.pattern === 'conditioning' && !(beforeHardMat && e.taxesGrip) && !used.has(e.id),
      );
      if (finisher) {
        used.add(finisher.id);
        exercises.push({
          exercise: finisher,
          sets: beforeHardMat ? 4 : 6,
          repRange: finisher.prescribedIn === 'yards' ? [30, 40] : [30, 45],
          notes: '30 seconds hard, 90 seconds easy — this is round-pace work, not a max effort.',
        });
      }
    }

    const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
    return {
      day,
      label: template.label,
      exercises,
      estimatedMinutes: Math.round(10 + totalSets * 3.5),
    };
  });

  return {
    sessions,
    weeklyBjjFatigue: Number(totalFatigue.toFixed(1)),
    recommendedLiftDays: recommendation.days,
    goals: [...profile.goals],
    rationale,
  };
}
