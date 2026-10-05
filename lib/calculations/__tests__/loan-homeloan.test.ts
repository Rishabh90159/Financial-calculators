import { describe, expect, it } from "vitest";
import { calculateEmiAmount } from "../emi";
import { calculateHomeLoan, indicativeMaxLtv } from "../homeLoan";
import { calculateLoan, tenureToMonths } from "../loan";
import { clamp, roundTo, toNonNegative, yearsToMonths } from "../utils";

describe("utils", () => {
  it("roundTo handles float edge cases", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.675, 2)).toBe(2.68);
    expect(roundTo(-1.005, 2)).toBe(-1.01);
    expect(roundTo(Number.NaN)).toBe(0);
    expect(roundTo(1234.5, 0)).toBe(1235);
  });

  it("toNonNegative rejects invalid numbers", () => {
    expect(toNonNegative(-1)).toBe(0);
    expect(toNonNegative(Number.NaN)).toBe(0);
    expect(toNonNegative(Number.POSITIVE_INFINITY)).toBe(0);
    expect(toNonNegative("12")).toBe(12);
    expect(toNonNegative(undefined)).toBe(0);
  });

  it("clamp and yearsToMonths", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(Number.NaN, 1, 3)).toBe(1);
    expect(yearsToMonths(2.5)).toBe(30);
    expect(yearsToMonths(-3)).toBe(0);
  });
});

describe("calculateLoan", () => {
  it("years and months give identical results for the same tenure", () => {
    const a = calculateLoan({ principal: 500_000, annualRate: 12, tenure: 3, tenureUnit: "years" });
    const b = calculateLoan({ principal: 500_000, annualRate: 12, tenure: 36, tenureUnit: "months" });
    expect(a.emi).toBe(b.emi);
    expect(roundTo(a.emi, 2)).toBe(16607.15);
  });

  it("computes interest ratios", () => {
    const r = calculateLoan({ principal: 500_000, annualRate: 12, tenure: 36, tenureUnit: "months" });
    expect(r.interestToPrincipalPercent).toBeCloseTo((r.totalInterest / 500_000) * 100, 10);
    expect(r.interestShareOfPaymentPercent).toBeCloseTo((r.totalInterest / r.totalPayment) * 100, 10);
  });

  it("returns zeroed ratios for invalid input", () => {
    const r = calculateLoan({ principal: 0, annualRate: 12, tenure: 3, tenureUnit: "years" });
    expect(r.interestToPrincipalPercent).toBe(0);
    expect(r.interestShareOfPaymentPercent).toBe(0);
    expect(r.isValid).toBe(false);
  });

  it("tenureToMonths rounds and rejects negatives", () => {
    expect(tenureToMonths(1.25, "years")).toBe(15);
    expect(tenureToMonths(18.4, "months")).toBe(18);
    expect(tenureToMonths(-2, "years")).toBe(0);
  });
});

describe("calculateHomeLoan", () => {
  const base = {
    propertyPrice: 8_000_000,
    downPayment: 1_600_000,
    annualRate: 8.5,
    tenureYears: 20,
    costs: { stampDuty: 480_000, registration: 80_000, other: 40_000 },
  };

  it("derives loan, down-payment %, LTV and upfront cash", () => {
    const r = calculateHomeLoan(base);
    expect(r.loanAmount).toBe(6_400_000);
    expect(r.downPaymentPercent).toBe(20);
    expect(r.ltvPercent).toBe(80);
    expect(r.additionalCosts).toBe(600_000);
    expect(r.upfrontTotal).toBe(2_200_000);
    expect(r.emi.emi).toBeCloseTo(calculateEmiAmount(6_400_000, 8.5, 240), 8);
    expect(r.totalCostOfOwnership).toBeCloseTo(2_200_000 + r.emi.totalPayment, 6);
  });

  it("works without optional costs", () => {
    const r = calculateHomeLoan({ ...base, costs: undefined });
    expect(r.additionalCosts).toBe(0);
    expect(r.upfrontTotal).toBe(1_600_000);
  });

  it("clamps a down payment larger than the price (no negative loan)", () => {
    const r = calculateHomeLoan({ ...base, downPayment: 9_000_000 });
    expect(r.downPayment).toBe(8_000_000);
    expect(r.loanAmount).toBe(0);
    expect(r.ltvPercent).toBe(0);
    expect(r.emi.emi).toBe(0);
  });

  it("handles zero / invalid property price safely", () => {
    const r = calculateHomeLoan({ ...base, propertyPrice: Number.NaN });
    expect(r.isValid).toBe(false);
    for (const v of [r.loanAmount, r.ltvPercent, r.downPaymentPercent, r.upfrontTotal, r.emi.emi]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("ignores negative additional costs", () => {
    const r = calculateHomeLoan({ ...base, costs: { stampDuty: -100, registration: Number.NaN, other: 50 } });
    expect(r.additionalCosts).toBe(50);
  });

  it("indicative RBI LTV slabs", () => {
    expect(indicativeMaxLtv(25_00_000)).toBe(90);
    expect(indicativeMaxLtv(30_00_000)).toBe(90);
    expect(indicativeMaxLtv(30_00_001)).toBe(80);
    expect(indicativeMaxLtv(75_00_000)).toBe(80);
    expect(indicativeMaxLtv(1_00_00_000)).toBe(75);
  });
});
