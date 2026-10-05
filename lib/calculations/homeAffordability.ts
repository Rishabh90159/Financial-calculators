import { calculateEmiAmount } from "./emi";
import { RBI_LTV_SLABS } from "./homeLoan";
import { clamp, compoundGrowthMinusOne, LIMITS, monthlyRate, toNonNegative, yearsToMonths } from "./utils";

/**
 * Home affordability model.
 *
 * Works out a comfortable property budget from monthly cash flow and savings,
 * rather than from what a lender might sanction. Three scenarios are produced,
 * each defined by a cap on TOTAL EMIs (existing + new) as a share of take-home
 * income. The ratios are planning rules of thumb, not regulation.
 *
 * For a ratio R:
 *   ratio cap on new EMI   = income × R − existing EMIs
 *   cash-flow cap          = income − expenses − investments − existing EMIs − ownership costs
 *   new EMI capacity       = max(0, min(ratio cap, cash-flow cap))
 *   max loan from EMI      = EMI × [(1 + r)^n − 1] ÷ [r × (1 + r)^n]      (0% → EMI × n)
 *   cash available         = max(0, savings − emergency fund)
 *
 * The maximum price P must satisfy, with c = purchase costs as a share of price
 * and L = the LTV limit that applies to the loan size:
 *   loan        ≤ max loan from EMI
 *   loan        ≤ L × P
 *   P − loan + c × P ≤ cash available
 * so P = min((cash + maxLoan) ÷ (1 + c), cash ÷ (1 + c − L)).
 *
 * L depends on the loan size through RBI's slabs (≤ ₹30 lakh: 90%, ≤ ₹75 lakh: 80%,
 * above: 75%), further capped by the user's maximum LTV. Each slab is solved with
 * its loan ceiling added to the EMI ceiling; the largest price across slabs is the
 * exact optimum (any feasible purchase sits in some slab, and every slab solution
 * is feasible because a smaller loan only ever qualifies for a higher LTV).
 */

export type AffordabilityScenarioKey = "conservative" | "balanced" | "aggressive";

/** What stops the budget from going higher. */
export type BindingConstraint =
  /** New EMI is held down by the EMI-to-income ratio. */
  | "emi-ratio"
  /** New EMI is held down by monthly expenses, investments and ownership costs. */
  | "cash-flow"
  /** Savings above the emergency fund cannot cover a larger down payment and purchase costs. */
  | "savings"
  /** The loan is held at an RBI LTV slab boundary; a bigger loan would require a much larger down payment. */
  | "ltv"
  /** No budget is possible (no income, no EMI room and no cash). */
  | "none";

export interface AffordabilityRatios {
  /** Total EMI-to-income caps in percent of take-home income. */
  conservative: number;
  balanced: number;
  aggressive: number;
}

export interface HomeAffordabilityInput {
  /** Monthly take-home (in-hand) income. */
  monthlyIncome: number;
  /** EMIs already being paid each month (car, personal, education loans etc.). */
  existingEmis: number;
  /** Monthly living expenses, excluding rent that stops after buying. */
  monthlyExpenses: number;
  /** Monthly investments/savings the buyer wants to keep making. */
  monthlyInvestments: number;
  /** Savings available today. */
  currentSavings: number;
  /** Amount kept aside as an emergency fund and never used for the purchase. */
  emergencyFund: number;
  /** Home loan interest rate, % p.a. */
  annualRate: number;
  /** Home loan tenure in years. */
  tenureYears: number;
  /** Stamp duty, registration, legal and similar one-time costs as % of price (0–15). */
  purchaseCostPercent: number;
  /** Maintenance, property tax and other monthly ownership costs. */
  monthlyOwnershipCosts: number;
  /** EMI-to-income caps for the three scenarios (defaults 30 / 40 / 50). */
  ratios?: Partial<AffordabilityRatios>;
  /** User's maximum loan-to-value in percent (default 80); RBI slabs can lower it further. */
  maxLtvPercent?: number;
}

