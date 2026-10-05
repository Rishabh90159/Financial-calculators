import { describe, expect, it } from "vitest";
import {
  calculatePropertyPurchaseCost,
  calculatePurchaseCostScenarios,
  SCENARIO_PRICES,
  type PropertyPurchaseCostInput,
  type PropertyPurchaseCostResult,
} from "../propertyPurchaseCost";

/** The calculator's default (illustrative) inputs. */
const DEFAULTS: PropertyPurchaseCostInput = {
  propertyPrice: 1_00_00_000,
  propertyType: "ready",
  gstRatePercent: 5,
  stampDuty: { mode: "percent", value: 6 },
  registration: { mode: "percent", value: 1 },
  registrationCap: 0,
  brokeragePercent: 1,
  legalFees: 25_000,
  societyCharges: 1_00_000,
  otherCharges: 0,
  loanAmount: 75_00_000,
  processingFee: { mode: "percent", value: 0.5 },
  otherLoanCharges: 0,
};

function numericValues(r: PropertyPurchaseCostResult): number[] {
  return Object.values(r).filter((v): v is number => typeof v === "number");
}

describe("calculatePropertyPurchaseCost — reference values", () => {
  it("₹1 crore ready-to-move defaults (worked example on the page)", () => {
    const r = calculatePropertyPurchaseCost(DEFAULTS);
    // Stamp duty 6% × 1,00,00,000 = 6,00,000
    expect(r.stampDuty).toBe(6_00_000);
    // Registration 1% × 1,00,00,000 = 1,00,000
    expect(r.registration).toBe(1_00_000);
    // Ready to move: no GST
    expect(r.gst).toBe(0);
    // Brokerage 1% × 1,00,00,000 = 1,00,000
    expect(r.brokerage).toBe(1_00_000);
    // Processing 0.5% × 75,00,000 = 37,500
    expect(r.processingFee).toBe(37_500);
    // Purchase costs = 6,00,000 + 1,00,000 + 0 + 1,00,000 + 25,000 + 1,00,000 + 0 = 9,25,000
    expect(r.purchaseCosts).toBe(9_25_000);
    expect(r.loanCosts).toBe(37_500);
    // Extra = 9,25,000 + 37,500 = 9,62,500
    expect(r.totalExtraCosts).toBe(9_62_500);
    // Down payment = 1,00,00,000 − 75,00,000 = 25,00,000
    expect(r.downPayment).toBe(25_00_000);
    // Upfront = 25,00,000 + 9,62,500 = 34,62,500
    expect(r.totalUpfrontCash).toBe(34_62_500);
    // Total purchase cost = 1,00,00,000 + 9,62,500 = 1,09,62,500
    expect(r.totalPurchaseCost).toBe(1_09_62_500);
    // 9,62,500 / 1,00,00,000 = 9.625%
    expect(r.extraCostsPercentOfPrice).toBeCloseTo(9.625, 10);
    expect(r.ltvPercent).toBe(75);
    expect(r.notes).toEqual([]);
    expect(r.isValid).toBe(true);
  });

  it("under construction adds GST at 5% or 1% of the price", () => {
    const five = calculatePropertyPurchaseCost({ ...DEFAULTS, propertyType: "under-construction", gstRatePercent: 5 });
    // 5% × 1,00,00,000 = 5,00,000 → upfront 34,62,500 + 5,00,000 = 39,62,500
    expect(five.gst).toBe(5_00_000);
    expect(five.gstRatePercent).toBe(5);
    expect(five.totalUpfrontCash).toBe(39_62_500);
    expect(five.totalPurchaseCost).toBe(1_14_62_500);

    const one = calculatePropertyPurchaseCost({ ...DEFAULTS, propertyPrice: 40_00_000, loanAmount: 30_00_000, propertyType: "under-construction", gstRatePercent: 1 });
    // 1% × 40,00,000 = 40,000
    expect(one.gst).toBe(40_000);
  });

  it("ignores the GST rate for ready-to-move homes", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, propertyType: "ready", gstRatePercent: 5 });
    expect(r.gst).toBe(0);
    expect(r.gstRatePercent).toBe(0);
  });
});

