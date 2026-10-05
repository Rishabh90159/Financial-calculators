import { describe, expect, it } from "vitest";
import { calculateEmiAmount } from "../emi";
import {
  calculateLoanPrepayment,
  comparePrepayWithInvesting,
  type LoanPrepaymentInput,
  type LoanPrepaymentResult,
  type StrategyResult,
} from "../loanPrepayment";
import { roundTo } from "../utils";

const BASE: LoanPrepaymentInput = {
  outstanding: 30_00_000,
  annualRate: 8.5,
  remainingYears: 15,
  prepaymentAmount: 2_00_000,
  frequency: "once",
  firstPrepaymentMonth: 1,
};

function strategyNumbers(s: StrategyResult): number[] {
  return [
    s.totalInterest,
    s.totalEmiPaid,
    s.totalPrepaid,
    s.feesPaid,
    s.months,
    s.monthsSaved,
    s.interestSaved,
    s.netSaving,
    s.netLoss,
    s.emiAfterFirstPrepayment,
    s.finalEmi,
    s.lumpSumsApplied,
  ];
}

function allNumbers(r: LoanPrepaymentResult): number[] {
  return [
    r.outstanding,
    r.annualRate,
    r.remainingMonths,
    r.currentEmi,
    r.prepaymentAmount,
    r.firstPrepaymentMonth,
    r.extraMonthly,
    r.feePercent,
    r.original.totalInterest,
    r.original.totalPayment,
    r.original.months,
    ...strategyNumbers(r.reduceTenure),
    ...strategyNumbers(r.reduceEmi),
  ];
}

function expectFiniteNonNegative(values: number[]) {
  for (const v of values) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
}

/** Every rupee of principal is repaid exactly once: EMIs + prepayments − interest = outstanding. */
function expectPrincipalConserved(r: LoanPrepaymentResult, s: StrategyResult) {
  expect(s.totalEmiPaid + s.totalPrepaid - s.totalInterest).toBeCloseTo(r.outstanding, 4);
}

