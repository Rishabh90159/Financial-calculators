import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Faq } from "@/components/ui/Faq";
import { calculatorPath, getCalculator, type CalculatorId } from "@/lib/calculators/registry";
import { calculatorAppJsonLd, faqJsonLd, type FaqItem } from "@/lib/seo";
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
        <header className="mt-5 max-w-3xl">
          <h1 className="text-[2rem] font-semibold sm:text-[2.6rem]">{h1}</h1>
          <div className="mt-3 text-lg leading-relaxed text-ink-muted">{intro}</div>
        </header>

        <div className="mt-8">{calculator}</div>

        <div className="mt-6">
          <Disclaimer investment={investmentDisclaimer} />
        </div>

        <article className="prose-fin mt-6">{children}</article>

        <div className="mt-14 max-w-3xl">
          <Faq items={faqs} />
        </div>
        <div className="mt-14">
          <RelatedCalculators id={id} />
        </div>
      </Container>
    </>
  );
}
