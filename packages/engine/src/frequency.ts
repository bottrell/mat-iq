import type { ExperienceLevel, LifterProfile } from './types.ts';

/**
 * How many lifting days a week the athlete can absorb on top of their mat volume.
 *
 * The premise: jiu jitsu is the priority, lifting is support. As mat fatigue
 * climbs, lifting frequency comes down so the weight room never eats into
 * performance in rounds. Beginners are capped lower — they recover worse from
 * mixed loading and need less volume to progress.
 */
const MAX_DAYS_BY_EXPERIENCE: Record<ExperienceLevel, number> = {
  beginner: 3,
  intermediate: 4,
  advanced: 4,
};

interface FatigueBand {
  /** Upper bound of weekly mat fatigue for this band, exclusive. */
  upTo: number;
  days: number;
  description: string;
}

const BANDS: readonly FatigueBand[] = [
  { upTo: 8, days: 4, description: 'light mat week' },
  { upTo: 18, days: 3, description: 'moderate mat week' },
  { upTo: 30, days: 3, description: 'busy mat week' },
  { upTo: 45, days: 2, description: 'heavy mat week' },
  { upTo: Infinity, days: 2, description: 'very heavy mat week' },
];

export interface FrequencyRecommendation {
  days: number;
  /** Why this number — surfaced to the user, who can override it. */
  reason: string;
}

export function recommendLiftDays(
  weeklyBjjFatigue: number,
  profile: LifterProfile,
): FrequencyRecommendation {
  const band = BANDS.find((b) => weeklyBjjFatigue < b.upTo) ?? BANDS[BANDS.length - 1]!;
  const experienceCap = MAX_DAYS_BY_EXPERIENCE[profile.experience];

  const available = 7 - (profile.unavailableDays?.length ?? 0);
  let days = Math.min(band.days, experienceCap, available);

  // Never recommend zero: even one weekly session preserves strength.
  days = Math.max(1, days);

  const reasons = [`${band.description} (fatigue ${weeklyBjjFatigue.toFixed(1)}) suggests ${band.days} lifting days`];
  if (experienceCap < band.days) {
    reasons.push(`capped at ${experienceCap} for a ${profile.experience} lifter`);
  }
  if (available < Math.min(band.days, experienceCap)) {
    reasons.push(`limited to ${available} by your availability`);
  }

  return { days, reason: reasons.join('; ') };
}
