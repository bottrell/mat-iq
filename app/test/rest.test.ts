import { describe, expect, it } from 'vitest';
import { formatRest, remainingSeconds, restReadout } from '../src/ui/rest.ts';

describe('formatRest', () => {
  it('formats as mm:ss with a padded seconds field', () => {
    expect(formatRest(90)).toBe('1:30');
    expect(formatRest(5)).toBe('0:05');
    expect(formatRest(600)).toBe('10:00');
  });

  it('clamps negatives to zero rather than printing "-1:-30"', () => {
    expect(formatRest(-30)).toBe('0:00');
  });
});

describe('remainingSeconds', () => {
  const start = 1_000_000;

  it('counts down as wall-clock time passes', () => {
    expect(remainingSeconds(start, 90, start)).toBe(90);
    expect(remainingSeconds(start, 90, start + 30_000)).toBe(60);
  });

  it('goes negative once rest is over, so overtime can be shown', () => {
    expect(remainingSeconds(start, 90, start + 120_000)).toBe(-30);
  });

  it('stays correct across a long suspension — the whole reason for wall-clock math', () => {
    // Phone locked for 10 minutes mid-workout. A tick counter would still read
    // near 90; wall-clock math knows rest ended long ago.
    expect(remainingSeconds(start, 90, start + 600_000)).toBe(-510);
  });
});

describe('restReadout', () => {
  const start = 1_000_000;

  it('counts down before the target', () => {
    expect(restReadout(start, 90, start + 30_000)).toEqual({ text: '1:00', done: false });
  });

  it('switches to counting up at zero', () => {
    expect(restReadout(start, 90, start + 90_000)).toEqual({ text: '+0:00', done: true });
  });

  it('shows overtime with a plus sign', () => {
    expect(restReadout(start, 90, start + 105_000)).toEqual({ text: '+0:15', done: true });
  });
});
