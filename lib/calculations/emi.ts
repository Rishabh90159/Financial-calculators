import { clamp, compoundGrowthMinusOne, LIMITS, monthlyRate, toNonNegative } from "./utils";

export interface EmiInput {
  /** Loan principal in rupees. */
  principal: number;
  /** Annual interest rate in percent, e.g. 8.5 for 8.5% p.a. */
  annualRate: number;
  /** Number of monthly instalments. */
  tenureMonths: number;
}

export interface EmiResult {
  /** Monthly instalment (unrounded). */
  emi: number;
  principal: number;
  totalInterest: number;
  totalPayment: number;
  tenureMonths: number;
  annualRate: number;
  /** False when the inputs could not produce a meaningful loan (e.g. zero principal or tenure). */
  isValid: boolean;
}

export interface AmortizationMonth {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface AmortizationYear {
  /** Loan year (1 = first 12 instalments), not calendar year. */
  year: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  closingBalance: number;
}

function normaliseInput(input: EmiInput) {
  return {
    principal: clamp(toNonNegative(input.principal), 0, LIMITS.maxAmount),
    annualRate: clamp(toNonNegative(input.annualRate), 0, LIMITS.maxAnnualRate),
    tenureMonths: Math.round(clamp(toNonNegative(input.tenureMonths), 0, LIMITS.maxTenureMonths)),
  };
}

/**
 * Monthly instalment under the standard reducing-balance method:
 *
 *   EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 *
 * Implemented in the algebraically equivalent, numerically stable form
 *   EMI = P × r × (g + 1) / g,  where g = (1 + r)^n − 1 via expm1/log1p,
 * so tiny rates do not lose precision. A 0% rate degenerates to P / n.
 */
export function calculateEmiAmount(principal: number, annualRate: number, tenureMonths: number): number {
  const { principal: p, annualRate: rate, tenureMonths: n } = normaliseInput({ principal, annualRate, tenureMonths });
  if (p === 0 || n === 0) return 0;

  const r = monthlyRate(rate);
  if (r === 0) return p / n;

  const growth = compoundGrowthMinusOne(r, n);
  // Within LIMITS growth is always finite; the guard keeps the contract if limits ever change.
  if (!Number.isFinite(growth) || growth <= 0) return p * r;
  return (p * r * (growth + 1)) / growth;
}

export function calculateEmi(input: EmiInput): EmiResult {
  const { principal, annualRate, tenureMonths } = normaliseInput(input);
  const emi = calculateEmiAmount(principal, annualRate, tenureMonths);
  const isValid = principal > 0 && tenureMonths > 0;

  if (!isValid) {
    return { emi: 0, principal, totalInterest: 0, totalPayment: 0, tenureMonths, annualRate, isValid };
  }

  const totalPayment = emi * tenureMonths;
  // Floating-point noise can make this −0.0000001 at 0% interest; never report negative interest.
  const totalInterest = Math.max(0, totalPayment - principal);

  return { emi, principal, totalInterest, totalPayment, tenureMonths, annualRate, isValid };
}

/**
 * Month-by-month schedule. The final instalment absorbs floating-point residue so
 * the closing balance is exactly zero.
 */
export function buildAmortizationSchedule(input: EmiInput): AmortizationMonth[] {
  const { principal, annualRate, tenureMonths } = normaliseInput(input);
  if (principal === 0 || tenureMonths === 0) return [];

  const r = monthlyRate(annualRate);
  const emi = calculateEmiAmount(principal, annualRate, tenureMonths);
  const rows: AmortizationMonth[] = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPaid = balance * r;
    const isLast = month === tenureMonths;
    const principalPaid = isLast ? balance : Math.min(balance, Math.max(0, emi - interestPaid));
    balance = isLast ? 0 : Math.max(0, balance - principalPaid);
    rows.push({ month, payment: principalPaid + interestPaid, principalPaid, interestPaid, closingBalance: balance });
  }

  return rows;
}

/** Aggregates a monthly schedule into loan years (12 instalments each; the last year may be shorter). */
export function summariseByYear(schedule: AmortizationMonth[]): AmortizationYear[] {
  const years: AmortizationYear[] = [];
  for (const row of schedule) {
    const yearIndex = Math.floor((row.month - 1) / 12);
    let year = years[yearIndex];
    if (!year) {
      year = { year: yearIndex + 1, principalPaid: 0, interestPaid: 0, totalPaid: 0, closingBalance: 0 };
      years[yearIndex] = year;
    }
    year.principalPaid += row.principalPaid;
    year.interestPaid += row.interestPaid;
    year.totalPaid += row.payment;
    year.closingBalance = row.closingBalance;
  }
  return years;
}

export interface EmiSensitivity {
  base: EmiResult;
  /** Same loan with the rate raised by `rateStep` percentage points. */
  higherRate: EmiResult;
  /** Same loan with the tenure extended by `tenureStepMonths`. */
  longerTenure: EmiResult;
  /** Same loan with the tenure shortened by `tenureStepMonths` (null if that would leave no tenure). */
  shorterTenure: EmiResult | null;
  rateStep: number;
  tenureStepMonths: number;
}

/** "What-if" comparisons used for the Key Insights panels. */
export function calculateEmiSensitivity(input: EmiInput, rateStep = 1, tenureStepMonths = 60): EmiSensitivity {
  const base = calculateEmi(input);
  const shorterMonths = base.tenureMonths - tenureStepMonths;
  return {
    base,
    higherRate: calculateEmi({ ...input, annualRate: base.annualRate + rateStep }),
    longerTenure: calculateEmi({ ...input, tenureMonths: base.tenureMonths + tenureStepMonths }),
    shorterTenure: shorterMonths > 0 ? calculateEmi({ ...input, tenureMonths: shorterMonths }) : null,
    rateStep,
    tenureStepMonths,
  };
}
