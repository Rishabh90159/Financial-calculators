import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { CALCULATORS, calculatorPath, CATEGORY_LABELS, liveCalculators, type CalculatorCategory } from "@/lib/calculators/registry";
import { buildMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const metadata = buildMetadata({
  title: "All Financial Calculators – EMI, SIP, Loan & Home Loan",
  description:
    "All our free financial calculators in one place: EMI, SIP, personal loan, home loan and home loan EMI. Find the right tool for your question and get an answer in seconds.",
  path: "/calculators",
});

const CHOOSER = [
  { q: "I know my loan amount and want the monthly EMI", id: "emi" },
  { q: "I want to compare personal, car or education loan offers", id: "loan" },
  { q: "I am buying a home and want to know the cash I need", id: "home-loan" },
  { q: "I want the EMI and schedule for a specific home loan", id: "home-loan-emi" },
  { q: "I want to see how a monthly investment could grow", id: "sip" },
] as const;

export default function CalculatorsPage() {
  const live = liveCalculators();
  const categories = [...new Set(live.map((c) => c.category))] as CalculatorCategory[];
  const planned = CALCULATORS.filter((c) => c.status === "planned");

  return (
    <Container className="pt-6 sm:pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Financial calculators",
          itemListElement: live.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(calculatorPath(c)),
            name: c.name,
          })),
        }}
      />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
        ]}
      />
      <header className="mt-5 max-w-3xl">
        <h1 className="text-[2rem] font-semibold sm:text-[2.6rem]">Financial calculators</h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-muted">
          Free tools for borrowing and investing decisions. Each calculator answers one specific question, shows its
          formula, and explains what the result means for you.
        </p>
      </header>

      <section aria-labelledby="chooser-heading" className="mt-10 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6">
        <h2 id="chooser-heading" className="text-xl font-semibold">
          Which calculator do I need?
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {CHOOSER.map((item) => {
            const c = live.find((x) => x.id === item.id);
            if (!c) return null;
            return (
              <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-ink-muted">{item.q}</span>
                <Link href={calculatorPath(c)} className="shrink-0 font-semibold text-brand underline-offset-4 hover:underline">
                  {c.name} →
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {categories.map((cat) => (
        <section key={cat} aria-labelledby={`cat-${cat}`} className="mt-12">
          <h2 id={`cat-${cat}`} className="text-2xl font-semibold">
            {CATEGORY_LABELS[cat]}
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {live
              .filter((c) => c.category === cat)
              .map((c) => (
                <li key={c.id}>
                  <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6">
                    <h3 className="text-xl font-semibold">
                      <Link href={calculatorPath(c)} className="hover:text-brand">
                        {c.name}
                      </Link>
                    </h3>
                    <p className="mt-2 text-ink-muted">{c.description}</p>
                    <p className="mt-3 text-sm">
                      <span className="font-semibold text-ink">Use it to answer: </span>
                      <span className="text-ink-muted">{c.useCase}</span>
                    </p>
                    <Link
                      href={calculatorPath(c)}
                      className="mt-5 self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
                      aria-label={`Open the ${c.name}`}
                    >
                      Open calculator
                    </Link>
                  </article>
                </li>
              ))}
          </ul>
        </section>
      ))}

      {planned.length > 0 && (
        <section aria-labelledby="planned-heading" className="mt-14">
          <h2 id="planned-heading" className="text-2xl font-semibold">
            Coming soon
          </h2>
          <p className="mt-2 text-ink-muted">We are working on more calculators for property, income and long-term planning.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {planned.map((c) => (
              <li key={c.id} className="rounded-full border border-dashed border-line-strong px-3 py-1 text-sm text-ink-muted">
                {c.name}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}
