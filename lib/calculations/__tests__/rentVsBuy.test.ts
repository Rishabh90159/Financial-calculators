import { describe, expect, it } from "vitest";
import { calculateEmiAmount } from "../emi";
import {
  calculateRentVsBuy,
  calculateRentVsBuySensitivity,
  effectiveMonthlyRate,
  type RentVsBuyInput,
  type SensitivityGroup,
  type SensitivityKey,
  type RentVsBuyResult,
} from "../rentVsBuy";

/** The calculator's default inputs. */
const DEFAULTS: RentVsBuyInput = {
  propertyPrice: 80_00_000,
  downPayment: 16_00_000,
  loanRate: 8.5,
  loanTenureYears: 20,
  purchaseCosts: 6_00_000,
  monthlyMaintenance: 3_000,
  annualOwnershipCosts: 6_000,
  ownershipCostGrowth: 5,
  sellingCostPercent: 1,
  monthlyRent: 25_000,
  rentIncrease: 5,
  investmentReturn: 10,
  propertyAppreciation: 5,
  horizonYears: 10,
};

/** A blank slate: everything zero, so each test switches on only what it needs. */
const ZERO: RentVsBuyInput = {
  propertyPrice: 10_00_000,
  downPayment: 10_00_000,
  loanRate: 0,
  loanTenureYears: 0,
  purchaseCosts: 0,
  monthlyMaintenance: 0,
  annualOwnershipCosts: 0,
  ownershipCostGrowth: 0,
  sellingCostPercent: 0,
  monthlyRent: 0,
  rentIncrease: 0,
  investmentReturn: 0,
  propertyAppreciation: 0,
  horizonYears: 5,
};

function collectNumbers(value: unknown, out: number[] = []): number[] {
  if (typeof value === "number") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectNumbers(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectNumbers(v, out));
  return out;
}

function expectAllFinite(result: RentVsBuyResult) {
  for (const n of collectNumbers(result)) expect(Number.isFinite(n)).toBe(true);
}

describe("effectiveMonthlyRate", () => {
  it("compounds to the annual rate over 12 months", () => {
    const r = effectiveMonthlyRate(10);
    expect((1 + r) ** 12).toBeCloseTo(1.1, 12);
    expect(effectiveMonthlyRate(0)).toBe(0);
    expect(effectiveMonthlyRate(Number.NaN)).toBe(0);
    expect(effectiveMonthlyRate(-5)).toBe(0);
  });
});

