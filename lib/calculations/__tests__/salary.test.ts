import { describe, expect, it } from "vitest";
import { annualPf, buildCtcComparison, calculateSalary, type SalaryInput } from "../salary";

function expectFiniteNonNegative(...values: number[]) {
  for (const v of values) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
}

/** The calculator's default inputs. */
const DEFAULTS: SalaryInput = {
  annualCtc: 12_00_000,
  basicPercent: 40,
  hraPercent: 50,
  employerPf: "full",
  employeePf: "full",
  includeGratuity: false,
  professionalTax: 2_400,
  otherMonthlyDeductions: 0,
  regime: "new",
};

describe("calculateSalary — default ₹12 lakh CTC (page worked example)", () => {
  const r = calculateSalary(DEFAULTS);

  it("splits CTC into components", () => {
    // basic = 12,00,000 × 40% = 4,80,000; employer PF = 12% × 4,80,000 = 57,600
    // gross = 12,00,000 − 57,600 = 11,42,400; HRA = 50% × 4,80,000 = 2,40,000
    // special = 11,42,400 − 4,80,000 − 2,40,000 = 4,22,400
    expect(r.basic).toBeCloseTo(4_80_000, 6);
    expect(r.employerPf).toBeCloseTo(57_600, 6);
    expect(r.grossSalary).toBeCloseTo(11_42_400, 6);
    expect(r.hra).toBeCloseTo(2_40_000, 6);
    expect(r.specialAllowance).toBeCloseTo(4_22_400, 6);
    expect(r.employeePf).toBeCloseTo(57_600, 6);
    expect(r.monthlyGross).toBeCloseTo(95_200, 6);
  });

  it("new regime: taxable 10,67,400 ≤ 12 lakh → nil tax; take-home ₹90,200 a month", () => {
    // taxable = 11,42,400 − 75,000 = 10,67,400; rebate wipes out slab tax of 46,740
    expect(r.selected.taxableIncome).toBeCloseTo(10_67_400, 6);
    expect(r.selected.tax.slabTax).toBeCloseTo(46_740, 6);
    expect(r.incomeTax).toBe(0);
    // 11,42,400 − 57,600 − 2,400 = 10,82,400 → ÷ 12 = 90,200
    expect(r.annualTakeHome).toBeCloseTo(10_82_400, 6);
    expect(r.monthlyTakeHome).toBeCloseTo(90_200, 6);
    expect(r.isValid).toBe(true);
  });

  it("old regime with no extra deductions: tax ₹1,27,109; take-home ₹79,608 a month", () => {
    // taxable = 11,42,400 − 50,000 − 2,400 PT − 57,600 (PF under 80C) = 10,32,400
    // tax = 12,500 + 1,00,000 + 32,400 × 30% = 1,22,220; × 1.04 = 1,27,108.80
    // take-home = 11,42,400 − 57,600 − 2,400 − 1,27,108.80 = 9,55,291.20 → 79,607.60 / month
    const old = r.byRegime.old;
    expect(old.taxableIncome).toBeCloseTo(10_32_400, 6);
    expect(old.incomeTax).toBeCloseTo(1_27_108.8, 6);
    expect(old.monthlyTakeHome).toBeCloseTo(79_607.6, 6);
    expect(r.higherTakeHome).toBe("new");
  });
});

describe("PF modes", () => {
  it("annualPf: full, ceiling (₹1,800/month max), none", () => {
    expect(annualPf(4_80_000, "full")).toBeCloseTo(57_600, 6);
    // 12% × min(4,80,000, 1,80,000) = 21,600
    expect(annualPf(4_80_000, "ceiling")).toBeCloseTo(21_600, 6);
    // basic below ceiling: 12% × 1,20,000 = 14,400
    expect(annualPf(1_20_000, "ceiling")).toBeCloseTo(14_400, 6);
    expect(annualPf(4_80_000, "none")).toBe(0);
  });

  it("ceiling mode: gross 11,78,400; take-home 11,54,400 (₹96,200 / month)", () => {
    const r = calculateSalary({ ...DEFAULTS, employerPf: "ceiling", employeePf: "ceiling" });
    expect(r.grossSalary).toBeCloseTo(11_78_400, 6);
    expect(r.monthlyTakeHome).toBeCloseTo(96_200, 6);
  });

  it("PF not in CTC: gross = CTC; take-home 12,00,000 − 2,400 = 11,97,600", () => {
    const r = calculateSalary({ ...DEFAULTS, employerPf: "none", employeePf: "none" });
    expect(r.grossSalary).toBe(12_00_000);
    expect(r.annualTakeHome).toBeCloseTo(11_97_600, 6);
  });

  it("employee on full basic while employer pays the ceiling", () => {
    const r = calculateSalary({ ...DEFAULTS, employerPf: "ceiling", employeePf: "full" });
    expect(r.employerPf).toBeCloseTo(21_600, 6);
    expect(r.employeePf).toBeCloseTo(57_600, 6);
  });
});

