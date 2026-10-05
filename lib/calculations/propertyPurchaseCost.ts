import { clamp, LIMITS, toNonNegative } from "./utils";

/**
 * Property purchase cost: everything a buyer pays on top of (or alongside)
 * the agreement value, and the cash needed upfront after the home loan.
 *
 * No state-specific stamp duty or registration rates are built in. The user
 * enters the rates (or fixed amounts) that apply in their state; defaults in
 * the UI are illustrative only.
 */

export type PropertyType = "ready" | "under-construction";
export type ChargeMode = "percent" | "amount";

/** A charge entered either as a percentage of a base value or as a fixed rupee amount. */
export interface ChargeInput {
  mode: ChargeMode;
  /** Percent (e.g. 6 for 6%) when mode is "percent"; rupees when mode is "amount". */
  value: number;
}

export interface PropertyPurchaseCostInput {
  /** Property price / agreement value in rupees. */
  propertyPrice: number;
  /**
   * Value on which stamp duty (and percentage registration) is charged, e.g. the
   * circle rate / guidance value when it is higher than the agreement value.
   * 0, missing or invalid means "use the property price".
   */
  stampDutyValue?: number;
  propertyType: PropertyType;
  /** GST rate in percent for under-construction homes (usually 5, or 1 for affordable housing). Ignored when ready to move. */
  gstRatePercent: number;
  stampDuty: ChargeInput;
  registration: ChargeInput;
  /** Maximum registration fee in rupees; 0 means no cap. Applies to both modes. */
  registrationCap?: number;
  /** Brokerage as % of the property price, entered inclusive of GST. */
  brokeragePercent: number;
  /** Legal and documentation fees (₹, inclusive of GST). */
  legalFees: number;
  /** Society / maintenance deposit and transfer charges (₹). */
  societyCharges: number;
  /** Other charges such as parking, club membership, PLC (₹). */
  otherCharges: number;
  /** Home loan amount in rupees. Clamped to the property price. */
  loanAmount: number;
  /** Loan processing fee: % of the loan, or a fixed amount (inclusive of GST). */
  processingFee: ChargeInput;
  /** Other loan charges paid upfront: legal/technical, MODT, insurance (₹). */
  otherLoanCharges: number;
}

export interface PropertyPurchaseCostResult {
  propertyPrice: number;
  /** Value stamp duty was charged on (property price unless a different value was entered). */
  stampDutyBase: number;
  stampDuty: number;
  /** Registration after any cap. */
  registration: number;
  /** True when the cap reduced the registration fee. */
  registrationCapApplied: boolean;
  /** GST on the property (0 for ready-to-move). */
  gst: number;
  /** Effective GST rate applied, in percent (0 for ready-to-move). */
  gstRatePercent: number;
  brokerage: number;
  legalFees: number;
  societyCharges: number;
  otherCharges: number;
  processingFee: number;
  otherLoanCharges: number;
  /** Stamp duty + registration + GST + brokerage + legal + society + other. */
  purchaseCosts: number;
  /** Processing fee + other loan charges. */
  loanCosts: number;
  /** purchaseCosts + loanCosts. */
  totalExtraCosts: number;
  /** Loan as entered (sanitised), before clamping to the price. */
  requestedLoanAmount: number;
  /** Loan after clamping to the property price. */
  loanAmount: number;
  /** True when the loan entered was more than the property price. */
  loanClamped: boolean;
  /** Loan ÷ price × 100. */
  ltvPercent: number;
  /** max(0, price − loan). */
  downPayment: number;
  /** Down payment + all extra costs: the cash the loan does not cover. */
  totalUpfrontCash: number;
  /** Price + all extra costs (excludes loan interest). */
  totalPurchaseCost: number;
  /** totalExtraCosts ÷ price × 100. */
  extraCostsPercentOfPrice: number;
  /** Human-readable notes about adjustments made to the inputs. */
  notes: string[];
  isValid: boolean;
}

const MAX_PERCENT = 100;

function sanitiseAmount(value: unknown): number {
  return clamp(toNonNegative(value), 0, LIMITS.maxAmount);
}

function sanitisePercent(value: unknown): number {
  return clamp(toNonNegative(value), 0, MAX_PERCENT);
}

/** percent mode: base × rate / 100; amount mode: the amount itself. */
function chargeAmount(charge: ChargeInput | undefined, base: number): number {
  if (!charge) return 0;
  if (charge.mode === "amount") return sanitiseAmount(charge.value);
  return (base * sanitisePercent(charge.value)) / 100;
}

/**
 * Formulas (all amounts in rupees, full precision; round only for display):
 *
 *   stampDutyBase   = stampDutyValue if > 0, else propertyPrice
 *   stampDuty       = stampDutyBase × rate% (or the fixed amount)
 *   registration    = min(stampDutyBase × rate% (or fixed amount), cap)   — cap 0 = no cap
 *   gst             = propertyPrice × gstRate%  (under construction only; 0 when ready to move)
 *   brokerage       = propertyPrice × brokerage%
 *   loanAmount      = min(loan entered, propertyPrice)
 *   processingFee   = loanAmount × fee% (or the fixed amount)
 *   totalExtraCosts = stampDuty + registration + gst + brokerage + legal + society + other
 *                     + processingFee + otherLoanCharges
 *   downPayment     = max(0, propertyPrice − loanAmount)
 *   totalUpfrontCash  = downPayment + totalExtraCosts
 *   totalPurchaseCost = propertyPrice + totalExtraCosts   (loan interest excluded)
 */
