import { buildAmortizationSchedule, calculateEmiAmount } from "./emi";
import { clamp, LIMITS, toNonNegative, yearsToMonths } from "./utils";

/**
 * Rent vs buy: compares the estimated net financial position of two households
 * that start with the same cash and spend the same total each month.
 *
 * BUYER
 *  - Month 0: pays down payment + one-time purchase costs.
 *  - Months 1…: pays the loan instalment (until the loan ends) + monthly maintenance
 *    + annual ownership costs ÷ 12. Maintenance and ownership costs step up once
 *    every 12 months by `ownershipCostGrowth`.
 *  - Home value after m months: V = price × (1 + g)^(m / 12).
 *  - Outstanding loan from the standard reducing-balance amortization schedule.
 *
 * RENTER
 *  - Month 0: invests (down payment + purchase costs) instead of buying.
 *  - Months 1…: pays rent, which steps up once every 12 months by `rentIncrease`.
 *
 * EQUAL-SPENDING RULE
 *  - Each month, whichever side spends less invests the difference:
 *    if buying costs more, the renter invests (buyer outflow − rent);
 *    if rent is higher, the buyer invests (rent − buyer outflow).
 *  - Portfolios earn a monthly return of (1 + i)^(1/12) − 1, so 12 months compound
 *    to exactly the annual return i. Each month the portfolio first grows, then that
 *    month's contribution is added (end-of-month contribution).
 *
 * NET POSITION AT HORIZON H (months = 12H)
 *  - Buy  = V − outstanding loan − selling cost (V × sell%) + buyer's portfolio
 *  - Rent = renter's portfolio
 *  - Difference = Buy − Rent (positive: buying ahead; negative: renting ahead)
 *
 * Excluded by design: income-tax effects (home loan deductions, capital gains,
 * tax on investment returns), rent deposits, moving costs, home insurance,
 * rental income and the non-financial value of owning or renting.
 *
 * Sign convention: the buyer's net position can be negative (a home worth less than
 * the outstanding loan plus selling cost). Property appreciation may be negative.
 * Every other figure is non-negative.
 */

export interface RentVsBuyInput {
  /** Property price in rupees. */
  propertyPrice: number;
  /** Down payment in rupees (capped at the property price). */
  downPayment: number;
  /** Home loan interest rate, % p.a. */
  loanRate: number;
  /** Home loan tenure in years. */
  loanTenureYears: number;
  /** One-time purchase costs: stamp duty, registration, legal, brokerage etc. */
  purchaseCosts: number;
  /** Monthly maintenance in rupees, in the first year. */
  monthlyMaintenance: number;
  /** Annual property tax and other recurring ownership costs, in the first year. */
  annualOwnershipCosts: number;
  /** Annual step-up applied to maintenance and ownership costs, %. */
  ownershipCostGrowth: number;
  /** Cost of selling at the horizon (brokerage etc.) as % of the home's value then. */
  sellingCostPercent: number;
  /** Monthly rent in rupees, in the first year. */
  monthlyRent: number;
  /** Annual rent increase, %. */
  rentIncrease: number;
  /** Expected annual return on invested money, %. */
  investmentReturn: number;
  /** Expected annual property price change, % (may be negative). */
  propertyAppreciation: number;
  /** Comparison horizon in whole years (1–30). */
  horizonYears: number;
}

export interface RentVsBuyYear {
  year: number;
  propertyValue: number;
  outstandingLoan: number;
  sellingCost: number;
  buyerPortfolio: number;
  renterPortfolio: number;
  /** Buy net position; can be negative. */
  buyNet: number;
  rentNet: number;
  /** buyNet − rentNet. */
  difference: number;
}

export type BreakEvenStatus = "from-start" | "year" | "never";

export interface BreakEven {
  /** "from-start": buying is ahead at year 1; "year": first catches up in `year`; "never": not within 30 years. */
  status: BreakEvenStatus;
  year: number | null;
  /** True if, once ahead, buying stays ahead in every later year up to 30. */
  staysAhead: boolean;
}

