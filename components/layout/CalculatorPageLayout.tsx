import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { calculatorPath, getCalculator, type CalculatorId } from "@/lib/calculators/registry";
import { formatDate } from "@/lib/format";
import { calculatorAppJsonLd, faqJsonLd, type FaqItem } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Container";
import { Disclaimer } from "./Disclaimer";
import { RelatedCalculators } from "./RelatedCalculators";

interface CalculatorPageLayoutProps {
  id: CalculatorId;
  h1: string;
  /** One or two sentences under the H1 answering the core question. */
  intro: ReactNode;
  /** Description used in WebApplication structured data. */
  schemaDescription: string;
  calculator: ReactNode;
  /** Server-rendered article content (H2/H3 sections). */
  children: ReactNode;
  faqs: FaqItem[];
  investmentDisclaimer?: boolean;
  /** References for factual, legal, tax or rate information used on the page. */
  sources?: Source[];
}

export interface Source {
  name: string;
  /** Official page, when one exists. */
  url?: string;
  /** What the source is used for, or when it was last checked. */
  detail?: string;
}

/**
 * Shared page template: everything here is server-rendered HTML. Only the
 * `calculator` slot ships client JavaScript.
 */
export function CalculatorPageLayout({
  id,
  h1,
  intro,
  schemaDescription,
  calculator,
  children,
  faqs,
  investmentDisclaimer,
  sources,
}: CalculatorPageLayoutProps) {
  const entry = getCalculator(id);
  return (
    <>
      <JsonLd data={[calculatorAppJsonLd(entry, schemaDescription), faqJsonLd(faqs)]} />
      <Container className="pt-6 sm:pt-8">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Calculators", path: "/calculators" },
            { name: entry.name, path: calculatorPath(entry) },
          ]}
        />
        <header className="mt-4 max-w-3xl">
          <h1 className="text-[1.875rem] font-semibold sm:text-[2.25rem]">{h1}</h1>
          <div className="mt-2 text-[1.0625rem] leading-relaxed text-ink-muted">{intro}</div>
          <p className="mt-2 text-sm text-ink-muted">
            Last reviewed <time dateTime={siteConfig.contentUpdated}>{formatDate(siteConfig.contentUpdated)}</time> ·{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-brand">
              How we calculate
            </Link>
          </p>
        </header>

        <div className="mt-6">{calculator}</div>

        <div className="mt-6">
          <Disclaimer investment={investmentDisclaimer} />
        </div>

        <article className="prose-fin mt-6">{children}</article>

        <div className="mt-12 max-w-3xl">
          <Faq items={faqs} />
        </div>
        <div className="mt-12">
          <RelatedCalculators id={id} />
        </div>
        <section aria-labelledby="sources-heading" className="mt-12 max-w-3xl border-t border-line pt-6 text-sm text-ink-muted">
          <h2 id="sources-heading" className="text-lg text-ink">
            Sources and methodology
          </h2>
          {sources && sources.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {sources.map((s) => (
                <li key={s.name}>
                  {s.url ? (
                    <a href={s.url} className="text-brand underline underline-offset-2" rel="noopener noreferrer" target="_blank">
                      {s.name}
                    </a>
                  ) : (
                    <span className="text-ink">{s.name}</span>
                  )}
                  {s.detail && <> — {s.detail}</>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2">
            Formulas, rounding and the assumptions shared by every calculator are documented on our{" "}
            <Link href="/methodology" className="text-brand underline underline-offset-2">
              methodology page
            </Link>
            . Found an error? <Link href="/contact" className="text-brand underline underline-offset-2">Tell us</Link>.
          </p>
        </section>
      </Container>
    </>
  );
}
