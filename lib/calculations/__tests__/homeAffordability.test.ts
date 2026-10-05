import { describe, expect, it } from "vitest";
import { calculateEmiAmount } from "../emi";
import {
  calculateHomeAffordability,
  checkPropertyAffordability,
  loanFromEmi,
  maxPermittedLoan,
  solveMaxPrice,
  type HomeAffordabilityInput,
} from "../homeAffordability";

/** The calculator's defaults: ₹1 lakh take-home. */
const BASE: HomeAffordabilityInput = {
  monthlyIncome: 1_00_000,
  existingEmis: 0,
  monthlyExpenses: 35_000,
  monthlyInvestments: 15_000,
  currentSavings: 20_00_000,
  emergencyFund: 3_00_000,
  annualRate: 8.5,
  tenureYears: 20,
  purchaseCostPercent: 7,
  monthlyOwnershipCosts: 3_000,
};

function allNumbers(obj: unknown, out: number[] = []): number[] {
  if (typeof obj === "number") out.push(obj);
  else if (obj && typeof obj === "object") for (const v of Object.values(obj)) allNumbers(v, out);
  return out;
}

describe("loanFromEmi (present value of the EMI annuity)", () => {
  it("inverts the EMI formula", () => {
    // EMI on ₹50 lakh at 8.5% for 240 months is ₹43,391.16, so ₹43,391.16 services ₹50 lakh.
    const emi = calculateEmiAmount(50_00_000, 8.5, 240);
    expect(emi).toBeCloseTo(43_391.16, 1);
    expect(loanFromEmi(emi, 8.5, 240)).toBeCloseTo(50_00_000, 4);
  });

  it("₹40,000 at 8.5% for 20 years supports about ₹46.09 lakh", () => {
    // 40,000 ÷ (43,391.16 / 50,00,000) = 40,000 ÷ 0.0086782 ≈ 46,09,234
    const loan = loanFromEmi(40_000, 8.5, 240);
    expect(loan).toBeCloseTo(46_09_233.59, 0);
    expect(calculateEmiAmount(loan, 8.5, 240)).toBeCloseTo(40_000, 6);
  });

  it("0% interest is EMI × n", () => {
    expect(loanFromEmi(10_000, 0, 120)).toBe(12_00_000);
  });

  it("returns 0 for invalid inputs and stays finite for extreme ones", () => {
    expect(loanFromEmi(Number.NaN, 8.5, 240)).toBe(0);
    expect(loanFromEmi(-5_000, 8.5, 240)).toBe(0);
    expect(loanFromEmi(10_000, 8.5, 0)).toBe(0);
    expect(Number.isFinite(loanFromEmi(1e15, 50, 600))).toBe(true);
    expect(loanFromEmi(1e15, 0, 600)).toBeLessThanOrEqual(1e12);
    // Tiny rates stay close to the 0% answer instead of losing precision.
    expect(loanFromEmi(10_000, 1e-9, 120)).toBeCloseTo(12_00_000, 0);
  });
});

describe("maxPermittedLoan (RBI slabs × user max LTV)", () => {
  it("applies 90% / 80% / 75% slabs when the user allows 90%", () => {
    expect(maxPermittedLoan(30_00_000, 90)).toBe(27_00_000); // 90% of ₹30 lakh
    // ₹34 lakh: 90% would be ₹30.6 lakh (above the ₹30 lakh slab), so the loan is held at ₹30 lakh,
    // which beats 80% × ₹34 lakh = ₹27.2 lakh.
    expect(maxPermittedLoan(34_00_000, 90)).toBe(30_00_000);
    expect(maxPermittedLoan(50_00_000, 90)).toBe(40_00_000); // 80%
    // ₹1 crore: 80% = ₹80 lakh is above ₹75 lakh, 75% = ₹75 lakh; both give ₹75 lakh.
    expect(maxPermittedLoan(1_00_00_000, 90)).toBe(75_00_000);
    expect(maxPermittedLoan(2_00_00_000, 90)).toBe(1_50_00_000); // 75%
  });

  it("the user's lower LTV wins", () => {
    expect(maxPermittedLoan(20_00_000, 80)).toBe(16_00_000);
    expect(maxPermittedLoan(20_00_000, 0)).toBe(0);
  });

  it("handles junk", () => {
    expect(maxPermittedLoan(Number.NaN)).toBe(0);
    expect(maxPermittedLoan(-1)).toBe(0);
  });
});

