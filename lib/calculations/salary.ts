import { calculateIncomeTax, getRegimeRules, type IncomeTaxResult } from "./incomeTax";
import { TAX_RULES, type TaxRegime } from "./taxRules";
import { clamp, LIMITS, toNonNegative } from "./utils";

/**
 * CTC → take-home salary model.
 *
 * Structure (all annual, rupees):
 *   basic           = CTC × basic%
 *   employer PF     = 12% × basic                         ("full")
 *                   = 12% × min(basic, ₹15,000 × 12)      ("ceiling" — max ₹21,600 a year)
 *                   = 0                                   ("none" — not part of CTC)
 *   gratuity        = 4.81% × basic, only if included in CTC (accrued, not paid monthly)
 *   gross salary    = CTC − employer PF − gratuity
 *   HRA             = basic × HRA%   (reduced if basic + HRA would exceed gross)
 *   special allow.  = gross − basic − HRA (≥ 0)
 *   employee PF     = same three modes, on the same basic
 *
 * Taxable income:
 *   new regime = max(0, gross − ₹75,000)
 *   old regime = max(0, gross − ₹50,000 − PT − HRA exemption
 *                       − min(₹1,50,000, employee PF + other 80C) − 80D & other)
 *
 * Take-home:
 *   annual  = max(0, gross − employee PF − PT − income tax (incl. cess) − other deductions × 12)
 *   monthly = annual ÷ 12  (TDS assumed spread evenly over 12 months)
 *
 * Not modelled: other income, perquisites, variable pay/bonus timing,
 * employer NPS, DA, LTA, meal cards, EDLI/admin charges, mid-year joining.
 */

export type PfMode = "full" | "ceiling" | "none";

export interface OldRegimeDeductions {
  /** Exempt part of HRA for the year (cannot exceed HRA received). */
  hraExemption: number;
  /** 80C investments other than employee PF (PPF, ELSS, life insurance, etc.). */
  other80C: number;
  /** 80D health insurance and any other deductions, combined. */
  deduction80DAndOther: number;
}

export interface SalaryInput {
  annualCtc: number;
  /** Basic salary as % of CTC (20–70). */
  basicPercent: number;
  /** HRA as % of basic (0–100). */
  hraPercent: number;
  employerPf: PfMode;
  employeePf: PfMode;
  /** When true, gratuity (4.81% of basic) is treated as part of CTC but not paid monthly. */
  includeGratuity: boolean;
  /** Professional tax per year (0–₹2,500). */
  professionalTax: number;
  /** Other deductions per month (group insurance, canteen, etc.). */
  otherMonthlyDeductions: number;
  regime: TaxRegime;
  /** Only used by the old regime. */
  oldRegime?: Partial<OldRegimeDeductions>;
}

export interface RegimeOutcome {
  regime: TaxRegime;
  standardDeduction: number;
  /** Professional tax actually deducted from income for tax (0 in the new regime). */
  professionalTaxDeduction: number;
  hraExemption: number;
  /** min(₹1,50,000, employee PF + other 80C); 0 in the new regime. */
  section80C: number;
  deduction80DAndOther: number;
  taxableIncome: number;
  tax: IncomeTaxResult;
  /** Annual income tax incl. cess, full precision. */
  incomeTax: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
  /** incomeTax ÷ gross salary × 100. */
  effectiveTaxRatePercent: number;
}

export interface SalaryBreakup {
  annualCtc: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  grossSalary: number;
  employerPf: number;
  gratuity: number;
  employeePf: number;
  professionalTax: number;
  otherDeductions: number;
}

export interface SalaryResult extends SalaryBreakup {
  regime: TaxRegime;
  /** Outcome under the selected regime. */
  selected: RegimeOutcome;
  /** Both regimes on the same inputs, for comparison. */
  byRegime: Record<TaxRegime, RegimeOutcome>;
  incomeTax: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
  monthlyGross: number;
  effectiveTaxRatePercent: number;
  /** Regime with the higher take-home on these inputs, or "equal". */
  higherTakeHome: TaxRegime | "equal";
  isValid: boolean;
  notes: string[];
}

