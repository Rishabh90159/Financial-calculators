import Link from "next/link";
import { calculatorPath, CATEGORY_LABELS, getCalculator, liveCalculators, type CalculatorCategory, type CalculatorId } from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site";
import { Container } from "./Container";
import { Logo } from "./Logo";

const SITE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
];

/** The most-used calculators get a direct link on wide screens; everything else is one click away. */
const FEATURED: { id: CalculatorId; label: string }[] = [
  { id: "emi", label: "EMI" },
  { id: "home-loan-emi", label: "Home Loan EMI" },
  { id: "home-loan-eligibility", label: "Eligibility" },
  { id: "sip", label: "SIP" },
  { id: "salary", label: "Salary" },
];

/**
 * Site header. The mobile menu is a native <details> disclosure, so navigation
 * works with zero client JavaScript. A few featured calculators are linked on wide
 * screens; the mobile menu lists every calculator, grouped by category.
 */
export function Header() {
  const calculators = liveCalculators();
  const categories = [...new Set(calculators.map((c) => c.category))] as CalculatorCategory[];
  return (
    <header className="border-b border-line bg-paper">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center text-sm font-medium">
            {FEATURED.map(({ id, label }) => (
              <li key={id} className="hidden lg:block">
                <Link href={calculatorPath(getCalculator(id))} className="rounded px-2.5 py-2 text-ink-muted hover:text-ink hover:underline hover:underline-offset-4">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/calculators" className="rounded px-2.5 py-2 font-semibold text-ink hover:text-brand">
                <span className="lg:hidden">Calculators</span>
                <span className="hidden lg:inline">All calculators</span>
              </Link>
            </li>
            {SITE_LINKS.map((l, i) => (
              <li key={l.href} className={i === 0 ? "ml-2 border-l border-line-strong pl-2" : undefined}>
                <Link href={l.href} className="rounded px-2.5 py-2 text-ink-muted hover:text-ink hover:underline hover:underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-line-strong px-3 py-1.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            Menu
            <span aria-hidden="true" className="text-ink-muted group-open:rotate-180">
              ▾
            </span>
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 z-20 mt-2 max-h-[calc(100dvh-5rem)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-line-strong bg-surface py-2 shadow-[0_4px_12px_rgb(18_32_47/0.08)]"
          >
            {categories.map((cat) => (
              <div key={cat} className="pb-1">
                <p className="px-4 pt-1.5 pb-0.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {CATEGORY_LABELS[cat]}
                </p>
                <ul className="text-[0.95rem]">
                  {calculators
                    .filter((c) => c.category === cat)
                    .map((c) => (
                      <li key={c.id}>
                        <Link href={calculatorPath(c)} className="block px-4 py-2 hover:bg-paper">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <Link href="/calculators" className="block border-t border-line px-4 py-2.5 font-semibold text-brand hover:bg-paper">
              All calculators
            </Link>
            <ul className="mt-1 border-t border-line pt-1 text-[0.95rem]">
              {SITE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block px-4 py-2.5 hover:bg-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </Container>
    </header>
  );
}
