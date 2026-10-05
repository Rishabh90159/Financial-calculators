/**
 * Shared numeric helpers for calculation modules.
 *
 * Every calculation function in this folder must return finite, non-negative
 * numbers for every possible input (including NaN, Infinity, negative and
 * absurdly large values). These helpers are the first line of that defence.
 */

/** Coerces any value to a finite, non-negative number. Invalid input becomes 0. */
export function toNonNegative(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Rounds half away from zero to `decimals` places, avoiding the classic 1.005 → 1.00 float error. */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * factor * (1 + Number.EPSILON))) / factor;
}

/** Converts an annual percentage rate (e.g. 8.5) to a monthly decimal rate (0.0070833…). */
export function monthlyRate(annualRatePercent: number): number {
  return toNonNegative(annualRatePercent) / 12 / 100;
}

/** Converts a tenure in years (may be fractional) to a whole number of monthly instalments. */
export function yearsToMonths(years: number): number {
  return Math.round(toNonNegative(years) * 12);
}

/**
 * (1 + r)^n − 1, computed without catastrophic cancellation for very small r.
 * Returns Infinity if the result overflows; callers must handle that.
 */
export function compoundGrowthMinusOne(rate: number, periods: number): number {
  return Math.expm1(periods * Math.log1p(rate));
}

/**
 * Hard input limits shared by the calculation layer and the UI.
 * Values outside these bounds are clamped by the calculation functions so the
 * results always stay finite and meaningful.
 */
export const LIMITS = {
  maxAmount: 1e12, // ₹1 lakh crore — well beyond any personal-finance use case
  maxAnnualRate: 50, // % per annum
  maxTenureMonths: 600, // 50 years
} as const;
