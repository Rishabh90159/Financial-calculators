import type { ReactNode } from "react";

/**
 * Two-column shell: inputs on the left, results on the right (stacked on mobile).
 * On small screens the results sit below every input, so an optional `summary`
 * renders a bar that sticks to the bottom of the screen while the inputs are in
 * view, showing the headline result live and linking down to the full results.
 */
export function CalculatorCard({
  formLabel,
  inputs,
  results,
  resultsHeading = "Your results",
  summary,
}: {
  formLabel: string;
  inputs: ReactNode;
  results: ReactNode;
  resultsHeading?: string;
  summary?: { label: string; value: string };
}) {
  return (
    // overflow-clip (not hidden) rounds the corners without breaking the sticky summary bar.
    <div className="grid overflow-clip rounded-[var(--radius-card)] border border-line-strong bg-surface lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <form aria-label={formLabel} className="space-y-5 p-4 sm:p-6" onSubmit={(e) => e.preventDefault()} noValidate>
        {inputs}
        {summary && (
          <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex items-center justify-between gap-3 border-t border-brand-strong bg-brand px-4 py-2.5 text-white shadow-[0_-4px_12px_rgb(18_32_47/0.12)] sm:-mx-6 sm:-mb-6 sm:px-6 lg:hidden">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white/80">{summary.label}</p>
              <p className="font-serif text-xl font-semibold tabular-nums">{summary.value}</p>
            </div>
            <a
              href="#results-heading"
              className="shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-tint"
            >
              Full results ↓
            </a>
          </div>
        )}
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