describe("calculateRentVsBuy — default inputs (worked example on the page)", () => {
  const r = calculateRentVsBuy(DEFAULTS);

  it("derives the loan and first-month costs", () => {
    expect(r.loanAmount).toBe(64_00_000);
    expect(r.emi).toBeCloseTo(calculateEmiAmount(64_00_000, 8.5, 240), 8);
    expect(Math.round(r.emi)).toBe(55_541);
    // EMI 55,540.69 + maintenance 3,000 + tax 6,000 / 12 = 500 → 59,040.69
    expect(r.firstMonthBuyCost).toBeCloseTo(r.emi + 3_500, 8);
    expect(r.upfrontCash).toBe(22_00_000);
  });

  it("matches the year-1 snapshot computed by hand", () => {
    const y1 = r.allYears[0]!;
    // Home value: 80,00,000 × 1.05 = 84,00,000; selling cost 1% = 84,000
    expect(y1.propertyValue).toBeCloseTo(84_00_000, 6);
    expect(y1.sellingCost).toBeCloseTo(84_000, 6);
    // Renter: 22,00,000 grows a full year at 10% = 24,20,000, plus 12 end-of-month
    // contributions of (59,040.69 − 25,000) = 34,040.69. With monthly r = 1.1^(1/12) − 1,
    // the annuity factor ((1 + r)^12 − 1) / r = 0.1 / r ≈ 12.5406 → ≈ 4,26,890.
    const m = effectiveMonthlyRate(10);
    const contribution = r.firstMonthBuyCost - 25_000;
    expect(y1.renterPortfolio).toBeCloseTo(24_20_000 + contribution * (0.1 / m), 4);
    expect(Math.round(y1.renterPortfolio)).toBe(28_46_888);
    // Buyer: 84,00,000 − balance after 12 EMIs − 84,000; no surplus to invest.
    expect(y1.buyerPortfolio).toBe(0);
    expect(y1.buyNet).toBeCloseTo(84_00_000 - y1.outstandingLoan - 84_000, 6);
  });

  it("matches the 10-year figures quoted in the worked example", () => {
    // 80,00,000 × 1.05^10 = 1,30,31,157.01
    expect(r.propertyValue).toBeCloseTo(8_000_000 * 1.05 ** 10, 4);
    expect(Math.round(r.propertyValue)).toBe(1_30_31_157);
    expect(Math.round(r.outstandingLoan)).toBe(44_79_605);
    expect(Math.round(r.sellingCost)).toBe(1_30_312);
    expect(Math.round(r.buyNet)).toBe(84_21_241);
    expect(Math.round(r.rentNet)).toBe(1_16_03_934);
    expect(Math.round(r.difference)).toBe(-31_82_693);
    expect(r.ahead).toBe("rent");
    expect(Math.round(r.totalRentPaid)).toBe(37_73_368);
    expect(Math.round(r.totalEmiPaid)).toBe(66_64_882);
    expect(Math.round(r.interestPaid)).toBe(47_44_487);
    expect(Math.round(r.principalRepaid)).toBe(19_20_395);
    expect(Math.round(r.totalBuyerOutflow)).toBe(93_93_154);
    expect(r.breakEven.status).toBe("never");
  });

  it("matches the ₹40,000-rent variant quoted on the page", () => {
    const r = calculateRentVsBuy({ ...DEFAULTS, monthlyRent: 40_000 });
    expect(Math.round(r.difference)).toBe(4_47_219);
    expect(r.ahead).toBe("buy");
    expect(r.breakEven).toEqual({ status: "year", year: 8, staysAhead: true });
  });

  it("keeps internal identities", () => {
    expect(r.interestPaid + r.principalRepaid).toBeCloseTo(r.totalEmiPaid, 4);
    expect(r.loanAmount - r.principalRepaid).toBeCloseTo(r.outstandingLoan, 4);
    expect(r.totalBuyerOutflow).toBeCloseTo(
      r.upfrontCash + r.totalEmiPaid + r.totalMaintenance + r.totalOwnershipCosts,
      4,
    );
    // Rent 25,000 stepping up 5% a year for 10 years: 3,00,000 × (1.05^10 − 1) / 0.05
    expect(r.totalRentPaid).toBeCloseTo((300_000 * (1.05 ** 10 - 1)) / 0.05, 4);
    expect(r.years).toHaveLength(10);
    expect(r.allYears).toHaveLength(30);
    expect(r.years[9]).toEqual(r.allYears[9]);
    expect(r.isValid).toBe(true);
  });
});