export interface RentVsBuyResult {
  /** Sanitised inputs actually used. */
  input: RentVsBuyInput;
  horizonYears: number;
  loanAmount: number;
  /** Monthly instalment (0 when no loan is needed). */
  emi: number;
  loanTenureMonths: number;
  /** Down payment + purchase costs: cash the buyer spends and the renter invests at month 0. */
  upfrontCash: number;
  firstMonthBuyCost: number;
  firstMonthRent: number;

  propertyValue: number;
  outstandingLoan: number;
  sellingCost: number;
  /** V − outstanding loan − selling cost; can be negative. */
  homeEquity: number;
  buyerPortfolio: number;
  renterPortfolio: number;
  buyNet: number;
  rentNet: number;
  difference: number;
  ahead: "buy" | "rent" | "even";

  totalRentPaid: number;
  /** Down payment + purchase costs + instalments + maintenance + ownership costs, up to the horizon. */
  totalBuyerOutflow: number;
  totalEmiPaid: number;
  interestPaid: number;
  principalRepaid: number;
  totalMaintenance: number;
  totalOwnershipCosts: number;
  /** Monthly surpluses invested by the renter (excluding the month-0 lump sum). */
  renterMonthlyInvested: number;
  /** Monthly surpluses invested by the buyer. */
  buyerMonthlyInvested: number;

  /** Snapshots for years 1…horizon. */
  years: RentVsBuyYear[];
  /** Snapshots for years 1…30, used for break-even and holding-period comparisons. */
  allYears: RentVsBuyYear[];
  breakEven: BreakEven;
  notes: string[];
  isValid: boolean;
}

export const RENT_VS_BUY_MAX_YEARS = 30;
const MAX_PERCENT_COST = 20;
const MIN_APPRECIATION = -20;
const MAX_APPRECIATION = 30;
/** Differences smaller than this (in rupees) are treated as a tie. */
const TIE_TOLERANCE = 0.5;

const amount = (v: unknown) => clamp(toNonNegative(v), 0, LIMITS.maxAmount);
const rate = (v: unknown) => clamp(toNonNegative(v), 0, LIMITS.maxAnnualRate);

/** Accepts negative appreciation (falling prices), unlike the other rates. Non-finite input becomes 0. */
function appreciation(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return clamp(n, MIN_APPRECIATION, MAX_APPRECIATION);
}

export function normaliseRentVsBuyInput(input: RentVsBuyInput): RentVsBuyInput {
  const propertyPrice = amount(input.propertyPrice);
  const tenureMonths = clamp(yearsToMonths(input.loanTenureYears), 0, RENT_VS_BUY_MAX_YEARS * 12);
  return {
    propertyPrice,
    downPayment: clamp(toNonNegative(input.downPayment), 0, propertyPrice),
    loanRate: rate(input.loanRate),
    loanTenureYears: tenureMonths / 12,
    purchaseCosts: amount(input.purchaseCosts),
    monthlyMaintenance: amount(input.monthlyMaintenance),
    annualOwnershipCosts: amount(input.annualOwnershipCosts),
    ownershipCostGrowth: rate(input.ownershipCostGrowth),
    sellingCostPercent: clamp(toNonNegative(input.sellingCostPercent), 0, MAX_PERCENT_COST),
    monthlyRent: amount(input.monthlyRent),
    rentIncrease: rate(input.rentIncrease),
    investmentReturn: rate(input.investmentReturn),
    propertyAppreciation: appreciation(input.propertyAppreciation),
    horizonYears: Math.round(clamp(toNonNegative(input.horizonYears), 1, RENT_VS_BUY_MAX_YEARS)),
  };
}

