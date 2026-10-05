import { calculateEmiAmount } from "./emi";
import { indicativeMaxLtv } from "./homeLoan";
import { clamp, compoundGrowthMinusOne, LIMITS, monthlyRate, toNonNegative } from "./utils";

/**
 * Home loan eligibility estimate from income, using the two checks most Indian
 * lenders start with:
 *
 *  1. FOIR (Fixed Obligation to Income Ratio): all EMIs and fixed obligations,
 *     including the new home loan EMI, may use at most FOIR% of monthly income.
 *  2. The new EMI is converted to a loan amount as the present value of the
 *     EMI annuity at the quoted rate and tenure.
 *
 * FOIR is lender practice, not regulation; the default and range here are
 * assumptions the user can change. The LTV slabs come from RBI housing-finance
 * guidelines via `indicativeMaxLtv`.
 */

export const ELIGIBILITY_DEFAULTS = {
  foirPercent: 50,
  retirementAge: 60,
  ltvPercent: 80,
} as const;

/** Bounds the engine enforces. The UI uses narrower, realistic ranges. */
export const ELIGIBILITY_LIMITS = {
  maxAge: 100,
  minLtvPercent: 10,
  maxLtvPercent: 100,
  maxFoirPercent: 100,
  maxTenureYears: LIMITS.maxTenureMonths / 12,
} as const;

export interface HomeLoanEligibilityInput {
  /** Applicant's monthly net (take-home) income in rupees. */
  monthlyIncome: number;
  /** Co-applicant's monthly net income in rupees (optional). */
  coApplicantIncome?: number;
  /** Total of EMIs already being paid each month. */
  existingEmis?: number;
  /** Other fixed monthly obligations the lender may count (e.g. credit card minimums). */
  otherObligations?: number;
  /** Applicant's age in years. */
  age: number;
  /** Desired loan tenure in years. */
  tenureYears: number;
  /** Annual interest rate in percent, e.g. 8.5. */
  annualRate: number;
  /** Maximum share of income for all EMIs and obligations, in percent. Default 50. */
  foirPercent?: number;
  /** Age by which the loan must be repaid. Default 60. */
  retirementAge?: number;
  /** Loan-to-value the user assumes for the property budget, in percent. Default 80. */
  ltvPercent?: number;
}

export type EligibilityIssue =
  /** No income entered. */
  | "no-income"
  /** Existing EMIs and obligations already use the whole FOIR allowance. */
  | "obligations-exceed-limit"
  /** Retirement age shortened the desired tenure. */
  | "tenure-capped-by-age"
  /** Age is at or beyond the assumed retirement age, so no tenure is left. */
  | "no-tenure-left"
  /** The RBI LTV slab for this loan size is lower than the LTV assumption. */
  | "ltv-capped-by-rbi";

export interface HomeLoanEligibilityResult {
  /** Applicant + co-applicant monthly income. */
  combinedIncome: number;
  foirPercent: number;
  /** combinedIncome × FOIR: the ceiling for all EMIs and obligations together. */
  maxTotalObligations: number;
  /** Existing EMIs + other obligations. */
  existingObligations: number;
  /** Maximum EMI available for the new home loan (never negative). */
  maxEmi: number;
  desiredTenureMonths: number;
  /** Tenure actually used, after the retirement-age cap. */
  tenureMonths: number;
  tenureCappedByAge: boolean;
  annualRate: number;
  /** Present value of `maxEmi` over `tenureMonths` at `annualRate`. */
  eligibleLoan: number;
  /** User's LTV assumption after clamping. */
  assumedLtvPercent: number;
  /** RBI slab maximum for a loan of this size. */
  rbiMaxLtvPercent: number;
  /** min(assumed LTV, RBI slab). */
  appliedLtvPercent: number;
  ltvCappedByRbi: boolean;
  /** eligibleLoan ÷ applied LTV. */
  propertyBudget: number;
  /** propertyBudget − eligibleLoan. */
  downPayment: number;
  /** maxEmi × tenureMonths. */
  totalRepayment: number;
  /** totalRepayment − eligibleLoan (never negative). */
  totalInterest: number;
  /** True when a positive loan amount could be estimated. */
  isValid: boolean;
  issues: EligibilityIssue[];
  /** Plain-language explanations matching `issues`. */
  notes: string[];
}

