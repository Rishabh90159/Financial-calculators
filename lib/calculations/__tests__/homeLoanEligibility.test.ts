import { describe, expect, it } from "vitest";
import { calculateEmiAmount } from "../emi";
import {
  calculateHomeLoanEligibility,
  emiOnEligibleLoan,
  loanPerRupeeOfEmi,
  presentValueOfEmi,
  type HomeLoanEligibilityInput,
} from "../homeLoanEligibility";
import { roundTo } from "../utils";

const BASE: HomeLoanEligibilityInput = { monthlyIncome: 1_00_000, age: 30, tenureYears: 20, annualRate: 8.5 };

describe("presentValueOfEmi", () => {
  it("matches a hand-verified reference value", () => {
    // EMI on ₹50,00,000 at 8.5% for 240 months = ₹43,391.16 (see emi tests).
    // So ₹50,000 of EMI supports 50,000 ÷ 43,391.16 × 50,00,000 ≈ ₹57,61,542.
    // Direct: r = 0.0070833…, (1+r)^240 ≈ 5.44959; PV = 50,000 × 4.44959 ÷ (0.0070833 × 5.44959) ≈ 57,61,542.
    expect(roundTo(presentValueOfEmi(50_000, 8.5, 240), 0)).toBe(57_61_542);
  });

  it("is the exact inverse of calculateEmiAmount", () => {
    const cases: [number, number][] = [
      [8.5, 240],
      [0.01, 360],
      [12, 60],
      [49, 600],
    ];
    for (const [rate, n] of cases) {
      const pv = presentValueOfEmi(25_000, rate, n);
      expect(calculateEmiAmount(pv, rate, n)).toBeCloseTo(25_000, 6);
    }
  });

  it("0% interest degenerates to EMI × n", () => {
    expect(presentValueOfEmi(40_000, 0, 240)).toBe(96_00_000);
  });

  it("returns 0 for zero, negative or invalid inputs", () => {
    expect(presentValueOfEmi(0, 8.5, 240)).toBe(0);
    expect(presentValueOfEmi(50_000, 8.5, 0)).toBe(0);
    expect(presentValueOfEmi(-5, 8.5, 240)).toBe(0);
    expect(presentValueOfEmi(Number.NaN, 8.5, 240)).toBe(0);
    expect(presentValueOfEmi(50_000, Number.NaN, 12)).toBe(50_000 * 12);
  });

  it("loanPerRupeeOfEmi scales linearly", () => {
    expect(loanPerRupeeOfEmi(8.5, 240) * 10_000).toBeCloseTo(presentValueOfEmi(10_000, 8.5, 240), 6);
  });
});

