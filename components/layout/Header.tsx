import Link from "next/link";
import { calculatorPath, liveCalculators } from "@/lib/calculators/registry";
import { siteConfig } from "@/lib/site";
import { Container } from "./Container";
import { Logo } from "./Logo";

/**
 * Site header. The mobile menu is a native <details> disclosure, so navigation
 * works with zero client JavaScript.
 */
export function Header() {
  const calculators = liveCalculators();
  return (
    <header className="border-b border-line bg-paper/95">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${siteConfig.name} home`} className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm font-medium">
            {calculators.map((c) => (
              <li key={c.id}>
                <Link
                  href={calculatorPath(c)}
                  className="rounded-md px-3 py-2 text-ink-muted hover:bg-surface hover:text-ink"
                >
                  {c.name.replace(" Calculator", "")}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/calculators"
                className="ml-1 rounded-md border border-line-strong px-3 py-2 text-ink hover:border-brand hover:text-brand"
              >
                All calculators
              </Link>
            </li>
          </ul>
        </nav>

        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-line-strong px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
            Menu
            <span aria-hidden="true" className="text-ink-muted group-open:rotate-180">
              ▾
            </span>
          </summary>
          <nav
            aria-label="Main"
            className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-line bg-surface p-2 shadow-lg"
          >
            <ul className="text-sm">
              {calculators.map((c) => (
                <li key={c.id}>
                  <Link href={calculatorPath(c)} className="block rounded-md px-3 py-2.5 hover:bg-paper">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li className="mt-1 border-t border-line pt-1">
                <Link href="/calculators" className="block rounded-md px-3 py-2.5 font-semibold text-brand hover:bg-paper">
                  All calculators
                </Link>
              </li>
            </ul>
          </nav>
        </details>
      </Container>
    </header>
  );
}