export const SALARY_CONSTANTS = {
  pfRate: 0.12,
  /** Statutory PF wage ceiling per month. */
  pfWageCeilingMonthly: 15_000,
  gratuityRate: 0.0481,
  basicPercentMin: 20,
  basicPercentMax: 70,
  hraPercentMax: 100,
} as const;

const PF_MODES: readonly PfMode[] = ["full", "ceiling", "none"];

function pfMode(value: unknown, fallback: PfMode): PfMode {
  return PF_MODES.includes(value as PfMode) ? (value as PfMode) : fallback;
}

function amount(value: unknown): number {
  return clamp(toNonNegative(value), 0, LIMITS.maxAmount);
}

/** Annual PF contribution: 12% of basic, or of basic capped at ₹15,000 a month, or nothing. */
export function annualPf(annualBasic: number, mode: PfMode): number {
  const basic = amount(annualBasic);
  if (mode === "none") return 0;
  if (mode === "ceiling") return SALARY_CONSTANTS.pfRate * Math.min(basic, SALARY_CONSTANTS.pfWageCeilingMonthly * 12);
  return SALARY_CONSTANTS.pfRate * basic;
}

function normaliseInput(input: SalaryInput) {
  const employerPf = pfMode(input.employerPf, "full");
  return {
    annualCtc: amount(input.annualCtc),
    basicPercent: clamp(
      toNonNegative(input.basicPercent) || SALARY_CONSTANTS.basicPercentMin,
      SALARY_CONSTANTS.basicPercentMin,
      SALARY_CONSTANTS.basicPercentMax,
    ),
    hraPercent: clamp(toNonNegative(input.hraPercent), 0, SALARY_CONSTANTS.hraPercentMax),
    employerPf,
    employeePf: pfMode(input.employeePf, employerPf),
    includeGratuity: input.includeGratuity === true,
    professionalTax: toNonNegative(input.professionalTax),
    otherMonthly: amount(input.otherMonthlyDeductions),
    regime: (input.regime === "old" ? "old" : "new") as TaxRegime,
    hraExemption: amount(input.oldRegime?.hraExemption),
    other80C: amount(input.oldRegime?.other80C),
    deduction80DAndOther: amount(input.oldRegime?.deduction80DAndOther),
  };
}

type Normalised = ReturnType<typeof normaliseInput>;

/** Splits CTC into salary components. Pure; adds structural warnings to `notes`. */
export function buildSalaryBreakup(input: SalaryInput, notes: string[] = []): SalaryBreakup {
  const n = normaliseInput(input);
  return breakupFrom(n, notes);
}

function breakupFrom(n: Normalised, notes: string[]): SalaryBreakup {
  const ctc = n.annualCtc;
  const basicFromCtc = (ctc * n.basicPercent) / 100;
  const employerPf = annualPf(basicFromCtc, n.employerPf);
  const gratuity = n.includeGratuity ? basicFromCtc * SALARY_CONSTANTS.gratuityRate : 0;
  const grossSalary = Math.max(0, ctc - employerPf - gratuity);
  // Basic ≤ 70% of CTC and employer costs ≤ ~12% of CTC, so this cap is a safety net only.
  const basic = Math.min(basicFromCtc, grossSalary);

  const hraWanted = (basic * n.hraPercent) / 100;
  const room = Math.max(0, grossSalary - basic);
  const hra = Math.min(hraWanted, room);
  if (hraWanted > room + 0.005) {
    notes.push(
      "Basic + HRA at these percentages is more than the gross salary left after employer PF and gratuity, so this structure is inconsistent. HRA has been reduced to fit and special allowance set to ₹0.",
    );
  }
  const specialAllowance = Math.max(0, grossSalary - basic - hra);

  const employeePf = annualPf(basicFromCtc, n.employeePf);

  let professionalTax = clamp(n.professionalTax, 0, TAX_RULES.professionalTaxMax);
  if (n.professionalTax > TAX_RULES.professionalTaxMax) {
    notes.push("Professional tax cannot exceed ₹2,500 a year, so ₹2,500 has been used.");
  }
  professionalTax = Math.min(professionalTax, grossSalary);

  return {
    annualCtc: ctc,
    basic,
    hra,
    specialAllowance,
    grossSalary,
    employerPf,
    gratuity,
    employeePf,
    professionalTax,
    otherDeductions: n.otherMonthly * 12,
  };
}

