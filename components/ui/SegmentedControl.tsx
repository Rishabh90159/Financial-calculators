"use client";

import { useId } from "react";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Native radio group styled as a segmented control: arrow keys move between
 * options and screen readers announce it as a radio group with a legend.
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  hideLegend = false,
}: {
  legend: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Keep the legend for screen readers only, when a visible heading already labels the control. */
  hideLegend?: boolean;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-1.5 text-sm font-semibold text-ink"}>{legend}</legend>
      <div className="inline-flex max-w-full flex-wrap rounded-md border border-line-strong p-0.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer rounded px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand ${
              value === o.value ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