describe("calculateLoanPrepayment — reference values (₹30 lakh, 8.5%, 15 years, ₹2 lakh once in month 1)", () => {
  const r = calculateLoanPrepayment(BASE);

  it("current EMI and original interest", () => {
    // n = 180, r = 8.5/1200. EMI = P·r·(1+r)^n/((1+r)^n − 1) = ₹29,542.19
    // (cross-check: ₹50 lakh/15y at 8.5% = ₹49,236.98; × 0.6 = ₹29,542.19).
    expect(r.remainingMonths).toBe(180);
    expect(roundTo(r.currentEmi, 2)).toBe(29542.19);
    // Original interest = 180 × 29,542.1867 − 30,00,000 = 53,17,593.61 − 30,00,000 = 23,17,593.61
    expect(roundTo(r.original.totalInterest, 0)).toBe(2_317_594);
    expect(r.original.totalInterest).toBeCloseTo(r.currentEmi * 180 - 3_000_000, 4);
    expect(r.original.months).toBe(180);
  });

  it("reduce tenure: EMI unchanged, loan ends 22 months early, saves ≈ ₹4,55,828", () => {
    expect(r.reduceTenure.emiAfterFirstPrepayment).toBe(r.currentEmi);
    expect(r.reduceTenure.months).toBe(158);
    expect(r.reduceTenure.monthsSaved).toBe(22);
    expect(roundTo(r.reduceTenure.interestSaved, 0)).toBe(455_828);
    expect(r.reduceTenure.totalPrepaid).toBe(200_000);
    expectPrincipalConserved(r, r.reduceTenure);
  });

  it("reduce EMI: EMI recomputed over the remaining 179 months", () => {
    // Month 1: interest = 30,00,000 × 8.5/1200 = 21,250; principal = 29,542.19 − 21,250 = 8,292.19
    // Balance = 29,91,707.81 − 2,00,000 = 27,91,707.81.
    // New EMI = EMI(27,91,707.81, 8.5%, 179) = 29,542.19 × 27,91,707.81 / 29,91,707.81 = 27,567.25
    const balanceAfter = 3_000_000 - (r.currentEmi - 21_250) - 200_000;
    expect(r.reduceEmi.emiAfterFirstPrepayment).toBeCloseTo(calculateEmiAmount(balanceAfter, 8.5, 179), 6);
    expect(roundTo(r.reduceEmi.emiAfterFirstPrepayment, 2)).toBe(27567.25);
    expect(r.reduceEmi.months).toBe(180);
    expect(r.reduceEmi.monthsSaved).toBe(0);
    // Interest saved = 179 × (29,542.19 − 27,567.25) − 2,00,000 = 3,53,513.90 − 2,00,000 = 1,53,513.90
    const closedForm = 179 * (r.currentEmi - r.reduceEmi.emiAfterFirstPrepayment) - 200_000;
    expect(r.reduceEmi.interestSaved).toBeCloseTo(closedForm, 4);
    expect(roundTo(r.reduceEmi.interestSaved, 0)).toBe(153_514);
    expectPrincipalConserved(r, r.reduceEmi);
  });

  it("reducing tenure saves more interest than reducing EMI", () => {
    expect(r.reduceTenure.interestSaved).toBeGreaterThan(r.reduceEmi.interestSaved);
    expect(r.hasPrepayment).toBe(true);
    expect(r.isValid).toBe(true);
    expect(r.notes).toEqual([]);
  });

  it("scenario amounts used on the page", () => {
    const rows = [50_000, 1_00_000, 5_00_000].map((a) => calculateLoanPrepayment({ ...BASE, prepaymentAmount: a }));
    expect(rows.map((x) => roundTo(x.reduceTenure.interestSaved, 0))).toEqual([123_834, 240_729, 979_718]);
    expect(rows.map((x) => x.reduceTenure.monthsSaved)).toEqual([5, 11, 50]);
    expect(rows.map((x) => roundTo(x.reduceEmi.emiAfterFirstPrepayment, 0))).toEqual([29_048, 28_555, 24_605]);
    expect(rows.map((x) => roundTo(x.reduceEmi.interestSaved, 0))).toEqual([38_378, 76_757, 383_785]);
  });

  it("an earlier prepayment saves more than a later one", () => {
    const m61 = calculateLoanPrepayment({ ...BASE, firstPrepaymentMonth: 61 });
    const m121 = calculateLoanPrepayment({ ...BASE, firstPrepaymentMonth: 121 });
    expect(roundTo(m61.reduceTenure.interestSaved, 0)).toBe(240_827);
    expect(m61.reduceTenure.monthsSaved).toBe(14);
    expect(roundTo(m121.reduceTenure.interestSaved, 0)).toBe(93_820);
    expect(m121.reduceTenure.monthsSaved).toBe(9);
    expect(r.reduceTenure.interestSaved).toBeGreaterThan(m61.reduceTenure.interestSaved);
    expect(m61.reduceTenure.interestSaved).toBeGreaterThan(m121.reduceTenure.interestSaved);
  });
});

