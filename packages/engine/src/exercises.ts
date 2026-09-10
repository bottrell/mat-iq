import type { Exercise } from './types.ts';

/**
 * Starter library — deliberately small and commercial-gym safe.
 *
 * This gets replaced by the curated open-dataset import (see stack decisions);
 * it exists so the generator has real data to program against today. Grip flags
 * matter more here than in general strength work: a fried grip is the fastest
 * way to have a bad round.
 */
export const EXERCISES: readonly Exercise[] = [
  // Squat
  { id: 'back-squat', name: 'Back Squat', pattern: 'squat', equipment: 'barbell', fatigueCost: 5, taxesGrip: false, incrementLb: 10, prescribedIn: 'reps' },
  { id: 'front-squat', name: 'Front Squat', pattern: 'squat', equipment: 'barbell', fatigueCost: 4, taxesGrip: false, incrementLb: 10, prescribedIn: 'reps' },
  { id: 'goblet-squat', name: 'Goblet Squat', pattern: 'squat', equipment: 'dumbbell', fatigueCost: 3, taxesGrip: true, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'split-squat', name: 'Bulgarian Split Squat', pattern: 'squat', equipment: 'dumbbell', fatigueCost: 3, taxesGrip: true, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'leg-press', name: 'Leg Press', pattern: 'squat', equipment: 'machine', fatigueCost: 3, taxesGrip: false, incrementLb: 10, prescribedIn: 'reps' },

  // Hinge
  { id: 'deadlift', name: 'Conventional Deadlift', pattern: 'hinge', equipment: 'barbell', fatigueCost: 5, taxesGrip: true, incrementLb: 10, prescribedIn: 'reps' },
  { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', pattern: 'hinge', equipment: 'barbell', fatigueCost: 4, taxesGrip: true, incrementLb: 10, prescribedIn: 'reps' },
  { id: 'rdl', name: 'Romanian Deadlift', pattern: 'hinge', equipment: 'barbell', fatigueCost: 4, taxesGrip: true, incrementLb: 10, prescribedIn: 'reps' },
  { id: 'hip-thrust', name: 'Barbell Hip Thrust', pattern: 'hinge', equipment: 'barbell', fatigueCost: 3, taxesGrip: false, incrementLb: 10, prescribedIn: 'reps' },
  { id: 'back-extension', name: 'Back Extension', pattern: 'hinge', equipment: 'bodyweight', fatigueCost: 2, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },

  // Press
  { id: 'bench-press', name: 'Bench Press', pattern: 'press', equipment: 'barbell', fatigueCost: 4, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'overhead-press', name: 'Overhead Press', pattern: 'press', equipment: 'barbell', fatigueCost: 4, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'db-bench', name: 'Dumbbell Bench Press', pattern: 'press', equipment: 'dumbbell', fatigueCost: 3, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', pattern: 'press', equipment: 'dumbbell', fatigueCost: 3, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'dip', name: 'Dip', pattern: 'press', equipment: 'bodyweight', fatigueCost: 3, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },

  // Horizontal pull
  { id: 'barbell-row', name: 'Barbell Row', pattern: 'row', equipment: 'barbell', fatigueCost: 4, taxesGrip: true, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'chest-supported-row', name: 'Chest-Supported Row', pattern: 'row', equipment: 'dumbbell', fatigueCost: 3, taxesGrip: true, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'cable-row', name: 'Seated Cable Row', pattern: 'row', equipment: 'cable', fatigueCost: 2, taxesGrip: true, incrementLb: 10, prescribedIn: 'reps' },

  // Vertical pull
  { id: 'pull-up', name: 'Pull-Up', pattern: 'vertical_pull', equipment: 'bodyweight', fatigueCost: 3, taxesGrip: true, incrementLb: 5, prescribedIn: 'reps' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', pattern: 'vertical_pull', equipment: 'cable', fatigueCost: 2, taxesGrip: true, incrementLb: 10, prescribedIn: 'reps' },

  // Carry / grip — high value for grappling, cheap systemically
  { id: 'farmers-carry', name: "Farmer's Carry", pattern: 'carry', equipment: 'dumbbell', fatigueCost: 3, taxesGrip: true, incrementLb: 5, prescribedIn: 'yards' },
  { id: 'gi-pullup-hold', name: 'Towel Hang', pattern: 'grip', equipment: 'bodyweight', fatigueCost: 2, taxesGrip: true, incrementLb: 0, prescribedIn: 'seconds' },
  { id: 'plate-pinch', name: 'Plate Pinch Hold', pattern: 'grip', equipment: 'bodyweight', fatigueCost: 1, taxesGrip: true, incrementLb: 2.5, prescribedIn: 'seconds' },

  // Core
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise', pattern: 'core', equipment: 'bodyweight', fatigueCost: 2, taxesGrip: true, incrementLb: 0, prescribedIn: 'reps' },
  { id: 'ab-wheel', name: 'Ab Wheel Rollout', pattern: 'core', equipment: 'bodyweight', fatigueCost: 2, taxesGrip: false, incrementLb: 0, prescribedIn: 'reps' },
  { id: 'pallof-press', name: 'Pallof Press', pattern: 'core', equipment: 'cable', fatigueCost: 1, taxesGrip: false, incrementLb: 5, prescribedIn: 'reps' },

  // Conditioning
  { id: 'assault-bike-intervals', name: 'Assault Bike Intervals', pattern: 'conditioning', equipment: 'machine', fatigueCost: 3, taxesGrip: false, incrementLb: 0, prescribedIn: 'seconds' },
  { id: 'rower-intervals', name: 'Rowing Intervals', pattern: 'conditioning', equipment: 'machine', fatigueCost: 3, taxesGrip: true, incrementLb: 0, prescribedIn: 'seconds' },
  { id: 'kb-swing', name: 'Kettlebell Swing', pattern: 'conditioning', equipment: 'kettlebell', fatigueCost: 3, taxesGrip: true, incrementLb: 0, prescribedIn: 'reps' },
  { id: 'sled-push', name: 'Sled Push', pattern: 'conditioning', equipment: 'machine', fatigueCost: 3, taxesGrip: false, incrementLb: 0, prescribedIn: 'yards' },
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exerciseById(id: string): Exercise {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown exercise: ${id}`);
  return found;
}