/** Finite, non-negative value, or the fallback when the value is missing or invalid. */
function orDefault(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return value === undefined || value === null || !Number.isFinite(n) || n < 0 ? fallback : n;
}

const amount = (v: unknown) => clamp(toNonNegative(v), 0, LIMITS.maxAmount);

/**
 * Present value of a level monthly instalment (the loan an EMI can repay):
 *
 *   PV = EMI × [(1 + r)^n − 1] ÷ [r × (1 + r)^n]
 *
 * r = annual rate ÷ 12 ÷ 100, n = months. Computed as EMI × g ÷ (r × (g + 1))
 * with g = (1 + r)^n − 1 via expm1/log1p, so tiny rates keep full precision.
 * A 0% rate degenerates to EMI × n. Inverse of `calculateEmiAmount`.
 */
export function presentValueOfEmi(emi: number, annualRate: number, tenureMonths: number): number {
  const e = amount(emi);
  const rate = clamp(toNonNegative(annualRate), 0, LIMITS.maxAnnualRate);
  const n = Math.round(clamp(toNonNegative(tenureMonths), 0, LIMITS.maxTenureMonths));
  if (e === 0 || n === 0) return 0;

  const r = monthlyRate(rate);
  if (r === 0) return e * n;

  const growth = compoundGrowthMinusOne(r, n);
  // Within LIMITS growth is always finite; on overflow the annuity tends to a perpetuity, EMI ÷ r.
  if (!Number.isFinite(growth)) return e / r;
  if (growth <= 0) return e * n;
  return (e * growth) / (r * (growth + 1));
}

/**
 * Estimates the maximum home loan:
 *
 *   combined income      = applicant + co-applicant
 *   max EMI              = max(0, combined income × FOIR − existing EMIs − other obligations)
 *   tenure (months)      = min(desired tenure, retirement age − age), floored at 0
 *   eligible loan        = presentValueOfEmi(max EMI, rate, tenure)
 *   applied LTV          = min(assumed LTV, RBI slab for the loan size)
 *   property budget      = eligible loan ÷ applied LTV
 *   down payment         = property budget − eligible loan
 *   total repayment      = max EMI × months;  total interest = total repayment − loan
 */
