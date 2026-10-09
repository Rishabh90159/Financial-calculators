/**
 * Calculator registry — the navigation architecture for the whole site.
 *
 * Every calculator, live or planned, is declared here once. The sitemap,
 * header, footer, directory page and "related calculators" sections all read
 * from this list. Planned calculators never render as links, so there are no
 * broken URLs. To launch one: build its page under app/calculators/<slug>/
 * and change its status to "live".
 */

export type CalculatorId =
  | "emi"
  | "sip"
  | "loan"
  | "home-loan"
  | "home-loan-emi"
  | "home-loan-eligibility"
  | "home-affordability"
  | "loan-prepayment"
  | "rent-vs-buy"
  | "property-purchase-cost"
  | "car-loan"
  | "salary"
  // Planned
  | "income-tax"
  | "investment"
  | "retirement";

export type CalculatorCategory = "loans" | "property" | "investing" | "tax-income";

export interface CalculatorEntry {
  id: CalculatorId;
  slug: string;
  name: string;
  /** One sentence describing what it calculates. */
  description: string;
  /** The question it answers for the user. */
  useCase: string;
  /** Short imperative link label, e.g. "Calculate EMI". Live calculators only. */
  action?: string;
  category: CalculatorCategory;
  status: "live" | "planned";
  related: CalculatorId[];
  /**
   * ISO date of this page's last substantive content change. Falls back to
   * `siteConfig.contentUpdated`. Drives the sitemap <lastmod> and the "Last reviewed" line.
   */
  contentUpdated?: string;
}

export const CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  loans: "Loans & EMI",
  property: "Property",
  investing: "Investing",
  "tax-income": "Salary & tax",
};