function outcomeFor(regime: TaxRegime, b: SalaryBreakup, n: Normalised): RegimeOutcome {
  const rules = getRegimeRules(regime);
  const gross = b.grossSalary;
  const standardDeduction = Math.min(rules.standardDeduction, gross);
  const professionalTaxDeduction = rules.professionalTaxDeductible ? b.professionalTax : 0;
  const allows = rules.allowsExemptionsAndDeductions;
  const hraExemption = allows ? Math.min(n.hraExemption, b.hra) : 0;
  const section80C = allows ? Math.min(TAX_RULES.section80CLimit, b.employeePf + n.other80C) : 0;
  const deduction80DAndOther = allows ? n.deduction80DAndOther : 0;

  const taxableIncome = Math.max(
    0,
    gross - standardDeduction - professionalTaxDeduction - hraExemption - section80C - deduction80DAndOther,
  );
  const tax = calculateIncomeTax({ taxableIncome, regime });
  const incomeTax = tax.totalTax;
  const annualTakeHome = Math.max(0, gross - b.employeePf - b.professionalTax - incomeTax - b.otherDeductions);

  return {
    regime,
    standardDeduction,
    professionalTaxDeduction,
    hraExemption,
    section80C,
    deduction80DAndOther,
    taxableIncome,
    tax,
    incomeTax,
    annualTakeHome,
    monthlyTakeHome: annualTakeHome / 12,
    effectiveTaxRatePercent: gross > 0 ? (incomeTax / gross) * 100 : 0,
  };
}

export function calculateSalary(input: SalaryInput): SalaryResult {
  const n = normaliseInput(input);
  const notes: string[] = [];
  const breakup = breakupFrom(n, notes);

  const byRegime = {
    new: outcomeFor("new", breakup, n),
    old: outcomeFor("old", breakup, n),
  } satisfies Record<TaxRegime, RegimeOutcome>;
  const selected = byRegime[n.regime];

  if (n.regime === "old" && n.hraExemption > breakup.hra + 0.005) {
    notes.push("HRA exemption cannot exceed the HRA you receive, so it has been capped at your annual HRA.");
  }
  if (n.regime === "old" && breakup.employeePf + n.other80C > TAX_RULES.section80CLimit) {
    notes.push("Employee PF and other 80C investments together are capped at ₹1,50,000.");
  }
  const outgoings = breakup.employeePf + breakup.professionalTax + selected.incomeTax + breakup.otherDeductions;
  if (breakup.grossSalary > 0 && outgoings > breakup.grossSalary) {
    notes.push("Deductions are more than the gross salary, so take-home is shown as ₹0.");
  }
  notes.push(...selected.tax.notes);

  const diff = byRegime.new.annualTakeHome - byRegime.old.annualTakeHome;
  const higherTakeHome: TaxRegime | "equal" = Math.abs(diff) < 1 ? "equal" : diff > 0 ? "new" : "old";

  return {
    ...breakup,
    regime: n.regime,
    selected,
    byRegime,
    incomeTax: selected.incomeTax,
    annualTakeHome: selected.annualTakeHome,
    monthlyTakeHome: selected.monthlyTakeHome,
    monthlyGross: breakup.grossSalary / 12,
    effectiveTaxRatePercent: selected.effectiveTaxRatePercent,
    higherTakeHome,
    isValid: n.annualCtc > 0,
    notes,
  };
}

export interface CtcComparisonRow {
  annualCtc: number;
  monthlyTakeHome: number;
  annualTax: number;
}

/** Same salary structure and regime at several CTC levels. */
export function buildCtcComparison(input: SalaryInput, ctcs: readonly number[]): CtcComparisonRow[] {
  return ctcs.map((annualCtc) => {
    const r = calculateSalary({ ...input, annualCtc });
    return { annualCtc: r.annualCtc, monthlyTakeHome: r.monthlyTakeHome, annualTax: r.incomeTax };
  });
}
