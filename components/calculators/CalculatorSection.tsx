import type { ReactNode } from "react";

/**
 * A titled block below the main calculator card (scenarios, insights,
 * comparisons). Separated by a rule rather than boxed, matching the
 * amortization and insights sections.
 */
export function CalculatorSection({
  id,
  title,
  description,
  children,
}: {
  /** Unique id prefix; the heading gets `${id}-heading`. */
  id: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-line pt-6">
      <h2 id={`${id}-heading`} className="text-xl">
        {title}
      </h2>
      {description && <p className="mt-1 max-w-3xl text-sm text-ink-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
