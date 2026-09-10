import { describe, expect, it } from 'vitest';
import { progress } from '../src/progression.ts';
import { exerciseById } from '../src/exercises.ts';
import type { PrescribedExercise } from '../src/types.ts';

const squat: PrescribedExercise = {
  exercise: exerciseById('back-squat'),
  sets: 3,
  repRange: [4, 6],
  targetWeightLb: 225,
};

describe('progress', () => {
  it('adds load once every set reaches the top of the range', () => {
    const result = progress(squat, [{ reps: 6 }, { reps: 6 }, { reps: 6 }]);
    expect(result.outcome).toBe('advance_load');
    expect(result.next.targetWeightLb).toBe(235);
  });

  it('holds the load when only some sets topped out', () => {
    const result = progress(squat, [{ reps: 6 }, { reps: 6 }, { reps: 5 }]);
    expect(result.outcome).toBe('add_reps');
    expect(result.next.targetWeightLb).toBe(225);
  });

  it('does not advance when the lifter cut the session short', () => {
    const result = progress(squat, [{ reps: 6 }, { reps: 6 }]);
    expect(result.outcome).not.toBe('advance_load');
  });

  it('deloads 10% after missing the floor on two sets', () => {
    const result = progress(squat, [{ reps: 3 }, { reps: 3 }, { reps: 5 }]);
    expect(result.outcome).toBe('deload');
    expect(result.next.targetWeightLb).toBe(205);
  });

  it('tolerates one bad set without deloading — that is just a hard mat week', () => {
    const result = progress(squat, [{ reps: 6 }, { reps: 5 }, { reps: 3 }]);
    expect(result.outcome).toBe('add_reps');
  });

  it('rounds deloaded weight to the nearest 5 lb', () => {
    const odd: PrescribedExercise = { ...squat, targetWeightLb: 187 };
    const result = progress(odd, [{ reps: 1 }, { reps: 1 }, { reps: 1 }]);
    expect(result.next.targetWeightLb! % 5).toBe(0);
  });

  it('handles bodyweight work that has no target weight', () => {
    const pullups: PrescribedExercise = {
      exercise: exerciseById('pull-up'),
      sets: 3,
      repRange: [5, 10],
    };
    const result = progress(pullups, [{ reps: 10 }, { reps: 10 }, { reps: 10 }]);
    expect(result.outcome).toBe('advance_load');
    expect(result.next.targetWeightLb).toBeUndefined();
  });

  it('leaves the prescription alone when nothing was logged', () => {
    const result = progress(squat, []);
    expect(result.outcome).toBe('hold');
    expect(result.next).toEqual(squat);
  });

  it('ignores extra sets beyond what was prescribed', () => {
    const result = progress(squat, [{ reps: 6 }, { reps: 6 }, { reps: 6 }, { reps: 2 }]);
    expect(result.outcome).toBe('advance_load');
  });

  it('never mutates the prescription it was given', () => {
    const before = { ...squat };
    progress(squat, [{ reps: 6 }, { reps: 6 }, { reps: 6 }]);
    expect(squat).toEqual(before);
  });
});