describe("solveMaxPrice", () => {
  it("EMI-limited: P = (cash + maxLoan) / (1 + c)", () => {
    // (17,00,000 + 46,09,233.59) / 1.07 = 58,96,480.0; cash-limited bound 17L / 0.27 = 62.96L is looser.
    const s = solveMaxPrice(46_09_233.59, 17_00_000, 0.07, 80);
    expect(s.price).toBeCloseTo(58_96_479.99, 1);
    expect(s.loan).toBeCloseTo(46_09_233.59, 2);
    expect(s.limitedBy).toBe("emi");
  });

  it("savings-limited: P = cash / (1 + c − L)", () => {
    // 17,00,000 / (1 + 0.07 − 0.80) = 62,96,296.30; loan = 80% = 50,37,037.04
    const s = solveMaxPrice(54_15_849.47, 17_00_000, 0.07, 80);
    expect(s.price).toBeCloseTo(62_96_296.3, 1);
    expect(s.loan).toBeCloseTo(50_37_037.04, 1);
    expect(s.limitedBy).toBe("savings");
  });

  it("uses the 90% slab for small loans when allowed", () => {
    // Cash ₹3 lakh, c = 0, L = 90%: P = 3L / 0.1 = ₹30 lakh, loan ₹27 lakh (≤ ₹30 lakh slab).
    const s = solveMaxPrice(1e9, 3_00_000, 0, 90);
    expect(s.price).toBeCloseTo(30_00_000, 4);
    expect(s.loan).toBeCloseTo(27_00_000, 4);
    expect(s.ltvCap).toBeCloseTo(0.9, 10);
  });

  it("holds the loan at the ₹30 lakh slab boundary when that is optimal", () => {
    // Cash ₹4 lakh, c = 0, user 90%.
    // Slab 1 (≤ 30L, 90%): min((4 + 30)/1, 4/0.1 = 40) = ₹34 lakh, loan ₹30 lakh (boundary).
    // Slab 2 (≤ 75L, 80%): min(huge, 4/0.2) = ₹20 lakh. Slab 3: 4/0.25 = ₹16 lakh. Best = ₹34 lakh.
    const s = solveMaxPrice(1e9, 4_00_000, 0, 90);
    expect(s.price).toBeCloseTo(34_00_000, 4);
    expect(s.loan).toBeCloseTo(30_00_000, 4);
    expect(s.limitedBy).toBe("slab-ceiling");
  });

  it("holds the loan at the ₹75 lakh boundary rather than dropping to 75% LTV", () => {
    // Cash ₹30 lakh, c = 7%, user 80%, unlimited EMI.
    // Slab 2: min((30 + 75)/1.07 = 98.13L, 30/0.27 = 111.1L) = ₹98.13 lakh, loan ₹75 lakh.
    // Slab 3 (75%): 30/0.32 = ₹93.75 lakh. Best = ₹98.13 lakh.
    const s = solveMaxPrice(1e9, 30_00_000, 0.07, 80);
    expect(s.price).toBeCloseTo(1_05_00_000 / 1.07, 2);
    expect(s.loan).toBeCloseTo(75_00_000, 4);
    expect(s.limitedBy).toBe("slab-ceiling");
  });

  it("moves to the 75% slab when savings are large enough", () => {
    // Cash ₹60 lakh, c = 7%: slab 2 gives (60 + 75)/1.07 = ₹1.2617 crore; slab 3 gives 60/0.32 = ₹1.875 crore.
    const s = solveMaxPrice(1e9, 60_00_000, 0.07, 80);
    expect(s.price).toBeCloseTo(60_00_000 / 0.32, 2);
    expect(s.loan / s.price).toBeCloseTo(0.75, 10);
  });

  it("every solution is feasible: loan within LTV limits and cash covers the upfront amount", () => {
    for (const cash of [0, 1e5, 3e5, 4e5, 17e5, 30e5, 60e5, 2e7]) {
      for (const m of [0, 5e5, 25e5, 46e5, 8e6, 1e9]) {
        for (const ltv of [0, 75, 80, 90, 100]) {
          const s = solveMaxPrice(m, cash, 0.07, ltv);
          expect(s.loan).toBeLessThanOrEqual(m + 1e-6);
          expect(s.loan).toBeLessThanOrEqual(maxPermittedLoan(s.price, ltv) + 1e-4);
          expect(s.price * 1.07 - s.loan).toBeLessThanOrEqual(cash + 1e-4);
        }
      }
    }
  });
});

