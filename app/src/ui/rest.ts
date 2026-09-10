/** Pure helpers behind the rest timer, kept out of the component so they can be tested. */

/** mm:ss, never negative. */
export function formatRest(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(clamped / 60);
  return `${minutes}:${String(clamped % 60).padStart(2, '0')}`;
}

/**
 * Seconds left, derived from wall-clock times rather than counted ticks.
 * iOS suspends timers when the screen locks; a tick-counting timer would be
 * minutes slow by the time you pick the phone back up.
 */
export function remainingSeconds(startedAt: number, targetSeconds: number, now: number): number {
  return targetSeconds - Math.floor((now - startedAt) / 1000);
}

/** What the timer shows: counting down, or counting up once rest is over. */
export function restReadout(
  startedAt: number,
  targetSeconds: number,
  now: number,
): { text: string; done: boolean } {
  const remaining = remainingSeconds(startedAt, targetSeconds, now);
  return remaining <= 0
    ? { text: `+${formatRest(-remaining)}`, done: true }
    : { text: formatRest(remaining), done: false };
}
