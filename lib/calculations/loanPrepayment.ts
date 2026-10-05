import { calculateEmiAmount } from "./emi";
import { clamp, LIMITS, monthlyRate, toNonNegative, yearsToMonths } from "./utils";

/**
 * Loan prepayment engine.
 *
 * Simulates an existing reducing-balance loan month by month, with and without
 * prepayments, and reports the interest saved under two strategies:
 *
 *  - Reduce tenure (keep EMI): the EMI never changes; prepayments make the loan end earlier.
 *  - Reduce EMI (keep tenure): after every lump-sum prepayment the EMI is recomputed over the
 *    months left in the ORIGINAL tenure:  EMI = calculateEmiAmount(balance, rate, n − m).
 *    Recurring extra monthly payments never trigger a recomputation, so they always shorten
 *    the loan (in both strategies).
 *
 * Each simulated month m (1-based, month 1 = the next EMI):
 *   interest  = balance × r                 (r = annual rate ÷ 12 ÷ 100)
 *   principal = min(balance, EMI − interest) (the final instalment is trimmed to clear the balance)
 *   balance  −= principal
 *   balance  −= min(extra monthly payment, balance)
 *   balance  −= min(lump sum due this month, balance)   (lump sums fall in month f, f+12, f+24 … for "yearly")
 *
 * A prepayment fee (% of each prepaid rupee, both lump sums and extra monthly payments) is
 * assumed to be paid separately in cash, so it does not reduce the amount applied to the loan.
 * Full precision is kept throughout; round only for display.
 */

export type PrepaymentFrequency = "once" | "yearly";
export type PrepaymentStrategy = "reduce-tenure" | "reduce-emi";

export interface LoanPrepaymentInput {
  /** Principal outstanding today, in rupees. */
  outstanding: number;
  /** Current annual interest rate in percent, e.g. 8.5. */
  annualRate: number;
  /** Remaining tenure in years; decimals allowed (converted with yearsToMonths). */
  remainingYears: number;
  /** Lump-sum prepayment amount (each time, for "yearly"). */
  prepaymentAmount: number;
  frequency: PrepaymentFrequency;
  /** Month of the first lump sum, 1 = paid along with the next EMI. Months after the tenure are ignored. */
  firstPrepaymentMonth: number;
  /** Optional recurring extra payment made every month on top of the EMI. */
  extraMonthly?: number;
  /** Optional prepayment fee as a percent of each prepaid amount. */
  feePercent?: number;
}

export interface StrategyResult {
  strategy: PrepaymentStrategy;
  /** Interest paid over the remaining life of the loan with prepayments. */
  totalInterest: number;
  /** Sum of regular instalments (EMIs) paid. */
  totalEmiPaid: number;
  /** Lump sums + extra monthly payments actually applied to the loan. */
  totalPrepaid: number;
  feesPaid: number;
  /** Number of monthly instalments until the loan is closed. */
  months: number;
  monthsSaved: number;
  /** Original total interest − new total interest. */
  interestSaved: number;
  /** max(0, interest saved − fees). */
  netSaving: number;
  /** max(0, fees − interest saved): non-zero only when fees outweigh the saving. */
  netLoss: number;
  /** EMI in force right after the first lump sum (equals the current EMI for reduce-tenure). */
  emiAfterFirstPrepayment: number;
  /** EMI in force for the last full instalment. */
  finalEmi: number;
  /** Number of lump sums actually applied. */
  lumpSumsApplied: number;
  /** True when a lump sum cleared the remaining balance. */
  closedByPrepayment: boolean;
}

export interface LoanPrepaymentResult {
  outstanding: number;
  annualRate: number;
  remainingMonths: number;
  /** EMI implied by outstanding, rate and remaining tenure. */
  currentEmi: number;
  prepaymentAmount: number;
  frequency: PrepaymentFrequency;
  firstPrepaymentMonth: number;
  extraMonthly: number;
  feePercent: number;
  original: { totalInterest: number; totalPayment: number; months: number };
  reduceTenure: StrategyResult;
  reduceEmi: StrategyResult;
  /** True when at least one rupee of prepayment is applied. */
  hasPrepayment: boolean;
  isValid: boolean;
  /** Human-readable notes about ignored or capped inputs. */
  notes: string[];
}

