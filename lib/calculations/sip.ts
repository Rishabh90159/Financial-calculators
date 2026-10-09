import { clamp, compoundGrowthMinusOne, LIMITS, monthlyRate, toNonNegative } from "./utils";

export interface SipInput {
  /** Amount invested every month, in rupees. With a step-up, this is the first year's amount. */
  monthlyInvestment: number;
  /** Expected annual return in percent. This is an assumption, not a guarantee. */
  annualReturn: number;
  /** Investment duration in years (fractional years are rounded to whole months). */
  years: number;
  /** Optional yearly increase in the monthly instalment, in percent (step-up / top-up SIP). Default 0. */
  annualStepUp?: number;
  /** Optional expected inflation in percent a year, used only to express the result in today's money. Default 0. */
  inflationRate?: number;
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
  /**
   * Future value deflated to today's money: futureValue ÷ (1 + inflation)^(months ÷ 12).
   * Equals futureValue when inflation is 0.
   */
  inflationAdjustedValue: number;
  months: number;
  isValid: boolean;
}

const MAX_SIP_MONTHS = LIMITS.maxTenureMonths;
/** Step-up and inflation above these are not meaningful planning inputs. */
export const SIP_LIMITS = { maxStepUpPercent: 50, maxInflationPercent: 20 } as const;

function normaliseInput(input: SipInput) {
  return {
    monthlyInvestment: clamp(toNonNegative(input.monthlyInvestment), 0, LIMITS.maxAmount),
    annualReturn: clamp(toNonNegative(input.annualReturn), 0, LIMITS.maxAnnualRate),
    months: Math.round(clamp(toNonNegative(input.years) * 12, 0, MAX_SIP_MONTHS)),
    stepUp: clamp(toNonNegative(input.annualStepUp ?? 0), 0, SIP_LIMITS.maxStepUpPercent),
    inflation: clamp(toNonNegative(input.inflationRate ?? 0), 0, SIP_LIMITS.maxInflationPercent),
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

/**
 * Step-up SIP: the instalment for year y (0-based) is P × (1 + stepUp)^y.
 * Each instalment is invested at the start of its month and compounds monthly,
 * the same convention as `sipFutureValue`. Simulated month by month (at most 600 steps).
 * With stepUp = 0 this equals `sipFutureValue` up to floating-point rounding.
 */
export function stepUpSipValue(
  monthlyInvestment: number,
  annualReturn: number,
  months: number,
  annualStepUp: number,
): { invested: number; value: number } {
  const p = clamp(toNonNegative(monthlyInvestment), 0, LIMITS.maxAmount);
  const n = Math.round(clamp(toNonNegative(months), 0, MAX_SIP_MONTHS));
  const i = monthlyRate(clamp(toNonNegative(annualReturn), 0, LIMITS.maxAnnualRate));
  const s = clamp(toNonNegative(annualStepUp), 0, SIP_LIMITS.maxStepUpPercent) / 100;

  let invested = 0;
  let value = 0;
  for (let m = 0; m < n; m++) {
    const instalment = p * (1 + s) ** Math.floor(m / 12);
    invested += instalment;
    value = (value + instalment) * (1 + i);
  }
  return {
    invested: Number.isFinite(invested) ? invested : 0,
    value: Number.isFinite(value) ? value : 0,
  };
}

/** Value at `months` and amount invested so far, honouring the step-up when there is one. */
function valueAt(n: ReturnType<typeof normaliseInput>, months: number) {
  if (n.stepUp === 0) {
    return { invested: n.monthlyInvestment * months, value: sipFutureValue(n.monthlyInvestment, n.annualReturn, months) };
  }
  return stepUpSipValue(n.monthlyInvestment, n.annualReturn, months, n.stepUp);
}

/** Deflates a future amount to today's money at an annual inflation rate. */
export function inflationAdjusted(futureAmount: number, inflationPercent: number, months: number): number {
  const rate = clamp(toNonNegative(inflationPercent), 0, SIP_LIMITS.maxInflationPercent) / 100;
  if (rate === 0) return futureAmount;
  const value = futureAmount / (1 + rate) ** (Math.max(0, months) / 12);
  return Number.isFinite(value) ? value : 0;
}

export function calculateSip(input: SipInput): SipResult {
  const n = normaliseInput(input);
  const isValid = n.monthlyInvestment > 0 && n.months > 0;
  if (!isValid) {
    return { totalInvested: 0, estimatedReturns: 0, futureValue: 0, inflationAdjustedValue: 0, months: n.months, isValid };
  }

  const { invested: totalInvested, value: futureValue } = valueAt(n, n.months);
  return {
    totalInvested,
    estimatedReturns: Math.max(0, futureValue - totalInvested),
    futureValue,
    inflationAdjustedValue: inflationAdjusted(futureValue, n.inflation, n.months),
    months: n.months,
    isValid,
  };
}

/** Value of the SIP at the end of each year, for the growth chart and table. */
export function buildSipGrowth(input: SipInput): SipYearPoint[] {
  const n = normaliseInput(input);
  if (n.monthlyInvestment === 0 || n.months === 0) return [];

  const points: SipYearPoint[] = [];
  const totalYears = Math.ceil(n.months / 12);
  for (let year = 1; year <= totalYears; year++) {
    const { invested, value } = valueAt(n, Math.min(year * 12, n.months));
    points.push({ year, invested, estimatedReturns: Math.max(0, value - invested), value });
  }
  return points;
}
