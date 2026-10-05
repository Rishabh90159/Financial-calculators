/**
 * Indian income-tax rules used by the salary (and, later, income-tax) calculators.
 *
 * DATA ONLY — no logic lives here. When the rules change, update this file,
 * the `taxYear` / `lastVerified` metadata and the reference tests in
 * `__tests__/incomeTax.test.ts`. Every page that shows a tax estimate reads the
 * tax year, last-verified date and source from here.
 *
 * Scope: resident individuals below 60 years of age. Senior and super-senior
 * citizen slabs, non-residents, HUFs and special-rate income (capital gains,
 * lottery etc.) are NOT modelled.
 *
 * Verified on 6 October 2026 against the Income Tax Department's
 * "Return applicable" help page for AY 2026-27 (FY 2025-26). Budget 2026 made
 * no change to slabs, rebate, standard deduction, surcharge or cess, so the same
 * figures apply for FY 2026-27 (AY 2027-28).
 */

export type TaxRegime = "new" | "old";

export interface TaxSlab {
  /** Upper bound of the slab in rupees (inclusive); `null` for the top, open-ended slab. */
  upTo: number | null;
  /** Marginal rate as a decimal, e.g. 0.05 for 5%. */
  rate: number;
}

export interface SurchargeBand {
  /** Surcharge applies when taxable income exceeds this amount. */
  above: number;
  /** Surcharge rate (decimal) applied to income tax. */
  rate: number;
}

export interface RebateRule {
  /** Rebate is available only if taxable income does not exceed this amount. */
  maxTaxableIncome: number;
  /** Maximum rebate in rupees (rebate = min(tax, maxRebate)). */
  maxRebate: number;
  /**
   * When true, tax just above `maxTaxableIncome` may not exceed the income in
   * excess of that limit (marginal relief on the rebate).
   */
  marginalRelief: boolean;
}

export interface RegimeRules {
  label: string;
  /** Slabs in ascending order. Each slab taxes income above the previous slab's `upTo`. */
  slabs: readonly TaxSlab[];
  /** Standard deduction for salary income, in rupees. */
  standardDeduction: number;
  rebate: RebateRule;
  /** Surcharge bands in ascending order of threshold. */
  surcharge: readonly SurchargeBand[];
  /** Whether professional tax paid is deductible from salary income. */
  professionalTaxDeductible: boolean;
  /** Whether HRA exemption and deductions such as 80C/80D can be claimed. */
  allowsExemptionsAndDeductions: boolean;
}

export const TAX_RULES = {
  taxYear: "FY 2026-27 (AY 2027-28)",
  /** ISO date the figures were last checked against the source. */
  lastVerified: "2026-10-06",
  appliesTo: "Resident individuals below 60 years of age",
  source: {
    name: "Income Tax Department — tax slabs for individuals",
    url: "https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1",
    detail: "AY 2026-27 rates; unchanged for FY 2026-27 by Budget 2026; verified 6 October 2026",
  },
  /** Health & Education Cess on (income tax + surcharge). */
  cessRate: 0.04,
  /** Combined cap on deductions under section 80C (old regime), including employee PF. */
  section80CLimit: 1_50_000,
  /** Constitutional maximum for professional tax per year. */
  professionalTaxMax: 2_500,
  regimes: {
    new: {
      label: "New regime",
      slabs: [
        { upTo: 4_00_000, rate: 0 },
        { upTo: 8_00_000, rate: 0.05 },
        { upTo: 12_00_000, rate: 0.1 },
        { upTo: 16_00_000, rate: 0.15 },
        { upTo: 20_00_000, rate: 0.2 },
        { upTo: 24_00_000, rate: 0.25 },
        { upTo: null, rate: 0.3 },
      ],
      standardDeduction: 75_000,
      rebate: { maxTaxableIncome: 12_00_000, maxRebate: 60_000, marginalRelief: true },
      // Surcharge is capped at 25% under the new regime.
      surcharge: [
        { above: 50_00_000, rate: 0.1 },
        { above: 1_00_00_000, rate: 0.15 },
        { above: 2_00_00_000, rate: 0.25 },
      ],
      professionalTaxDeductible: false,
      allowsExemptionsAndDeductions: false,
    },
    old: {
      label: "Old regime",
      slabs: [
        { upTo: 2_50_000, rate: 0 },
        { upTo: 5_00_000, rate: 0.05 },
        { upTo: 10_00_000, rate: 0.2 },
        { upTo: null, rate: 0.3 },
      ],
      standardDeduction: 50_000,
      rebate: { maxTaxableIncome: 5_00_000, maxRebate: 12_500, marginalRelief: false },
      surcharge: [
        { above: 50_00_000, rate: 0.1 },
        { above: 1_00_00_000, rate: 0.15 },
        { above: 2_00_00_000, rate: 0.25 },
        { above: 5_00_00_000, rate: 0.37 },
      ],
      professionalTaxDeductible: true,
      allowsExemptionsAndDeductions: true,
    },
  } satisfies Record<TaxRegime, RegimeRules>,
} as const;