export function calculatePropertyPurchaseCost(input: PropertyPurchaseCostInput): PropertyPurchaseCostResult {
  const notes: string[] = [];
  const propertyPrice = sanitiseAmount(input.propertyPrice);

  const enteredDutyValue = sanitiseAmount(input.stampDutyValue);
  const stampDutyBase = enteredDutyValue > 0 ? enteredDutyValue : propertyPrice;
  if (enteredDutyValue > 0 && enteredDutyValue < propertyPrice) {
    notes.push(
      "The value used for stamp duty is lower than the property price. Stamp duty is usually charged on the higher of the agreement value and the government's circle rate or guidance value.",
    );
  }

  const stampDuty = chargeAmount(input.stampDuty, stampDutyBase);

  const registrationBeforeCap = chargeAmount(input.registration, stampDutyBase);
  const cap = sanitiseAmount(input.registrationCap);
  const registrationCapApplied = cap > 0 && registrationBeforeCap > cap;
  const registration = registrationCapApplied ? cap : registrationBeforeCap;

  const gstRatePercent = input.propertyType === "under-construction" ? sanitisePercent(input.gstRatePercent) : 0;
  const gst = (propertyPrice * gstRatePercent) / 100;

  const brokerage = (propertyPrice * sanitisePercent(input.brokeragePercent)) / 100;
  const legalFees = sanitiseAmount(input.legalFees);
  const societyCharges = sanitiseAmount(input.societyCharges);
  const otherCharges = sanitiseAmount(input.otherCharges);

  const requestedLoanAmount = sanitiseAmount(input.loanAmount);
  const loanClamped = requestedLoanAmount > propertyPrice;
  const loanAmount = loanClamped ? propertyPrice : requestedLoanAmount;
  if (loanClamped) {
    notes.push(
      "The loan amount was more than the property price, so it has been limited to the price. Lenders usually finance only a share of the property value.",
    );
  }

  const processingFee = chargeAmount(input.processingFee, loanAmount);
  const otherLoanCharges = sanitiseAmount(input.otherLoanCharges);

  const purchaseCosts = stampDuty + registration + gst + brokerage + legalFees + societyCharges + otherCharges;
  const loanCosts = processingFee + otherLoanCharges;
  const totalExtraCosts = purchaseCosts + loanCosts;

  const downPayment = Math.max(0, propertyPrice - loanAmount);
  const totalUpfrontCash = downPayment + totalExtraCosts;
  const totalPurchaseCost = propertyPrice + totalExtraCosts;

  return {
    propertyPrice,
    stampDutyBase,
    stampDuty,
    registration,
    registrationCapApplied,
    gst,
    gstRatePercent,
    brokerage,
    legalFees,
    societyCharges,
    otherCharges,
    processingFee,
    otherLoanCharges,
    purchaseCosts,
    loanCosts,
    totalExtraCosts,
    requestedLoanAmount,
    loanAmount,
    loanClamped,
    ltvPercent: propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0,
    downPayment,
    totalUpfrontCash,
    totalPurchaseCost,
    extraCostsPercentOfPrice: propertyPrice > 0 ? (totalExtraCosts / propertyPrice) * 100 : 0,
    notes,
    isValid: propertyPrice > 0,
  };
}

export interface PurchaseCostScenario {
  propertyPrice: number;
  loanAmount: number;
  downPayment: number;
  totalExtraCosts: number;
  totalUpfrontCash: number;
}

/** Price points used for the "upfront cash at other prices" table. */
export const SCENARIO_PRICES = [50_00_000, 75_00_000, 1_00_00_000, 1_50_00_000, 2_00_00_000] as const;

/**
 * Re-runs the calculation at other property prices, keeping the user's rates:
 *  - Loan = price × the user's LTV (loan ÷ price, capped at 100%).
 *  - Percentage charges keep their percentage.
 *  - Fixed stamp duty / registration amounts are converted to the equivalent
 *    rate on the user's stamp-duty value, so they scale with price.
 *  - A different stamp-duty value is scaled in the same ratio to the price.
 *  - The registration cap, fixed processing fee and other fixed rupee charges
 *    (legal, society, other, other loan charges) stay as entered.
 */
export function calculatePurchaseCostScenarios(
  input: PropertyPurchaseCostInput,
  prices: readonly number[] = SCENARIO_PRICES,
): PurchaseCostScenario[] {
  const base = calculatePropertyPurchaseCost(input);
  const ltv = base.propertyPrice > 0 ? Math.min(1, base.loanAmount / base.propertyPrice) : 0;
  const dutyRatio = base.propertyPrice > 0 ? base.stampDutyBase / base.propertyPrice : 1;

  const asPercent = (charge: ChargeInput | undefined): ChargeInput => {
    if (!charge) return { mode: "percent", value: 0 };
    if (charge.mode === "percent") return charge;
    const pct = base.stampDutyBase > 0 ? (sanitiseAmount(charge.value) / base.stampDutyBase) * 100 : 0;
    return { mode: "percent", value: pct };
  };
  const stampDuty = asPercent(input.stampDuty);
  const registration = asPercent(input.registration);

  return prices.map((p) => {
    const price = sanitiseAmount(p);
    const r = calculatePropertyPurchaseCost({
      ...input,
      propertyPrice: price,
      stampDutyValue: price * dutyRatio,
      stampDuty,
      registration,
      loanAmount: price * ltv,
    });
    return {
      propertyPrice: r.propertyPrice,
      loanAmount: r.loanAmount,
      downPayment: r.downPayment,
      totalExtraCosts: r.totalExtraCosts,
      totalUpfrontCash: r.totalUpfrontCash,
    };
  });
}
