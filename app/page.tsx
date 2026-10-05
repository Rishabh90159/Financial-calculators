import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { calculatorPath, getCalculator, liveCalculators } from "@/lib/calculators/registry";
import { buildMetadata, faqJsonLd, websiteJsonLd, type FaqItem } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = buildMetadata({
  title: `EMI, SIP & Home Loan Calculators — ${siteConfig.name}`,
  description:
    "Free EMI, SIP, loan and home loan calculators with amortization schedules, clear formulas and plain-English explanations. No sign-up, nothing stored.",
  path: "/",
  absoluteTitle: true,
});

const POPULAR = [
  {
    question: "EMI on a ₹50 lakh home loan for 20 years",
    answer: "₹43,391 a month at 8.5%",
    detail: "Total interest ≈ ₹54.1 lakh",
    id: "home-loan-emi" as const,
  },
  {
    question: "₹10,000 a month SIP for 10 years",
    answer: "≈ ₹23.2 lakh at 12% a year",
    detail: "On ₹12 lakh invested",
    id: "sip" as const,
  },
  {
    question: "EMI on a ₹5 lakh personal loan for 3 years",
    answer: "₹16,607 a month at 12%",
    detail: "Total interest ≈ ₹97,858",
    id: "loan" as const,
  },
  {
    question: "Upfront cash for an ₹80 lakh home",
    answer: "₹16 lakh down payment at 20%",
    detail: "Plus stamp duty and registration",
    id: "home-loan" as const,
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

export default function HomePage() {
  const calculators = liveCalculators();

  return (
    <>
      <JsonLd data={[websiteJsonLd(), faqJsonLd(FAQS)]} />

      {/* Hero */}
      <section className="border-b border-line">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Free financial calculators</p>
            <h1 className="mt-3 text-[2.5rem] font-semibold leading-[1.08] sm:text-6xl">
              Financial calculations
              <br />
              made simple.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
              Work out your EMI, plan a SIP or cost a home purchase in seconds. Every result shows the formula behind it,
              in plain language, so you understand what you are signing up for.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={calculatorPath(getCalculator("emi"))}
                className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-strong"
              >
                Calculate EMI
              </Link>
              <Link
                href="/calculators"
                className="rounded-lg border border-line-strong bg-surface px-5 py-3 font-semibold text-ink hover:border-brand hover:text-brand"
              >
                Browse all calculators
              </Link>
            </div>
          </div>

          {/* A static worked example: a real calculation, not decoration. */}
          <figure className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[0_8px_30px_-12px_rgb(18_32_47/0.18)]">
            <figcaption className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Example · Home loan
            </figcaption>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-line pb-3">
                <dt className="text-ink-muted">Loan amount</dt>
                <dd className="font-semibold tabular-nums">₹50,00,000</dd>
              </div>
              <div className="flex justify-between border-b border-line pb-3">
                <dt className="text-ink-muted">Interest rate · Tenure</dt>
                <dd className="font-semibold tabular-nums">8.5% · 20 years</dd>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="text-ink-muted">Monthly EMI</dt>
                <dd className="font-serif text-3xl font-semibold tabular-nums">₹43,391</dd>
              </div>
            </dl>
            <div className="mt-5" aria-hidden="true">
              <div className="flex h-3 overflow-hidden rounded-full">
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
              className="mt-4 inline-block text-sm font-semibold text-brand underline underline-offset-4"
            >
              Try your own numbers →
            </Link>
          </figure>
        </Container>
      </section>

      {/* Featured calculators */}
      <section aria-labelledby="featured-heading" className="py-16">
        <Container>
          <h2 id="featured-heading" className="text-3xl font-semibold">
            Calculators
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Five focused tools, each built around one question people ask before borrowing or investing.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calculators.map((c, i) => (
              <li key={c.id} className={i === 0 ? "lg:row-span-1" : ""}>
                <Link
                  href={calculatorPath(c)}
                  className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 hover:border-brand"
                >
                  <span className="font-serif text-xl font-semibold text-ink group-hover:text-brand">{c.name}</span>
                  <span className="mt-2 text-sm text-ink-muted">{c.description}</span>
                  <span className="mt-4 border-t border-line pt-3 text-sm italic text-ink">&ldquo;{c.useCase}&rdquo;</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Popular calculations */}
      <section aria-labelledby="popular-heading" className="border-y border-line bg-surface py-16">
        <Container>
          <h2 id="popular-heading" className="text-3xl font-semibold">
            Popular calculations
          </h2>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Quick answers to common questions, worked out with the same formulas as the calculators. Rates are
            illustrative, so plug in the rate you are actually offered.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR.map((p) => (
              <li key={p.question} className="flex flex-col rounded-[var(--radius-card)] border border-line p-5">
                <h3 className="font-sans text-sm font-semibold leading-snug text-ink-muted">{p.question}</h3>
                <p className="mt-3 font-serif text-xl font-semibold leading-snug text-ink">{p.answer}</p>
                <p className="mt-1 text-sm text-ink-muted">{p.detail}</p>
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
      <section className="py-16">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Why use {siteConfig.name}</h2>
            <dl className="mt-6 space-y-5">
              {[
                ["Formulas you can check", "Every page shows the exact formula and a worked example, so the numbers are never a black box."],
                ["Private by design", "Calculations run in your browser. We do not ask for your name, phone number or income, and we never store what you enter."],
                ["Beyond a single number", "See total interest, amortization schedules, and what happens if the rate or tenure changes. That is the context that matters for a decision."],
                ["Fast on any phone", "Light pages with no pop-ups or heavy scripts, built to load quickly even on slow mobile connections."],
              ].map(([title, body]) => (
                <div key={title} className="border-l-2 border-brand pl-4">
                  <dt className="font-semibold text-ink">{title}</dt>
                  <dd className="mt-1 text-ink-muted">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-3xl font-semibold">How the calculators work</h2>
            <ol className="mt-6 space-y-5">
              {[
                ["Enter your numbers", "Type a value or drag the slider. Amounts are shown in lakh and crore as you go."],
                ["See results instantly", "Results update as you type: EMI or future value, totals, and a visual breakdown."],
                ["Understand the trade-offs", "Key insights show how rate and tenure changes would affect what you pay."],
                ["Verify with your lender", "Use the estimate to compare offers and ask better questions, then confirm the final terms."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-brand"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="mt-1 text-ink-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className="pb-4">
        <Container className="max-w-3xl">
          <Faq items={FAQS} />
          <p className="mt-6 text-sm text-ink-muted">
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