describe("percentage vs fixed-amount modes", () => {
  it("fixed amounts are used as entered", () => {
    const r = calculatePropertyPurchaseCost({
      ...DEFAULTS,
      stampDuty: { mode: "amount", value: 5_50_000 },
      registration: { mode: "amount", value: 30_000 },
      processingFee: { mode: "amount", value: 10_000 },
    });
    expect(r.stampDuty).toBe(5_50_000);
    expect(r.registration).toBe(30_000);
    expect(r.processingFee).toBe(10_000);
    // 5,50,000 + 30,000 + 1,00,000 + 25,000 + 1,00,000 + 10,000 = 8,15,000
    expect(r.totalExtraCosts).toBe(8_15_000);
  });

  it("percentage stamp duty and registration use the stamp-duty value when higher than the price", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, stampDutyValue: 1_20_00_000 });
    // 6% × 1,20,00,000 = 7,20,000; 1% × 1,20,00,000 = 1,20,000
    expect(r.stampDutyBase).toBe(1_20_00_000);
    expect(r.stampDuty).toBe(7_20_000);
    expect(r.registration).toBe(1_20_000);
    // Brokerage and GST still use the price
    expect(r.brokerage).toBe(1_00_000);
    expect(r.notes).toEqual([]);
  });

  it("falls back to the price when the stamp-duty value is 0 and notes a lower value", () => {
    expect(calculatePropertyPurchaseCost({ ...DEFAULTS, stampDutyValue: 0 }).stampDutyBase).toBe(1_00_00_000);
    const low = calculatePropertyPurchaseCost({ ...DEFAULTS, stampDutyValue: 80_00_000 });
    expect(low.stampDuty).toBe(4_80_000);
    expect(low.notes).toHaveLength(1);
  });
});

describe("registration cap", () => {
  it("caps registration when the computed fee exceeds the cap", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, registrationCap: 30_000 });
    // 1% × 1 crore = 1,00,000 > 30,000 → 30,000
    expect(r.registration).toBe(30_000);
    expect(r.registrationCapApplied).toBe(true);
    expect(r.totalUpfrontCash).toBe(34_62_500 - 70_000);
  });

  it("does nothing when the fee is under the cap or the cap is 0", () => {
    const under = calculatePropertyPurchaseCost({ ...DEFAULTS, registrationCap: 2_00_000 });
    expect(under.registration).toBe(1_00_000);
    expect(under.registrationCapApplied).toBe(false);
    expect(calculatePropertyPurchaseCost({ ...DEFAULTS, registrationCap: 0 }).registration).toBe(1_00_000);
  });

  it("also caps a fixed registration amount", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, registration: { mode: "amount", value: 50_000 }, registrationCap: 30_000 });
    expect(r.registration).toBe(30_000);
  });
});

describe("loan handling", () => {
  it("clamps a loan larger than the price and adds a note", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, loanAmount: 1_50_00_000 });
    expect(r.requestedLoanAmount).toBe(1_50_00_000);
    expect(r.loanAmount).toBe(1_00_00_000);
    expect(r.loanClamped).toBe(true);
    expect(r.downPayment).toBe(0);
    // Processing fee on the clamped loan: 0.5% × 1 crore = 50,000
    expect(r.processingFee).toBe(50_000);
    expect(r.ltvPercent).toBe(100);
    expect(r.notes.some((n) => n.includes("limited to the price"))).toBe(true);
    // Upfront cash = only the extra costs
    expect(r.totalUpfrontCash).toBe(r.totalExtraCosts);
  });

  it("no loan: upfront cash equals the total purchase cost", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, loanAmount: 0 });
    expect(r.processingFee).toBe(0);
    expect(r.downPayment).toBe(1_00_00_000);
    expect(r.totalUpfrontCash).toBe(r.totalPurchaseCost);
  });
});