describe("hand-checked small loans", () => {
  it("0% interest: ₹1,20,000 over 12 months, ₹20,000 prepaid in month 1", () => {
    const r = calculateLoanPrepayment({
      outstanding: 120_000,
      annualRate: 0,
      remainingYears: 1,
      prepaymentAmount: 20_000,
      frequency: "once",
      firstPrepaymentMonth: 1,
    });
    expect(r.currentEmi).toBe(10_000);
    // Reduce tenure: after month 1 balance 1,10,000 − 20,000 = 90,000 → 9 more EMIs of 10,000 → 10 months.
    expect(r.reduceTenure.months).toBe(10);
    expect(r.reduceTenure.monthsSaved).toBe(2);
    expect(r.reduceTenure.interestSaved).toBe(0);
    // Reduce EMI: 90,000 ÷ 11 remaining months = 8,181.82.
    expect(roundTo(r.reduceEmi.emiAfterFirstPrepayment, 2)).toBe(8181.82);
    expect(r.reduceEmi.months).toBe(12);
    expect(r.notes.some((n) => n.includes("0% interest"))).toBe(true);
  });

  it("prepayment larger than the balance closes the loan in that month", () => {
    // ₹1,00,000 at 12% for 12 months: EMI 8,884.88. Month 1 interest 1,000, principal 7,884.88,
    // balance 92,115.12 → the ₹2,00,000 prepayment is capped at 92,115.12 and the loan closes.
    const r = calculateLoanPrepayment({
      outstanding: 100_000,
      annualRate: 12,
      remainingYears: 1,
      prepaymentAmount: 200_000,
      frequency: "once",
      firstPrepaymentMonth: 1,
    });
    expect(roundTo(r.currentEmi, 2)).toBe(8884.88);
    for (const s of [r.reduceTenure, r.reduceEmi]) {
      expect(s.months).toBe(1);
      expect(s.closedByPrepayment).toBe(true);
      expect(roundTo(s.totalInterest, 2)).toBe(1000);
      expect(roundTo(s.totalPrepaid, 2)).toBe(92115.12);
      expect(s.emiAfterFirstPrepayment).toBe(0);
      expectPrincipalConserved(r, s);
    }
    // Original interest = 12 × 8,884.88 − 1,00,000 ≈ 6,618.55; saved ≈ 6,618.55 − 1,000 = 5,618.55.
    expect(r.reduceTenure.interestSaved).toBeCloseTo(r.currentEmi * 12 - 100_000 - 1000, 4);
    expect(r.notes.some((n) => n.includes("closes"))).toBe(true);
  });

  it("prepayment fee reduces the net saving and can exceed it", () => {
    const withFee = calculateLoanPrepayment({ ...BASE, feePercent: 2 });
    expect(withFee.reduceTenure.feesPaid).toBeCloseTo(4_000, 8); // 2% of ₹2,00,000
    expect(withFee.reduceTenure.netSaving).toBeCloseTo(withFee.reduceTenure.interestSaved - 4_000, 6);
    expect(withFee.reduceTenure.netLoss).toBe(0);

    const zeroRate = calculateLoanPrepayment({ ...BASE, annualRate: 0, feePercent: 1 });
    expect(zeroRate.reduceTenure.interestSaved).toBe(0);
    expect(zeroRate.reduceTenure.netSaving).toBe(0);
    expect(zeroRate.reduceTenure.netLoss).toBeCloseTo(2_000, 8);
  });
});

describe("prepayment schedule rules", () => {
  it("yearly lump sums fall on each anniversary and save more than a one-time payment", () => {
    const once = calculateLoanPrepayment(BASE);
    const yearly = calculateLoanPrepayment({ ...BASE, frequency: "yearly" });
    expect(yearly.reduceTenure.lumpSumsApplied).toBeGreaterThan(1);
    expect(yearly.reduceTenure.totalPrepaid).toBeLessThanOrEqual(200_000 * yearly.reduceTenure.lumpSumsApplied + 1e-6);
    expect(yearly.reduceTenure.interestSaved).toBeGreaterThan(once.reduceTenure.interestSaved);
    // Figures quoted on the page: ₹2 lakh every year from month 1 closes the loan in 85 months.
    expect(yearly.reduceTenure.months).toBe(85);
    expect(roundTo(yearly.reduceTenure.interestSaved, 0)).toBe(1_361_725);
    expect(yearly.reduceEmi.finalEmi).toBeLessThan(yearly.reduceEmi.emiAfterFirstPrepayment);
    expectPrincipalConserved(yearly, yearly.reduceTenure);
    expectPrincipalConserved(yearly, yearly.reduceEmi);
  });

  it("yearly prepayments starting in month 7 hit months 7, 19 and 31", () => {
    const r = calculateLoanPrepayment({
      outstanding: 300_000,
      annualRate: 10,
      remainingYears: 3,
      prepaymentAmount: 1_000,
      frequency: "yearly",
      firstPrepaymentMonth: 7,
    });
    expect(r.reduceTenure.lumpSumsApplied).toBe(3);
    expect(r.reduceTenure.totalPrepaid).toBe(3_000);
  });

  it("a first prepayment month after the tenure is ignored with a note", () => {
    const r = calculateLoanPrepayment({ ...BASE, firstPrepaymentMonth: 181 });
    expect(r.hasPrepayment).toBe(false);
    expect(r.reduceTenure.interestSaved).toBe(0);
    expect(r.reduceTenure.months).toBe(180);
    expect(r.notes.some((n) => n.includes("after the loan ends"))).toBe(true);
  });

  it("extra monthly payments shorten the loan in both strategies and never change the EMI", () => {
    const r = calculateLoanPrepayment({ ...BASE, prepaymentAmount: 0, extraMonthly: 5_000 });
    expect(r.hasPrepayment).toBe(true);
    expect(r.reduceTenure.months).toBeLessThan(180);
    expect(r.reduceEmi.months).toBe(r.reduceTenure.months);
    expect(r.reduceEmi.finalEmi).toBe(r.currentEmi);
    expect(r.reduceEmi.interestSaved).toBeCloseTo(r.reduceTenure.interestSaved, 6);
    expectPrincipalConserved(r, r.reduceTenure);
  });

  it("decimal remaining tenure converts to whole months", () => {
    expect(calculateLoanPrepayment({ ...BASE, remainingYears: 13.4 }).remainingMonths).toBe(161);
  });

  it("no prepayment means no saving", () => {
    const r = calculateLoanPrepayment({ ...BASE, prepaymentAmount: 0 });
    expect(r.hasPrepayment).toBe(false);
    expect(r.reduceTenure.interestSaved).toBe(0);
    expect(r.reduceEmi.emiAfterFirstPrepayment).toBe(r.currentEmi);
  });
});

