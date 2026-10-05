import { useId } from "react";
import { formatINRCompact } from "@/lib/format";

export interface StackedBarDatum {
  label: string;
  /** Bottom segment (solid brand colour). */
  base: number;
  /** Top segment (hatched accent colour). */
  top: number;
}

interface StackedBarChartProps {
  data: StackedBarDatum[];
  baseLabel: string;
  topLabel: string;
  /** Accessible title describing what the chart shows. */
  title: string;
  /** Visible x-axis caption, e.g. "Loan year". */
  xLabel: string;
}

const W = 640;
const H = 260;
const PAD = { top: 12, right: 8, bottom: 32, left: 56 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/** Lightweight responsive stacked column chart (pure SVG, no JS needed to render). */
export function StackedBarChart({ data, baseLabel, topLabel, title, xLabel }: StackedBarChartProps) {
  const hatchId = `hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (data.length === 0) return null;

  const max = niceMax(Math.max(...data.map((d) => d.base + d.top)));
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.max(2, Math.min(28, slot * 0.68));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 10);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title}>
        <defs>
          <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="var(--color-accent)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" />
          </pattern>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-ink-muted">
              {formatINRCompact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const baseH = (d.base / max) * plotH;
          const topH = (d.top / max) * plotH;
          return (
            <g key={d.label}>
              <rect x={x} y={PAD.top + plotH - baseH} width={barW} height={baseH} fill="var(--color-brand)" />
              <rect x={x} y={PAD.top + plotH - baseH - topH} width={barW} height={topH} fill={`url(#${hatchId})`} />
              {(i % labelEvery === 0 || i === data.length - 1) && (
                <text x={x + barW / 2} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="11" className="fill-ink-muted">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
        <text x={PAD.left + plotW / 2} y={H - 2} textAnchor="middle" fontSize="11" className="fill-ink-muted">
          {xLabel}
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm bg-brand" />
          {baseLabel}
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-sm bg-accent bg-[repeating-linear-gradient(45deg,transparent_0_2px,rgb(255_255_255/0.45)_2px_4px)]"
          />
          {topLabel}
        </span>
      </figcaption>
    </figure>
  );
}
