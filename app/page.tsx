import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { calculatorPath, getCalculator, liveCalculators, type CalculatorId } from "@/lib/calculators/registry";
import { buildMetadata, faqJsonLd, type FaqItem } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: `Free Financial Calculators – EMI, SIP & Home Loan | ${siteConfig.name}`,
  description:
    "Free financial calculators for EMI, home loans, SIP returns, loans and more. Calculate monthly payments, interest, returns and repayment schedules with MoneyMetric.",
  path: "/",
  absoluteTitle: true,
});

interface PopularCalculation {
  question: string;
  /** The assumption the figures depend on, stated next to them. */
  basis: string;
  figures: [label: string, value: string][];
  note?: string;
  id: CalculatorId;
}

/** Worked out with the same functions the calculators use; see lib/calculations tests. */
const POPULAR: PopularCalculation[] = [
  {
    question: "EMI on a ₹50 lakh home loan for 20 years",
    basis: "At 8.5% a year",
    figures: [
      ["Monthly EMI", "₹43,391"],
      ["Total interest", "≈ ₹54.1 lakh"],
    ],
    id: "home-loan-emi",
  },
  {
    question: "₹10,000 a month SIP for 10 years",
    basis: "Assuming 12% a year",
    figures: [
      ["Estimated value", "≈ ₹23.2 lakh"],
      ["Amount invested", "₹12 lakh"],
    ],
    id: "sip",
  },
  {
    question: "EMI on a ₹5 lakh personal loan for 3 years",
    basis: "At 12% a year",
    figures: [
      ["Monthly EMI", "₹16,607"],
      ["Total interest", "≈ ₹97,858"],
    ],
    id: "loan",
  },
  {
    question: "Upfront cash for an ₹80 lakh home",
    basis: "With a 20% down payment",
    figures: [
      ["Down payment", "₹16 lakh"],
      ["Loan amount", "₹64 lakh"],
    ],
    note: "Plus stamp duty and registration",
    id: "home-loan",
  },
];

const FAQS: FaqItem[] = [
  {
    question: "Are these calculators free to use?",
    answer:
      "Yes. Every calculator is free, needs no sign-up and runs entirely in your browser. The numbers you enter are not sent to or stored on any server.",
  },
  {
    question: "How accurate are the results?",
    answer:
      "The calculators use the standard formulas lenders and fund houses use: the reducing-balance EMI formula for loans and the annuity-due future-value formula for SIPs. They are checked by automated tests against published reference values. Your lender's figures may differ slightly because of rounding, processing fees, broken-period interest or rate changes.",
  },
  {
    question: "Can I rely on these numbers to take a loan or invest?",
    answer:
      "Use them to understand and compare options, not as a final quote. Actual interest rates, fees, taxes and investment returns depend on your lender, credit profile and market conditions. Confirm terms with your lender or a qualified adviser before deciding.",
  },
  {
    question: "Which calculator should I use for a home loan?",
    answer:
      "Use the Home Loan EMI Calculator if you already know the loan amount and want the monthly EMI and repayment schedule. Use the Home Loan Calculator if you are starting from the property price and want to see the down payment, loan amount, loan-to-value ratio and total cash needed upfront.",
  },
];

const PRINCIPLES = [
  ["Formulas you can check", "Every page shows the exact formula and a worked example, so the numbers are never a black box."],
  ["Nothing stored", "Calculations run in your browser. We do not ask for your name, phone number or income, and we never store what you enter."],
  ["More than one number", "See total interest, amortization schedules, and what happens if the rate or tenure changes. That is the context that matters for a decision."],
  ["Fast on any phone", "Light pages with no pop-ups or heavy scripts, built to load quickly even on slow mobile connections."],
] as const;

const STEPS = [
  ["Enter your numbers", "Type a value or drag the slider. Amounts are shown in lakh and crore as you go."],
  ["See results as you type", "EMI or future value, totals, and a visual breakdown update instantly."],
  ["Compare scenarios", "Key insights show how rate and tenure changes would affect what you pay."],
  ["Confirm with your lender", "Use the estimate to compare offers and ask better questions, then confirm the final terms."],
] as const;

