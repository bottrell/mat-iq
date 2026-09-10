/** Domain vocabulary for mat-iq routine generation. */

/** Days are 0 = Monday .. 6 = Sunday. Weeks start on Monday for training purposes. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** How hard the mat session was. Deliberately coarse — see stack decisions. */
export type Intensity = 'light' | 'medium' | 'hard';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

/** v1 ships two goals only. */
export type Goal = 'strength' | 'conditioning';

/** A planned session on the mats. */
export interface BjjSession {
  day: Weekday;
  /** Rounds rolled. Drilling-only sessions are entered as 0 rounds. */
  rounds: number;
  intensity: Intensity;
}

/** The four lifts we ask about at onboarding, keyed by movement pattern. */
export type MainLift = 'squat' | 'hinge' | 'press' | 'row';

export interface LifterProfile {
  experience: ExperienceLevel;
  goals: Goal[];
  /** Current weight used for a hard set of 5-8, in pounds. */
  workingWeightsLb: Partial<Record<MainLift, number>>;
  bodyweightLb?: number;
  /** Optional target weight class, in pounds. */
  weightClassTargetLb?: number;
  /** Days the lifter cannot train at all (work, travel, family). */
  unavailableDays?: Weekday[];
}

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'press'
  | 'row'
  | 'vertical_pull'
  | 'carry'
  | 'grip'
  | 'core'
  | 'conditioning';

export interface Exercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  /** Available in any commercial gym. */
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell';
  /** Relative systemic cost, 1 (isolation) to 5 (heavy barbell compound). */
  fatigueCost: 1 | 2 | 3 | 4 | 5;
  /** True when the lift meaningfully taxes grip — matters the day before hard rolling. */
  taxesGrip: boolean;
  /** Load increment in pounds when a double-progression cycle completes. */
  incrementLb: number;
  /**
   * The unit the work is measured in. Carries are yards, holds and intervals are
   * seconds; everything else is reps. Double progression still applies — you
   * extend distance or time before adding load, exactly as with reps.
   */
  prescribedIn: 'reps' | 'seconds' | 'yards';
}

/** One exercise as prescribed for a session. */
export interface PrescribedExercise {
  exercise: Exercise;
  sets: number;
  /** Interpreted in the exercise's `prescribedIn` unit, not always reps. */
  repRange: readonly [min: number, max: number];
  /** Omitted when we have no working-weight baseline to extrapolate from. */
  targetWeightLb?: number;
  notes?: string;
}

export interface LiftSession {
  day: Weekday;
  /** Human-readable label, e.g. "Full Body A" or "Upper". */
  label: string;
  exercises: PrescribedExercise[];
  estimatedMinutes: number;
}

export interface Routine {
  sessions: LiftSession[];
  /** Total weekly mat fatigue this routine was built against. */
  weeklyBjjFatigue: number;
  /** What the engine recommended before any user override. */
  recommendedLiftDays: number;
  goals: Goal[];
  /** Plain-language explanation of the programming choices. */
  rationale: string[];
}