describe("gratuity", () => {
  it("4.81% of basic is carved out of CTC and not paid monthly", () => {
    // gratuity = 4.81% × 4,80,000 = 23,088; gross = 12,00,000 − 57,600 − 23,088 = 11,19,312
    const r = calculateSalary({ ...DEFAULTS, includeGratuity: true });
    expect(r.gratuity).toBeCloseTo(23_088, 6);
    expect(r.grossSalary).toBeCloseTo(11_19_312, 6);
    expect(r.annualTakeHome).toBeCloseTo(10_59_312, 6);
  });
});

describe("tax at higher CTCs", () => {
  it("₹25 lakh CTC, new regime: tax ₹2,87,300", () => {
    // basic 10L; PF 1,20,000; gross 23,80,000; taxable 23,05,000
    // slab = 2,00,000 + 3,05,000 × 25% = 2,76,250; × 1.04 = 2,87,300
    // take-home = 23,80,000 − 1,20,000 − 2,400 − 2,87,300 = 19,70,300
    const r = calculateSalary({ ...DEFAULTS, annualCtc: 25_00_000 });
    expect(r.incomeTax).toBeCloseTo(2_87_300, 6);
    expect(r.annualTakeHome).toBeCloseTo(19_70_300, 6);
    expect(r.effectiveTaxRatePercent).toBeCloseTo((2_87_300 / 23_80_000) * 100, 6);
  });

  it("old regime with HRA exemption, 80C (capped) and 80D", () => {
    // taxable = 11,42,400 − 50,000 − 2,400 − 1,00,000 − min(1,50,000, 57,600 + 1,00,000) − 25,000 = 8,15,000
    // tax = 12,500 + 3,15,000 × 20% = 75,500; × 1.04 = 78,520
    const r = calculateSalary({
      ...DEFAULTS,
      regime: "old",
      oldRegime: { hraExemption: 1_00_000, other80C: 1_00_000, deduction80DAndOther: 25_000 },
    });
    expect(r.selected.section80C).toBe(1_50_000);
    expect(r.selected.taxableIncome).toBeCloseTo(8_15_000, 6);
    expect(r.incomeTax).toBeCloseTo(78_520, 6);
    expect(r.annualTakeHome).toBeCloseTo(10_03_880, 6);
    expect(r.notes.some((n) => n.includes("1,50,000"))).toBe(true);
  });

  it("new regime ignores old-regime deductions and professional tax for tax", () => {
    const a = calculateSalary({ ...DEFAULTS, annualCtc: 20_00_000 });
    const b = calculateSalary({
      ...DEFAULTS,
      annualCtc: 20_00_000,
      oldRegime: { hraExemption: 2_00_000, other80C: 1_50_000, deduction80DAndOther: 50_000 },
    });
    expect(b.incomeTax).toBe(a.incomeTax);
    expect(a.byRegime.new.professionalTaxDeduction).toBe(0);
  });

  it("HRA exemption is capped at HRA received", () => {
    const r = calculateSalary({ ...DEFAULTS, regime: "old", oldRegime: { hraExemption: 9_00_000 } });
    expect(r.selected.hraExemption).toBeCloseTo(2_40_000, 6);
    expect(r.notes.some((n) => n.includes("HRA exemption"))).toBe(true);
  });
});

describe("basic % extremes and structure warnings", () => {
  it("basic 20%: special allowance absorbs the rest", () => {
    // basic 2,40,000; PF 28,800; gross 11,71,200; HRA 1,20,000; special 8,11,200
    const r = calculateSalary({ ...DEFAULTS, basicPercent: 20 });
    expect(r.specialAllowance).toBeCloseTo(8_11_200, 6);
  });

  it("basic 70% with HRA 50%: HRA reduced to fit, special ₹0, warning", () => {
    // basic 8,40,000; PF 1,00,800; gross 10,99,200; room for HRA = 2,59,200 (< 4,20,000)
    const r = calculateSalary({ ...DEFAULTS, basicPercent: 70 });
    expect(r.hra).toBeCloseTo(2_59_200, 6);
    expect(r.specialAllowance).toBe(0);
    expect(r.basic + r.hra + r.specialAllowance).toBeCloseTo(r.grossSalary, 6);
    expect(r.notes.some((n) => n.includes("inconsistent"))).toBe(true);
  });

  it("basic % outside 20–70 is clamped", () => {
    expect(calculateSalary({ ...DEFAULTS, basicPercent: 5 }).basic).toBeCloseTo(2_40_000, 6);
    expect(calculateSalary({ ...DEFAULTS, basicPercent: 95 }).basic).toBeCloseTo(8_40_000, 6);
  });

  it("professional tax above ₹2,500 is capped with a note", () => {
    const r = calculateSalary({ ...DEFAULTS, professionalTax: 10_000 });
    expect(r.professionalTax).toBe(2_500);
    expect(r.notes.some((n) => n.includes("2,500"))).toBe(true);
  });

  it("other deductions larger than salary → take-home ₹0 with a note", () => {
    const r = calculateSalary({ ...DEFAULTS, otherMonthlyDeductions: 2_00_000 });
    expect(r.annualTakeHome).toBe(0);
    expect(r.notes.some((n) => n.includes("₹0"))).toBe(true);
  });
});

