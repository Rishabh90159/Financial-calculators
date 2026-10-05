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
    <section aria-labelledby="related-heading" className="max-w-3xl">
      <h2 id="related-heading" className="text-[1.4rem]">
        Related calculators
      </h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {live.map((c) => (
          <li key={c.id}>
            <Link href={calculatorPath(c)} className="group flex items-baseline justify-between gap-4 py-3 hover:bg-surface sm:px-2">
              <span>
                <span className="font-semibold text-brand group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                <span className="mt-0.5 block text-sm text-ink-muted">{c.useCase}</span>
              </span>
              <span aria-hidden="true" className="text-brand">
                →
              </span>
            </Link>
          </li>
        ))}
        {planned.map((c) => (
          <li key={c.id} className="py-3 sm:px-2">
            <span className="font-semibold text-ink-muted">{c.name}</span>
            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-ink-muted">· Coming soon</span>
            <span className="mt-0.5 block text-sm text-ink-muted">{c.useCase}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