export interface AffordabilityScenario {
  key: AffordabilityScenarioKey;
  /** EMI-to-income cap used, in percent. */
  ratioPercent: number;
  /** income × R − existing EMIs (may be ≤ 0, reported floored at 0). */
  ratioCapEmi: number;
  /** Monthly surplus available for a new EMI after all other outgoings (floored at 0). */
  cashFlowCapEmi: number;
  /** New EMI the scenario allows: max(0, min(ratio cap, cash-flow cap)). */
  emiCapacity: number;
  /** Largest loan that EMI capacity can service at the given rate and tenure. */
  maxLoanFromEmi: number;
  propertyPrice: number;
  loanAmount: number;
  /** EMI on `loanAmount` (≤ emiCapacity; lower when savings or LTV bind). */
  emi: number;
  downPayment: number;
  purchaseCosts: number;
  /** Down payment + purchase costs. */
  upfrontCash: number;
  /** Cash available − upfront cash (savings above the emergency fund left after buying). */
  remainingSavings: number;
  /** LTV cap that applied (min of user max and RBI slab), in percent. */
  appliedLtvPercent: number;
  /** Actual loan ÷ price, in percent. */
  loanToValuePercent: number;
  /** EMI + monthly ownership costs. */
  monthlyHousingCost: number;
  /** (Existing EMIs + new EMI) ÷ income, in percent. */
  totalEmiToIncomePercent: number;
  /** Monthly housing cost ÷ income, in percent. */
  housingCostToIncomePercent: number;
  /** Income left after expenses, investments, all EMIs and ownership costs (floored at 0). */
  monthlySurplus: number;
  /** Shortfall when outgoings exceed income (0 otherwise). */
  monthlyShortfall: number;
  binding: BindingConstraint;
}

export interface HomeAffordabilityResult {
  monthlyIncome: number;
  existingEmis: number;
  monthlyExpenses: number;
  monthlyInvestments: number;
  monthlyOwnershipCosts: number;
  annualRate: number;
  tenureMonths: number;
  purchaseCostPercent: number;
  maxLtvPercent: number;
  ratios: AffordabilityRatios;
  /** max(0, savings − emergency fund). */
  cashAvailable: number;
  /** Portion of savings held as the emergency fund: min(savings, emergency fund). */
  emergencyFundKept: number;
  /** Income − expenses − investments − existing EMIs − ownership costs, before any new EMI (floored at 0). */
  monthlyRoomBeforeEmi: number;
  /** How far those outgoings exceed income before any new EMI (0 when they fit). */
  monthlyDeficitBeforeEmi: number;
  scenarios: Record<AffordabilityScenarioKey, AffordabilityScenario>;
  /** Same scenarios in display order. */
  scenarioList: AffordabilityScenario[];
  isValid: boolean;
  /** Plain-language warnings about the inputs. */
  notes: string[];
}

export const DEFAULT_RATIOS: AffordabilityRatios = { conservative: 30, balanced: 40, aggressive: 50 };
export const DEFAULT_MAX_LTV = 80;
export const MAX_PURCHASE_COST_PERCENT = 15;
const SCENARIO_KEYS: readonly AffordabilityScenarioKey[] = ["conservative", "balanced", "aggressive"];

const money = (v: unknown) => clamp(toNonNegative(v), 0, LIMITS.maxAmount);

/**
 * Present value of a level monthly annuity — the loan an EMI can repay:
 *   PV = EMI × [(1 + r)^n − 1] ÷ [r × (1 + r)^n] = EMI × g ÷ (r × (g + 1)),  g = (1 + r)^n − 1.
 * At 0% it is EMI × n. g uses expm1/log1p so small rates stay precise.
 */
export function loanFromEmi(emi: number, annualRate: number, tenureMonths: number): number {
  const e = money(emi);
  const n = Math.round(clamp(toNonNegative(tenureMonths), 0, LIMITS.maxTenureMonths));
  const rate = clamp(toNonNegative(annualRate), 0, LIMITS.maxAnnualRate);
  if (e === 0 || n === 0) return 0;
  const r = monthlyRate(rate);
  if (r === 0) return Math.min(LIMITS.maxAmount, e * n);
  const g = compoundGrowthMinusOne(r, n);
  // (g / (g + 1)) → 1 as g → ∞, so the PV tends to EMI / r; this keeps the result finite.
  const factor = Number.isFinite(g) && g > 0 ? g / (g + 1) : 1;
  return Math.min(LIMITS.maxAmount, (e * factor) / r);
}

/** LTV caps (as fractions) per RBI slab, each further limited by the user's maximum LTV. */
function slabCaps(maxLtvPercent: number) {
  return RBI_LTV_SLABS.map((s) => ({
    maxLoan: Math.min(s.maxLoan, LIMITS.maxAmount),
    ltv: Math.min(maxLtvPercent, s.maxLtvPercent) / 100,
  }));
}