/** Effective monthly rate whose 12-month compounding equals the annual rate: (1 + i)^(1/12) − 1. */
export function effectiveMonthlyRate(annualPercent: number): number {
  const i = rate(annualPercent) / 100;
  return Math.expm1(Math.log1p(i) / 12);
}

interface Simulation {
  allYears: RentVsBuyYear[];
  /** Cumulative flows recorded at the end of each year (index = year − 1). */
  flows: {
    rent: number;
    emi: number;
    interest: number;
    principal: number;
    maintenance: number;
    ownership: number;
    renterInvested: number;
    buyerInvested: number;
  }[];
  emi: number;
  loanAmount: number;
  tenureMonths: number;
  firstMonthBuyCost: number;
}

/** One 30-year monthly run recording a snapshot at the end of every year. */
function simulate(p: RentVsBuyInput): Simulation {
  const loanAmount = p.propertyPrice - p.downPayment;
  const tenureMonths = Math.round(p.loanTenureYears * 12);
  const schedule = buildAmortizationSchedule({ principal: loanAmount, annualRate: p.loanRate, tenureMonths });
  const emi = calculateEmiAmount(loanAmount, p.loanRate, tenureMonths);
  const r = effectiveMonthlyRate(p.investmentReturn);
  const g = p.propertyAppreciation / 100;
  const rentGrowth = 1 + p.rentIncrease / 100;
  const costGrowth = 1 + p.ownershipCostGrowth / 100;

  let renterPortfolio = p.downPayment + p.purchaseCosts;
  let buyerPortfolio = 0;
  let balance = schedule.length > 0 ? loanAmount : 0;
  const cum = { rent: 0, emi: 0, interest: 0, principal: 0, maintenance: 0, ownership: 0, renterInvested: 0, buyerInvested: 0 };
  const allYears: RentVsBuyYear[] = [];
  const flows: Simulation["flows"] = [];
  let firstMonthBuyCost = 0;

  for (let m = 1; m <= RENT_VS_BUY_MAX_YEARS * 12; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const rent = p.monthlyRent * rentGrowth ** yearIndex;
    const maintenance = p.monthlyMaintenance * costGrowth ** yearIndex;
    const ownership = (p.annualOwnershipCosts / 12) * costGrowth ** yearIndex;
    const row = schedule[m - 1];
    const instalment = row ? row.payment : 0;
    if (row) {
      balance = row.closingBalance;
      cum.interest += row.interestPaid;
      cum.principal += row.principalPaid;
    }
    const buyOutflow = instalment + maintenance + ownership;
    if (m === 1) firstMonthBuyCost = buyOutflow;

    const renterContribution = Math.max(0, buyOutflow - rent);
    const buyerContribution = Math.max(0, rent - buyOutflow);
    renterPortfolio = renterPortfolio * (1 + r) + renterContribution;
    buyerPortfolio = buyerPortfolio * (1 + r) + buyerContribution;

    cum.rent += rent;
    cum.emi += instalment;
    cum.maintenance += maintenance;
    cum.ownership += ownership;
    cum.renterInvested += renterContribution;
    cum.buyerInvested += buyerContribution;

    if (m % 12 === 0) {
      const year = m / 12;
      const propertyValue = p.propertyPrice * (1 + g) ** year;
      const sellingCost = propertyValue * (p.sellingCostPercent / 100);
      const buyNet = propertyValue - balance - sellingCost + buyerPortfolio;
      const rentNet = renterPortfolio;
      allYears.push({
        year,
        propertyValue,
        outstandingLoan: balance,
        sellingCost,
        buyerPortfolio,
        renterPortfolio,
        buyNet,
        rentNet,
        difference: buyNet - rentNet,
      });
      flows.push({ ...cum });
    }
  }

  return { allYears, flows, emi, loanAmount, tenureMonths, firstMonthBuyCost };
}

