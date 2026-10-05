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
  // Planned
  | "home-affordability"
  | "loan-eligibility"
  | "rent-vs-buy"
  | "loan-prepayment"
  | "property-purchase-cost"
  | "salary"
  | "income-tax"
  | "investment"
  | "retirement"
  | "car-loan";

export type CalculatorCategory = "loans" | "property" | "investing" | "tax-income";

export interface CalculatorEntry {
  id: CalculatorId;
  slug: string;
  name: string;
  /** One sentence describing what it calculates. */
  description: string;
  /** The question it answers for the user. */
  useCase: string;
  category: CalculatorCategory;
  status: "live" | "planned";
  related: CalculatorId[];
}

export const CATEGORY_LABELS: Record<CalculatorCategory, string> = {
  loans: "Loans & EMI",
  property: "Property",
  investing: "Investing",
  "tax-income": "Tax & income",
};

export const CALCULATORS: readonly CalculatorEntry[] = [
  {
    id: "emi",
    slug: "emi-calculator",
    name: "EMI Calculator",
    description: "Monthly instalment, total interest and full amortization schedule for any reducing-balance loan.",
    useCase: "What will my monthly instalment be, and how much interest will I pay?",
    category: "loans",
    status: "live",
    related: ["home-loan-emi", "loan", "home-loan", "loan-prepayment"],
  },
  {
    id: "sip",
    slug: "sip-calculator",
    name: "SIP Calculator",
    description: "Estimate how a fixed monthly investment could grow over time at an assumed rate of return.",
    useCase: "How much could my monthly SIP be worth after a number of years?",
    category: "investing",
    status: "live",
    related: ["investment", "retirement", "emi"],
  },
  {
    id: "loan",
    slug: "loan-calculator",
    name: "Loan Calculator",
    description: "Compare the true cost of personal, education, vehicle or business loans by amount, rate and tenure.",
    useCase: "What does this loan really cost me over its full term?",
    category: "loans",
    status: "live",
    related: ["emi", "loan-eligibility", "car-loan", "loan-prepayment"],
  },
  {
    id: "home-loan",
    slug: "home-loan-calculator",
    name: "Home Loan Calculator",
    description: "Work out loan amount, EMI, LTV and total upfront cash from property price and down payment.",
    useCase: "How much cash do I need, and what will I pay each month to buy this home?",
    category: "property",
    status: "live",
    related: ["home-loan-emi", "rent-vs-buy", "home-affordability", "property-purchase-cost"],
  },
  {
    id: "home-loan-emi",
    slug: "home-loan-emi-calculator",
    name: "Home Loan EMI Calculator",
    description: "Home loan EMI with year-by-year amortization and the impact of rate and tenure changes.",
    useCase: "What is the EMI on my home loan and how do rate or tenure changes affect it?",
    category: "property",
    status: "live",
    related: ["home-loan", "home-affordability", "emi", "loan-prepayment"],
  },
  // ---- Planned (not linked anywhere until status is "live") ----
  {
    id: "home-affordability",
    slug: "home-affordability-calculator",
    name: "Home Affordability Calculator",
    description: "Estimate the property price you can afford from income, savings and existing EMIs.",
    useCase: "How expensive a home can I afford?",
    category: "property",
    status: "planned",
    related: ["home-loan", "home-loan-emi"],
  },
  {
    id: "loan-eligibility",
    slug: "loan-eligibility-calculator",
    name: "Loan Eligibility Calculator",
    description: "Estimate the maximum loan lenders may offer based on income and obligations.",
    useCase: "How much can I borrow?",
    category: "loans",
    status: "planned",
    related: ["loan", "emi"],
  },
  {
    id: "rent-vs-buy",
    slug: "rent-vs-buy-calculator",
    name: "Rent vs Buy Calculator",
    description: "Compare the long-term cost of renting against buying a home.",
    useCase: "Should I rent or buy?",
    category: "property",
    status: "planned",
    related: ["home-loan", "sip"],
  },
  {
    id: "loan-prepayment",
    slug: "loan-prepayment-calculator",
    name: "Loan Prepayment Calculator",
    description: "See how part-prepayments reduce interest and tenure.",
    useCase: "How much will I save by prepaying my loan?",
    category: "loans",
    status: "planned",
    related: ["emi", "home-loan-emi"],
  },
  {
    id: "property-purchase-cost",
    slug: "property-purchase-cost-calculator",
    name: "Property Purchase Cost Calculator",
    description: "Total cost of buying property including duties and fees.",
    useCase: "What will this property really cost me to buy?",
    category: "property",
    status: "planned",
    related: ["home-loan"],
  },
  {
    id: "salary",
    slug: "salary-calculator",
    name: "Salary Calculator",
    description: "Convert CTC to in-hand monthly salary.",
    useCase: "What is my take-home pay?",
    category: "tax-income",
    status: "planned",
    related: ["income-tax"],
  },
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
  {
    id: "car-loan",
    slug: "car-loan-calculator",
    name: "Car Loan Calculator",
    description: "EMI and total cost of a car loan.",
    useCase: "What will my car loan cost?",
    category: "loans",
    status: "planned",
    related: ["loan", "emi"],
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