/**
 * Largest loan permitted against a price under the RBI slabs and the user's max LTV:
 *   max over slabs of min(slab LTV × price, slab loan ceiling).
 * (E.g. at ₹34 lakh the loan can be ₹30 lakh — the 90% slab ceiling — rather than 80% × ₹34 lakh.)
 */
export function maxPermittedLoan(price: number, maxLtvPercent = DEFAULT_MAX_LTV): number {
  const p = money(price);
  const userLtv = clamp(toNonNegative(maxLtvPercent), 0, 100);
  let best = 0;
  for (const s of slabCaps(userLtv)) best = Math.max(best, Math.min(s.ltv * p, s.maxLoan));
  return best;
}

interface PriceSolution {
  price: number;
  loan: number;
  ltvCap: number;
  /** Which term of the min() limited the price. */
  limitedBy: "emi" | "slab-ceiling" | "savings";
}

/** Solves the maximum price for a given EMI-supported loan ceiling (see module doc). */
export function solveMaxPrice(
  maxLoanFromEmi: number,
  cashAvailable: number,
  purchaseCostShare: number,
  maxLtvPercent: number,
): PriceSolution {
  const m = money(maxLoanFromEmi);
  const cash = money(cashAvailable);
  const c = clamp(toNonNegative(purchaseCostShare), 0, MAX_PURCHASE_COST_PERCENT / 100);
  const userLtv = clamp(toNonNegative(maxLtvPercent), 0, 100);

  let best: PriceSolution = { price: 0, loan: 0, ltvCap: Math.min(userLtv, RBI_LTV_SLABS[0].maxLtvPercent) / 100, limitedBy: "savings" };
  for (const s of slabCaps(userLtv)) {
    const loanCeiling = Math.min(m, s.maxLoan);
    const byLoan = (cash + loanCeiling) / (1 + c);
    // 1 + c − L ≥ 0.1 because L ≤ 0.9, so this never divides by zero.
    const byCash = cash / (1 + c - s.ltv);
    const price = Math.min(byLoan, byCash, LIMITS.maxAmount);
    const loan = Math.min(loanCeiling, s.ltv * price);
    let limitedBy: PriceSolution["limitedBy"] = "savings";
    if (byLoan <= byCash) limitedBy = loanCeiling < m ? "slab-ceiling" : "emi";
    // Prefer a strictly higher price; on ties keep the earlier (higher-LTV) slab.
    if (price > best.price + 1e-6) best = { price, loan, ltvCap: s.ltv, limitedBy };
  }
  return best;
}

function normaliseRatios(r: Partial<AffordabilityRatios> | undefined): AffordabilityRatios {
  const pick = (v: unknown, fallback: number) =>
    v === undefined ? fallback : clamp(toNonNegative(v), 0, 100);
  return {
    conservative: pick(r?.conservative, DEFAULT_RATIOS.conservative),
    balanced: pick(r?.balanced, DEFAULT_RATIOS.balanced),
    aggressive: pick(r?.aggressive, DEFAULT_RATIOS.aggressive),
  };
}

