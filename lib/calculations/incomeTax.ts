import { TAX_RULES, type RegimeRules, type SurchargeBand, type TaxRegime, type TaxSlab } from "./taxRules";
import { clamp, LIMITS, toNonNegative } from "./utils";

/**
 * Pure income-tax engine for resident individuals below 60, driven entirely by
 * `taxRules.ts`. It takes TAXABLE income (after standard deduction and any
 * other deductions) and returns tax with rebate, surcharge, marginal relief and
 * cess. It knows nothing about salaries, so an Income Tax Calculator can reuse it.
 *
 * Rounding: every intermediate value keeps full precision. `totalTaxRounded`
 * rounds the final figure to the nearest rupee for display. Official returns
 * also round taxable income to the nearest ₹10 and final tax payable to the
 * nearest ₹10 (sections 288A/288B of the Income-tax Act, 1961); that ₹10
 * rounding is deliberately not applied here — the difference is at most ₹5.
 */

export interface IncomeTaxInput {
  /** Taxable income in rupees, after all deductions. */
  taxableIncome: number;
  regime: TaxRegime;
}

export interface SlabTaxLine {
  /** Lower bound of the slab (exclusive). */
  from: number;
  /** Upper bound (inclusive); `null` for the top slab. */
  upTo: number | null;
  rate: number;
  /** Income falling in this slab. */
  taxableInSlab: number;
  tax: number;
}

export interface IncomeTaxResult {
  regime: TaxRegime;
  taxableIncome: number;
  /** Tax from the slabs alone, before rebate. */
  slabTax: number;
  /** Section 87A-style rebate, including marginal relief just above the rebate limit. */
  rebate: number;
  /** slabTax − rebate. */
  taxAfterRebate: number;
  /** Surcharge rate applied (decimal), 0 below ₹50 lakh. */
  surchargeRate: number;
  /** Surcharge after marginal relief. */
  surcharge: number;
  /** Amount by which surcharge marginal relief reduced the surcharge. */
  surchargeRelief: number;
  /** Health & Education Cess = 4% × (taxAfterRebate + surcharge). */
  cess: number;
  /** taxAfterRebate + surcharge + cess, full precision. */
  totalTax: number;
  /** totalTax rounded to the nearest rupee. */
  totalTaxRounded: number;
  /** totalTax ÷ taxableIncome × 100 (0 when taxable income is 0). */
  effectiveRatePercent: number;
  /** Marginal slab rate (decimal) on the last rupee of taxable income. */
  marginalSlabRate: number;
  slabBreakdown: SlabTaxLine[];
  /** False when there is no taxable income. */
  isValid: boolean;
  notes: string[];
}

export function getRegimeRules(regime: TaxRegime): RegimeRules {
  return TAX_RULES.regimes[regime === "old" ? "old" : "new"];
}

function normaliseIncome(value: number): number {
  return clamp(toNonNegative(value), 0, LIMITS.maxAmount);
}

/**
 * Progressive slab tax:
 *
 *   tax = Σ rate_i × max(0, min(income, upTo_i) − upTo_(i−1))
 */
export function calculateSlabTax(taxableIncome: number, slabs: readonly TaxSlab[]): { tax: number; lines: SlabTaxLine[] } {
  const income = normaliseIncome(taxableIncome);
  const lines: SlabTaxLine[] = [];
  let lower = 0;
  let tax = 0;
  for (const slab of slabs) {
    const upper = slab.upTo ?? Number.POSITIVE_INFINITY;
    const inSlab = Math.max(0, Math.min(income, upper) - lower);
    const slabTax = inSlab * slab.rate;
    lines.push({ from: lower, upTo: slab.upTo, rate: slab.rate, taxableInSlab: inSlab, tax: slabTax });
    tax += slabTax;
    lower = upper;
  }
  return { tax, lines };
}

/**
 * Rebate (the section 87A rebate):
 *
 *   if income ≤ limit:  rebate = min(slabTax, maxRebate)
 *   else if marginal relief applies (new regime):
 *       tax payable = min(slabTax, income − limit), so rebate = slabTax − that
 *   else: rebate = 0
 */
