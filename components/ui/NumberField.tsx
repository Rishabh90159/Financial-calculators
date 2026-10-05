"use client";

import { useId, useState, type CSSProperties } from "react";
import { amountInWords, formatNumber, parseNumberInput } from "@/lib/format";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Shown before the input, e.g. "₹". */
  prefix?: string;
  /** Shown after the input, e.g. "%" or "years". */
  suffix?: string;
  /** Short helper text under the field. */
  hint?: string;
  /** Show "12.5 lakh" style helper for rupee amounts. */
  showWords?: boolean;
  /** Fires on the first user interaction, for analytics. */
  onInteract?: (kind: "slider" | "input") => void;
}

function validate(raw: string, min: number, max: number, label: string): { value: number | null; error: string | null } {
  const parsed = parseNumberInput(raw);
  if (raw.trim() === "") return { value: null, error: `Enter ${label.toLowerCase()}.` };
  if (parsed === null) return { value: null, error: "Enter a valid number using digits only." };
  if (parsed < min) return { value: null, error: `Must be at least ${formatNumber(min)}.` };
  if (parsed > max) return { value: null, error: `Must be ${formatNumber(max)} or less.` };
  return { value: parsed, error: null };
}

/**
 * Text input + range slider bound to one numeric value.
 *
 * The parent always holds the last *valid* number, so results never show NaN.
 * While the typed text is invalid, an inline error is announced and the last
 * valid result stays on screen.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  hint,
  showWords,
  onInteract,
}: NumberFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // `draft` holds what the user is typing; null means "display the formatted value".
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // An external change (preset button, linked field) discards a stale draft.
  if (value !== prevValue) {
    setPrevValue(value);
    if (!focused && draft !== null) setDraft(null);
  }

  const error = draft !== null ? validate(draft, min, max, label).error : null;
  // Keep the formatted value on focus: swapping it would clear the browser's select-all, so typing would append.
  const display = draft ?? formatNumber(value);
  const fill = max > min ? ((Math.min(Math.max(value, min), max) - min) / (max - min)) * 100 : 0;
  const words = showWords ? amountInWords(value) : "";
  const describedBy = error ? errorId : hint || words ? hintId : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
      </div>
      <div
        className={`mt-1.5 flex items-center rounded-lg border bg-surface transition-colors focus-within:border-brand ${
          error ? "border-danger" : "border-line-strong"
        }`}
      >
        {prefix && (
          <span className="pl-3 text-ink-muted select-none" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          className="w-full min-w-0 bg-transparent px-3 py-2.5 text-base font-semibold tabular-nums text-ink outline-none"
          value={display}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
            // Keep invalid text visible with its error; otherwise show the formatted value.
            if (draft !== null && !validate(draft, min, max, label).error) setDraft(null);
          }}
          onChange={(e) => {
            onInteract?.("input");
            const raw = e.target.value;
            setDraft(raw);
            const { value: next } = validate(raw, min, max, label);
            if (next !== null) {
              setPrevValue(next);
              onChange(next);
            }
          }}
        />
        {suffix && (
          <span className="pr-3 text-sm text-ink-muted select-none" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      <input
        type="range"
        className="range mt-2"
        style={{ "--fill": `${fill}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(value, min), max)}
        aria-label={`${label} slider`}
        aria-valuetext={`${prefix ?? ""}${formatNumber(value)}${suffix ? ` ${suffix}` : ""}`}
        onChange={(e) => {
          onInteract?.("slider");
          setDraft(null);
          const next = Number(e.target.value);
          setPrevValue(next);
          onChange(next);
        }}
      />
      <div className="flex justify-between text-xs text-ink-muted tabular-nums" aria-hidden="true">
        <span>
          {prefix}
          {formatNumber(min)}
          {suffix && suffix.length <= 2 ? suffix : ""}
        </span>
        <span>
          {prefix}
          {formatNumber(max)}
          {suffix && suffix.length <= 2 ? suffix : ""}
        </span>
      </div>
      {(hint || words) && !error && (
        <p id={hintId} className="mt-1 text-xs text-ink-muted">
          {words && <span className="font-medium">₹{words}</span>}
          {words && hint ? " · " : ""}
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 flex items-start gap-1.5 text-sm font-medium text-danger">
          <span aria-hidden="true">⚠</span>
          <span>
            {error} <span className="font-normal">Showing results for the last valid value.</span>
          </span>
        </p>
      )}
    </div>
  );
}