export function calculateHomeAffordability(input: HomeAffordabilityInput): HomeAffordabilityResult {
  const monthlyIncome = money(input.monthlyIncome);
  const existingEmis = money(input.existingEmis);
  const monthlyExpenses = money(input.monthlyExpenses);
  const monthlyInvestments = money(input.monthlyInvestments);
  const monthlyOwnershipCosts = money(input.monthlyOwnershipCosts);
  const currentSavings = money(input.currentSavings);
  const emergencyFund = money(input.emergencyFund);
  const annualRate = clamp(toNonNegative(input.annualRate), 0, LIMITS.maxAnnualRate);
  const tenureMonths = Math.min(LIMITS.maxTenureMonths, yearsToMonths(clamp(toNonNegative(input.tenureYears), 0, 50)));
  const purchaseCostPercent = clamp(toNonNegative(input.purchaseCostPercent), 0, MAX_PURCHASE_COST_PERCENT);
  const maxLtvPercent =
    input.maxLtvPercent === undefined ? DEFAULT_MAX_LTV : clamp(toNonNegative(input.maxLtvPercent), 0, 100);
  const ratios = normaliseRatios(input.ratios);
  const c = purchaseCostPercent / 100;

  const cashAvailable = Math.max(0, currentSavings - emergencyFund);
  const emergencyFundKept = Math.min(currentSavings, emergencyFund);
  const room =
    monthlyIncome - monthlyExpenses - monthlyInvestments - existingEmis - monthlyOwnershipCosts;
  const isValid = monthlyIncome > 0 && tenureMonths > 0;
  const pct = (part: number) => (monthlyIncome > 0 ? (part / monthlyIncome) * 100 : 0);

  const build = (key: AffordabilityScenarioKey): AffordabilityScenario => {
    const ratioPercent = ratios[key];
    const ratioCapRaw = (monthlyIncome * ratioPercent) / 100 - existingEmis;
    const emiCapacity = isValid ? Math.max(0, Math.min(ratioCapRaw, room)) : 0;
    const maxLoanFromEmi = loanFromEmi(emiCapacity, annualRate, tenureMonths);
    const solution = isValid
      ? solveMaxPrice(maxLoanFromEmi, cashAvailable, c, maxLtvPercent)
      : { price: 0, loan: 0, ltvCap: 0, limitedBy: "savings" as const };

    const propertyPrice = solution.price;
    const loanAmount = Math.min(solution.loan, propertyPrice);
    const emi = Math.min(emiCapacity, calculateEmiAmount(loanAmount, annualRate, tenureMonths));
    const downPayment = Math.max(0, propertyPrice - loanAmount);
    const purchaseCosts = propertyPrice * c;
    const upfrontCash = downPayment + purchaseCosts;
    const ownership = propertyPrice > 0 ? monthlyOwnershipCosts : 0;
    const monthlyHousingCost = emi + ownership;
    const left = monthlyIncome - monthlyExpenses - monthlyInvestments - existingEmis - monthlyHousingCost;

    const emiLimit: BindingConstraint = ratioCapRaw <= room ? "emi-ratio" : "cash-flow";
    let binding: BindingConstraint;
    if (!isValid) binding = "none";
    else if (propertyPrice <= 0) binding = emiCapacity > 0 ? "savings" : emiLimit;
    else if (solution.limitedBy === "savings") binding = "savings";
    else if (solution.limitedBy === "slab-ceiling") binding = "ltv";
    else binding = emiLimit;

    return {
      key,
      ratioPercent,
      ratioCapEmi: Math.max(0, ratioCapRaw),
      cashFlowCapEmi: Math.max(0, room),
      emiCapacity,
      maxLoanFromEmi,
      propertyPrice,
      loanAmount,
      emi,
      downPayment,
      purchaseCosts,
      upfrontCash,
      remainingSavings: Math.max(0, cashAvailable - upfrontCash),
      appliedLtvPercent: solution.ltvCap * 100,
      loanToValuePercent: propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0,
      monthlyHousingCost,
      totalEmiToIncomePercent: pct(existingEmis + emi),
      housingCostToIncomePercent: pct(monthlyHousingCost),
      monthlySurplus: Math.max(0, left),
      monthlyShortfall: Math.max(0, -left),
      binding,
    };
  };

  const scenarios = {
    conservative: build("conservative"),
    balanced: build("balanced"),
    aggressive: build("aggressive"),
  };

  const notes: string[] = [];
  if (monthlyIncome <= 0) notes.push("Enter your monthly take-home income to see a budget.");
  if (tenureMonths <= 0) notes.push("Enter a loan tenure of at least one year.");
  if (isValid && room <= 0)
    notes.push(
      "Your expenses, investments, existing EMIs and ownership costs already use all of your take-home income, so there is no room for a new EMI.",
    );
  if (isValid && existingEmis >= (monthlyIncome * ratios.aggressive) / 100)
    notes.push("Your existing EMIs are already at or above the Aggressive EMI-to-income limit.");
  if (currentSavings < emergencyFund)
    notes.push("Your savings are below the emergency fund you want to keep, so nothing is available for a down payment yet.");
  if (!(ratios.conservative <= ratios.balanced && ratios.balanced <= ratios.aggressive))
    notes.push("Your EMI-to-income ratios are not in ascending order (Conservative ≤ Balanced ≤ Aggressive).");

  return {
    monthlyIncome,
    existingEmis,
    monthlyExpenses,
    monthlyInvestments,
    monthlyOwnershipCosts,
    annualRate,
    tenureMonths,
    purchaseCostPercent,
    maxLtvPercent,
    ratios,
    cashAvailable,
    emergencyFundKept,
    monthlyRoomBeforeEmi: Math.max(0, room),
    monthlyDeficitBeforeEmi: Math.max(0, -room),
    scenarios,
    scenarioList: SCENARIO_KEYS.map((k) => scenarios[k]),
    isValid,
    notes,
  };
}