describe("calculateHomeLoanEligibility — reference values", () => {
  it("default inputs: ₹1 lakh income, 50% FOIR, 20 years at 8.5%", () => {
    const r = calculateHomeLoanEligibility(BASE);
    // max EMI = 1,00,000 × 50% − 0 = 50,000
    expect(r.maxEmi).toBe(50_000);
    expect(r.tenureMonths).toBe(240);
    expect(roundTo(r.eligibleLoan, 0)).toBe(57_61_542);
    // Loan > ₹30 lakh and ≤ ₹75 lakh → RBI 80%; assumption 80% → applied 80%.
    expect(r.rbiMaxLtvPercent).toBe(80);
    expect(r.appliedLtvPercent).toBe(80);
    // Budget = 57,61,542 ÷ 0.8 ≈ 72,01,927; down payment ≈ 14,40,385
    expect(roundTo(r.propertyBudget, 0)).toBe(72_01_927);
    expect(roundTo(r.downPayment, 0)).toBe(14_40_385);
    // Total repayment = 50,000 × 240 = 1,20,00,000
    expect(r.totalRepayment).toBe(1_20_00_000);
    expect(roundTo(r.totalInterest, 0)).toBe(62_38_458);
    expect(r.isValid).toBe(true);
    expect(r.issues).toEqual([]);
    expect(emiOnEligibleLoan(r)).toBeCloseTo(r.maxEmi, 6);
  });

  it("worked example on the page: ₹10,000 existing EMI", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, existingEmis: 10_000 });
    // 50,000 − 10,000 = 40,000 → 40,000 ÷ 43,391.16 × 50 lakh ≈ 46,09,234
    expect(r.maxEmi).toBe(40_000);
    expect(roundTo(r.eligibleLoan, 0)).toBe(46_09_234);
    expect(roundTo(r.propertyBudget, 0)).toBe(57_61_542);
    expect(roundTo(r.downPayment, 0)).toBe(11_52_308);
    expect(r.totalRepayment).toBe(96_00_000);
    expect(roundTo(r.totalInterest, 0)).toBe(49_90_766);
  });

  it("each ₹10,000 of existing EMI cuts eligibility by the PV of ₹10,000", () => {
    const a = calculateHomeLoanEligibility(BASE);
    const b = calculateHomeLoanEligibility({ ...BASE, existingEmis: 10_000 });
    expect(roundTo(a.eligibleLoan - b.eligibleLoan, 0)).toBe(11_52_308);
  });

  it("counts co-applicant income and other obligations", () => {
    const r = calculateHomeLoanEligibility({
      ...BASE,
      coApplicantIncome: 50_000,
      existingEmis: 15_000,
      otherObligations: 5_000,
    });
    // 1,50,000 × 50% − 20,000 = 55,000
    expect(r.combinedIncome).toBe(1_50_000);
    expect(r.existingObligations).toBe(20_000);
    expect(r.maxEmi).toBe(55_000);
  });

  it("table values for tenure and rate", () => {
    const loan = (o: Partial<HomeLoanEligibilityInput>) =>
      roundTo(calculateHomeLoanEligibility({ ...BASE, existingEmis: 10_000, ...o }).eligibleLoan, 0);
    expect(loan({ tenureYears: 10 })).toBe(32_26_179);
    expect(loan({ tenureYears: 30 })).toBe(52_02_146);
    expect(loan({ annualRate: 7.5 })).toBe(49_65_285);
    expect(loan({ annualRate: 9.5 })).toBe(42_91_241);
  });

  it("page salary table (no existing EMIs)", () => {
    const row = (income: number) => {
      const r = calculateHomeLoanEligibility({ ...BASE, monthlyIncome: income });
      return [r.maxEmi, roundTo(r.eligibleLoan, 0), r.appliedLtvPercent, roundTo(r.propertyBudget, 0)];
    };
    expect(row(50_000)).toEqual([25_000, 28_80_771, 80, 36_00_964]);
    expect(row(75_000)).toEqual([37_500, 43_21_156, 80, 54_01_446]);
    expect(row(1_00_000)).toEqual([50_000, 57_61_542, 80, 72_01_927]);
    expect(row(1_50_000)).toEqual([75_000, 86_42_313, 75, 1_15_23_084]);
    expect(row(2_00_000)).toEqual([1_00_000, 1_15_23_084, 75, 1_53_64_112]);
  });

  it("page co-applicant example and remaining tenure/rate rows", () => {
    const joint = calculateHomeLoanEligibility({ ...BASE, existingEmis: 10_000, coApplicantIncome: 40_000 });
    // 1,40,000 × 50% − 10,000 = 60,000
    expect(joint.maxEmi).toBe(60_000);
    expect(roundTo(joint.eligibleLoan, 0)).toBe(69_13_850);
    const loan = (o: Partial<HomeLoanEligibilityInput>) =>
      roundTo(calculateHomeLoanEligibility({ ...BASE, existingEmis: 10_000, ...o }).eligibleLoan, 0);
    expect(loan({ tenureYears: 15 })).toBe(40_61_988);
    expect(loan({ tenureYears: 25 })).toBe(49_67_543);
    expect(loan({ annualRate: 10.5 })).toBe(40_06_491);
    // Age 45, no EMIs: tenure capped to 15 years
    expect(roundTo(calculateHomeLoanEligibility({ ...BASE, age: 45 }).eligibleLoan, 0)).toBe(50_77_485);
  });

  it("0% interest: loan = EMI × months and zero interest", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, annualRate: 0 });
    expect(r.eligibleLoan).toBe(50_000 * 240);
    expect(r.totalInterest).toBe(0);
  });
});

describe("calculateHomeLoanEligibility — age cap", () => {
  it("caps the tenure at retirement age − age", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, age: 45 });
    expect(r.tenureMonths).toBe(180);
    expect(r.tenureCappedByAge).toBe(true);
    expect(r.issues).toContain("tenure-capped-by-age");
    expect(r.notes[0]).toMatch(/20 to 15 years/);
  });

  it("does not cap when exactly at the limit", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, age: 40 });
    expect(r.tenureMonths).toBe(240);
    expect(r.tenureCappedByAge).toBe(false);
  });

  it("uses a custom retirement age", () => {
    expect(calculateHomeLoanEligibility({ ...BASE, age: 45, retirementAge: 70 }).tenureMonths).toBe(240);
  });

  it("returns zero eligibility when no tenure is left", () => {
    for (const age of [60, 65]) {
      const r = calculateHomeLoanEligibility({ ...BASE, age });
      expect(r.tenureMonths).toBe(0);
      expect(r.eligibleLoan).toBe(0);
      expect(r.propertyBudget).toBe(0);
      expect(r.totalRepayment).toBe(0);
      expect(r.isValid).toBe(false);
      expect(r.issues).toContain("no-tenure-left");
    }
  });

  it("floors fractional ages so the loan never passes retirement", () => {
    expect(calculateHomeLoanEligibility({ ...BASE, age: 50.5 }).tenureMonths).toBe(114);
  });
});

