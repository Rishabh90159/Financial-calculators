import Link from "next/link";
import { calculatorPath, getRelated, type CalculatorId } from "@/lib/calculators/registry";

/**
 * Related-calculator links driven by the registry. Planned calculators are
 * listed as "coming soon" without a link; flipping their status to "live"
 * turns them into links automatically.
 */
export function RelatedCalculators({ id }: { id: CalculatorId }) {
  const { live, planned } = getRelated(id);
  if (live.length === 0 && planned.length === 0) return null;

  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-2xl sm:text-[1.625rem]">
        Related calculators
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {live.map((c) => (
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
        {planned.map((c) => (
          <li key={c.id} className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-4">
            <span className="font-semibold text-ink-muted">{c.name}</span>
            <span className="ml-2 rounded bg-paper px-1.5 py-0.5 text-xs font-medium text-ink-muted">Coming soon</span>
            <span className="mt-1 block text-sm text-ink-muted">{c.useCase}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