// ---------------------------------------------------------------------------
// "Can I afford this property?" check
// ---------------------------------------------------------------------------

export type AffordabilityBand = "conservative" | "balanced" | "aggressive" | "above";

export interface PropertyCheckResult {
  propertyPrice: number;
  /** Largest loan the LTV limits allow at this price (the check assumes you borrow it). */
  loanAmount: number;
  /** Minimum down payment: price − permitted loan. */
  downPayment: number;
  /** Loan ÷ price, in percent. */
  loanToValuePercent: number;
  purchaseCosts: number;
  upfrontCash: number;
  cashAvailable: number;
  /** Cash left over after the upfront payment (0 if short). */
  cashSurplus: number;
  /** Cash still needed for the upfront payment (0 if covered). */
  cashShortfall: number;
  emi: number;
  /** EMI if any cash surplus is also put towards the down payment. */
  emiUsingSurplus: number;
  monthlyHousingCost: number;
  /** Monthly housing cost ÷ take-home income, in percent. */
  housingCostToIncomePercent: number;
  /** (Existing EMIs + new EMI) ÷ income, in percent. */
  totalEmiToIncomePercent: number;
  monthlySurplus: number;
  monthlyShortfall: number;
  /** Tightest scenario whose EMI-to-income cap the total EMIs fit within. */
  band: AffordabilityBand;
  isValid: boolean;
}

/**
 * Checks a specific price: down payment = price − maximum permitted loan (RBI slabs
 * and user max LTV), loan = the rest, EMI from the standard formula, then compares
 * total EMIs ÷ income with the scenario ratios and upfront cash with cash available.
 */
export function checkPropertyAffordability(input: HomeAffordabilityInput, propertyPrice: number): PropertyCheckResult {
  const base = calculateHomeAffordability(input);
  const price = money(propertyPrice);
  const c = base.purchaseCostPercent / 100;
  const loanAmount = Math.min(price, maxPermittedLoan(price, base.maxLtvPercent));
  const downPayment = price - loanAmount;
  const purchaseCosts = price * c;
  const upfrontCash = downPayment + purchaseCosts;
  const cashSurplus = Math.max(0, base.cashAvailable - upfrontCash);
  const cashShortfall = Math.max(0, upfrontCash - base.cashAvailable);
  const emi = calculateEmiAmount(loanAmount, base.annualRate, base.tenureMonths);
  const emiUsingSurplus = calculateEmiAmount(Math.max(0, loanAmount - cashSurplus), base.annualRate, base.tenureMonths);
  const ownership = price > 0 ? base.monthlyOwnershipCosts : 0;
  const monthlyHousingCost = emi + ownership;
  const room = base.monthlyRoomBeforeEmi - base.monthlyDeficitBeforeEmi;
  const left = room + base.monthlyOwnershipCosts - monthlyHousingCost;
  const income = base.monthlyIncome;
  const totalEmiToIncomePercent = income > 0 ? ((base.existingEmis + emi) / income) * 100 : 0;
  const isValid = base.isValid && price > 0;

  let band: AffordabilityBand = "above";
  if (isValid) {
    const totalEmi = base.existingEmis + emi;
    const fits = (ratio: number) => totalEmi <= (income * ratio) / 100 + 1e-6;
    if (fits(base.ratios.conservative)) band = "conservative";
    else if (fits(base.ratios.balanced)) band = "balanced";
    else if (fits(base.ratios.aggressive)) band = "aggressive";
  }

  return {
    propertyPrice: price,
    loanAmount,
    downPayment,
    loanToValuePercent: price > 0 ? (loanAmount / price) * 100 : 0,
    purchaseCosts,
    upfrontCash,
    cashAvailable: base.cashAvailable,
    cashSurplus,
    cashShortfall,
    emi,
    emiUsingSurplus,
    monthlyHousingCost,
    housingCostToIncomePercent: income > 0 ? (monthlyHousingCost / income) * 100 : 0,
    totalEmiToIncomePercent,
    monthlySurplus: Math.max(0, left),
    monthlyShortfall: Math.max(0, -left),
    band,
    isValid,
  };
}