describe("calculateHomeAffordability — worked example (defaults)", () => {
  const r = calculateHomeAffordability(BASE);

  it("derives cash available and monthly room", () => {
    // Cash = 20,00,000 − 3,00,000 = 17,00,000. Room = 1,00,000 − 35,000 − 15,000 − 0 − 3,000 = 47,000.
    expect(r.cashAvailable).toBe(17_00_000);
    expect(r.emergencyFundKept).toBe(3_00_000);
    expect(r.monthlyRoomBeforeEmi).toBe(47_000);
    expect(r.isValid).toBe(true);
    expect(r.notes).toEqual([]);
  });

  it("Balanced (40%): EMI ₹40,000 limited by the ratio, price ≈ ₹58.96 lakh", () => {
    const b = r.scenarios.balanced;
    expect(b.emiCapacity).toBe(40_000); // min(40,000, 47,000)
    expect(b.maxLoanFromEmi).toBeCloseTo(46_09_233.59, 1);
    expect(b.propertyPrice).toBeCloseTo(58_96_479.99, 1);
    expect(b.loanAmount).toBeCloseTo(46_09_233.59, 1);
    expect(b.emi).toBeCloseTo(40_000, 4);
    expect(b.downPayment).toBeCloseTo(12_87_246.4, 1);
    expect(b.purchaseCosts).toBeCloseTo(4_12_753.6, 1); // 7% of price
    expect(b.upfrontCash).toBeCloseTo(17_00_000, 2);
    expect(b.remainingSavings).toBeCloseTo(0, 2);
    expect(b.monthlyHousingCost).toBeCloseTo(43_000, 4);
    expect(b.totalEmiToIncomePercent).toBeCloseTo(40, 6);
    expect(b.housingCostToIncomePercent).toBeCloseTo(43, 6);
    expect(b.monthlySurplus).toBeCloseTo(7_000, 4); // 47,000 + 3,000 − 43,000
    expect(b.binding).toBe("emi-ratio");
  });

  it("Conservative (30%): price ≈ ₹48.20 lakh", () => {
    const c = r.scenarios.conservative;
    // Loan = 30,000 / 0.0086782 ≈ 34,56,925; price = (17L + 34,56,925) / 1.07 ≈ 48,19,556
    expect(c.emiCapacity).toBe(30_000);
    expect(c.propertyPrice).toBeCloseTo(48_19_556.26, 1);
    expect(c.monthlySurplus).toBeCloseTo(17_000, 4);
    expect(c.binding).toBe("emi-ratio");
  });

  it("Aggressive (50%): cash flow caps EMI at ₹47,000, then savings limit the price to ₹62.96 lakh", () => {
    const a = r.scenarios.aggressive;
    expect(a.ratioCapEmi).toBe(50_000);
    expect(a.cashFlowCapEmi).toBe(47_000);
    expect(a.emiCapacity).toBe(47_000);
    expect(a.propertyPrice).toBeCloseTo(62_96_296.3, 1);
    expect(a.loanAmount).toBeCloseTo(50_37_037.04, 1);
    expect(a.emi).toBeCloseTo(43_712.58, 1);
    expect(a.loanToValuePercent).toBeCloseTo(80, 8);
    expect(a.binding).toBe("savings");
  });

  it("scenarios are ordered by price", () => {
    const { conservative: c, balanced: b, aggressive: a } = r.scenarios;
    expect(c.propertyPrice).toBeLessThan(b.propertyPrice);
    expect(b.propertyPrice).toBeLessThan(a.propertyPrice);
  });
});

