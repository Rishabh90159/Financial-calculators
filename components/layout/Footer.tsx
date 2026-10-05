import Link from "next/link";
import { CALCULATORS, calculatorPath, CATEGORY_LABELS, type CalculatorCategory } from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function Footer() {
  const live = CALCULATORS.filter((c) => c.status === "live");
  const categories = [...new Set(live.map((c) => c.category))] as CalculatorCategory[];

  return (
    <footer className="mt-16 border-t border-line-strong bg-surface">
      <Container className="py-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-muted">{siteConfig.tagline} Transparent formulas, no sign-up, no data stored.</p>
          </div>
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink">{CATEGORY_LABELS[cat]}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {live
                  .filter((c) => c.category === cat)
                  .map((c) => (
                    <li key={c.id}>
                      <Link href={calculatorPath(c)} className="text-ink-muted hover:text-brand hover:underline">
                        {c.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-ink">Company</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/calculators" className="text-ink-muted hover:text-brand hover:underline">
                  All calculators
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-ink-muted hover:text-brand hover:underline">
                  About &amp; methodology
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-ink-muted hover:text-brand hover:underline">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-ink-muted hover:text-brand hover:underline">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-ink-muted hover:text-brand hover:underline">
                  Terms of use
                </Link>
              </li>
              <li>
                <a href={`tel:${siteConfig.contact.phone}`} className="text-ink-muted hover:text-brand hover:underline">
                  {siteConfig.contact.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-ink-muted">
          All calculations are estimates for informational and educational purposes only and are not financial advice.
          Actual loan terms, interest rates, taxes, fees and investment returns vary. Consult your lender or a qualified
          financial adviser before making decisions. © {siteConfig.name}.
        </p>
      </Container>
    </footer>
  );
}
