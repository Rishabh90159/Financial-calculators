import { calculateEmi, type EmiResult } from "./emi";
import { clamp, LIMITS, toNonNegative, yearsToMonths } from "./utils";

export interface PurchaseCosts {
  stampDuty: number;
  registration: number;
  other: number;
}

export interface HomeLoanInput {
  propertyPrice: number;
  downPayment: number;
  annualRate: number;
  tenureYears: number;
  /** Optional, user-entered one-time purchase costs. No state-specific rates are assumed. */
  costs?: Partial<PurchaseCosts>;
}

export interface HomeLoanResult {
  propertyPrice: number;
  /** Down payment after clamping to the property price. */
  downPayment: number;
  loanAmount: number;
  downPaymentPercent: number;
  /** Loan-to-value ratio in percent. */
  ltvPercent: number;
  additionalCosts: number;
  /** Cash needed before/at purchase: down payment + additional costs. */
  upfrontTotal: number;
  /** Everything paid over the life of the purchase: upfront cash + all EMIs. */
  totalCostOfOwnership: number;
  emi: EmiResult;
  isValid: boolean;
}

/**
 * Indicative maximum LTV slabs from the Reserve Bank of India's housing-loan
 * guidelines (≤ ₹30 lakh: 90%, ₹30–75 lakh: 80%, > ₹75 lakh: 75%), applied on
 * the loan amount. Shown only as an informational check, never as a hard rule:
 * lenders apply their own policies and the regulation can change.
 * Review this table whenever RBI updates its guidance.
 */
export const RBI_LTV_SLABS = [
  { maxLoan: 30_00_000, maxLtvPercent: 90 },
  { maxLoan: 75_00_000, maxLtvPercent: 80 },
  { maxLoan: Number.POSITIVE_INFINITY, maxLtvPercent: 75 },
] as const;

export function indicativeMaxLtv(loanAmount: number): number {
  const loan = toNonNegative(loanAmount);
  const slab = RBI_LTV_SLABS.find((s) => loan <= s.maxLoan);
  return slab?.maxLtvPercent ?? 75;
}

export function calculateHomeLoan(input: HomeLoanInput): HomeLoanResult {
  const propertyPrice = clamp(toNonNegative(input.propertyPrice), 0, LIMITS.maxAmount);
  const downPayment = clamp(toNonNegative(input.downPayment), 0, propertyPrice);
  const loanAmount = propertyPrice - downPayment;

  const additionalCosts =
    clamp(toNonNegative(input.costs?.stampDuty), 0, LIMITS.maxAmount) +
    clamp(toNonNegative(input.costs?.registration), 0, LIMITS.maxAmount) +
    clamp(toNonNegative(input.costs?.other), 0, LIMITS.maxAmount);

  const emi = calculateEmi({
    principal: loanAmount,
    annualRate: input.annualRate,
    tenureMonths: yearsToMonths(input.tenureYears),
  });

  const upfrontTotal = downPayment + additionalCosts;

  return {
    propertyPrice,
    downPayment,
    loanAmount,
    downPaymentPercent: propertyPrice > 0 ? (downPayment / propertyPrice) * 100 : 0,
    ltvPercent: propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0,
    additionalCosts,
    upfrontTotal,
    totalCostOfOwnership: upfrontTotal + emi.totalPayment,
    emi,
    isValid: propertyPrice > 0,
  };
}