describe("calculateRentVsBuy — hand-verifiable 0% cases", () => {
  it("no loan, 0% everything: buyer saves the rent", () => {
    // Buyer owns outright and pays nothing monthly, so invests rent 10,000 × 60 = 6,00,000.
    // Renter invested 10,00,000 at 0%. Buy = 10L + 6L = 16L; Rent = 10L.
    const r = calculateRentVsBuy({ ...ZERO, monthlyRent: 10_000 });
    expect(r.buyNet).toBeCloseTo(16_00_000, 6);
    expect(r.rentNet).toBeCloseTo(10_00_000, 6);
    expect(r.difference).toBeCloseTo(6_00_000, 6);
    expect(r.totalRentPaid).toBeCloseTo(6_00_000, 6);
    expect(r.buyerMonthlyInvested).toBeCloseTo(6_00_000, 6);
    expect(r.breakEven.status).toBe("from-start");
    expect(r.breakEven.year).toBe(1);
    expect(r.notes.some((n) => n.includes("buyer invests"))).toBe(true);
  });

  it("zero down payment, 0% loan: equity equals principal repaid", () => {
    // 12,00,000 over 10 years at 0% → EMI 10,000 = rent, so nobody invests.
    // After 5 years balance = 12,00,000 − 60 × 10,000 = 6,00,000. Buy = 12L − 6L = 6L; Rent = 0.
    const r = calculateRentVsBuy({
      ...ZERO,
      propertyPrice: 12_00_000,
      downPayment: 0,
      loanTenureYears: 10,
      monthlyRent: 10_000,
    });
    expect(r.emi).toBeCloseTo(10_000, 8);
    expect(r.outstandingLoan).toBeCloseTo(6_00_000, 6);
    expect(r.buyNet).toBeCloseTo(6_00_000, 6);
    expect(r.rentNet).toBe(0);
    expect(r.interestPaid).toBeCloseTo(0, 6);
    expect(r.renterMonthlyInvested).toBe(0);
    expect(r.buyerMonthlyInvested).toBe(0);
  });

  it("horizon longer than the loan tenure", () => {
    // 12L at 0% over 5 years → EMI 20,000. Rent 10,000.
    // Years 1–5: renter invests 10,000 × 60 = 6L. Years 6–10: buyer pays 0, invests 10,000 × 60 = 6L.
    // Buy = 12L − 0 + 6L = 18L; Rent = 6L.
    const r = calculateRentVsBuy({
      ...ZERO,
      propertyPrice: 12_00_000,
      downPayment: 0,
      loanTenureYears: 5,
      monthlyRent: 10_000,
      horizonYears: 10,
    });
    expect(r.outstandingLoan).toBe(0);
    expect(r.rentNet).toBeCloseTo(6_00_000, 6);
    expect(r.buyerPortfolio).toBeCloseTo(6_00_000, 6);
    expect(r.buyNet).toBeCloseTo(18_00_000, 6);
    expect(r.totalEmiPaid).toBeCloseTo(12_00_000, 6);
    expect(r.principalRepaid).toBeCloseTo(12_00_000, 6);
    expect(r.notes.some((n) => n.includes("fully repaid after 5 years"))).toBe(true);
  });

  it("rent above the ownership cost", () => {
    // Owner pays 2,000 maintenance; rent is 12,000. Buyer invests 10,000 × 12 = 1,20,000 in year 1.
    const r = calculateRentVsBuy({ ...ZERO, monthlyMaintenance: 2_000, monthlyRent: 12_000, horizonYears: 1 });
    expect(r.buyerPortfolio).toBeCloseTo(1_20_000, 6);
    expect(r.buyNet).toBeCloseTo(11_20_000, 6);
    expect(r.rentNet).toBeCloseTo(10_00_000, 6);
    expect(r.ahead).toBe("buy");
  });

  it("break-even in a later year", () => {
    // Buyer spends 10L + 2L costs; renter invests 12L at 0%. Rent 8,000, no owner costs.
    // Buy net in year y = 10L + 96,000y; first ≥ 12L when y = 3 (2,88,000 ≥ 2,00,000; y = 2 gives 1,92,000).
    const r = calculateRentVsBuy({ ...ZERO, purchaseCosts: 2_00_000, monthlyRent: 8_000 });
    expect(r.allYears[1]!.difference).toBeCloseTo(-8_000, 6);
    expect(r.breakEven).toEqual({ status: "year", year: 3, staysAhead: true });
  });

  it("annual step-ups for rent and ownership costs", () => {
    // Rent 10,000 rising 10% after 12 months: 1,20,000 + 1,32,000 = 2,52,000.
    // Maintenance 1,000 + tax 12,000/yr (1,000/month) rising 5%: (24,000) + (25,200) = 49,200.
    const r = calculateRentVsBuy({
      ...ZERO,
      monthlyRent: 10_000,
      rentIncrease: 10,
      monthlyMaintenance: 1_000,
      annualOwnershipCosts: 12_000,
      ownershipCostGrowth: 5,
      horizonYears: 2,
    });
    expect(r.totalRentPaid).toBeCloseTo(2_52_000, 6);
    expect(r.totalMaintenance + r.totalOwnershipCosts).toBeCloseTo(49_200, 6);
  });

  it("selling cost and appreciation, including falling prices", () => {
    // 10L × 1.05^5 = 12,76,281.5625; 2% selling cost = 25,525.63
    const up = calculateRentVsBuy({ ...ZERO, propertyAppreciation: 5, sellingCostPercent: 2 });
    expect(up.propertyValue).toBeCloseTo(12_76_281.5625, 4);
    expect(up.sellingCost).toBeCloseTo(25_525.63125, 4);
    expect(up.buyNet).toBeCloseTo(12_76_281.5625 - 25_525.63125, 4);
    // −2% a year: 10L × 0.98^5 = 9,03,920.79
    const down = calculateRentVsBuy({ ...ZERO, propertyAppreciation: -2 });
    expect(down.propertyValue).toBeCloseTo(1_000_000 * 0.98 ** 5, 4);
    expect(down.input.propertyAppreciation).toBe(-2);
  });

  it("allows negative buyer net (negative equity) and flags it", () => {
    const r = calculateRentVsBuy({
      ...ZERO,
      downPayment: 0,
      loanRate: 10,
      loanTenureYears: 30,
      propertyAppreciation: -10,
      sellingCostPercent: 5,
      horizonYears: 3,
    });
    expect(r.buyNet).toBeLessThan(0);
    expect(r.homeEquity).toBeLessThan(0);
    expect(r.notes.some((n) => n.includes("negative equity"))).toBe(true);
    expectAllFinite(r);
  });
});

