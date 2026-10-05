import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { calculatorPath, liveCalculators } from "@/lib/calculators/registry";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Rendered with an HTTP 404 status by Next.js for unknown routes and notFound() calls. */
export default function NotFound() {
  return (
    <Container className="max-w-3xl py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand">Error 404</p>
      <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-lg text-ink-muted">
        The page you are looking for does not exist or may have moved. Check the address, or pick up from one of these
        calculators.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {liveCalculators().map((c) => (
          <li key={c.id}>
            <Link
              href={calculatorPath(c)}
              className="group block h-full rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-brand"
            >
              <span className="font-semibold text-ink group-hover:text-brand">{c.name} →</span>
              <span className="mt-1 block text-sm text-ink-muted">{c.useCase}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-strong">
          Go to the homepage
        </Link>
        <Link
          href="/calculators"
          className="rounded-lg border border-line-strong bg-surface px-5 py-3 font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Browse all calculators
        </Link>
      </div>
    </Container>
  );
}
