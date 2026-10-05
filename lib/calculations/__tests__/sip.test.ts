import { describe, expect, it } from "vitest";
import { buildSipGrowth, calculateSip, sipFutureValue } from "../sip";
import { roundTo } from "../utils";

describe("sipFutureValue — reference values", () => {
  it("₹10,000/month at 12% for 10 years ≈ ₹23,23,391", () => {
    expect(roundTo(sipFutureValue(10_000, 12, 120), 0)).toBe(2_323_391);
  });

  it("₹5,000/month at 12% for 5 years ≈ ₹4,12,432", () => {
    expect(roundTo(sipFutureValue(5_000, 12, 60), 0)).toBe(412_432);
  });

  it("matches the textbook annuity-due formula", () => {
    const p = 7_500;
    const i = 11.25 / 12 / 100;
    const n = 211;
    const textbook = p * (((1 + i) ** n - 1) / i) * (1 + i);
    expect(sipFutureValue(p, 11.25, n)).toBeCloseTo(textbook, 6);
  });

  it("one month of SIP grows by exactly one month of return", () => {
    expect(sipFutureValue(1000, 12, 1)).toBeCloseTo(1010, 10);
  });

  it("0% return equals total invested", () => {
    expect(sipFutureValue(2500, 0, 24)).toBe(60_000);
  });
});

describe("calculateSip", () => {
  it("returns invested, returns and total that add up", () => {
    const r = calculateSip({ monthlyInvestment: 10_000, annualReturn: 12, years: 10 });
    expect(r.isValid).toBe(true);
    expect(r.totalInvested).toBe(1_200_000);
    expect(r.estimatedReturns + r.totalInvested).toBeCloseTo(r.futureValue, 6);
    expect(roundTo(r.estimatedReturns, 0)).toBe(1_123_391);
  });

  it("higher return or longer duration → higher future value", () => {
    const base = calculateSip({ monthlyInvestment: 5000, annualReturn: 10, years: 10 });
    expect(calculateSip({ monthlyInvestment: 5000, annualReturn: 12, years: 10 }).futureValue).toBeGreaterThan(base.futureValue);
    expect(calculateSip({ monthlyInvestment: 5000, annualReturn: 10, years: 15 }).futureValue).toBeGreaterThan(base.futureValue);
  });

  it.each([
    { monthlyInvestment: 0, annualReturn: 12, years: 10 },
    { monthlyInvestment: 1000, annualReturn: 12, years: 0 },
    { monthlyInvestment: -1000, annualReturn: 12, years: 10 },
    { monthlyInvestment: Number.NaN, annualReturn: Number.NaN, years: Number.NaN },
    { monthlyInvestment: Number.POSITIVE_INFINITY, annualReturn: 12, years: 10 },
  ])("is safe and invalid for %o", (input) => {
    const r = calculateSip(input);
    for (const v of [r.totalInvested, r.estimatedReturns, r.futureValue]) {
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("flags zero amount or duration as invalid", () => {
    expect(calculateSip({ monthlyInvestment: 0, annualReturn: 12, years: 10 }).isValid).toBe(false);
    expect(calculateSip({ monthlyInvestment: 1000, annualReturn: 12, years: 0 }).isValid).toBe(false);
  });

  it("stays finite at the extreme limits", () => {
    const r = calculateSip({ monthlyInvestment: 1e15, annualReturn: 1e3, years: 1e3 });
    expect(Number.isFinite(r.futureValue)).toBe(true);
    expect(r.months).toBe(600);
  });

  it("handles very small amounts and tiny returns", () => {
    const r = calculateSip({ monthlyInvestment: 1, annualReturn: 1e-9, years: 1 });
    expect(r.futureValue).toBeCloseTo(12, 6);
  });

  it("supports fractional years by rounding to months", () => {
    expect(calculateSip({ monthlyInvestment: 1000, annualReturn: 0, years: 2.5 }).totalInvested).toBe(30_000);
  });
});

describe("buildSipGrowth", () => {
  it("returns one point per year, ending at the final value", () => {
    const input = { monthlyInvestment: 10_000, annualReturn: 12, years: 10 };
    const points = buildSipGrowth(input);
    expect(points).toHaveLength(10);
    expect(points.at(-1)?.value).toBeCloseTo(calculateSip(input).futureValue, 6);
    for (let i = 1; i < points.length; i++) expect(points[i]!.value).toBeGreaterThan(points[i - 1]!.value);
  });

  it("includes a partial final year", () => {
    const points = buildSipGrowth({ monthlyInvestment: 1000, annualReturn: 0, years: 1.5 });
    expect(points).toHaveLength(2);
    expect(points[1]?.invested).toBe(18_000);
  });

  it("is empty for invalid input", () => {
    expect(buildSipGrowth({ monthlyInvestment: 0, annualReturn: 12, years: 5 })).toEqual([]);
  });
});