describe("calculateRentVsBuy — input sanitising", () => {
  it("caps the down payment at the price", () => {
    const r = calculateRentVsBuy({ ...DEFAULTS, downPayment: 1_00_00_000 });
    expect(r.loanAmount).toBe(0);
    expect(r.emi).toBe(0);
    expect(r.input.downPayment).toBe(80_00_000);
    expect(r.notes.some((n) => n.includes("capped"))).toBe(true);
  });

  it("clamps the horizon to whole years between 1 and 30", () => {
    expect(calculateRentVsBuy({ ...DEFAULTS, horizonYears: 0 }).horizonYears).toBe(1);
    expect(calculateRentVsBuy({ ...DEFAULTS, horizonYears: 45 }).horizonYears).toBe(30);
    expect(calculateRentVsBuy({ ...DEFAULTS, horizonYears: 7.6 }).horizonYears).toBe(8);
    expect(calculateRentVsBuy({ ...DEFAULTS, horizonYears: Number.NaN }).horizonYears).toBe(1);
  });

  it("treats negative and NaN values as zero (appreciation NaN → 0)", () => {
    const r = calculateRentVsBuy({
      ...DEFAULTS,
      monthlyRent: -5_000,
      loanRate: Number.NaN,
      purchaseCosts: -1,
      propertyAppreciation: Number.NaN,
    });
    expect(r.input.monthlyRent).toBe(0);
    expect(r.input.loanRate).toBe(0);
    expect(r.input.purchaseCosts).toBe(0);
    expect(r.input.propertyAppreciation).toBe(0);
    expectAllFinite(r);
  });

  it("returns finite zeros and isValid=false for an all-invalid input", () => {
    const bad = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, Number.NaN])) as unknown as RentVsBuyInput;
    const r = calculateRentVsBuy(bad);
    expect(r.isValid).toBe(false);
    expect(r.buyNet).toBe(0);
    expect(r.rentNet).toBe(0);
    expectAllFinite(r);
    expectAllFinite(calculateRentVsBuy({ ...ZERO, propertyPrice: 0, downPayment: 0 }));
  });

  it("stays finite for huge and infinite values", () => {
    const huge = Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, 1e300])) as unknown as RentVsBuyInput;
    const r = calculateRentVsBuy(huge);
    expectAllFinite(r);
    expect(r.input.propertyAppreciation).toBe(30);
    expect(r.input.sellingCostPercent).toBe(20);
    const inf = Object.fromEntries(
      Object.keys(DEFAULTS).map((k) => [k, Number.POSITIVE_INFINITY]),
    ) as unknown as RentVsBuyInput;
    expectAllFinite(calculateRentVsBuy(inf));
    expectAllFinite(calculateRentVsBuy({ ...DEFAULTS, propertyAppreciation: Number.NEGATIVE_INFINITY }));
  });

  it("higher appreciation always helps buying", () => {
    const low = calculateRentVsBuy({ ...DEFAULTS, propertyAppreciation: 3 });
    const high = calculateRentVsBuy({ ...DEFAULTS, propertyAppreciation: 8 });
    expect(high.difference).toBeGreaterThan(low.difference);
  });
});

