import { calculateEmi, calculateEmiAmount, type EmiResult } from "./emi";
import { clamp, LIMITS, toNonNegative } from "./utils";

/**
 * Car loan calculations.
 *
 * All EMI maths is delegated to `emi.ts` (standard reducing-balance method).
 * This module adds the car-purchase layer on top: on-road price, down payment,
 * upfront costs, tenure comparison, a flat-rate comparison and a rough
 * share-of-income affordability check. Every function returns finite,
 * non-negative numbers for any input.
 */

/** Longest tenure (in years) accepted by the engine; the UI restricts this further to 1–7 years. */
export const MAX_CAR_TENURE_YEARS = LIMITS.maxTenureMonths / 12;

/** Tenures shown in the comparison table. The first entry is the baseline for "extra interest". */
export const CAR_TENURE_OPTIONS = [3, 4, 5, 6, 7] as const;

/** Rough planning bands for car EMI as a share of monthly take-home income (percent). */
export const CAR_EMI_SHARE_BANDS = { lowerMax: 10, moderateMax: 20 } as const;

/**
 * Share of take-home income taken by all EMIs above which many lenders tend to
 * become cautious. A general observation (often quoted as ~40–50%), not a rule.
 */
export const TOTAL_EMI_CAUTION_PERCENT = 40;

/**
 * Rounds a tenure in years to the nearest half year and clamps it to the engine
 * limits. Car loans are offered in whole or half years in this calculator.
 */
export function normaliseCarTenureYears(years: number): number {
  const y = clamp(toNonNegative(years), 0, MAX_CAR_TENURE_YEARS);
  return Math.round(y * 2) / 2;
}

/** Whole number of monthly instalments for a tenure in years (half years allowed). */
export function carTenureMonths(years: number): number {
  return Math.round(normaliseCarTenureYears(years) * 12);
}

export interface CarLoanInput {
  /** On-road price: ex-showroom + registration/RTO + insurance + other charges. */
  onRoadPrice: number;
  /** Cash paid towards the car; clamped to the on-road price. */
  downPayment: number;
  /** Annual reducing-balance interest rate in percent. */
  annualRate: number;
  /** Tenure in years; rounded to the nearest half year. */
  tenureYears: number;
  /** Optional loan processing fee in rupees (including GST, as charged). */
  processingFee?: number;
  /** Optional other upfront costs: accessories, extended warranty, etc. */
  otherUpfrontCosts?: number;
}

export interface CarLoanResult {
  onRoadPrice: number;
  /** Down payment after clamping to the on-road price. */
  downPayment: number;
  downPaymentPercent: number;
  /** Loan amount = on-road price − down payment. */
  loanAmount: number;
  /** Loan amount as a percentage of the on-road price. */
  loanToPricePercent: number;
  processingFee: number;
  otherUpfrontCosts: number;
  /** Total upfront cost = down payment + processing fee + other upfront costs. */
  upfrontTotal: number;
  /** Total cost of the car with the loan = upfront total + all EMIs. */
  totalCostWithLoan: number;
  /** Tenure actually used (nearest half year). */
  tenureYears: number;
  tenureMonths: number;
  emi: EmiResult;
  /** True when there is a car price to work with. A zero loan (fully paid in cash) is still valid. */
  isValid: boolean;
  /** Plain-language notes about adjustments made to the inputs. */
  notes: string[];
}

/**
 * Core car loan calculation.
 *
 *   Loan amount            = on-road price − down payment (down payment clamped to [0, price])
 *   EMI                    = P × r × (1 + r)^n / ((1 + r)^n − 1)   (via calculateEmi)
 *   Total interest         = EMI × n − P
 *   Total upfront cost     = down payment + processing fee + other upfront costs
 *   Total cost with loan   = total upfront cost + EMI × n
 */