describe("calculateHomeAffordability — constraints and edge cases", () => {
  it("existing EMIs reduce the ratio cap", () => {
    // 40% of 1,00,000 − 15,000 = 25,000; cash flow 47,000 − 15,000 = 32,000.
    const b = calculateHomeAffordability({ ...BASE, existingEmis: 15_000 }).scenarios.balanced;
    expect(b.emiCapacity).toBe(25_000);
    expect(b.totalEmiToIncomePercent).toBeCloseTo(40, 6);
  });

  it("cash flow binds when expenses are high", () => {
    // Room = 1,00,000 − 60,000 − 15,000 − 3,000 = 22,000 < 40,000.
    const b = calculateHomeAffordability({ ...BASE, monthlyExpenses: 60_000 }).scenarios.balanced;
    expect(b.emiCapacity).toBe(22_000);
    expect(b.binding).toBe("cash-flow");
  });

  it("no EMI room: price is what savings buy outright", () => {
    const r = calculateHomeAffordability({ ...BASE, monthlyExpenses: 90_000 });
    const b = r.scenarios.balanced;
    expect(b.emiCapacity).toBe(0);
    expect(b.loanAmount).toBe(0);
    expect(b.propertyPrice).toBeCloseTo(17_00_000 / 1.07, 4);
    expect(b.binding).toBe("cash-flow");
    expect(b.monthlyShortfall).toBeCloseTo(8_000, 6); // 1L − 90k − 15k − 3k
    expect(b.monthlySurplus).toBe(0);
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it("existing EMIs above the ratio give zero new EMI", () => {
    const r = calculateHomeAffordability({ ...BASE, existingEmis: 55_000, monthlyExpenses: 10_000, monthlyInvestments: 0 });
    expect(r.scenarios.aggressive.emiCapacity).toBe(0);
    expect(r.scenarios.aggressive.binding).toBe("emi-ratio");
  });

  it("savings below the emergency fund: no cash, price 0, savings bind", () => {
    const r = calculateHomeAffordability({ ...BASE, currentSavings: 2_00_000 });
    expect(r.cashAvailable).toBe(0);
    expect(r.emergencyFundKept).toBe(2_00_000);
    expect(r.scenarios.balanced.propertyPrice).toBe(0);
    expect(r.scenarios.balanced.binding).toBe("savings");
    expect(r.scenarios.balanced.monthlyHousingCost).toBe(0);
  });

  it("0% interest: loan = EMI × n", () => {
    const b = calculateHomeAffordability({ ...BASE, annualRate: 0, currentSavings: 1e9 }).scenarios.balanced;
    // Loan = 40,000 × 240 = ₹96 lakh — above ₹75 lakh, so savings are plentiful and the EMI binds.
    expect(b.maxLoanFromEmi).toBe(96_00_000);
    expect(b.loanAmount).toBeCloseTo(96_00_000, 4);
    expect(b.emi).toBeCloseTo(40_000, 6);
  });

  it("zero purchase costs and 100% user LTV are still capped by RBI slabs", () => {
    const b = calculateHomeAffordability({ ...BASE, purchaseCostPercent: 0, maxLtvPercent: 100 }).scenarios.aggressive;
    expect(b.loanToValuePercent).toBeLessThanOrEqual(90 + 1e-9);
  });

  it("invalid when income or tenure is zero", () => {
    const a = calculateHomeAffordability({ ...BASE, monthlyIncome: 0 });
    expect(a.isValid).toBe(false);
    expect(a.scenarios.balanced.propertyPrice).toBe(0);
    expect(a.scenarios.balanced.binding).toBe("none");
    expect(calculateHomeAffordability({ ...BASE, tenureYears: 0 }).isValid).toBe(false);
  });

  it("flags unordered ratios", () => {
    const r = calculateHomeAffordability({ ...BASE, ratios: { conservative: 45, balanced: 40, aggressive: 50 } });
    expect(r.notes.some((n) => n.includes("ascending"))).toBe(true);
  });

  it("sanitises NaN, negative, Infinity and huge inputs", () => {
    const junk = [Number.NaN, -1, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1e20, 0];
    for (const v of junk) {
      const r = calculateHomeAffordability({
        monthlyIncome: v,
        existingEmis: v,
        monthlyExpenses: v,
        monthlyInvestments: v,
        currentSavings: v,
        emergencyFund: v,
        annualRate: v,
        tenureYears: v,
        purchaseCostPercent: v,
        monthlyOwnershipCosts: v,
        ratios: { conservative: v, balanced: v, aggressive: v },
        maxLtvPercent: v,
      });
      for (const n of allNumbers(r)) {
        expect(Number.isFinite(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("checkPropertyAffordability", () => {
  it("₹80 lakh with defaults: above Aggressive and short of cash", () => {
    const c = checkPropertyAffordability(BASE, 80_00_000);
    // Loan ≤ ₹75 lakh slab at 80%: ₹64 lakh. Down ₹16 lakh + costs 7% ₹5.6 lakh = ₹21.6 lakh vs ₹17 lakh available.
    expect(c.loanAmount).toBe(64_00_000);
    expect(c.downPayment).toBe(16_00_000);
    expect(c.purchaseCosts).toBeCloseTo(5_60_000, 6);
    expect(c.upfrontCash).toBeCloseTo(21_60_000, 6);
    expect(c.cashShortfall).toBeCloseTo(4_60_000, 6);
    expect(c.cashSurplus).toBe(0);
    // EMI = 64L × 0.0086782 ≈ 55,540.69
    expect(c.emi).toBeCloseTo(55_540.69, 1);
    expect(c.monthlyHousingCost).toBeCloseTo(58_540.69, 1);
    expect(c.monthlyShortfall).toBeCloseTo(8_540.69, 1); // 50,000 − 58,540.69
    expect(c.band).toBe("above");
  });

  it("₹50 lakh: within Balanced with a cash surplus", () => {
    const c = checkPropertyAffordability(BASE, 50_00_000);
    // Loan 40L → EMI 34,712.93 = 34.7% of income (between 30% and 40%).
    expect(c.emi).toBeCloseTo(34_712.93, 1);
    expect(c.band).toBe("balanced");
    expect(c.cashSurplus).toBeCloseTo(3_50_000, 6); // 17L − (10L + 3.5L)
    expect(c.emiUsingSurplus).toBeCloseTo(calculateEmiAmount(36_50_000, 8.5, 240), 6);
    expect(c.monthlySurplus).toBeCloseTo(12_287.07, 1);
  });

  it("bands follow the ratio thresholds", () => {
    expect(checkPropertyAffordability(BASE, 40_00_000).band).toBe("conservative"); // EMI 27,770 = 27.8%
    expect(checkPropertyAffordability(BASE, 60_00_000).band).toBe("aggressive"); // EMI 41,656 = 41.7%
  });

  it("uses the 90% slab only when the user allows it", () => {
    expect(checkPropertyAffordability({ ...BASE, maxLtvPercent: 90 }, 25_00_000).loanAmount).toBe(22_50_000);
    expect(checkPropertyAffordability(BASE, 25_00_000).loanAmount).toBe(20_00_000);
  });

  it("is invalid for zero price and returns finite non-negative numbers for junk", () => {
    expect(checkPropertyAffordability(BASE, 0).isValid).toBe(false);
    for (const v of [Number.NaN, -5, Number.POSITIVE_INFINITY, 1e20]) {
      const c = checkPropertyAffordability({ ...BASE, monthlyIncome: v }, v);
      for (const n of allNumbers(c)) {
        expect(Number.isFinite(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("sweep: every output finite and non-negative", () => {
  it("across a grid of realistic and extreme inputs", () => {
    for (const income of [0, 25_000, 1_00_000, 5_00_000, 1e12]) {
      for (const existing of [0, 20_000, 2_00_000]) {
        for (const savings of [0, 5_00_000, 50_00_000]) {
          for (const rate of [0, 8.5, 50]) {
            for (const years of [0, 1, 30, 50]) {
              const input = {
                ...BASE,
                monthlyIncome: income,
                existingEmis: existing,
                currentSavings: savings,
                annualRate: rate,
                tenureYears: years,
              };
              const r = calculateHomeAffordability(input);
              const c = checkPropertyAffordability(input, 80_00_000);
              for (const n of [...allNumbers(r), ...allNumbers(c)]) {
                expect(Number.isFinite(n)).toBe(true);
                expect(n).toBeGreaterThanOrEqual(0);
              }
              for (const s of r.scenarioList) {
                expect(s.emi).toBeLessThanOrEqual(s.emiCapacity + 1e-6);
                expect(s.loanAmount).toBeLessThanOrEqual(s.propertyPrice + 1e-6);
                expect(s.upfrontCash).toBeLessThanOrEqual(r.cashAvailable + 1e-3);
              }
            }
          }
        }
      }
    }
  });
});

describe("figures quoted on the page", () => {
  it("₹10,000 of EMI supports about ₹11.52 lakh at 8.5% for 20 years", () => {
    expect(loanFromEmi(10_000, 8.5, 240)).toBeCloseTo(11_52_308, -1);
    expect(loanFromEmi(40_000, 8.5, 300)).toBeCloseTo(49_67_543, -1);
    expect(loanFromEmi(40_000, 8.5, 360)).toBeCloseTo(52_02_146, -1);
    expect(loanFromEmi(40_000, 9.5, 240)).toBeCloseTo(42_91_241, -1);
  });

  it("longer tenure helps only until savings bind", () => {
    const t25 = calculateHomeAffordability({ ...BASE, tenureYears: 25 }).scenarios.balanced;
    expect(t25.propertyPrice).toBeCloseTo(62_31_348, -1);
    expect(t25.binding).toBe("emi-ratio");
    const t30 = calculateHomeAffordability({ ...BASE, tenureYears: 30 }).scenarios.balanced;
    expect(t30.propertyPrice).toBeCloseTo(62_96_296, -1);
    expect(t30.binding).toBe("savings");
    expect(t30.emi).toBeCloseTo(38_730, -1);
  });

  it("a ₹10,000 existing EMI cuts the Balanced budget to ₹48.20 lakh", () => {
    const b = calculateHomeAffordability({ ...BASE, existingEmis: 10_000 }).scenarios.balanced;
    expect(b.emi).toBeCloseTo(30_000, 4);
    expect(b.propertyPrice).toBeCloseTo(48_19_556, -1);
  });

  it("9.5% interest lowers the Balanced budget to about ₹55.99 lakh", () => {
    expect(calculateHomeAffordability({ ...BASE, annualRate: 9.5 }).scenarios.balanced.propertyPrice).toBeCloseTo(55_99_291, -1);
  });
});
