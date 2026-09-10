import { describe, expect, it } from 'vitest';
import { fatigueByDay, hardDays, sessionFatigue, weeklyFatigue } from '../src/fatigue.ts';
import type { BjjSession } from '../src/types.ts';

describe('sessionFatigue', () => {
  it('scales with both rounds and intensity', () => {
    const light = sessionFatigue({ day: 0, rounds: 6, intensity: 'light' });
    const medium = sessionFatigue({ day: 0, rounds: 6, intensity: 'medium' });
    const hard = sessionFatigue({ day: 0, rounds: 6, intensity: 'hard' });
    expect(light).toBeLessThan(medium);
    expect(medium).toBeLessThan(hard);
  });

  it('charges attendance cost for a drilling-only session', () => {
    expect(sessionFatigue({ day: 0, rounds: 0, intensity: 'medium' })).toBe(1);
  });

  it('treats negative rounds as zero rather than crediting fatigue back', () => {
    expect(sessionFatigue({ day: 0, rounds: -5, intensity: 'hard' })).toBe(1.5);
  });

  it('matches the documented calibration reference', () => {
    expect(sessionFatigue({ day: 0, rounds: 6, intensity: 'hard' })).toBeCloseTo(10.5);
    expect(sessionFatigue({ day: 0, rounds: 6, intensity: 'medium' })).toBeCloseTo(6.4);
  });
});

describe('weeklyFatigue', () => {
  it('is zero for a week off', () => {
    expect(weeklyFatigue([])).toBe(0);
  });

  it('sums every session', () => {
    const week: BjjSession[] = [
      { day: 0, rounds: 5, intensity: 'medium' },
      { day: 2, rounds: 5, intensity: 'medium' },
    ];
    expect(weeklyFatigue(week)).toBeCloseTo(2 * sessionFatigue(week[0]!));
  });
});

describe('fatigueByDay', () => {
  it('combines two sessions on the same day', () => {
    const byDay = fatigueByDay([
      { day: 3, rounds: 4, intensity: 'light' },
      { day: 3, rounds: 4, intensity: 'light' },
    ]);
    expect(byDay[3]).toBeCloseTo(4.2);
    expect(byDay[0]).toBe(0);
  });
});

describe('hardDays', () => {
  it('ignores hard sessions with no rounds rolled', () => {
    expect(hardDays([{ day: 1, rounds: 0, intensity: 'hard' }]).size).toBe(0);
  });

  it('flags days with hard rolling', () => {
    expect([...hardDays([{ day: 5, rounds: 8, intensity: 'hard' }])]).toEqual([5]);
  });
});