describe("invalid and extreme inputs", () => {
  it("zero price is invalid but finite", () => {
    const r = calculatePropertyPurchaseCost({ ...DEFAULTS, propertyPrice: 0 });
    expect(r.isValid).toBe(false);
    expect(r.ltvPercent).toBe(0);
    expect(r.extraCostsPercentOfPrice).toBe(0);
    // Loan clamps to 0; fixed costs still count
    expect(r.loanAmount).toBe(0);
    expect(r.totalUpfrontCash).toBe(1_25_000);
  });

  it("negative, NaN and Infinity inputs become 0", () => {
    const r = calculatePropertyPurchaseCost({
      propertyPrice: Number.NaN,
      stampDutyValue: -5,
      propertyType: "under-construction",
      gstRatePercent: Number.POSITIVE_INFINITY,
      stampDuty: { mode: "percent", value: -6 },
      registration: { mode: "amount", value: Number.NaN },
      registrationCap: Number.NEGATIVE_INFINITY,
      brokeragePercent: Number.NaN,
      legalFees: -25_000,
      societyCharges: Number.POSITIVE_INFINITY,
      otherCharges: Number.NaN,
      loanAmount: -1,
      processingFee: { mode: "amount", value: -100 },
      otherLoanCharges: Number.NaN,
    });
    for (const v of numericValues(r)) expect(v).toBe(0);
    expect(r.isValid).toBe(false);
  });

  it("clamps percentages to 100% and amounts to the global limit", () => {
    const r = calculatePropertyPurchaseCost({
      ...DEFAULTS,
      propertyPrice: 1e20,
      stampDuty: { mode: "percent", value: 500 },
      loanAmount: 1e20,
      legalFees: 1e30,
    });
    expect(r.propertyPrice).toBe(1e12);
    expect(r.stampDuty).toBe(1e12);
    expect(r.legalFees).toBe(1e12);
    expect(Number.isFinite(r.totalPurchaseCost)).toBe(true);
  });

  it("tolerates a missing optional cap and stamp-duty value", () => {
    const { registrationCap: _cap, stampDutyValue: _v, ...rest } = DEFAULTS;
    void _cap;
    void _v;
    expect(calculatePropertyPurchaseCost(rest).totalUpfrontCash).toBe(34_62_500);
  });

  it("sweep: every numeric output is finite and non-negative", () => {
    const values = [Number.NaN, -1, 0, 1, 0.5, 6, 100, 150, 1e5, 1e7, 1e13, Number.POSITIVE_INFINITY];
    const modes = ["percent", "amount"] as const;
    const types = ["ready", "under-construction"] as const;
    for (const v of values) {
      for (const mode of modes) {
        for (const propertyType of types) {
          const input: PropertyPurchaseCostInput = {
            propertyPrice: v,
            stampDutyValue: v,
            propertyType,
            gstRatePercent: v,
            stampDuty: { mode, value: v },
            registration: { mode, value: v },
            registrationCap: v,
            brokeragePercent: v,
            legalFees: v,
            societyCharges: v,
            otherCharges: v,
            loanAmount: v,
            processingFee: { mode, value: v },
            otherLoanCharges: v,
          };
          for (const n of numericValues(calculatePropertyPurchaseCost(input))) {
            expect(Number.isFinite(n)).toBe(true);
            expect(n).toBeGreaterThanOrEqual(0);
          }
          for (const s of calculatePurchaseCostScenarios({ ...input, propertyPrice: v || 1_00_00_000 })) {
            for (const n of Object.values(s)) {
              expect(Number.isFinite(n)).toBe(true);
              expect(n).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    }
  });
});

describe("calculatePurchaseCostScenarios", () => {
  it("keeps the user's rates and LTV at each price point", () => {
    const rows = calculatePurchaseCostScenarios(DEFAULTS);
    expect(rows.map((r) => r.propertyPrice)).toEqual([...SCENARIO_PRICES]);
    // Upfront = 25% down + (6% + 1% + 1%) + 0.5% × 75% loan + ₹1,25,000 fixed = 33.375% × P + 1,25,000
    expect(rows.map((r) => Math.round(r.totalUpfrontCash))).toEqual([
      17_93_750, // 16,68,750 + 1,25,000
      26_28_125, // 25,03,125 + 1,25,000
      34_62_500, // 33,37,500 + 1,25,000
      51_31_250, // 50,06,250 + 1,25,000
      68_00_000, // 66,75,000 + 1,25,000
    ]);
    expect(rows[0]!.loanAmount).toBe(37_50_000);
  });

  it("converts fixed stamp duty to an equivalent rate so it scales with price", () => {
    const rows = calculatePurchaseCostScenarios(
      { ...DEFAULTS, stampDuty: { mode: "amount", value: 6_00_000 } },
      [50_00_000],
    );
    const pct = calculatePurchaseCostScenarios(DEFAULTS, [50_00_000]);
    expect(rows[0]!.totalUpfrontCash).toBeCloseTo(pct[0]!.totalUpfrontCash, 6);
  });

  it("caps LTV at 100% when the loan exceeds the price", () => {
    const rows = calculatePurchaseCostScenarios({ ...DEFAULTS, loanAmount: 5e7 }, [50_00_000]);
    expect(rows[0]!.loanAmount).toBe(50_00_000);
    expect(rows[0]!.downPayment).toBe(0);
  });
});
