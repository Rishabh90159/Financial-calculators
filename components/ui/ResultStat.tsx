import type { ReactNode } from "react";

interface ResultStatProps {
  label: string;
  value: ReactNode;
  /** Small swatch shown next to the label (also identified by text, never colour alone). */
  swatch?: "principal" | "interest" | "neutral";
  emphasis?: boolean;
  note?: ReactNode;
}

const SWATCH: Record<NonNullable<ResultStatProps["swatch"]>, string> = {
  principal: "bg-brand",
  interest: "bg-accent bg-[repeating-linear-gradient(45deg,transparent_0_2px,rgb(255_255_255/0.45)_2px_4px)]",
  neutral: "bg-ink-muted",
};

/** The headline figure is set apart by size alone; supporting figures sit on hairline rules. */
export function ResultStat({ label, value, swatch, emphasis, note }: ResultStatProps) {
  return (
    <div className={emphasis ? "border-b border-line pb-4" : "border-t border-line pt-2"}>
      <dt className="flex items-center gap-2 text-sm text-ink-muted">
        {swatch && <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 shrink-0 rounded-sm ${SWATCH[swatch]}`} />}
        {label}
      </dt>
      <dd
        className={`tabular-nums font-semibold text-ink ${emphasis ? "mt-1 font-serif text-[2.25rem] leading-tight sm:text-[2.5rem]" : "mt-0.5 text-lg"}`}
      >
        {value}
      </dd>
      {note && <dd className="mt-1 text-xs text-ink-muted">{note}</dd>}
    </div>
  );
}
