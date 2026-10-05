import type { ReactNode } from "react";

export interface ScenarioColumn {
  label: string;
  /** Numeric columns are right-aligned with tabular figures. */
  numeric?: boolean;
}

export interface ScenarioRow {
  /** First cell; rendered as the row header. */
  label: ReactNode;
  cells: ReactNode[];
  /** Marks the row that matches the user's current inputs. */
  current?: boolean;
}

/**
 * Comparison table used by every calculator's scenario section. The wrapper
 * scrolls horizontally on narrow screens (and is keyboard-focusable so it can
 * be scrolled without a mouse); the page itself never overflows.
 */
export function ScenarioTable({
  caption,
  columns,
  rows,
}: {
  /** Accessible description of the table. */
  caption: string;
  /** Includes the first (row header) column. */
  columns: ScenarioColumn[];
  rows: ScenarioRow[];
}) {
  return (
    <div
      className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface"
      tabIndex={0}
      role="region"
      aria-label={`${caption} (scrollable)`}
    >
      <table className="w-full min-w-[30rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line-strong">
            {columns.map((c) => (
              <th
                key={c.label}
                scope="col"
                className={`px-3 py-2 font-semibold whitespace-nowrap text-ink-muted ${c.numeric ? "text-right" : "text-left"}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line tabular-nums">
          {rows.map((r, i) => (
            <tr key={i} className={r.current ? "bg-brand-tint" : undefined}>
              <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">
                {r.label}
                {r.current && <span className="ml-1.5 text-xs font-semibold text-brand">(your inputs)</span>}
              </th>
              {r.cells.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2 whitespace-nowrap ${columns[j + 1]?.numeric === false ? "text-left" : "text-right"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
