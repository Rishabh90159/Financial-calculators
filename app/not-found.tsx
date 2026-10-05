import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { calculatorPath, liveCalculators } from "@/lib/calculators/registry";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Rendered with an HTTP 404 status by Next.js for unknown routes and notFound() calls. */
export default function NotFound() {
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Error 404</p>
      <h1 className="mt-2 text-[1.875rem] font-semibold sm:text-[2.25rem]">Page not found</h1>
      <p className="mt-3 text-lg text-ink-muted">
        The page you are looking for does not exist or may have moved. Check the address, or pick up from one of these
        calculators.
      </p>
      <ul className="mt-6 divide-y divide-line border-y border-line-strong">
        {liveCalculators().map((c) => (
          <li key={c.id}>
            <Link
              href={calculatorPath(c)}
              className="group block py-3 hover:bg-surface sm:px-2"
            >
              <span className="font-semibold text-brand group-hover:underline group-hover:underline-offset-4">{c.name} →</span>
              <span className="mt-1 block text-sm text-ink-muted">{c.useCase}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="rounded-md bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-strong">
          Go to the homepage
        </Link>
        <Link
          href="/calculators"
          className="rounded-md border border-line-strong bg-surface px-4 py-2.5 font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Browse all calculators
        </Link>
      </div>
    </Container>
  );
}