describe("calculateRentVsBuySensitivity", () => {
  it("defaults: rows, current marking and most sensitive assumption", () => {
    const s = calculateRentVsBuySensitivity(DEFAULTS);
    const base = calculateRentVsBuy(DEFAULTS).difference;
    const byKey = Object.fromEntries(s.groups.map((g) => [g.key, g])) as Record<SensitivityKey, SensitivityGroup>;
    expect(byKey.propertyAppreciation.rows.map((r) => r.value)).toEqual([3, 4, 5, 6, 7]);
    expect(byKey.rentIncrease.rows.map((r) => r.value)).toEqual([3, 5, 7]);
    expect(byKey.investmentReturn.rows.map((r) => r.value)).toEqual([8, 10, 12]);
    expect(byKey.loanRate.rows.map((r) => r.value)).toEqual([7.5, 8.5, 9.5]);
    for (const g of s.groups) {
      const current = g.rows.filter((r) => r.current);
      expect(current).toHaveLength(1);
      expect(current[0]!.difference).toBeCloseTo(base, 6);
    }
    // Swings at defaults: appreciation ≈ ₹49.4 L, return ≈ ₹33.9 L, rate ≈ ₹18.9 L, rent ≈ ₹9.5 L.
    expect(s.mostSensitive?.key).toBe("propertyAppreciation");
    expect(Math.round(byKey.propertyAppreciation.swing)).toBe(49_36_021);
    expect(byKey.investmentReturn.rows[0]!.difference).toBeGreaterThan(byKey.investmentReturn.rows[2]!.difference);
  });

  it("matches the sensitivity figures quoted on the page", () => {
    const s = calculateRentVsBuySensitivity(DEFAULTS);
    const diffs = (key: SensitivityKey) =>
      s.groups.find((g) => g.key === key)!.rows.map((r) => Math.round(r.difference));
    expect(diffs("propertyAppreciation")).toEqual([-54_39_721, -43_60_004, -31_82_693, -19_00_025, -5_03_700]);
    expect(diffs("investmentReturn")).toEqual([-16_09_545, -31_82_693, -50_00_869]);
    expect(diffs("loanRate")).toEqual([-22_50_574, -31_82_693, -41_35_989]);
    expect(diffs("rentIncrease")).toEqual([-36_34_873, -31_82_693, -26_84_391]);
    expect(s.holding.map((h) => Math.round(h.difference))).toEqual([-15_25_071, -31_82_693, -62_46_760, -1_17_09_140]);
  });

  it("holding periods include the chosen horizon", () => {
    const s = calculateRentVsBuySensitivity({ ...DEFAULTS, horizonYears: 12 });
    expect(s.holding.map((h) => h.years)).toEqual([5, 10, 12, 15, 20]);
    expect(s.holding.find((h) => h.current)?.years).toBe(12);
    const s10 = calculateRentVsBuySensitivity(DEFAULTS);
    expect(s10.holding.map((h) => h.years)).toEqual([5, 10, 15, 20]);
    expect(Math.round(s10.holding[0]!.difference)).toBe(-15_25_071);
  });

  it("drops rows that clamp to the same value", () => {
    const s = calculateRentVsBuySensitivity({ ...DEFAULTS, loanRate: 0, rentIncrease: 1 });
    const rate = s.groups.find((g) => g.key === "loanRate")!;
    expect(rate.rows.map((r) => r.value)).toEqual([0, 1]);
    expect(rate.rows[0]!.current).toBe(true);
    const rent = s.groups.find((g) => g.key === "rentIncrease")!;
    expect(rent.rows.map((r) => r.value)).toEqual([0, 1, 3]);
  });

  it("appreciation can go negative in the sensitivity rows", () => {
    const s = calculateRentVsBuySensitivity({ ...DEFAULTS, propertyAppreciation: 0 });
    expect(s.groups[0]!.rows.map((r) => r.value)).toEqual([-2, -1, 0, 1, 2]);
  });

  it("returns null for most sensitive when nothing changes the result", () => {
    // No loan, no rent, nothing to invest: every scenario gives the same difference.
    const s = calculateRentVsBuySensitivity({ ...ZERO, propertyPrice: 0, downPayment: 0 });
    expect(s.mostSensitive).toBeNull();
  });
});

describe("finite-output sweep", () => {
  it("every numeric output is finite across edge combinations", () => {
    const values = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1e15];
    const keys = Object.keys(DEFAULTS) as (keyof RentVsBuyInput)[];
    for (const key of keys) {
      for (const v of values) {
        const input = { ...DEFAULTS, [key]: v };
        const r = calculateRentVsBuy(input);
        expectAllFinite(r);
        for (const n of collectNumbers(calculateRentVsBuySensitivity(input, r))) {
          expect(Number.isFinite(n)).toBe(true);
        }
      }
    }
    for (const horizonYears of [1, 5, 10, 15, 20, 30]) {
      for (const loanTenureYears of [0, 1, 5, 30]) {
        expectAllFinite(calculateRentVsBuy({ ...DEFAULTS, horizonYears, loanTenureYears }));
      }
    }
  });
});
