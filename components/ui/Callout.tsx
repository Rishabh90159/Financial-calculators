import type { ReactNode } from "react";

const TONES = {
  info: "border-brand/30 bg-brand-tint",
  warn: "border-accent/40 bg-accent-tint",
  neutral: "border-line bg-surface",
} as const;

export function Callout({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className={`rounded-md border p-4 text-sm leading-relaxed ${TONES[tone]}`}>
      {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
      <div className="text-ink-muted [&_strong]:text-ink">{children}</div>
    </div>
  );
}