export function calculateCarLoan(input: CarLoanInput): CarLoanResult {
  const notes: string[] = [];
  const onRoadPrice = clamp(toNonNegative(input.onRoadPrice), 0, LIMITS.maxAmount);
  const rawDown = clamp(toNonNegative(input.downPayment), 0, LIMITS.maxAmount);
  const downPayment = Math.min(rawDown, onRoadPrice);
  if (rawDown > onRoadPrice && onRoadPrice > 0) {
    notes.push("Down payment is more than the on-road price, so it has been capped at the price and no loan is needed.");
  }
  const loanAmount = onRoadPrice - downPayment;

  const processingFee = clamp(toNonNegative(input.processingFee), 0, LIMITS.maxAmount);
  const otherUpfrontCosts = clamp(toNonNegative(input.otherUpfrontCosts), 0, LIMITS.maxAmount);

  const tenureYears = normaliseCarTenureYears(input.tenureYears);
  const tenureMonths = Math.round(tenureYears * 12);
  if (loanAmount > 0 && tenureMonths === 0) {
    notes.push("Enter a tenure of at least six months to calculate an EMI.");
  }

  const emi = calculateEmi({ principal: loanAmount, annualRate: input.annualRate, tenureMonths });
  const upfrontTotal = downPayment + processingFee + otherUpfrontCosts;

  return {
    onRoadPrice,
    downPayment,
    downPaymentPercent: onRoadPrice > 0 ? (downPayment / onRoadPrice) * 100 : 0,
    loanAmount,
    loanToPricePercent: onRoadPrice > 0 ? (loanAmount / onRoadPrice) * 100 : 0,
    processingFee,
    otherUpfrontCosts,
    upfrontTotal,
    totalCostWithLoan: upfrontTotal + emi.totalPayment,
    tenureYears,
    tenureMonths,
    emi,
    isValid: onRoadPrice > 0,
    notes,
  };
}

export interface CarTenureRow {
  tenureYears: number;
  tenureMonths: number;
  emi: number;
  totalInterest: number;
  totalPayment: number;
  /** Interest above the baseline (shortest listed) tenure; 0 if this tenure costs less. */
  extraInterestVsBaseline: number;
  /** Interest saved versus the baseline; non-zero only for tenures shorter than the baseline. */
  interestSavedVsBaseline: number;
  /** True for the row matching the user's tenure. */
  isCurrent: boolean;
}

export interface CarTenureComparison {
  /** Baseline tenure in years (3 by default). */
  baselineYears: number;
  rows: CarTenureRow[];
}

/**
 * EMI, interest and total payment for the same loan across several tenures.
 *   Extra interest vs baseline = max(0, interest(tenure) − interest(baseline))
 * The user's tenure is marked current; if it is not one of the options it is
 * inserted in order.
 */
export function compareCarLoanTenures(
  principal: number,
  annualRate: number,
  currentTenureYears: number,
  options: readonly number[] = CAR_TENURE_OPTIONS,
): CarTenureComparison {
  const cleanOptions = options.map(normaliseCarTenureYears).filter((y) => y > 0);
  const baselineYears = cleanOptions[0] ?? 3;
  const current = normaliseCarTenureYears(currentTenureYears);

  const set = new Set(cleanOptions);
  if (current > 0) set.add(current);
  const tenures = [...set].sort((a, b) => a - b);

  const baseline = calculateEmi({ principal, annualRate, tenureMonths: Math.round(baselineYears * 12) });

  const rows = tenures.map((years): CarTenureRow => {
    const months = Math.round(years * 12);
    const r = calculateEmi({ principal, annualRate, tenureMonths: months });
    const diff = r.totalInterest - baseline.totalInterest;
    return {
      tenureYears: years,
      tenureMonths: months,
      emi: r.emi,
      totalInterest: r.totalInterest,
      totalPayment: r.totalPayment,
      extraInterestVsBaseline: Math.max(0, diff),
      interestSavedVsBaseline: Math.max(0, -diff),
      isCurrent: years === current,
    };
  });

  return { baselineYears, rows };
}

export interface FlatRateComparison {
  /** Flat-rate interest = P × flat rate × years (charged on the original amount throughout). */
  flatInterest: number;
  /** Flat-rate EMI = (P + flat interest) ÷ n. */
  flatEmi: number;
  /** Interest at the same headline rate on a reducing balance. */
  reducingInterest: number;
  reducingEmi: number;
  /** Extra interest paid under the flat method = max(0, flat − reducing). */
  extraInterest: number;
  /** Reducing-balance annual rate that produces the same EMI as the flat quote (solved numerically). */
  equivalentReducingRate: number;
  isValid: boolean;
}

/**
 * Compares a flat-rate quote with a reducing-balance loan at the same headline rate.
 *
 *   Flat interest = P × (flat rate ÷ 100) × (n ÷ 12)
 *   Flat EMI      = (P + flat interest) ÷ n
 *
 * The equivalent reducing rate is found by bisection on calculateEmiAmount, since
 * EMI increases monotonically with the rate.
 */