describe("invalid and extreme input", () => {
  it.each([
    { label: "zero outstanding", input: { ...BASE, outstanding: 0 } },
    { label: "negative outstanding", input: { ...BASE, outstanding: -5 } },
    { label: "NaN outstanding", input: { ...BASE, outstanding: Number.NaN } },
    { label: "zero tenure", input: { ...BASE, remainingYears: 0 } },
    { label: "Infinity tenure", input: { ...BASE, remainingYears: Number.POSITIVE_INFINITY } },
  ])("$label → invalid, zeroed result", ({ input }) => {
    const r = calculateLoanPrepayment(input);
    expect(r.isValid).toBe(false);
    expect(r.currentEmi).toBe(0);
    expect(r.hasPrepayment).toBe(false);
    expectFiniteNonNegative(allNumbers(r));
  });

  it("clamps huge values and keeps outputs finite", () => {
    const r = calculateLoanPrepayment({
      outstanding: 1e20,
      annualRate: 1e6,
      remainingYears: 1e6,
      prepaymentAmount: 1e20,
      frequency: "yearly",
      firstPrepaymentMonth: 1e9,
      extraMonthly: 1e20,
      feePercent: 1e9,
    });
    expect(r.outstanding).toBe(1e12);
    expect(r.annualRate).toBe(50);
    expect(r.remainingMonths).toBe(600);
    expect(r.feePercent).toBe(100);
    expectFiniteNonNegative(allNumbers(r));
  });

  it("garbage frequency falls back to one-time", () => {
    const r = calculateLoanPrepayment({ ...BASE, frequency: "weekly" as never });
    expect(r.frequency).toBe("once");
  });

  it("sweep: every numeric output is finite and non-negative", () => {
    const amounts = [0, 1, 50_000, 30_00_000, 1e12, -1, Number.NaN];
    const rates = [0, 0.01, 8.5, 50, -3, Number.NaN];
    const years = [0, 0.08, 1, 15, 50, Number.NaN];
    const months = [0, 1, 6, 600, 601, Number.NaN];
    for (const outstanding of amounts)
      for (const annualRate of rates)
        for (const remainingYears of years)
          for (const firstPrepaymentMonth of months)
            for (const frequency of ["once", "yearly"] as const) {
              const r = calculateLoanPrepayment({
                outstanding,
                annualRate,
                remainingYears,
                prepaymentAmount: 2_00_000,
                frequency,
                firstPrepaymentMonth,
                extraMonthly: 1_000,
                feePercent: 1,
              });
              expectFiniteNonNegative(allNumbers(r));
              if (r.isValid) {
                expect(r.reduceTenure.interestSaved).toBeGreaterThanOrEqual(r.reduceEmi.interestSaved - 1e-6);
                expect(r.reduceTenure.months).toBeLessThanOrEqual(r.remainingMonths);
                expect(r.reduceEmi.months).toBeLessThanOrEqual(r.remainingMonths);
              }
            }
  });
});