export const CALCULATORS: readonly CalculatorEntry[] = [
  {
    id: "emi",
    slug: "emi-calculator",
    name: "EMI Calculator",
    description: "Monthly instalment, total interest and full amortization schedule for any reducing-balance loan.",
    useCase: "What will my monthly instalment be, and how much interest will I pay?",
    action: "Calculate EMI",
    category: "loans",
    status: "live",
    related: ["home-loan-emi", "loan", "car-loan", "loan-prepayment"],
  },
  {
    id: "sip",
    slug: "sip-calculator",
    name: "SIP Calculator",
    description: "Estimate how a monthly investment could grow at an assumed return, with optional yearly step-up and inflation adjustment.",
    useCase: "How much could my monthly SIP be worth after a number of years?",
    action: "Estimate SIP value",
    category: "investing",
    status: "live",
    related: ["salary", "loan-prepayment", "rent-vs-buy", "investment", "retirement"],
    contentUpdated: "2026-10-09",
  },
  {
    id: "loan",
    slug: "loan-calculator",
    name: "Loan Calculator",
    description: "Compare the true cost of personal, education, vehicle or business loans by amount, rate and tenure.",
    useCase: "What does this loan really cost me over its full term?",
    action: "Calculate loan cost",
    category: "loans",
    status: "live",
    related: ["emi", "car-loan", "loan-prepayment", "salary"],
  },
  {
    id: "home-loan",
    slug: "home-loan-calculator",
    name: "Home Loan Calculator",
    description: "Work out loan amount, EMI, LTV and total upfront cash from property price and down payment.",
    useCase: "How much cash do I need, and what will I pay each month to buy this home?",
    action: "Plan a home purchase",
    category: "property",
    status: "live",
    related: ["home-loan-emi", "property-purchase-cost", "loan-prepayment", "home-affordability"],
  },
  {
    id: "home-loan-emi",
    slug: "home-loan-emi-calculator",
    name: "Home Loan EMI Calculator",
    description: "Home loan EMI with year-by-year amortization and the impact of rate and tenure changes.",
    useCase: "What is the EMI on my home loan and how do rate or tenure changes affect it?",
    action: "Calculate home loan EMI",
    category: "property",
    status: "live",
    related: ["home-loan-eligibility", "home-loan", "loan-prepayment", "home-affordability"],
    contentUpdated: "2026-10-09",
  },
  {
    id: "home-loan-eligibility",
    slug: "home-loan-eligibility-calculator",
    name: "Home Loan Eligibility Calculator",
    description: "Estimate the home loan you may qualify for from your income, existing EMIs, age, rate and tenure.",
    useCase: "How much home loan can I get on my salary?",
    action: "Check loan eligibility",
    category: "property",
    status: "live",
    related: ["home-affordability", "home-loan-emi", "salary", "property-purchase-cost"],
    contentUpdated: "2026-10-09",
  },
  {
    id: "home-affordability",
    slug: "home-affordability-calculator",
    name: "Home Affordability Calculator",
    description: "Find a comfortable property budget from your income, expenses, savings and emergency fund.",
    useCase: "How much house can I afford without stretching my budget?",
    action: "Check what I can afford",
    category: "property",
    status: "live",
    related: ["property-purchase-cost", "home-loan-eligibility", "rent-vs-buy", "home-loan"],
  },
  {
    id: "loan-prepayment",
    slug: "loan-prepayment-calculator",
    name: "Loan Prepayment Calculator",
    description: "See how a lump-sum or recurring prepayment cuts your interest, EMI or remaining tenure.",
    useCase: "How much interest will I save by prepaying my loan?",
    action: "Calculate prepayment savings",
    category: "loans",
    status: "live",
    related: ["home-loan-emi", "emi", "sip", "home-loan"],
  },
  {
    id: "rent-vs-buy",
    slug: "rent-vs-buy-calculator",
    name: "Rent vs Buy Calculator",
    description: "Compare your estimated wealth after renting and investing versus buying with a home loan.",
    useCase: "Am I better off renting or buying, on my own assumptions?",
    action: "Compare rent and buy",
    category: "property",
    status: "live",
    related: ["home-affordability", "property-purchase-cost", "sip", "home-loan-emi"],
  },
  {
    id: "property-purchase-cost",
    slug: "property-purchase-cost-calculator",
    name: "Property Purchase Cost Calculator",
    description: "Add up stamp duty, registration, fees and deposits to find the real cash needed to buy a home.",
    useCase: "How much cash do I need upfront, beyond the down payment?",
    action: "Calculate buying cost",
    category: "property",
    status: "live",
    related: ["home-loan", "home-affordability", "home-loan-eligibility", "rent-vs-buy"],
  },
  {
    id: "car-loan",
    slug: "car-loan-calculator",
    name: "Car Loan Calculator",
    description: "Car loan EMI, total interest and upfront cost from the on-road price, with tenure comparison.",
    useCase: "What will my car loan cost each month and in total?",
    action: "Calculate car EMI",
    category: "loans",
    status: "live",
    related: ["emi", "loan", "loan-prepayment", "salary"],
  },
  {
    id: "salary",
    slug: "salary-calculator",
    name: "Salary Calculator",
    description: "Convert CTC to in-hand salary after PF, professional tax and estimated income tax.",
    useCase: "What is my take-home salary from my CTC?",
    action: "Calculate take-home pay",
    category: "tax-income",
    status: "live",
    related: ["home-loan-eligibility", "home-affordability", "sip", "income-tax"],
    contentUpdated: "2026-10-09",
  },
  // ---- Planned (not linked anywhere until status is "live") ----
  {
    id: "income-tax",
    slug: "income-tax-calculator",
    name: "Income Tax Calculator",
    description: "Estimate income tax under the applicable regime.",
    useCase: "How much income tax will I pay?",
    category: "tax-income",
    status: "planned",
    related: ["salary"],
  },
  {
    id: "investment",
    slug: "investment-calculator",
    name: "Investment Calculator",
    description: "Project lump-sum and recurring investment growth.",
    useCase: "How much will my investment grow?",
    category: "investing",
    status: "planned",
    related: ["sip", "retirement"],
  },
  {
    id: "retirement",
    slug: "retirement-calculator",
    name: "Retirement Calculator",
    description: "Estimate the corpus needed for retirement.",
    useCase: "How much do I need to retire?",
    category: "investing",
    status: "planned",
    related: ["sip", "investment"],
  },
];

export function calculatorPath(entry: Pick<CalculatorEntry, "slug">): string {
  return `/calculators/${entry.slug}`;
}

export function getCalculator(id: CalculatorId): CalculatorEntry {
  const entry = CALCULATORS.find((c) => c.id === id);
  if (!entry) throw new Error(`Unknown calculator: ${id}`);
  return entry;
}

export const liveCalculators = (): CalculatorEntry[] => CALCULATORS.filter((c) => c.status === "live");

export function getRelated(id: CalculatorId): { live: CalculatorEntry[]; planned: CalculatorEntry[] } {
  const related = getCalculator(id).related.map(getCalculator);
  return {
    live: related.filter((c) => c.status === "live"),
    planned: related.filter((c) => c.status === "planned"),
  };
}
