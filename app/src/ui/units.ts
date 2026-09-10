import type { Units } from '../db/repository.ts';

const LB_PER_KG = 2.2046226218;

/** Weights live in pounds; these convert only at the display boundary. */
export function fromLb(weightLb: number, units: Units): number {
  return units === 'kg' ? weightLb / LB_PER_KG : weightLb;
}

export function toLb(weight: number, units: Units): number {
  return units === 'kg' ? weight * LB_PER_KG : weight;
}

/** Rounds to the nearest plate-friendly increment for the unit. */
export function formatWeight(weightLb: number, units: Units): string {
  const converted = fromLb(weightLb, units);
  const step = units === 'kg' ? 2.5 : 5;
  const rounded = Math.round(converted / step) * step;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${units}`;
}