function emptyYear(year: number): RentVsBuyYear {
  return { year, propertyValue: 0, outstandingLoan: 0, sellingCost: 0, buyerPortfolio: 0, renterPortfolio: 0, buyNet: 0, rentNet: 0, difference: 0 };
}

function emptyFlow(): Simulation["flows"][number] {
  return { rent: 0, emi: 0, interest: 0, principal: 0, maintenance: 0, ownership: 0, renterInvested: 0, buyerInvested: 0 };
}

export function findBreakEven(allYears: RentVsBuyYear[]): BreakEven {
  const index = allYears.findIndex((y) => y.difference >= 0);
  if (index === -1) return { status: "never", year: null, staysAhead: false };
  const staysAhead = allYears.slice(index).every((y) => y.difference >= 0);
  return { status: index === 0 ? "from-start" : "year", year: allYears[index]?.year ?? null, staysAhead };
}

export function calculateRentVsBuy(raw: RentVsBuyInput): RentVsBuyResult {
  const input = normaliseRentVsBuyInput(raw);
  const H = input.horizonYears;
  const sim = simulate(input);
  // simulate() always records 30 years; the fallbacks only satisfy the type checker.
  const snap = sim.allYears[H - 1] ?? emptyYear(H);
  const flow = sim.flows[H - 1] ?? emptyFlow();
  const upfrontCash = input.downPayment + input.purchaseCosts;
  const isValid = input.propertyPrice > 0;

  const notes: string[] = [];
  const rawDown = toNonNegative(raw.downPayment);
  if (rawDown > input.propertyPrice && input.propertyPrice > 0) {
    notes.push("Down payment was higher than the property price, so it has been capped at the price (no loan).");
  }
  if (sim.loanAmount > 0 && sim.tenureMonths === 0) {
    notes.push("Loan tenure is zero, so no loan is modelled. Enter a tenure to include EMIs.");
  }
  if (sim.loanAmount > 0 && sim.tenureMonths > 0 && sim.tenureMonths < H * 12) {
    notes.push(
      `The loan is fully repaid after ${Number(input.loanTenureYears.toFixed(2))} years, before the ${H}-year horizon. After that the buyer pays only maintenance and ownership costs.`,
    );
  }
  if (input.monthlyRent > sim.firstMonthBuyCost && isValid) {
    notes.push("Rent is higher than the monthly cost of owning, so the buyer invests the difference each month.");
  }
  if (snap.propertyValue - snap.outstandingLoan - snap.sellingCost < 0) {
    notes.push("At the horizon the home is worth less than the outstanding loan plus selling cost (negative equity).");
  }

  const difference = snap.difference;
  const ahead = Math.abs(difference) < TIE_TOLERANCE ? "even" : difference > 0 ? "buy" : "rent";

  return {
    input,
    horizonYears: H,
    loanAmount: sim.loanAmount,
    emi: sim.tenureMonths > 0 ? sim.emi : 0,
    loanTenureMonths: sim.tenureMonths,
    upfrontCash,
    firstMonthBuyCost: sim.firstMonthBuyCost,
    firstMonthRent: input.monthlyRent,
    propertyValue: snap.propertyValue,
    outstandingLoan: snap.outstandingLoan,
    sellingCost: snap.sellingCost,
    homeEquity: snap.propertyValue - snap.outstandingLoan - snap.sellingCost,
    buyerPortfolio: snap.buyerPortfolio,
    renterPortfolio: snap.renterPortfolio,
    buyNet: snap.buyNet,
    rentNet: snap.rentNet,
    difference,
    ahead,
    totalRentPaid: flow.rent,
    totalBuyerOutflow: upfrontCash + flow.emi + flow.maintenance + flow.ownership,
    totalEmiPaid: flow.emi,
    interestPaid: flow.interest,
    principalRepaid: flow.principal,
    totalMaintenance: flow.maintenance,
    totalOwnershipCosts: flow.ownership,
    renterMonthlyInvested: flow.renterInvested,
    buyerMonthlyInvested: flow.buyerInvested,
    years: sim.allYears.slice(0, H),
    allYears: sim.allYears,
    breakEven: findBreakEven(sim.allYears),
    notes,
    isValid,
  };
}

