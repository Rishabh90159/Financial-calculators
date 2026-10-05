import { useId } from "react";
import { formatINR, formatPercent } from "@/lib/format";

interface DonutChartProps {
  primary: { label: string; value: number };
  secondary: { label: string; value: number };
  centerLabel: string;
  centerValue: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Two-segment donut in plain SVG. The second segment is hatched as well as
 * coloured, and the legend states every value and share in text.
 */
export function DonutChart({ primary, secondary, centerLabel, centerValue }: DonutChartProps) {
  const hatchId = `hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const total = primary.value + secondary.value;
  const primaryShare = total > 0 ? primary.value / total : 1;
  const primaryLen = primaryShare * CIRCUMFERENCE;
  const summary = `${primary.label} ${formatINR(primary.value)} (${formatPercent(primaryShare * 100)}), ${secondary.label} ${formatINR(secondary.value)} (${formatPercent((1 - primaryShare) * 100)}).`;

  return (
    <figure className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0" role="img" aria-label={`Breakdown: ${summary}`}>
        <defs>
          <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--color-accent)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />
          </pattern>
        </defs>
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke={`url(#${hatchId})`} strokeWidth="18" />
        <circle
          cx="70"
          cy="70"
          r={RADIUS}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="18"
          strokeDasharray={`${primaryLen} ${CIRCUMFERENCE}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" className="fill-ink-muted" fontSize="10">
          {centerLabel}
        </text>
        <text x="70" y="82" textAnchor="middle" className="fill-ink" fontSize="13" fontWeight="600">
          {centerValue}
        </text>
      </svg>
      <figcaption className="w-full space-y-2 text-sm">
        <LegendRow swatch="principal" label={primary.label} value={primary.value} share={primaryShare} />
        <LegendRow swatch="interest" label={secondary.label} value={secondary.value} share={1 - primaryShare} />
      </figcaption>
    </figure>
  );
}

function LegendRow({
  swatch,
  label,
  value,
  share,
}: {
  swatch: "principal" | "interest";
  label: string;
  value: number;
  share: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0">
      <span className="flex items-center gap-2 text-ink-muted">
        <span
          aria-hidden="true"
          className={`inline-block h-3 w-3 rounded-sm ${
            swatch === "principal"
              ? "bg-brand"
              : "bg-accent bg-[repeating-linear-gradient(45deg,transparent_0_2px,rgb(255_255_255/0.45)_2px_4px)]"
          }`}
        />
        {label}
      </span>
      <span className="tabular-nums text-ink">
        <span className="font-semibold">{formatINR(value)}</span>
        <span className="ml-2 text-ink-muted">{formatPercent(share * 100)}</span>
      </span>
    </div>
  );
}