describe("calculateHomeLoanEligibility — LTV", () => {
  it("applies the RBI 75% slab above ₹75 lakh", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, monthlyIncome: 1_50_000 });
    // EMI 75,000 → loan ≈ 86,42,313 (> 75 lakh) → RBI 75%
    expect(roundTo(r.eligibleLoan, 0)).toBe(86_42_313);
    expect(r.rbiMaxLtvPercent).toBe(75);
    expect(r.appliedLtvPercent).toBe(75);
    expect(r.ltvCappedByRbi).toBe(true);
    expect(r.propertyBudget).toBeCloseTo(r.eligibleLoan / 0.75, 6);
  });

  it("allows 90% at or below ₹30 lakh but never above the assumption", () => {
    const small = { ...BASE, monthlyIncome: 40_000 }; // EMI 20,000 → ≈ 23 lakh
    expect(calculateHomeLoanEligibility(small).appliedLtvPercent).toBe(80);
    const r = calculateHomeLoanEligibility({ ...small, ltvPercent: 90 });
    expect(r.rbiMaxLtvPercent).toBe(90);
    expect(r.appliedLtvPercent).toBe(90);
    expect(r.ltvCappedByRbi).toBe(false);
  });

  it("caps 90% assumption to 80% in the middle slab", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, ltvPercent: 90 });
    expect(r.appliedLtvPercent).toBe(80);
    expect(r.issues).toContain("ltv-capped-by-rbi");
  });

  it("respects a lower LTV assumption", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, ltvPercent: 50 });
    expect(r.appliedLtvPercent).toBe(50);
    expect(r.downPayment).toBeCloseTo(r.eligibleLoan, 6);
  });
});

describe("calculateHomeLoanEligibility — invalid and extreme input", () => {
  it("zero income", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, monthlyIncome: 0 });
    expect(r.isValid).toBe(false);
    expect(r.maxEmi).toBe(0);
    expect(r.issues).toContain("no-income");
  });

  it("obligations above the FOIR limit never give a negative EMI", () => {
    const r = calculateHomeLoanEligibility({ ...BASE, existingEmis: 45_000, otherObligations: 20_000 });
    expect(r.maxEmi).toBe(0);
    expect(r.eligibleLoan).toBe(0);
    expect(r.issues).toContain("obligations-exceed-limit");
  });

  it("negative, NaN and Infinity inputs are treated as zero or defaults", () => {
    const r = calculateHomeLoanEligibility({
      monthlyIncome: -1,
      coApplicantIncome: Number.NaN,
      existingEmis: Number.POSITIVE_INFINITY,
      age: Number.NaN,
      tenureYears: -20,
      annualRate: Number.NaN,
    });
    expect(r.combinedIncome).toBe(0);
    expect(r.existingObligations).toBe(0);
    expect(r.isValid).toBe(false);

    const d = calculateHomeLoanEligibility({ ...BASE, foirPercent: Number.NaN, retirementAge: -5, ltvPercent: Number.NaN });
    expect(d.foirPercent).toBe(50);
    expect(d.assumedLtvPercent).toBe(80);
    expect(d.tenureMonths).toBe(240);
  });

  it("huge values stay finite", () => {
    const r = calculateHomeLoanEligibility({
      monthlyIncome: 1e30,
      coApplicantIncome: 1e30,
      age: 0,
      tenureYears: 1e9,
      annualRate: 1e9,
      foirPercent: 1e9,
      retirementAge: 1e9,
      ltvPercent: 1e9,
    });
    expect(r.tenureMonths).toBe(600);
    expect(r.foirPercent).toBe(100);
    expect(Number.isFinite(r.eligibleLoan)).toBe(true);
    expect(r.isValid).toBe(true);
  });

  it("every numeric output is finite and non-negative across a sweep", () => {
    const values = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1e15, 0.5, 21, 30, 65, 1_00_000];
    const rates = [0, 0.001, 8.5, 50, -3, Number.NaN];
    // Collect violations and assert once: ~25k combinations × ~20 fields is too slow as individual expects.
    const failures: string[] = [];
    for (const income of values)
      for (const emis of values)
        for (const age of [0, 21, 45, 59.9, 60, 70, Number.NaN])
          for (const years of [0, 1, 20, 30, 100, Number.NaN])
            for (const rate of rates) {
              const r = calculateHomeLoanEligibility({
                monthlyIncome: income,
                existingEmis: emis,
                age,
                tenureYears: years,
                annualRate: rate,
                ltvPercent: income,
                foirPercent: emis,
              });
              for (const [key, v] of Object.entries(r)) {
                if (typeof v !== "number") continue;
                if (!Number.isFinite(v) || v < 0) {
                  failures.push(`${key}=${v} (income ${income}, emis ${emis}, age ${age}, years ${years}, rate ${rate})`);
                }
              }
            }
    expect(failures.slice(0, 5)).toEqual([]);
  });
});