/** Residue below one paisa is absorbed into the current payment instead of creating an extra month. */
const PAISA = 0.01;

interface SimulationConfig {
  principal: number;
  r: number;
  annualRate: number;
  n: number;
  emi: number;
  lumpSum: number;
  frequency: PrepaymentFrequency;
  firstMonth: number;
  extraMonthly: number;
  feeRate: number;
  recomputeEmi: boolean;
}

interface SimulationOutcome {
  totalInterest: number;
  totalEmiPaid: number;
  totalPrepaid: number;
  feesPaid: number;
  months: number;
  emiAfterFirstPrepayment: number;
  finalEmi: number;
  lumpSumsApplied: number;
  closedByPrepayment: boolean;
}

function isLumpSumMonth(month: number, cfg: SimulationConfig): boolean {
  if (cfg.lumpSum <= 0 || month < cfg.firstMonth) return false;
  if (cfg.frequency === "once") return month === cfg.firstMonth;
  return (month - cfg.firstMonth) % 12 === 0;
}

function simulate(cfg: SimulationConfig): SimulationOutcome {
  let balance = cfg.principal;
  let emi = cfg.emi;
  let totalInterest = 0;
  let totalEmiPaid = 0;
  let totalPrepaid = 0;
  let months = 0;
  let lumpSumsApplied = 0;
  let emiAfterFirstPrepayment = cfg.emi;
  let finalEmi = cfg.emi;
  let closedByPrepayment = false;

  for (let month = 1; month <= cfg.n && balance > 0; month++) {
    months = month;
    finalEmi = emi;
    const interest = balance * cfg.r;
    const isLast = month === cfg.n;
    let principalPaid = isLast ? balance : Math.min(balance, Math.max(0, emi - interest));
    if (balance - principalPaid < PAISA) principalPaid = balance;
    balance -= principalPaid;
    totalInterest += interest;
    totalEmiPaid += principalPaid + interest;

    if (balance > 0 && cfg.extraMonthly > 0) {
      const extra = Math.min(cfg.extraMonthly, balance);
      balance -= extra;
      totalPrepaid += extra;
    }

    if (balance > 0 && isLumpSumMonth(month, cfg)) {
      const lump = Math.min(cfg.lumpSum, balance);
      balance -= lump;
      totalPrepaid += lump;
      lumpSumsApplied += 1;
      if (balance < PAISA) {
        totalPrepaid += balance;
        balance = 0;
        closedByPrepayment = true;
      }
      if (cfg.recomputeEmi && balance > 0) {
        emi = calculateEmiAmount(balance, cfg.annualRate, cfg.n - month);
      }
      if (lumpSumsApplied === 1) emiAfterFirstPrepayment = balance > 0 ? emi : 0;
    }

    if (balance < PAISA) balance = 0;
  }

  return {
    totalInterest,
    totalEmiPaid,
    totalPrepaid,
    feesPaid: totalPrepaid * cfg.feeRate,
    months,
    emiAfterFirstPrepayment,
    finalEmi,
    lumpSumsApplied,
    closedByPrepayment,
  };
}

