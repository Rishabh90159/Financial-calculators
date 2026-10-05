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
    <div className="grid overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[0_1px_2px_rgb(18_32_47/0.06),0_8px_24px_-12px_rgb(18_32_47/0.12)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <form
        aria-label={formLabel}
        className="space-y-6 p-5 sm:p-7"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        {inputs}
      </form>
      <section aria-labelledby="results-heading" className="border-t border-line bg-[#fbfaf6] p-5 sm:p-7 lg:border-t-0 lg:border-l">
        <h2 id="results-heading" className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {resultsHeading}
        </h2>
        {results}
      </section>
    </div>
  );
}