describe("invalid and extreme inputs", () => {
  it.each([0, -12_00_000, Number.NaN, Number.POSITIVE_INFINITY])("CTC %s → zeros, not valid", (annualCtc) => {
    const r = calculateSalary({ ...DEFAULTS, annualCtc });
    expect(r.isValid).toBe(false);
    expect(r.monthlyTakeHome).toBe(0);
    expectFiniteNonNegative(r.grossSalary, r.incomeTax, r.annualTakeHome, r.effectiveTaxRatePercent);
  });

  it("NaN everywhere still returns finite non-negative numbers", () => {
    const r = calculateSalary({
      annualCtc: Number.NaN,
      basicPercent: Number.NaN,
      hraPercent: Number.NaN,
      employerPf: "bogus" as "full",
      employeePf: undefined as unknown as "full",
      includeGratuity: Number.NaN as unknown as boolean,
      professionalTax: Number.NaN,
      otherMonthlyDeductions: Number.NaN,
      regime: "bogus" as "new",
      oldRegime: { hraExemption: Number.NaN, other80C: -1, deduction80DAndOther: Number.POSITIVE_INFINITY },
    });
    expectFiniteNonNegative(r.basic, r.hra, r.specialAllowance, r.grossSalary, r.incomeTax, r.monthlyTakeHome);
    expect(r.regime).toBe("new");
  });

  it("huge CTC is clamped and stays finite", () => {
    const r = calculateSalary({ ...DEFAULTS, annualCtc: 1e30, regime: "old" });
    expect(r.annualCtc).toBe(1e12);
    expectFiniteNonNegative(r.incomeTax, r.annualTakeHome, r.monthlyTakeHome);
  });

  it("sweep: every output finite and non-negative; breakup sums to gross", () => {
    const modes = ["full", "ceiling", "none"] as const;
    for (let ctc = 0; ctc <= 3_00_00_000; ctc += 7_77_777) {
      for (const basicPercent of [20, 40, 70]) {
        for (const employerPf of modes) {
          for (const regime of ["new", "old"] as const) {
            const r = calculateSalary({
              ...DEFAULTS,
              annualCtc: ctc,
              basicPercent,
              employerPf,
              employeePf: employerPf,
              includeGratuity: basicPercent === 70,
              regime,
              oldRegime: { hraExemption: 50_000, other80C: 50_000, deduction80DAndOther: 25_000 },
            });
            expectFiniteNonNegative(
              r.basic,
              r.hra,
              r.specialAllowance,
              r.grossSalary,
              r.employerPf,
              r.employeePf,
              r.gratuity,
              r.incomeTax,
              r.annualTakeHome,
              r.monthlyTakeHome,
              r.effectiveTaxRatePercent,
              r.byRegime.new.taxableIncome,
              r.byRegime.old.taxableIncome,
            );
            expect(r.basic + r.hra + r.specialAllowance).toBeCloseTo(r.grossSalary, 4);
            expect(r.annualTakeHome).toBeLessThanOrEqual(r.annualCtc + 1e-6);
          }
        }
      }
    }
  });
});

describe("buildCtcComparison", () => {
  it("returns one row per CTC with take-home rising with CTC", () => {
    const rows = buildCtcComparison(DEFAULTS, [6_00_000, 10_00_000, 15_00_000, 25_00_000, 50_00_000]);
    expect(rows).toHaveLength(5);
    const takeHomes = rows.map((r) => r.monthlyTakeHome);
    expect([...takeHomes].sort((a, b) => a - b)).toEqual(takeHomes);
    expect(new Set(takeHomes).size).toBe(5);
    expect(rows.map((r) => Math.round(r.annualTax))).toEqual([0, 0, 86_268, 2_87_300, 10_24_920]);
  });
});
