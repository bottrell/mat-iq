import { describe, expect, it } from 'vitest';
import { placeLiftDays } from '../src/placement.ts';
import type { BjjSession, Weekday } from '../src/types.ts';

/** Mon/Wed/Fri hard rolling — the classic hobbyist week. */
const MWF_HARD: BjjSession[] = [
  { day: 0, rounds: 6, intensity: 'hard' },
  { day: 2, rounds: 6, intensity: 'hard' },
  { day: 4, rounds: 6, intensity: 'hard' },
];

describe('placeLiftDays', () => {
  it('never schedules a lift the day before hard rolling', () => {
    const days = placeLiftDays(MWF_HARD, 3);
    const dayBeforeHard: Weekday[] = [6, 1, 3]; // Sun, Tue, Thu
    for (const day of days) {
      expect(dayBeforeHard).not.toContain(day);
    }
  });

  it('returns the requested number of days', () => {
    expect(placeLiftDays(MWF_HARD, 2)).toHaveLength(2);
    expect(placeLiftDays(MWF_HARD, 3)).toHaveLength(3);
  });

  it('respects unavailable days', () => {
    const days = placeLiftDays(MWF_HARD, 3, [0, 2]);
    expect(days).not.toContain(0);
    expect(days).not.toContain(2);
  });

  it('cannot place more days than are available', () => {
    expect(placeLiftDays(MWF_HARD, 5, [0, 1, 2, 3, 4])).toHaveLength(2);
  });

  it('never returns a duplicate day', () => {
    const days = placeLiftDays(MWF_HARD, 4);
    expect(new Set(days).size).toBe(days.length);
  });

  it('returns days in chronological order', () => {
    const days = placeLiftDays(MWF_HARD, 3);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it('prefers rest days over mat days when the week is quiet', () => {
    const twoSessions: BjjSession[] = [
      { day: 0, rounds: 5, intensity: 'medium' },
      { day: 3, rounds: 5, intensity: 'medium' },
    ];
    const days = placeLiftDays(twoSessions, 2);
    // Tuesday and Wednesday sit before mat days; Friday/Saturday are clean.
    expect(days.some((d) => d >= 4)).toBe(true);
  });

  it('handles a week with no mat sessions at all', () => {
    expect(placeLiftDays([], 3)).toHaveLength(3);
  });

  it('spaces sessions rather than clumping them consecutively', () => {
    const days = placeLiftDays([], 3);
    const gaps = days.slice(1).map((d, i) => d - days[i]!);
    expect(Math.min(...gaps)).toBeGreaterThan(1);
  });
});