export function calculateLoanPrepayment(input: LoanPrepaymentInput): LoanPrepaymentResult {
  const outstanding = clamp(toNonNegative(input.outstanding), 0, LIMITS.maxAmount);
  const annualRate = clamp(toNonNegative(input.annualRate), 0, LIMITS.maxAnnualRate);
  const remainingMonths = Math.min(yearsToMonths(clamp(toNonNegative(input.remainingYears), 0, LIMITS.maxTenureMonths / 12)), LIMITS.maxTenureMonths);
  const prepaymentAmount = clamp(toNonNegative(input.prepaymentAmount), 0, LIMITS.maxAmount);
  const frequency: PrepaymentFrequency = input.frequency === "yearly" ? "yearly" : "once";
  const firstPrepaymentMonth = Math.max(1, Math.round(clamp(toNonNegative(input.firstPrepaymentMonth), 1, LIMITS.maxTenureMonths + 1)));
  const extraMonthly = clamp(toNonNegative(input.extraMonthly), 0, LIMITS.maxAmount);
  const feePercent = clamp(toNonNegative(input.feePercent), 0, 100);

  const isValid = outstanding > 0 && remainingMonths > 0;
  const currentEmi = isValid ? calculateEmiAmount(outstanding, annualRate, remainingMonths) : 0;
  const notes: string[] = [];

  const base: SimulationConfig = {
    principal: isValid ? outstanding : 0,
    r: monthlyRate(annualRate),
    annualRate,
    n: isValid ? remainingMonths : 0,
    emi: currentEmi,
    lumpSum: 0,
    frequency,
    firstMonth: firstPrepaymentMonth,
    extraMonthly: 0,
    feeRate: feePercent / 100,
    recomputeEmi: false,
  };

  const original = simulate(base);
  const lumpSumScheduled = isValid && prepaymentAmount > 0 && firstPrepaymentMonth <= remainingMonths;
  if (isValid && prepaymentAmount > 0 && firstPrepaymentMonth > remainingMonths) {
    notes.push("The first prepayment month falls after the loan ends, so the lump-sum prepayment was ignored.");
  }

  const withPrepayment: SimulationConfig = {
    ...base,
    lumpSum: lumpSumScheduled ? prepaymentAmount : 0,
    extraMonthly: isValid ? extraMonthly : 0,
  };
  const tenureRun = simulate(withPrepayment);
  const emiRun = simulate({ ...withPrepayment, recomputeEmi: true });

  function toStrategy(strategy: PrepaymentStrategy, run: SimulationOutcome): StrategyResult {
    const interestSaved = Math.max(0, original.totalInterest - run.totalInterest);
    const diff = interestSaved - run.feesPaid;
    return {
      strategy,
      totalInterest: run.totalInterest,
      totalEmiPaid: run.totalEmiPaid,
      totalPrepaid: run.totalPrepaid,
      feesPaid: run.feesPaid,
      months: run.months,
      monthsSaved: Math.max(0, original.months - run.months),
      interestSaved,
      netSaving: Math.max(0, diff),
      netLoss: Math.max(0, -diff),
      emiAfterFirstPrepayment: run.emiAfterFirstPrepayment,
      finalEmi: run.finalEmi,
      lumpSumsApplied: run.lumpSumsApplied,
      closedByPrepayment: run.closedByPrepayment,
    };
  }

  const reduceTenure = toStrategy("reduce-tenure", tenureRun);
  const reduceEmi = toStrategy("reduce-emi", emiRun);
  const hasPrepayment = tenureRun.totalPrepaid > 0;

  if (isValid && lumpSumScheduled && tenureRun.lumpSumsApplied === 0) {
    notes.push("The loan is fully repaid by your extra monthly payments before the first lump sum is due.");
  }
  if (tenureRun.closedByPrepayment) {
    notes.push("A prepayment covers the whole remaining balance, so the loan closes at that point (any excess is not used).");
  }
  if (isValid && hasPrepayment && annualRate === 0) {
    notes.push("At 0% interest there is no interest to save: prepaying only shortens the loan or lowers the EMI.");
  }

  return {
    outstanding,
    annualRate,
    remainingMonths,
    currentEmi,
    prepaymentAmount,
    frequency,
    firstPrepaymentMonth,
    extraMonthly,
    feePercent,
    original: {
      totalInterest: original.totalInterest,
      totalPayment: original.totalEmiPaid,
      months: original.months,
    },
    reduceTenure,
    reduceEmi,
    hasPrepayment,
    isValid,
    notes,
  };
}

export interface PrepayVsInvestInput {
  /** The lump sum that could either be prepaid or invested. */
  amount: number;
  /** Loan rate in percent per annum (monthly compounding, as on the loan). */
  loanAnnualRate: number;
  /** Expected annual investment return in percent (annual compounding). Uncertain by nature. */
  expectedAnnualReturn: number;
  /** Horizon in months (normally the months left in the original tenure after the prepayment). */
  months: number;
  /** Optional tax on investment gains at withdrawal, percent of the gain. */
  taxOnGainsPercent?: number;
}

