import { describe, expect, it } from "vitest";
import {
  buildAmortizationSchedule,
  calculateEmi,
  calculateEmiAmount,
  calculateEmiSensitivity,
  summariseByYear,
} from "../emi";
import { roundTo } from "../utils";

function expectFiniteNonNegative(...values: number[]) {
  for (const v of values) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
}

describe("calculateEmiAmount — reference values", () => {
  // Reference figures published widely by Indian banks and textbooks.
  it.each([
    { p: 100_000, rate: 12, n: 12, expected: 8884.88 },
    { p: 1_000_000, rate: 10, n: 240, expected: 9650.22 },
    { p: 5_000_000, rate: 8.5, n: 240, expected: 43391.16 },
    { p: 1_000_000, rate: 9, n: 60, expected: 20758.36 },
    { p: 500_000, rate: 12, n: 36, expected: 16607.15 },
  ])("₹$p at $rate% for $n months → ₹$expected", ({ p, rate, n, expected }) => {
    expect(roundTo(calculateEmiAmount(p, rate, n), 2)).toBe(expected);
  });

  it("matches the textbook formula P·r·(1+r)^n / ((1+r)^n − 1)", () => {
    const p = 2_345_678;
    const r = 7.35 / 12 / 100;
    const n = 177;
    const textbook = (p * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    expect(calculateEmiAmount(p, 7.35, n)).toBeCloseTo(textbook, 6);
  });
});

describe("calculateEmi — totals", () => {
  it("total payment = EMI × n, total interest = total payment − principal", () => {
    const r = calculateEmi({ principal: 1_000_000, annualRate: 9, tenureMonths: 60 });
    expect(r.isValid).toBe(true);
    expect(r.totalPayment).toBeCloseTo(r.emi * 60, 6);
    expect(r.totalInterest).toBeCloseTo(r.totalPayment - 1_000_000, 6);
    expect(roundTo(r.totalInterest, 0)).toBe(245_501);
  });

  it("0% interest divides principal evenly and has no interest", () => {
    const r = calculateEmi({ principal: 120_000, annualRate: 0, tenureMonths: 12 });
    expect(r.emi).toBe(10_000);
    expect(r.totalInterest).toBe(0);
    expect(r.totalPayment).toBe(120_000);
  });

  it("higher rate → higher EMI; longer tenure → lower EMI but more interest", () => {
    const base = calculateEmi({ principal: 3_000_000, annualRate: 8, tenureMonths: 240 });
    const higherRate = calculateEmi({ principal: 3_000_000, annualRate: 9, tenureMonths: 240 });
    const longer = calculateEmi({ principal: 3_000_000, annualRate: 8, tenureMonths: 300 });
    expect(higherRate.emi).toBeGreaterThan(base.emi);
    expect(longer.emi).toBeLessThan(base.emi);
    expect(longer.totalInterest).toBeGreaterThan(base.totalInterest);
  });

  it("EMI scales linearly with principal", () => {
    const a = calculateEmiAmount(2_500_000, 8.5, 240);
    const b = calculateEmiAmount(5_000_000, 8.5, 240);
    expect(b).toBeCloseTo(a * 2, 6);
  });
});

describe("calculateEmi — invalid and edge inputs", () => {
  it.each([
    { principal: 0, annualRate: 10, tenureMonths: 12 },
    { principal: 100_000, annualRate: 10, tenureMonths: 0 },
    { principal: -50_000, annualRate: 10, tenureMonths: 12 },
    { principal: Number.NaN, annualRate: 10, tenureMonths: 12 },
    { principal: 100_000, annualRate: Number.NaN, tenureMonths: Number.NaN },
    { principal: Number.POSITIVE_INFINITY, annualRate: 10, tenureMonths: 12 },
  ])("never returns NaN/Infinity/negative for %o", (input) => {
    const r = calculateEmi(input);
    expectFiniteNonNegative(r.emi, r.totalInterest, r.totalPayment, r.principal);
  });

  it("zero principal or tenure is flagged invalid with zero results", () => {
    expect(calculateEmi({ principal: 0, annualRate: 10, tenureMonths: 12 })).toMatchObject({ isValid: false, emi: 0 });
    expect(calculateEmi({ principal: 1000, annualRate: 10, tenureMonths: 0 })).toMatchObject({ isValid: false, emi: 0 });
  });

  it("negative or NaN rate is treated as 0%", () => {
    const r = calculateEmi({ principal: 12_000, annualRate: -5, tenureMonths: 12 });
    expect(r.emi).toBe(1000);
  });

  it("handles very large values without overflow", () => {
    const r = calculateEmi({ principal: 1e12, annualRate: 50, tenureMonths: 600 });
    expectFiniteNonNegative(r.emi, r.totalInterest, r.totalPayment);
    // At very long tenures the EMI approaches interest-only (P × r).
    expect(r.emi).toBeGreaterThan(1e12 * (50 / 1200));
  });

  it("clamps inputs beyond limits instead of producing garbage", () => {
    const r = calculateEmi({ principal: 1e20, annualRate: 1e6, tenureMonths: 1e9 });
    expectFiniteNonNegative(r.emi, r.totalInterest, r.totalPayment);
    expect(r.tenureMonths).toBe(600);
  });

  it("handles very small values and tiny rates precisely", () => {
    expect(calculateEmiAmount(1, 0.0001, 12)).toBeCloseTo(1 / 12, 6);
    const tiny = calculateEmi({ principal: 100, annualRate: 1e-9, tenureMonths: 360 });
    expectFiniteNonNegative(tiny.emi, tiny.totalInterest);
    expect(tiny.emi).toBeCloseTo(100 / 360, 9);
  });

  it("rounds fractional tenure to whole months", () => {
    expect(calculateEmi({ principal: 1000, annualRate: 10, tenureMonths: 11.6 }).tenureMonths).toBe(12);
  });
});

describe("amortization schedule", () => {
  const input = { principal: 1_000_000, annualRate: 9, tenureMonths: 60 };
  const schedule = buildAmortizationSchedule(input);
  const result = calculateEmi(input);

  it("has one row per instalment and ends at exactly zero", () => {
    expect(schedule).toHaveLength(60);
    expect(schedule.at(-1)?.closingBalance).toBe(0);
  });

  it("principal portions sum to the loan amount and interest to total interest", () => {
    const principalSum = schedule.reduce((s, r) => s + r.principalPaid, 0);
    const interestSum = schedule.reduce((s, r) => s + r.interestPaid, 0);
    expect(principalSum).toBeCloseTo(1_000_000, 4);
    expect(interestSum).toBeCloseTo(result.totalInterest, 4);
  });

  it("first-month interest is principal × monthly rate", () => {
    expect(schedule[0]?.interestPaid).toBeCloseTo(1_000_000 * 0.0075, 8);
  });

  it("interest portion falls and principal portion rises every month", () => {
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i]!.interestPaid).toBeLessThan(schedule[i - 1]!.interestPaid);
      expect(schedule[i]!.principalPaid).toBeGreaterThan(schedule[i - 1]!.principalPaid);
    }
  });

  it("balances never go negative", () => {
    for (const row of schedule) expect(row.closingBalance).toBeGreaterThanOrEqual(0);
  });

  it("returns an empty schedule for invalid input", () => {
    expect(buildAmortizationSchedule({ principal: 0, annualRate: 9, tenureMonths: 60 })).toEqual([]);
    expect(buildAmortizationSchedule({ principal: 1000, annualRate: 9, tenureMonths: 0 })).toEqual([]);
  });

  it("yearly summary groups 12 months per year with a short final year", () => {
    const years = summariseByYear(buildAmortizationSchedule({ principal: 100_000, annualRate: 10, tenureMonths: 30 }));
    expect(years).toHaveLength(3);
    expect(years.at(-1)?.closingBalance).toBe(0);
    const principalTotal = years.reduce((s, y) => s + y.principalPaid, 0);
    expect(principalTotal).toBeCloseTo(100_000, 4);
  });

  it("works at 0% interest", () => {
    const s = buildAmortizationSchedule({ principal: 1200, annualRate: 0, tenureMonths: 12 });
    expect(s.every((r) => r.interestPaid === 0 && r.principalPaid === 100)).toBe(true);
  });
});

describe("sensitivity", () => {
  it("computes higher-rate and tenure variants", () => {
    const s = calculateEmiSensitivity({ principal: 5_000_000, annualRate: 8.5, tenureMonths: 240 });
    expect(s.higherRate.annualRate).toBe(9.5);
    expect(s.longerTenure.tenureMonths).toBe(300);
    expect(s.shorterTenure?.tenureMonths).toBe(180);
    expect(s.higherRate.emi).toBeGreaterThan(s.base.emi);
  });

  it("omits the shorter-tenure variant when tenure is too short", () => {
    const s = calculateEmiSensitivity({ principal: 100_000, annualRate: 10, tenureMonths: 36 });
    expect(s.shorterTenure).toBeNull();
  });
});
