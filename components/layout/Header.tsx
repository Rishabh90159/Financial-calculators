import Link from "next/link";
import { calculatorPath, CATEGORY_LABELS, getCalculator, liveCalculators, type CalculatorCategory, type CalculatorId } from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

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

const barLink =
  "rounded px-2.5 py-2 text-white/85 hover:bg-white/10 hover:text-white";
const barLinkActive = "bg-white/15 font-semibold text-white";
const menuLink = "block px-4 py-2 hover:bg-paper";
const menuLinkActive = "bg-brand-tint font-semibold text-brand";

/**
 * Site header: a sticky brand-coloured bar. The mobile menu is a native <details>
 * disclosure, so navigation works with zero client JavaScript; MobileMenu closes it
 * after navigation once hydrated. NavLink highlights the current page. A few featured
 * calculators are linked on wide screens; the mobile menu lists every calculator,
 * grouped by category.
 */
export function Header() {
  const calculators = liveCalculators();
  const categories = [...new Set(calculators.map((c) => c.category))] as CalculatorCategory[];
  return (
    <header className="site-header sticky top-0 z-40 border-b border-brand-strong bg-brand text-white shadow-[0_2px_8px_rgb(18_32_47/0.15)]">
      <Container className="flex h-14 items-center justify-between gap-4">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="rounded-md">
          <Logo tone="light" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-0.5 text-sm font-medium">
            {FEATURED.map(({ id, label }) => (
              <li key={id} className="hidden lg:block">
                <NavLink href={calculatorPath(getCalculator(id))} className={barLink} activeClassName={barLinkActive}>
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="lg:ml-1.5">
              <NavLink
                href="/calculators"
                className="rounded-md bg-white px-3 py-1.5 font-semibold text-brand hover:bg-brand-tint"
                activeClassName="ring-2 ring-white/60 ring-offset-2 ring-offset-brand"
              >
                <span className="lg:hidden">Calculators</span>
                <span className="hidden lg:inline">All calculators</span>
              </NavLink>
            </li>
            {SITE_LINKS.map((l, i) => (
              <li key={l.href} className={i === 0 ? "ml-2 border-l border-white/30 pl-2" : undefined}>
                <NavLink href={l.href} className={barLink} activeClassName={barLinkActive}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <MobileMenu
          summary={
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-white/50 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Menu
            </summary>
          }
        >
          <nav
            aria-label="Main"
            className="menu-panel absolute right-0 z-20 mt-3 max-h-[calc(100dvh-5rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-md border border-line-strong bg-surface py-2 text-ink shadow-[0_8px_24px_rgb(18_32_47/0.18)]"
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
                        <NavLink href={calculatorPath(c)} className={menuLink} activeClassName={menuLinkActive}>
                          {c.name}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <NavLink
              href="/calculators"
              className="block border-t border-line px-4 py-2.5 font-semibold text-brand hover:bg-paper"
              activeClassName="bg-brand-tint"
            >
              All calculators
            </NavLink>
            <ul className="mt-1 border-t border-line pt-1 text-[0.95rem]">
              {SITE_LINKS.map((l) => (
                <li key={l.href}>
                  <NavLink href={l.href} className="block px-4 py-2.5 hover:bg-paper" activeClassName={menuLinkActive}>
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </MobileMenu>
      </Container>
    </header>
  );
}
