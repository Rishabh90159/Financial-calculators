import { describe, expect, it } from "vitest";
import {
  assessCarAffordability,
  calculateCarLoan,
  carEmiShareBand,
  carTenureMonths,
  compareCarLoanTenures,
  compareFlatRate,
  normaliseCarTenureYears,
} from "../carLoan";
import { calculateEmiAmount } from "../emi";
import { roundTo } from "../utils";

function expectFiniteNonNegative(...values: number[]) {
  for (const v of values) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
}

const base = { onRoadPrice: 10_00_000, downPayment: 2_00_000, annualRate: 9, tenureYears: 5 };

describe("calculateCarLoan — worked example (₹10 lakh on-road, ₹2 lakh down, 9%, 5 years)", () => {
  it("derives loan amount and EMI", () => {
    const r = calculateCarLoan(base);
    // Loan = 10,00,000 − 2,00,000 = 8,00,000.
    expect(r.loanAmount).toBe(8_00_000);
    expect(r.downPaymentPercent).toBe(20);
    expect(r.loanToPricePercent).toBe(80);
    expect(r.tenureMonths).toBe(60);
    // r = 9/1200 = 0.0075; (1.0075)^60 ≈ 1.565681.
    // EMI = 8,00,000 × 0.0075 × 1.565681 / 0.565681 = 6,000 × 2.767785 ≈ 16,606.7.
    // Cross-check: published ₹10 lakh/9%/60 m EMI is 20,758.36; × 0.8 = 16,606.69.
    expect(roundTo(r.emi.emi, 2)).toBe(16_606.68);
    // Total payment = 16,606.684 × 60 ≈ 9,96,401.05; interest = 9,96,401.05 − 8,00,000 = 1,96,401.05.
    expect(roundTo(r.emi.totalPayment, 0)).toBe(9_96_401);
    expect(roundTo(r.emi.totalInterest, 0)).toBe(1_96_401);
  });

  it("upfront total and total cost of the car", () => {
    const r = calculateCarLoan({ ...base, processingFee: 5_900, otherUpfrontCosts: 25_000 });
    // Upfront = 2,00,000 + 5,900 + 25,000 = 2,30,900.
    expect(r.upfrontTotal).toBe(2_30_900);
    expect(r.totalCostWithLoan).toBeCloseTo(2_30_900 + r.emi.totalPayment, 6);
    // Without optional costs: 2,00,000 + 9,96,401.05 = 11,96,401.05.
    const plain = calculateCarLoan(base);
    expect(plain.upfrontTotal).toBe(2_00_000);
    expect(roundTo(plain.totalCostWithLoan, 0)).toBe(11_96_401);
  });

  it("uses the shared EMI engine", () => {
    const r = calculateCarLoan({ ...base, annualRate: 8.65, tenureYears: 6.5 });
    expect(r.emi.emi).toBeCloseTo(calculateEmiAmount(8_00_000, 8.65, 78), 8);
  });
});