export function calculateRebate(taxableIncome: number, slabTax: number, rules: RegimeRules): number {
  const income = normaliseIncome(taxableIncome);
  const tax = toNonNegative(slabTax);
  const { maxTaxableIncome, maxRebate, marginalRelief } = rules.rebate;
  if (income <= maxTaxableIncome) return Math.min(tax, maxRebate);
  if (marginalRelief) {
    const capped = Math.min(tax, income - maxTaxableIncome);
    return Math.max(0, tax - capped);
  }
  return 0;
}

/** Tax after rebate, before surcharge and cess. */
function taxAfterRebateAt(income: number, rules: RegimeRules): number {
  const { tax } = calculateSlabTax(income, rules.slabs);
  return Math.max(0, tax - calculateRebate(income, tax, rules));
}

/**
 * Surcharge with marginal relief. For income I above threshold T (the highest
 * band whose threshold I exceeds), with rate s at I and the previous band's
 * rate s₀ at T:
 *
 *   surcharge = s × tax(I)
 *   tax(I) + surcharge ≤ tax(T) × (1 + s₀) + (I − T)
 *
 * so surcharge = max(0, min(s × tax(I), tax(T) × (1 + s₀) + (I − T) − tax(I))).
 */
export function calculateSurcharge(
  taxableIncome: number,
  taxAfterRebate: number,
  rules: RegimeRules,
): { rate: number; surcharge: number; relief: number } {
  const income = normaliseIncome(taxableIncome);
  const tax = toNonNegative(taxAfterRebate);
  let band: SurchargeBand | undefined;
  let previousRate = 0;
  for (const b of rules.surcharge) {
    if (income <= b.above) break;
    previousRate = band?.rate ?? 0;
    band = b;
  }
  if (!band) return { rate: 0, surcharge: 0, relief: 0 };

  const full = tax * band.rate;
  const taxAtThreshold = taxAfterRebateAt(band.above, rules);
  const ceiling = taxAtThreshold * (1 + previousRate) + (income - band.above);
  const surcharge = Math.max(0, Math.min(full, ceiling - tax));
  return { rate: band.rate, surcharge, relief: Math.max(0, full - surcharge) };
}

/**
 * Income tax for a resident individual below 60:
 *
 *   total = (slabTax − rebate) + surcharge + 4% cess on (tax + surcharge)
 */
export function calculateIncomeTax(input: IncomeTaxInput): IncomeTaxResult {
  const regime: TaxRegime = input.regime === "old" ? "old" : "new";
  const rules = getRegimeRules(regime);
  const taxableIncome = normaliseIncome(input.taxableIncome);
  const notes: string[] = [];

  const { tax: slabTax, lines } = calculateSlabTax(taxableIncome, rules.slabs);
  const rebate = calculateRebate(taxableIncome, slabTax, rules);
  const taxAfterRebate = Math.max(0, slabTax - rebate);
  const { rate: surchargeRate, surcharge, relief: surchargeRelief } = calculateSurcharge(taxableIncome, taxAfterRebate, rules);
  const cess = (taxAfterRebate + surcharge) * TAX_RULES.cessRate;
  const totalTax = taxAfterRebate + surcharge + cess;

  if (slabTax > 0 && taxAfterRebate === 0) {
    notes.push("Your tax is fully offset by the section 87A rebate.");
  } else if (rebate > 0) {
    notes.push("Marginal relief on the rebate limits your tax to the income above the rebate threshold.");
  }
  if (surchargeRelief > 0) {
    notes.push("Marginal relief reduces the surcharge because your income is just above a surcharge threshold.");
  }

  const top = [...lines].reverse().find((l) => l.taxableInSlab > 0);

  return {
    regime,
    taxableIncome,
    slabTax,
    rebate,
    taxAfterRebate,
    surchargeRate,
    surcharge,
    surchargeRelief,
    cess,
    totalTax,
    totalTaxRounded: Math.round(totalTax),
    effectiveRatePercent: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0,
    marginalSlabRate: top?.rate ?? 0,
    slabBreakdown: lines,
    isValid: taxableIncome > 0,
    notes,
  };
}