export function calculateHomeLoanEligibility(input: HomeLoanEligibilityInput): HomeLoanEligibilityResult {
  const applicantIncome = amount(input.monthlyIncome);
  const coApplicantIncome = amount(input.coApplicantIncome);
  const combinedIncome = applicantIncome + coApplicantIncome;
  const existingObligations = amount(input.existingEmis) + amount(input.otherObligations);

  const foirPercent = clamp(orDefault(input.foirPercent, ELIGIBILITY_DEFAULTS.foirPercent), 0, ELIGIBILITY_LIMITS.maxFoirPercent);
  const maxTotalObligations = (combinedIncome * foirPercent) / 100;
  const maxEmi = Math.max(0, maxTotalObligations - existingObligations);

  const age = clamp(toNonNegative(input.age), 0, ELIGIBILITY_LIMITS.maxAge);
  const retirementAge = clamp(
    orDefault(input.retirementAge, ELIGIBILITY_DEFAULTS.retirementAge),
    0,
    ELIGIBILITY_LIMITS.maxAge,
  );
  const desiredTenureMonths = Math.round(
    clamp(toNonNegative(input.tenureYears), 0, ELIGIBILITY_LIMITS.maxTenureYears) * 12,
  );
  // Floor so the loan never runs past the retirement age.
  const ageCapMonths = Math.max(0, Math.floor((retirementAge - age) * 12 + 1e-9));
  const tenureMonths = Math.min(desiredTenureMonths, ageCapMonths);
  const tenureCappedByAge = desiredTenureMonths > 0 && ageCapMonths < desiredTenureMonths;

  const annualRate = clamp(toNonNegative(input.annualRate), 0, LIMITS.maxAnnualRate);
  const eligibleLoan = presentValueOfEmi(maxEmi, annualRate, tenureMonths);
  const isValid = eligibleLoan > 0;

  const assumedLtvPercent = clamp(
    orDefault(input.ltvPercent, ELIGIBILITY_DEFAULTS.ltvPercent),
    ELIGIBILITY_LIMITS.minLtvPercent,
    ELIGIBILITY_LIMITS.maxLtvPercent,
  );
  const rbiMaxLtvPercent = indicativeMaxLtv(eligibleLoan);
  const appliedLtvPercent = Math.min(assumedLtvPercent, rbiMaxLtvPercent);
  const ltvCappedByRbi = isValid && rbiMaxLtvPercent < assumedLtvPercent;

  const propertyBudget = isValid ? eligibleLoan / (appliedLtvPercent / 100) : 0;
  const downPayment = Math.max(0, propertyBudget - eligibleLoan);
  const totalRepayment = isValid ? maxEmi * tenureMonths : 0;
  // Floating-point noise at 0% can give −0.0000001; never report negative interest.
  const totalInterest = Math.max(0, totalRepayment - eligibleLoan);

  const issues: EligibilityIssue[] = [];
  const notes: string[] = [];
  if (combinedIncome === 0) {
    issues.push("no-income");
    notes.push("Enter your monthly take-home income to estimate eligibility.");
  } else if (maxEmi === 0) {
    issues.push("obligations-exceed-limit");
    notes.push(
      `Your existing EMIs and obligations already use the full ${foirPercent}% of income assumed for repayments, so no room is left for a new EMI.`,
    );
  }
  if (desiredTenureMonths > 0 && ageCapMonths === 0) {
    issues.push("no-tenure-left");
    notes.push(
      `At age ${age}, a loan that must end by age ${retirementAge} has no tenure left. Try a later retirement-age assumption or a younger co-applicant as the main borrower.`,
    );
  } else if (tenureCappedByAge) {
    issues.push("tenure-capped-by-age");
    notes.push(
      `Tenure shortened from ${desiredTenureMonths / 12} to ${formatYears(tenureMonths)} years so the loan ends by age ${retirementAge}.`,
    );
  }
  if (ltvCappedByRbi) {
    issues.push("ltv-capped-by-rbi");
    notes.push(
      `For a loan of this size, RBI guidelines allow lenders to finance up to ${rbiMaxLtvPercent}% of the property value, so ${rbiMaxLtvPercent}% is used instead of ${assumedLtvPercent}%.`,
    );
  }

  return {
    combinedIncome,
    foirPercent,
    maxTotalObligations,
    existingObligations,
    maxEmi,
    desiredTenureMonths,
    tenureMonths,
    tenureCappedByAge,
    annualRate,
    eligibleLoan,
    assumedLtvPercent,
    rbiMaxLtvPercent,
    appliedLtvPercent,
    ltvCappedByRbi,
    propertyBudget,
    downPayment,
    totalRepayment,
    totalInterest,
    isValid,
    issues,
    notes,
  };
}

function formatYears(months: number): string {
  const years = months / 12;
  return Number.isInteger(years) ? String(years) : years.toFixed(1);
}

/**
 * How much eligible loan each rupee of monthly EMI capacity supports at this
 * rate and tenure (i.e. presentValueOfEmi(1, …)). Used for insights such as
 * "each ₹10,000 of existing EMI reduces eligibility by about ₹X".
 */
export function loanPerRupeeOfEmi(annualRate: number, tenureMonths: number): number {
  return presentValueOfEmi(1, annualRate, tenureMonths);
}

/** Sanity check used in tests: the EMI on the eligible loan equals the max EMI. */
export function emiOnEligibleLoan(result: HomeLoanEligibilityResult): number {
  return calculateEmiAmount(result.eligibleLoan, result.annualRate, result.tenureMonths);
}
