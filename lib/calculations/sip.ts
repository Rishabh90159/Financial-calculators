import { clamp, compoundGrowthMinusOne, LIMITS, monthlyRate, toNonNegative } from "./utils";

export interface SipInput {
  /** Amount invested every month, in rupees. */
  monthlyInvestment: number;
  /** Expected annual return in percent. This is an assumption, not a guarantee. */
  annualReturn: number;
  /** Investment duration in years (fractional years are rounded to whole months). */
  years: number;
}

export interface SipYearPoint {
  year: number;
  invested: number;
  estimatedReturns: number;
  value: number;
}

export interface SipResult {
  totalInvested: number;
  estimatedReturns: number;
  futureValue: number;
  months: number;
  isValid: boolean;
}

const MAX_SIP_MONTHS = LIMITS.maxTenureMonths;

function normaliseInput(input: SipInput) {
  return {
    monthlyInvestment: clamp(toNonNegative(input.monthlyInvestment), 0, LIMITS.maxAmount),
    annualReturn: clamp(toNonNegative(input.annualReturn), 0, LIMITS.maxAnnualRate),
    months: Math.round(clamp(toNonNegative(input.years) * 12, 0, MAX_SIP_MONTHS)),
  };
}

/**
 * Future value of a monthly SIP, assuming each instalment is invested at the
 * start of the month (annuity due) and returns compound monthly at annualReturn / 12:
 *
 *   FV = P × [((1 + i)^n − 1) / i] × (1 + i)
 *
 * This is the convention used by most Indian mutual-fund SIP calculators.
 */
export function sipFutureValue(monthlyInvestment: number, annualReturn: number, months: number): number {
  const p = clamp(toNonNegative(monthlyInvestment), 0, LIMITS.maxAmount);
  const n = Math.round(clamp(toNonNegative(months), 0, MAX_SIP_MONTHS));
  if (p === 0 || n === 0) return 0;

  const i = monthlyRate(clamp(toNonNegative(annualReturn), 0, LIMITS.maxAnnualRate));
  if (i === 0) return p * n;

  const value = p * (compoundGrowthMinusOne(i, n) / i) * (1 + i);
  return Number.isFinite(value) ? value : 0;
}

export function calculateSip(input: SipInput): SipResult {
  const { monthlyInvestment, annualReturn, months } = normaliseInput(input);
  const isValid = monthlyInvestment > 0 && months > 0;
  if (!isValid) {
    return { totalInvested: 0, estimatedReturns: 0, futureValue: 0, months, isValid };
  }

  const futureValue = sipFutureValue(monthlyInvestment, annualReturn, months);
  const totalInvested = monthlyInvestment * months;
  return {
    totalInvested,
    estimatedReturns: Math.max(0, futureValue - totalInvested),
    futureValue,
    months,
    isValid,
  };
}

/** Value of the SIP at the end of each year, for the growth chart and table. */
export function buildSipGrowth(input: SipInput): SipYearPoint[] {
  const { monthlyInvestment, annualReturn, months } = normaliseInput(input);
  if (monthlyInvestment === 0 || months === 0) return [];

  const points: SipYearPoint[] = [];
  const totalYears = Math.ceil(months / 12);
  for (let year = 1; year <= totalYears; year++) {
    const m = Math.min(year * 12, months);
    const value = sipFutureValue(monthlyInvestment, annualReturn, m);
    const invested = monthlyInvestment * m;
    points.push({ year, invested, estimatedReturns: Math.max(0, value - invested), value });
  }
  return points;
}