describe("comparePrepayWithInvesting", () => {
  it("values prepaying at the loan rate and investing at the expected return", () => {
    // ₹2,00,000 over 179 months. Prepay: 2,00,000 × (1 + 8.5/1200)^179 ≈ ₹7,07,519.
    // Invest at 10%: 2,00,000 × 1.10^(179/12) ≈ ₹8,28,840.
    const c = comparePrepayWithInvesting({ amount: 200_000, loanAnnualRate: 8.5, expectedAnnualReturn: 10, months: 179 });
    expect(c.prepayValue).toBeCloseTo(200_000 * (1 + 8.5 / 1200) ** 179, 4);
    expect(roundTo(c.prepayValue, 0)).toBe(707_519);
    expect(roundTo(c.investValueGross, 0)).toBe(828_840);
    expect(c.investValueAfterTax).toBe(c.investValueGross);
    expect(roundTo(c.investAhead, 0)).toBe(121_321);
    expect(c.prepayAhead).toBe(0);
    // Effective annual loan rate = (1 + 0.085/12)^12 − 1 = 8.839%; with no tax it is the break-even return.
    expect(roundTo(c.loanEffectiveAnnualRate, 3)).toBe(8.839);
    expect(c.breakEvenReturn).toBeCloseTo(c.loanEffectiveAnnualRate, 8);
  });

  it("tax on gains raises the break-even return", () => {
    const c = comparePrepayWithInvesting({
      amount: 200_000,
      loanAnnualRate: 8.5,
      expectedAnnualReturn: 10,
      months: 179,
      taxOnGainsPercent: 12.5,
    });
    // After tax: 2,00,000 + (8,28,840.34 − 2,00,000) × 0.875 = 7,50,235.30
    expect(roundTo(c.investValueAfterTax, 0)).toBe(750_235);
    expect(c.breakEvenReturn).toBeGreaterThan(c.loanEffectiveAnnualRate);
    const level = comparePrepayWithInvesting({
      amount: 200_000,
      loanAnnualRate: 8.5,
      expectedAnnualReturn: c.breakEvenReturn,
      months: 179,
      taxOnGainsPercent: 12.5,
    });
    expect(level.investValueAfterTax).toBeCloseTo(level.prepayValue, 4);
  });

  it("lower expected return favours prepaying", () => {
    const c = comparePrepayWithInvesting({ amount: 100_000, loanAnnualRate: 9, expectedAnnualReturn: 6, months: 120 });
    expect(c.prepayAhead).toBeGreaterThan(0);
    expect(c.investAhead).toBe(0);
  });

  it("invalid and extreme input stays finite", () => {
    for (const amount of [0, -1, Number.NaN, 1e20])
      for (const months of [0, -5, Number.NaN, 1e9])
        for (const rate of [0, 50, 1e9, Number.NaN]) {
          const c = comparePrepayWithInvesting({
            amount,
            loanAnnualRate: rate,
            expectedAnnualReturn: rate,
            months,
            taxOnGainsPercent: rate,
          });
          expectFiniteNonNegative([
            c.amount,
            c.months,
            c.loanEffectiveAnnualRate,
            c.prepayValue,
            c.investValueGross,
            c.investValueAfterTax,
            c.investAhead,
            c.prepayAhead,
            c.breakEvenReturn,
          ]);
        }
    expect(comparePrepayWithInvesting({ amount: 0, loanAnnualRate: 8, expectedAnnualReturn: 10, months: 12 }).isValid).toBe(false);
  });
});