describe("calculateCarLoan — edge cases", () => {
  it("0% interest divides the loan evenly", () => {
    const r = calculateCarLoan({ ...base, annualRate: 0 });
    // 8,00,000 / 60 = 13,333.33.
    expect(roundTo(r.emi.emi, 2)).toBe(13_333.33);
    expect(r.emi.totalInterest).toBe(0);
  });

  it("down payment equal to the price means no loan", () => {
    const r = calculateCarLoan({ ...base, downPayment: 10_00_000 });
    expect(r.loanAmount).toBe(0);
    expect(r.emi.emi).toBe(0);
    expect(r.emi.isValid).toBe(false);
    expect(r.isValid).toBe(true);
    expect(r.totalCostWithLoan).toBe(10_00_000);
  });

  it("down payment above the price is capped with a note", () => {
    const r = calculateCarLoan({ ...base, downPayment: 15_00_000 });
    expect(r.downPayment).toBe(10_00_000);
    expect(r.loanAmount).toBe(0);
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it("zero, negative and NaN inputs are safe", () => {
    for (const bad of [0, -5, Number.NaN, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]) {
      const r = calculateCarLoan({ onRoadPrice: bad, downPayment: bad, annualRate: bad, tenureYears: bad, processingFee: bad, otherUpfrontCosts: bad });
      expect(r.isValid).toBe(false);
      expectFiniteNonNegative(r.loanAmount, r.emi.emi, r.upfrontTotal, r.totalCostWithLoan, r.downPaymentPercent);
    }
  });

  it("negative optional costs are ignored", () => {
    const r = calculateCarLoan({ ...base, processingFee: -100, otherUpfrontCosts: Number.NaN });
    expect(r.upfrontTotal).toBe(2_00_000);
  });

  it("zero tenure gives no EMI and a note", () => {
    const r = calculateCarLoan({ ...base, tenureYears: 0 });
    expect(r.emi.emi).toBe(0);
    expect(r.notes.some((n) => n.includes("tenure"))).toBe(true);
  });

  it("huge values stay finite", () => {
    const r = calculateCarLoan({ onRoadPrice: 1e20, downPayment: 0, annualRate: 1e6, tenureYears: 1e6, processingFee: 1e30, otherUpfrontCosts: 1e30 });
    expectFiniteNonNegative(r.loanAmount, r.emi.emi, r.emi.totalInterest, r.upfrontTotal, r.totalCostWithLoan);
  });

  it("tenure is rounded to the nearest half year", () => {
    expect(normaliseCarTenureYears(4.3)).toBe(4.5);
    expect(normaliseCarTenureYears(4.2)).toBe(4);
    expect(carTenureMonths(5.5)).toBe(66);
    expect(carTenureMonths(-1)).toBe(0);
    expect(carTenureMonths(Number.NaN)).toBe(0);
  });
});

describe("compareCarLoanTenures", () => {
  it("3–7 year rows for ₹8 lakh at 9%", () => {
    const { rows, baselineYears } = compareCarLoanTenures(8_00_000, 9, 5);
    expect(baselineYears).toBe(3);
    expect(rows.map((r) => r.tenureYears)).toEqual([3, 4, 5, 6, 7]);
    // 3 years: (1.0075)^36 ≈ 1.308645 → EMI = 6,000 × 1.308645 / 0.308645 ≈ 25,439.8.
    expect(roundTo(rows[0]!.emi, 2)).toBe(25_439.79);
    expect(roundTo(rows[0]!.totalInterest, 0)).toBe(1_15_832);
    expect(rows[0]!.extraInterestVsBaseline).toBe(0);
    // 5 years: interest 1,96,401 − 1,15,832 = 80,569 extra.
    expect(roundTo(rows[2]!.extraInterestVsBaseline, 0)).toBe(80_569);
    // 7 years: EMI 12,871.26, interest 2,81,186; extra = 2,81,186 − 1,15,832 = 1,65,354.
    expect(roundTo(rows[4]!.emi, 2)).toBe(12_871.26);
    expect(roundTo(rows[4]!.extraInterestVsBaseline, 0)).toBe(1_65_354);
    expect(rows.filter((r) => r.isCurrent).map((r) => r.tenureYears)).toEqual([5]);
  });

  it("longer tenure → lower EMI, more interest", () => {
    const { rows } = compareCarLoanTenures(8_00_000, 9, 5);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]!.emi).toBeLessThan(rows[i - 1]!.emi);
      expect(rows[i]!.totalInterest).toBeGreaterThan(rows[i - 1]!.totalInterest);
    }
  });

  it("inserts a tenure that is not in the list as the current row", () => {
    const { rows } = compareCarLoanTenures(8_00_000, 9, 4.5);
    expect(rows.map((r) => r.tenureYears)).toEqual([3, 4, 4.5, 5, 6, 7]);
    expect(rows.find((r) => r.isCurrent)?.tenureYears).toBe(4.5);
  });

  it("a tenure shorter than the baseline shows savings, not negative extra interest", () => {
    const { rows } = compareCarLoanTenures(8_00_000, 9, 1);
    expect(rows[0]!.tenureYears).toBe(1);
    expect(rows[0]!.isCurrent).toBe(true);
    expect(rows[0]!.extraInterestVsBaseline).toBe(0);
    expect(rows[0]!.interestSavedVsBaseline).toBeGreaterThan(0);
  });

  it("zero principal gives zero rows without errors", () => {
    const { rows } = compareCarLoanTenures(0, 9, 5);
    for (const r of rows) expectFiniteNonNegative(r.emi, r.totalInterest, r.totalPayment, r.extraInterestVsBaseline);
  });
});

describe("compareFlatRate", () => {
  it("9% flat vs 9% reducing on ₹8 lakh for 5 years", () => {
    const f = compareFlatRate(8_00_000, 9, 60);
    // Flat interest = 8,00,000 × 0.09 × 5 = 3,60,000; flat EMI = 11,60,000 / 60 = 19,333.33.
    expect(f.flatInterest).toBe(3_60_000);
    expect(roundTo(f.flatEmi, 2)).toBe(19_333.33);
    expect(roundTo(f.reducingInterest, 0)).toBe(1_96_401);
    // 3,60,000 − 1,96,401 = 1,63,599 extra.
    expect(roundTo(f.extraInterest, 0)).toBe(1_63_599);
    expect(roundTo(f.equivalentReducingRate, 1)).toBe(15.7);
  });

  it("a 5% flat quote is roughly a 9.15% reducing rate", () => {
    const f = compareFlatRate(8_00_000, 5, 60);
    // Flat interest = 8,00,000 × 0.05 × 5 = 2,00,000; EMI = 10,00,000 / 60 = 16,666.67.
    expect(f.flatInterest).toBe(2_00_000);
    expect(roundTo(f.equivalentReducingRate, 2)).toBe(9.15);
    expect(calculateEmiAmount(8_00_000, f.equivalentReducingRate, 60)).toBeCloseTo(f.flatEmi, 4);
  });

  it("0% flat equals 0% reducing; invalid input is safe", () => {
    const z = compareFlatRate(1_20_000, 0, 12);
    expect(z.flatEmi).toBe(10_000);
    expect(z.extraInterest).toBe(0);
    expect(z.equivalentReducingRate).toBeCloseTo(0, 6);
    const bad = compareFlatRate(Number.NaN, -1, Number.POSITIVE_INFINITY);
    expect(bad.isValid).toBe(false);
    expectFiniteNonNegative(bad.flatEmi, bad.flatInterest, bad.equivalentReducingRate);
  });
});

