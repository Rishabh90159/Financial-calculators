import type { ReactNode } from "react";

/** Two-column shell: inputs on the left, results on the right (stacked on mobile). */
export function CalculatorCard({
  formLabel,
  inputs,
  results,
  resultsHeading = "Your results",
}: {
  formLabel: string;
  inputs: ReactNode;
  results: ReactNode;
  resultsHeading?: string;
}) {
  return (
    <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <form
        aria-label={formLabel}
        className="space-y-5 p-4 sm:p-6"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        {inputs}
      </form>
      <section aria-labelledby="results-heading" className="border-t border-line bg-[#fbfaf6] p-4 sm:p-6 lg:border-t-0 lg:border-l">
        <h2 id="results-heading" className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {resultsHeading}
        </h2>
        {results}
      </section>
    </div>
  );
}