export default function HomePage() {
  const calculators = liveCalculators();

  return (
    <>
      <JsonLd data={faqJsonLd(FAQS)} />

      {/* Hero */}
      <section className="border-b border-line">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-14">
          <div>
            <p className="text-sm font-semibold text-brand">{siteConfig.name}</p>
            <h1 className="mt-2 max-w-2xl text-[1.875rem] font-semibold leading-[1.15] sm:text-[2.5rem]">
              Free Financial Calculators for Loans, EMI, SIP &amp; Home Loans
            </h1>
            <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-ink-muted">
              <strong className="font-semibold text-ink">Calculate before you commit.</strong> Work out your EMI, plan a
              SIP or cost a home purchase in seconds. Every result shows the formula behind it, in plain language, so you
              understand what you are signing up for.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={calculatorPath(getCalculator("emi"))}
                className="rounded-md bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-strong"
              >
                Calculate EMI
              </Link>
              <Link
                href="/calculators"
                className="rounded-md border border-line-strong bg-surface px-4 py-2.5 font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Browse all calculators
              </Link>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-2 text-sm text-ink-muted">
              {["No sign-up", "No data stored", "Free to use"].map((item, i) => (
                <li key={item} className="flex gap-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* A static worked example: a real calculation, not decoration. */}
          <figure className="rounded-[var(--radius-card)] border border-line-strong bg-surface p-5">
            <figcaption className="text-sm font-semibold text-ink">Example: ₹50 lakh home loan</figcaption>
            <dl className="mt-3 text-sm">
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-ink-muted">Loan amount</dt>
                <dd className="font-semibold tabular-nums">₹50,00,000</dd>
              </div>
              <div className="flex justify-between border-b border-line py-2">
                <dt className="text-ink-muted">Interest rate · Tenure</dt>
                <dd className="font-semibold tabular-nums">8.5% · 20 years</dd>
              </div>
              <div className="flex items-baseline justify-between pt-3">
                <dt className="text-ink-muted">Monthly EMI</dt>
                <dd className="font-serif text-[1.75rem] font-semibold tabular-nums">₹43,391</dd>
              </div>
            </dl>
            <div className="mt-4" aria-hidden="true">
              <div className="flex h-2 overflow-hidden rounded-sm">
                <div className="bg-brand" style={{ width: "48%" }} />
                <div className="bg-accent bg-[repeating-linear-gradient(45deg,transparent_0_2px,rgb(255_255_255/0.45)_2px_4px)]" style={{ width: "52%" }} />
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Over 20 years you would repay about <strong className="text-ink">₹1.04 crore</strong>. More than half of
              that, about ₹54.1 lakh, is interest.
            </p>
            <Link
              href={calculatorPath(getCalculator("home-loan-emi"))}
              className="mt-3 inline-block text-sm font-semibold text-brand underline underline-offset-4"
            >
              Try your own numbers →
            </Link>
          </figure>
        </Container>
      </section>

      {/* Calculator directory */}
      <section aria-labelledby="featured-heading" className="py-10 sm:py-12">
        <Container>
          <h2 id="featured-heading" className="text-[1.5rem] font-semibold">
            Calculators
          </h2>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Five focused tools, each built around one question people ask before borrowing or investing.
          </p>
          <ul className="mt-5 divide-y divide-line border-y border-line-strong">
            {calculators.map((c) => (
              <li key={c.id}>
                <Link
                  href={calculatorPath(c)}
                  className="group grid gap-1 py-4 hover:bg-surface sm:px-3 lg:grid-cols-[15rem_1fr_auto] lg:items-baseline lg:gap-6"
                >
                  <span className="font-serif text-lg font-semibold text-ink group-hover:text-brand">{c.name}</span>
                  <span className="text-ink-muted">
                    {c.description} <span className="text-sm">{c.useCase}</span>
                  </span>
                  <span className="text-sm font-semibold text-brand group-hover:underline group-hover:underline-offset-4">
                    {c.action ?? `Open ${c.name}`} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Popular calculations */}
      <section aria-labelledby="popular-heading" className="border-y border-line bg-surface py-10 sm:py-12">
        <Container>
          <h2 id="popular-heading" className="text-[1.5rem] font-semibold">
            Popular calculations
          </h2>
          <p className="mt-1 max-w-2xl text-ink-muted">
            Quick answers to common questions, worked out with the same formulas as the calculators. Rates are
            illustrative, so plug in the rate you are actually offered.
          </p>
          <ul className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR.map((p) => (
              <li key={p.question} className="flex flex-col bg-surface p-4">
                <h3 className="font-sans text-[0.95rem] font-semibold leading-snug text-ink">{p.question}</h3>
                <p className="mt-0.5 text-xs text-ink-muted">{p.basis}</p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  {p.figures.map(([label, value], i) => (
                    <div key={label} className="flex items-baseline justify-between gap-3">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className={`font-semibold tabular-nums ${i === 0 ? "font-serif text-lg text-ink" : "text-ink"}`}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {p.note && <p className="mt-1.5 text-xs text-ink-muted">{p.note}</p>}
                <Link
                  href={calculatorPath(getCalculator(p.id))}
                  className="mt-auto pt-4 text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  {getCalculator(p.id).name} →
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Why + How */}
      <section className="py-10 sm:py-12">
        <Container className="space-y-10">
          <div>
            <h2 className="text-[1.5rem] font-semibold">Why use {siteConfig.name}</h2>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {PRINCIPLES.map(([title, body]) => (
                <div key={title} className="border-t border-line-strong pt-3">
                  <dt className="font-semibold text-ink">{title}</dt>
                  <dd className="mt-1 text-[0.95rem] text-ink-muted">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-[1.5rem] font-semibold">How the calculators work</h2>
            <ol className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(([title, body], i) => (
                <li key={title} className="border-t border-line-strong pt-3">
                  <p className="font-semibold text-ink">
                    <span aria-hidden="true" className="mr-2 font-mono text-sm text-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {title}
                  </p>
                  <p className="mt-1 text-[0.95rem] text-ink-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section aria-labelledby="guide-heading" className="border-t border-line py-10 sm:py-12">
        <Container>
          <div className="prose-fin">
            <h2 id="guide-heading" className="mt-0!">Financial calculators built for Indian borrowers and investors</h2>
            <p>
              {siteConfig.name} is a set of free financial calculators that use Indian conventions: amounts in lakh and
              crore, monthly EMIs on a reducing balance, and monthly SIP instalments. They are meant to help you plan and
              compare before you speak to a lender or invest, not to replace the final terms you are offered.
            </p>
            <p>
              If you already know how much you want to borrow, the{" "}
              <Link href={calculatorPath(getCalculator("emi"))}>EMI calculator</Link> gives your monthly instalment, total
              interest and a full amortization schedule. For personal, car, education or business loans, the{" "}
              <Link href={calculatorPath(getCalculator("loan"))}>loan calculator</Link> lets you enter tenure in months and
              compare offers on total repayment rather than EMI alone.
            </p>
            <p>
              Buying a home usually raises two separate questions. The{" "}
              <Link href={calculatorPath(getCalculator("home-loan"))}>home loan calculator</Link> starts from the property
              price and shows the down payment, loan-to-value ratio and cash you need upfront. The{" "}
              <Link href={calculatorPath(getCalculator("home-loan-emi"))}>home loan EMI calculator</Link> focuses on the
              loan itself, showing how the rate and tenure change your EMI and the interest you pay over 20 or 30 years.
            </p>
            <p>
              For saving and investing, the <Link href={calculatorPath(getCalculator("sip"))}>SIP calculator</Link>{" "}
              estimates what a fixed monthly investment could grow to at a return you choose. Testing a few different
              returns is more useful than relying on one number, because market-linked returns are never guaranteed.
            </p>
            <p>
              The formulas, assumptions and rounding used by every calculator are explained on our{" "}
              <Link href="/about#methodology">methodology page</Link>.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-4">
        <Container className="max-w-3xl">
          <Faq items={FAQS} />
          <p className="mt-5 text-sm text-ink-muted">
            Results are estimates for educational purposes, not financial advice.{" "}
            <Link href="/disclaimer" className="text-brand underline underline-offset-2">
              Read the disclaimer
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