export interface PrepayVsInvestResult {
  amount: number;
  months: number;
  /** Effective annual rate of the loan: (1 + r)^12 − 1, in percent. This is the guaranteed return of prepaying. */
  loanEffectiveAnnualRate: number;
  /**
   * What prepaying is worth at the end of the horizon:  A × (1 + r)^months.
   * Prepaying ₹A avoids interest at the loan rate on ₹A for the rest of the tenure, which is
   * the same as earning the loan rate, compounded monthly, risk-free and tax-free.
   */
  prepayValue: number;
  /** A × (1 + R)^(months ÷ 12), before tax. */
  investValueGross: number;
  /** A + (gross value − A) × (1 − tax rate). */
  investValueAfterTax: number;
  /** max(0, invest after tax − prepay value). */
  investAhead: number;
  /** max(0, prepay value − invest after tax). */
  prepayAhead: number;
  /** Pre-tax annual return the investment needs to match prepaying, in percent. */
  breakEvenReturn: number;
  isValid: boolean;
}

/**
 * Apples-to-apples illustration of prepaying versus investing the same lump sum over the
 * same horizon. Prepaying is valued at the loan rate (guaranteed); investing at the user's
 * expected return (uncertain), optionally after tax on the gain.
 *
 *   prepay value   = A × (1 + r_loan/12)^n
 *   invest (gross) = A × (1 + R)^(n/12)
 *   invest (net)   = A + (gross − A) × (1 − t)
 *   break-even R   = [1 + ((1 + r_loan/12)^n − 1) ÷ (1 − t)]^(12/n) − 1
 */
export function comparePrepayWithInvesting(input: PrepayVsInvestInput): PrepayVsInvestResult {
  const amount = clamp(toNonNegative(input.amount), 0, LIMITS.maxAmount);
  const loanRate = clamp(toNonNegative(input.loanAnnualRate), 0, LIMITS.maxAnnualRate);
  const expected = clamp(toNonNegative(input.expectedAnnualReturn), 0, LIMITS.maxAnnualRate);
  const months = Math.round(clamp(toNonNegative(input.months), 0, LIMITS.maxTenureMonths));
  const tax = clamp(toNonNegative(input.taxOnGainsPercent), 0, 60) / 100;
  const isValid = amount > 0 && months > 0;

  const r = monthlyRate(loanRate);
  const loanEffectiveAnnualRate = Math.expm1(12 * Math.log1p(r)) * 100;

  if (!isValid) {
    return {
      amount,
      months,
      loanEffectiveAnnualRate,
      prepayValue: amount,
      investValueGross: amount,
      investValueAfterTax: amount,
      investAhead: 0,
      prepayAhead: 0,
      breakEvenReturn: loanEffectiveAnnualRate / (1 - tax),
      isValid,
    };
  }

  const prepayGrowth = Math.exp(months * Math.log1p(r));
  const prepayValue = amount * prepayGrowth;
  const investValueGross = amount * Math.exp((months / 12) * Math.log1p(expected / 100));
  const investValueAfterTax = amount + (investValueGross - amount) * (1 - tax);
  const breakEvenReturn = (Math.exp((12 / months) * Math.log1p((prepayGrowth - 1) / (1 - tax))) - 1) * 100;

  return {
    amount,
    months,
    loanEffectiveAnnualRate,
    prepayValue,
    investValueGross,
    investValueAfterTax,
    investAhead: Math.max(0, investValueAfterTax - prepayValue),
    prepayAhead: Math.max(0, prepayValue - investValueAfterTax),
    breakEvenReturn,
    isValid,
  };
}

/** Standard comparison amounts for the scenario table. */
export const PREPAYMENT_SCENARIO_AMOUNTS = [50_000, 1_00_000, 2_00_000, 5_00_000] as const;
