import { describe, expect, it } from "vitest";
import { calculateIncomeTax, calculateRebate, calculateSlabTax, calculateSurcharge, getRegimeRules } from "../incomeTax";
import { TAX_RULES } from "../taxRules";

function expectFiniteNonNegative(...values: number[]) {
  for (const v of values) {
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThanOrEqual(0);
  }
}

const tax = (taxableIncome: number, regime: "new" | "old") => calculateIncomeTax({ taxableIncome, regime });

describe("taxRules metadata", () => {
  it("states the tax year, verification date and source", () => {
    expect(TAX_RULES.taxYear).toBe("FY 2026-27 (AY 2027-28)");
    expect(TAX_RULES.lastVerified).toBe("2026-10-06");
    expect(TAX_RULES.source.url).toMatch(/^https:\/\/www\.incometax\.gov\.in\//);
  });
});

describe("new regime — slab tax", () => {
  it.each([
    // 4L × 0 = 0
    { income: 4_00_000, slab: 0 },
    // 4L × 5% = 20,000
    { income: 8_00_000, slab: 20_000 },
    // 20,000 + 4L × 10% = 60,000
    { income: 12_00_000, slab: 60_000 },
    // 60,000 + 4L × 15% = 1,20,000
    { income: 16_00_000, slab: 1_20_000 },
    // 1,20,000 + 4L × 20% = 2,00,000
    { income: 20_00_000, slab: 2_00_000 },
    // 2,00,000 + 4L × 25% = 3,00,000
    { income: 24_00_000, slab: 3_00_000 },
    // 3,00,000 + 6L × 30% = 4,80,000
    { income: 30_00_000, slab: 4_80_000 },
  ])("₹$income → slab tax ₹$slab", ({ income, slab }) => {
    expect(calculateSlabTax(income, getRegimeRules("new").slabs).tax).toBeCloseTo(slab, 6);
  });
});

describe("new regime — rebate and marginal relief", () => {
  it("₹12,00,000 is fully rebated (slab tax 60,000, rebate 60,000)", () => {
    const r = tax(12_00_000, "new");
    expect(r.slabTax).toBeCloseTo(60_000, 6);
    expect(r.rebate).toBeCloseTo(60_000, 6);
    expect(r.totalTax).toBe(0);
  });

  it("₹12,00,001: slab tax 60,000.15 but payable capped at ₹1 → total ₹1.04", () => {
    const r = tax(12_00_001, "new");
    expect(r.taxAfterRebate).toBeCloseTo(1, 6);
    expect(r.totalTax).toBeCloseTo(1.04, 6);
  });

  it("₹12,10,000: slab 61,500, capped at 10,000; + 4% cess 400 → ₹10,400", () => {
    const r = tax(12_10_000, "new");
    expect(r.slabTax).toBeCloseTo(61_500, 6);
    expect(r.taxAfterRebate).toBeCloseTo(10_000, 6);
    expect(r.totalTaxRounded).toBe(10_400);
  });

  it("₹12,50,000: slab 67,500, capped at 50,000; + cess 2,000 → ₹52,000", () => {
    expect(tax(12_50_000, "new").totalTaxRounded).toBe(52_000);
  });

  it("relief ends near ₹12,70,588 (60,000 + 0.15x = x → x ≈ 70,588)", () => {
    // ₹12,75,000: slab 60,000 + 75,000 × 15% = 71,250 < 75,000, no relief; × 1.04 = 74,100
    const r = tax(12_75_000, "new");
    expect(r.rebate).toBe(0);
    expect(r.totalTaxRounded).toBe(74_100);
    // ₹12,70,000: slab 70,500 > 70,000 → still relieved to 70,000
    expect(tax(12_70_000, "new").taxAfterRebate).toBeCloseTo(70_000, 6);
  });

  it("₹16,00,000 → 1,20,000 + 4,800 cess = ₹1,24,800; ₹24,00,000 → ₹3,12,000", () => {
    expect(tax(16_00_000, "new").totalTaxRounded).toBe(1_24_800);
    expect(tax(24_00_000, "new").totalTaxRounded).toBe(3_12_000);
  });
});

describe("old regime", () => {
  it.each([
    // 2.5L × 5% = 12,500
    { income: 5_00_000, slab: 12_500 },
    // 12,500 + 5L × 20% = 1,12,500
    { income: 10_00_000, slab: 1_12_500 },
    // 1,12,500 + 5L × 30% = 2,62,500
    { income: 15_00_000, slab: 2_62_500 },
  ])("₹$income → slab tax ₹$slab", ({ income, slab }) => {
    expect(calculateSlabTax(income, getRegimeRules("old").slabs).tax).toBeCloseTo(slab, 6);
  });

  it("₹5,00,000 is fully rebated; ₹5,00,010 gets no rebate and no marginal relief", () => {
    expect(tax(5_00_000, "old").totalTax).toBe(0);
    // 12,500 + 10 × 20% = 12,502; × 1.04 = 13,002.08
    const r = tax(5_00_010, "old");
    expect(r.rebate).toBe(0);
    expect(r.totalTax).toBeCloseTo(13_002.08, 6);
  });

  it("₹10,32,400 → 1,12,500 + 32,400 × 30% = 1,22,220; × 1.04 = 1,27,108.80", () => {
    expect(tax(10_32_400, "old").totalTax).toBeCloseTo(1_27_108.8, 6);
  });
});

describe("surcharge and marginal relief", () => {
  it("new regime ₹50,00,000: no surcharge (threshold is 'more than ₹50 lakh')", () => {
    // 3,00,000 + 26L × 30% = 10,80,000; × 1.04 = 11,23,200
    const r = tax(50_00_000, "new");
    expect(r.surcharge).toBe(0);
    expect(r.totalTaxRounded).toBe(11_23_200);
  });

  it("new regime ₹51,00,000: 10% surcharge limited by marginal relief", () => {
    // tax = 3,00,000 + 27L × 30% = 11,10,000; full surcharge 1,11,000 → 12,21,000
    // ceiling = 10,80,000 (tax at 50L) + 1,00,000 = 11,80,000 → surcharge 70,000, relief 41,000
    // cess = 4% × 11,80,000 = 47,200 → total 12,27,200
    const r = tax(51_00_000, "new");
    expect(r.surchargeRate).toBe(0.1);
    expect(r.surcharge).toBeCloseTo(70_000, 6);
    expect(r.surchargeRelief).toBeCloseTo(41_000, 6);
    expect(r.totalTaxRounded).toBe(12_27_200);
  });

  it("new regime ₹60,00,000: full 10% surcharge (no relief)", () => {
    // tax = 3,00,000 + 36L × 30% = 13,80,000; surcharge 1,38,000; ceiling 10,80,000 + 10L = 20,80,000
    const r = tax(60_00_000, "new");
    expect(r.surcharge).toBeCloseTo(1_38_000, 6);
    expect(r.surchargeRelief).toBe(0);
    // (13,80,000 + 1,38,000) × 1.04 = 15,78,720
    expect(r.totalTaxRounded).toBe(15_78_720);
  });

  it("new regime ₹1,01,00,000: 15% surcharge relieved against tax at ₹1 crore with 10%", () => {
    // tax(1Cr) = 3,00,000 + 76L × 30% = 25,80,000; × 1.10 = 28,38,000
    // tax(1.01Cr) = 26,10,000; × 1.15 = 30,01,500; ceiling 28,38,000 + 1,00,000 = 29,38,000
    const r = tax(1_01_00_000, "new");
    expect(r.taxAfterRebate + r.surcharge).toBeCloseTo(29_38_000, 6);
  });

  it("old regime ₹51,00,000: relieved to 13,12,500 + 1,00,000 = 14,12,500", () => {
    // tax(50L) = 12,500 + 1,00,000 + 40L × 30% (12,00,000) = 13,12,500
    // tax(51L) = 13,42,500; full surcharge 1,34,250 → 14,76,750; ceiling = 13,12,500 + 1,00,000 = 14,12,500
    const r = tax(51_00_000, "old");
    expect(r.taxAfterRebate).toBeCloseTo(13_42_500, 6);
    expect(r.taxAfterRebate + r.surcharge).toBeCloseTo(14_12_500, 6);
  });

  it("37% applies only in the old regime above ₹5 crore (new regime stays at 25%)", () => {
    // Old: tax(5Cr) = 1,12,500 + 4.9Cr × 30% = 1,48,12,500; × 1.25 = 1,85,15,625
    // tax(5.01Cr) = 1,48,42,500; × 1.37 = 2,03,34,225; ceiling 1,85,15,625 + 1,00,000 = 1,86,15,625
    const old = tax(5_01_00_000, "old");
    expect(old.surchargeRate).toBe(0.37);
    expect(old.taxAfterRebate + old.surcharge).toBeCloseTo(1_86_15_625, 4);
    // New: tax = 3,00,000 + 4.77Cr × 30% = 1,46,10,000; × 1.25 = 1,82,62,500 (no relief at this level)
    const nw = tax(5_01_00_000, "new");
    expect(nw.surchargeRate).toBe(0.25);
    expect(nw.taxAfterRebate + nw.surcharge).toBeCloseTo(1_82_62_500, 4);
  });

  it("surcharge is 0 below the first threshold", () => {
    expect(calculateSurcharge(40_00_000, 9_00_000, getRegimeRules("old")).surcharge).toBe(0);
  });
});

describe("invalid and extreme inputs", () => {
  it.each([0, -1, -5_00_000, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "taxable income %s → zero tax, not valid",
    (income) => {
      for (const regime of ["new", "old"] as const) {
        const r = tax(income, regime);
        expect(r.totalTax).toBe(0);
        expect(r.isValid).toBe(false);
        expectFiniteNonNegative(r.slabTax, r.rebate, r.surcharge, r.cess, r.effectiveRatePercent);
      }
    },
  );

  it("huge income is clamped and stays finite", () => {
    const r = tax(1e20, "old");
    expectFiniteNonNegative(r.totalTax, r.surcharge, r.cess);
    expect(r.taxableIncome).toBe(1e12);
  });

  it("unknown regime falls back to the new regime", () => {
    expect(calculateIncomeTax({ taxableIncome: 16_00_000, regime: "x" as "new" }).regime).toBe("new");
  });

  it("rebate never exceeds the tax or turns negative", () => {
    expect(calculateRebate(3_00_000, 0, getRegimeRules("new"))).toBe(0);
    expect(calculateRebate(Number.NaN, Number.NaN, getRegimeRules("new"))).toBe(0);
  });

  it("sweep: all outputs finite, non-negative, and tax never exceeds income", () => {
    for (const regime of ["new", "old"] as const) {
      let previous = 0;
      for (let income = 0; income <= 6_00_00_000; income += 37_123) {
        const r = tax(income, regime);
        expectFiniteNonNegative(r.slabTax, r.rebate, r.taxAfterRebate, r.surcharge, r.surchargeRelief, r.cess, r.totalTax);
        expect(r.totalTax).toBeLessThan(income + 1);
        // Marginal relief guarantees tax never falls as income rises.
        expect(r.totalTax).toBeGreaterThanOrEqual(previous - 1e-6);
        previous = r.totalTax;
      }
    }
  });
});
