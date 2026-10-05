import { calculateEmi, type EmiResult } from "./emi";
import { toNonNegative } from "./utils";

export type TenureUnit = "years" | "months";

export interface LoanInput {
  principal: number;
  annualRate: number;
  tenure: number;
  tenureUnit: TenureUnit;
}

export interface LoanResult extends EmiResult {
  /** Total interest as a percentage of the amount borrowed. */
  interestToPrincipalPercent: number;
  /** Share of every rupee repaid that goes to interest, in percent. */
  interestShareOfPaymentPercent: number;
}

export function tenureToMonths(tenure: number, unit: TenureUnit): number {
  const t = toNonNegative(tenure);
  return Math.round(unit === "years" ? t * 12 : t);
}

/** General-purpose loan calculator: EMI plus ratios that describe the true cost of borrowing. */
export function calculateLoan(input: LoanInput): LoanResult {
  const base = calculateEmi({
    principal: input.principal,
    annualRate: input.annualRate,
    tenureMonths: tenureToMonths(input.tenure, input.tenureUnit),
  });

  return {
    ...base,
    interestToPrincipalPercent: base.principal > 0 ? (base.totalInterest / base.principal) * 100 : 0,
    interestShareOfPaymentPercent: base.totalPayment > 0 ? (base.totalInterest / base.totalPayment) * 100 : 0,
  };
}