describe("assessCarAffordability", () => {
  it("band boundaries: ≤10% lower, >10–20% moderate, >20% higher", () => {
    expect(carEmiShareBand(0)).toBe("lower");
    expect(carEmiShareBand(10)).toBe("lower");
    expect(carEmiShareBand(10.0001)).toBe("moderate");
    expect(carEmiShareBand(20)).toBe("moderate");
    expect(carEmiShareBand(20.0001)).toBe("higher");
    expect(carEmiShareBand(Number.NaN)).toBe("lower");
  });

  it("computes shares", () => {
    // 16,606.68 / 1,00,000 = 16.6% → moderate; (16,606.68 + 15,000) / 1,00,000 = 31.6%.
    const a = assessCarAffordability({ carEmi: 16_606.68, monthlyIncome: 1_00_000, existingEmis: 15_000 });
    expect(roundTo(a.carEmiSharePercent, 1)).toBe(16.6);
    expect(roundTo(a.totalEmiSharePercent, 1)).toBe(31.6);
    expect(a.band).toBe("moderate");
    expect(a.totalAboveCautionLevel).toBe(false);
  });

  it("flags total EMIs above 40% of income", () => {
    expect(assessCarAffordability({ carEmi: 20_000, monthlyIncome: 1_00_000, existingEmis: 20_000 }).totalAboveCautionLevel).toBe(false);
    expect(assessCarAffordability({ carEmi: 20_000, monthlyIncome: 1_00_000, existingEmis: 20_001 }).totalAboveCautionLevel).toBe(true);
  });

  it("no income → invalid, no band", () => {
    for (const income of [0, -1, Number.NaN, 0.5]) {
      const a = assessCarAffordability({ carEmi: 10_000, monthlyIncome: income, existingEmis: 0 });
      expect(a.isValid).toBe(false);
      expect(a.band).toBeNull();
      expectFiniteNonNegative(a.carEmiSharePercent, a.totalEmiSharePercent);
    }
  });
});

describe("sweep — every numeric output is finite and non-negative", () => {
  const values = [0, 1, -1, 0.5, 9, 1e5, 1e9, 1e15, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  it("calculateCarLoan, tenure comparison and affordability", () => {
    for (const price of values) {
      for (const down of [0, 2_00_000, -5, Number.NaN, 1e15]) {
        for (const rate of [0, 9, 50, 1e4, -3, Number.NaN]) {
          for (const years of [0, 0.5, 5, 7, 100, -2, Number.NaN]) {
            const r = calculateCarLoan({ onRoadPrice: price, downPayment: down, annualRate: rate, tenureYears: years, processingFee: price, otherUpfrontCosts: down });
            expectFiniteNonNegative(
              r.onRoadPrice, r.downPayment, r.downPaymentPercent, r.loanAmount, r.loanToPricePercent,
              r.processingFee, r.otherUpfrontCosts, r.upfrontTotal, r.totalCostWithLoan, r.tenureYears, r.tenureMonths,
              r.emi.emi, r.emi.totalInterest, r.emi.totalPayment,
            );
            const c = compareCarLoanTenures(r.loanAmount, rate, years);
            for (const row of c.rows) {
              expectFiniteNonNegative(row.emi, row.totalInterest, row.totalPayment, row.extraInterestVsBaseline, row.interestSavedVsBaseline);
            }
            const a = assessCarAffordability({ carEmi: r.emi.emi, monthlyIncome: price, existingEmis: down });
            expectFiniteNonNegative(a.carEmiSharePercent, a.totalEmiSharePercent, a.totalEmis);
          }
        }
      }
    }
  });

  it("compareFlatRate", () => {
    for (const p of values) {
      for (const rate of values) {
        for (const n of [0, 1, 60, 600, 1e6, Number.NaN]) {
          const f = compareFlatRate(p, rate, n);
          expectFiniteNonNegative(f.flatInterest, f.flatEmi, f.reducingInterest, f.reducingEmi, f.extraInterest, f.equivalentReducingRate);
        }
      }
    }
  });
});