export function compareFlatRate(principal: number, flatAnnualRate: number, tenureMonths: number): FlatRateComparison {
  const p = clamp(toNonNegative(principal), 0, LIMITS.maxAmount);
  const rate = clamp(toNonNegative(flatAnnualRate), 0, LIMITS.maxAnnualRate);
  const n = Math.round(clamp(toNonNegative(tenureMonths), 0, LIMITS.maxTenureMonths));

  if (p === 0 || n === 0) {
    return {
      flatInterest: 0,
      flatEmi: 0,
      reducingInterest: 0,
      reducingEmi: 0,
      extraInterest: 0,
      equivalentReducingRate: 0,
      isValid: false,
    };
  }

  const flatInterest = (p * rate * n) / 1200;
  const flatEmi = (p + flatInterest) / n;
  const reducing = calculateEmi({ principal: p, annualRate: rate, tenureMonths: n });

  // Bisection: find the reducing rate whose EMI equals the flat EMI.
  let lo = 0;
  let hi: number = LIMITS.maxAnnualRate;
  if (calculateEmiAmount(p, hi, n) <= flatEmi) {
    lo = hi;
  } else {
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (calculateEmiAmount(p, mid, n) < flatEmi) lo = mid;
      else hi = mid;
    }
  }

  return {
    flatInterest,
    flatEmi,
    reducingInterest: reducing.totalInterest,
    reducingEmi: reducing.emi,
    extraInterest: Math.max(0, flatInterest - reducing.totalInterest),
    equivalentReducingRate: (lo + hi) / 2,
    isValid: true,
  };
}

export type CarEmiShareBand = "lower" | "moderate" | "higher";

export interface CarAffordabilityInput {
  carEmi: number;
  /** Monthly take-home (in-hand) income. */
  monthlyIncome: number;
  /** EMIs already being paid on other loans, per month. */
  existingEmis: number;
}

export interface CarAffordabilityResult {
  /** Car EMI ÷ take-home income × 100. */
  carEmiSharePercent: number;
  /** (Car EMI + existing EMIs) ÷ take-home income × 100. */
  totalEmiSharePercent: number;
  totalEmis: number;
  /** Rough band for the car EMI share; null when no income is entered. */
  band: CarEmiShareBand | null;
  /** True when all EMIs together exceed TOTAL_EMI_CAUTION_PERCENT of income. */
  totalAboveCautionLevel: boolean;
  /** False when income is below ₹1 (shares cannot be computed). */
  isValid: boolean;
}

/** Band for a car-EMI share: ≤ 10% lower, > 10% to 20% moderate, > 20% higher. */
export function carEmiShareBand(sharePercent: number): CarEmiShareBand {
  const s = toNonNegative(sharePercent);
  if (s <= CAR_EMI_SHARE_BANDS.lowerMax) return "lower";
  if (s <= CAR_EMI_SHARE_BANDS.moderateMax) return "moderate";
  return "higher";
}

/**
 * Rough share-of-income check — a planning heuristic, not a lending rule or advice.
 *   Car EMI share   = car EMI ÷ income × 100
 *   Total EMI share = (car EMI + existing EMIs) ÷ income × 100
 */
export function assessCarAffordability(input: CarAffordabilityInput): CarAffordabilityResult {
  const carEmi = clamp(toNonNegative(input.carEmi), 0, LIMITS.maxAmount * 2);
  const existing = clamp(toNonNegative(input.existingEmis), 0, LIMITS.maxAmount);
  const income = clamp(toNonNegative(input.monthlyIncome), 0, LIMITS.maxAmount);
  const totalEmis = carEmi + existing;

  if (income < 1) {
    return {
      carEmiSharePercent: 0,
      totalEmiSharePercent: 0,
      totalEmis,
      band: null,
      totalAboveCautionLevel: false,
      isValid: false,
    };
  }

  const carEmiSharePercent = (carEmi / income) * 100;
  const totalEmiSharePercent = (totalEmis / income) * 100;
  return {
    carEmiSharePercent,
    totalEmiSharePercent,
    totalEmis,
    band: carEmiShareBand(carEmiSharePercent),
    totalAboveCautionLevel: totalEmiSharePercent > TOTAL_EMI_CAUTION_PERCENT,
    isValid: true,
  };
}