/* ------------------------------------------------------------------ */
/* Sensitivity analysis                                                 */
/* ------------------------------------------------------------------ */

export type SensitivityKey = "propertyAppreciation" | "rentIncrease" | "investmentReturn" | "loanRate";

export interface SensitivityRow {
  /** Percentage-point change from the user's input. */
  offset: number;
  /** Assumption value actually used (after clamping, e.g. a rate cannot go below 0%). */
  value: number;
  /** Buy − Rent at the chosen horizon with this assumption. */
  difference: number;
  current: boolean;
}

export interface SensitivityGroup {
  key: SensitivityKey;
  label: string;
  rows: SensitivityRow[];
  /** Largest minus smallest difference across the rows tested. */
  swing: number;
}

export interface HoldingPeriodRow {
  years: number;
  buyNet: number;
  rentNet: number;
  difference: number;
  current: boolean;
}

export interface RentVsBuySensitivity {
  groups: SensitivityGroup[];
  holding: HoldingPeriodRow[];
  /** Assumption group with the largest swing, or null if nothing changes the result. */
  mostSensitive: SensitivityGroup | null;
}

export const SENSITIVITY_STEPS: Record<SensitivityKey, { label: string; offsets: number[] }> = {
  propertyAppreciation: { label: "Property appreciation", offsets: [-2, -1, 0, 1, 2] },
  rentIncrease: { label: "Annual rent increase", offsets: [-2, 0, 2] },
  investmentReturn: { label: "Investment return", offsets: [-2, 0, 2] },
  loanRate: { label: "Loan interest rate", offsets: [-1, 0, 1] },
};

export const HOLDING_PERIODS = [5, 10, 15, 20] as const;

/**
 * Buy − Rent at the chosen horizon when one assumption is moved by a few
 * percentage points, plus the base result at several holding periods.
 * Rows that clamp to the same value (e.g. a 0% rate − 1) are dropped.
 */
export function calculateRentVsBuySensitivity(raw: RentVsBuyInput, base?: RentVsBuyResult): RentVsBuySensitivity {
  const baseResult = base ?? calculateRentVsBuy(raw);
  const input = baseResult.input;

  const groups: SensitivityGroup[] = (Object.keys(SENSITIVITY_STEPS) as SensitivityKey[]).map((key) => {
    const { label, offsets } = SENSITIVITY_STEPS[key];
    const rows: SensitivityRow[] = [];
    for (const offset of offsets) {
      const result = offset === 0 ? baseResult : calculateRentVsBuy({ ...input, [key]: input[key] + offset });
      const value = result.input[key];
      const existing = rows.findIndex((r) => r.value === value);
      const duplicate = rows[existing];
      if (duplicate) {
        if (offset === 0) rows[existing] = { ...duplicate, offset: 0, current: true };
        continue;
      }
      rows.push({ offset, value, difference: result.difference, current: offset === 0 });
    }
    const diffs = rows.map((r) => r.difference);
    return { key, label, rows, swing: Math.max(...diffs) - Math.min(...diffs) };
  });

  const periods = new Set<number>(HOLDING_PERIODS);
  periods.add(baseResult.horizonYears);
  const holding = [...periods]
    .sort((a, b) => a - b)
    .map((years) => {
      const y = baseResult.allYears[years - 1] ?? emptyYear(years);
      return { years, buyNet: y.buyNet, rentNet: y.rentNet, difference: y.difference, current: years === baseResult.horizonYears };
    });

  const top = groups.reduce<SensitivityGroup | null>((best, g) => (!best || g.swing > best.swing ? g : best), null);
  return { groups, holding, mostSensitive: top && top.swing > TIE_TOLERANCE ? top : null };
}
