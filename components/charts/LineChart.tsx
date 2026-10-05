import { useId } from "react";
import { formatINRCompact } from "@/lib/format";

export interface LineSeries {
  label: string;
  /** One value per x label; non-finite values are drawn as 0. */
  values: number[];
}

interface LineChartProps {
  /** X-axis labels, e.g. years "1".."10". */
  labels: string[];
  /** Exactly two series: the first is drawn solid (brand), the second dashed (accent). */
  series: [LineSeries, LineSeries];
  /** Short accessible title. */
  title: string;
  /** Longer accessible description (what the lines show, key takeaway). */
  description: string;
  /** Visible x-axis caption, e.g. "Year". */
  xLabel: string;
}

const W = 640;
const H = 260;
const PAD = { top: 12, right: 12, bottom: 32, left: 60 };

const STYLES = [
  { stroke: "var(--color-brand)", dash: undefined },
  { stroke: "var(--color-accent)", dash: "6 4" },
] as const;

/** Rounds a step up to 1, 2, 2.5 or 5 × 10^n. */
function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

const finite = (v: number) => (Number.isFinite(v) ? v : 0);

/**
 * Two-series line chart (pure SVG, renders on the server). Series are told
 * apart by line style (solid vs dashed) as well as colour, and the axis
 * handles negative values with a zero line.
 */
export function LineChart({ labels, series, title, description, xLabel }: LineChartProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `lc-title-${uid}`;
  const descId = `lc-desc-${uid}`;
  if (labels.length === 0) return null;

  const all = series.flatMap((s) => s.values.map(finite));
  const rawMin = Math.min(0, ...all);
  const rawMax = Math.max(0, ...all);
  const step = niceStep((rawMax - rawMin) / 4 || 1);
  const min = Math.floor(rawMin / step) * step;
  const max = Math.max(min + step, Math.ceil(rawMax / step) * step);
  const ticks: number[] = [];
  const tickCount = Math.round((max - min) / step);
  for (let k = 0; k <= tickCount; k++) {
    const t = min + k * step;
    ticks.push(Math.abs(t) < step / 1e6 ? 0 : t); // avoid "-₹0" from float noise or -0
  }

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const n = labels.length;
  const x = (i: number) => PAD.left + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - ((finite(v) - min) / (max - min)) * plotH;
  const labelEvery = Math.ceil(n / 10);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby={`${titleId} ${descId}`}>
        <title id={titleId}>{title}</title>
        <desc id={descId}>{description}</desc>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={Math.abs(t) < step / 1e6 ? "var(--color-line-strong)" : "var(--color-line)"}
              strokeWidth="1"
            />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" className="fill-ink-muted">
              {formatINRCompact(t)}
            </text>
          </g>
        ))}
        {labels.map((label, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={label} x={x(i)} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="11" className="fill-ink-muted">
              {label}
            </text>
          ) : null,
        )}
        {series.map((s, si) => {
          const style = STYLES[si] ?? STYLES[0];
          const points = s.values.slice(0, n).map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
          return (
            <g key={s.label}>
              {points.length > 1 && (
                <polyline
                  points={points.join(" ")}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth="2.5"
                  strokeDasharray={style.dash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {n <= 15 &&
                s.values.slice(0, n).map((v, i) =>
                  si === 0 ? (
                    <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={style.stroke} />
                  ) : (
                    <rect key={i} x={x(i) - 3} y={y(v) - 3} width="6" height="6" fill="var(--color-surface)" stroke={style.stroke} strokeWidth="1.5" />
                  ),
                )}
            </g>
          );
        })}
        <text x={PAD.left + plotW / 2} y={H - 2} textAnchor="middle" fontSize="11" className="fill-ink-muted">
          {xLabel}
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
        {series.map((s, si) => (
          <span key={s.label} className="flex items-center gap-2">
            <svg aria-hidden="true" width="28" height="10" viewBox="0 0 28 10" className="shrink-0">
              <line
                x1="1"
                x2="27"
                y1="5"
                y2="5"
                stroke={(STYLES[si] ?? STYLES[0]).stroke}
                strokeWidth="2.5"
                strokeDasharray={(STYLES[si] ?? STYLES[0]).dash}
                strokeLinecap="round"
              />
            </svg>
            {s.label}
            <span className="sr-only">{si === 0 ? "(solid line)" : "(dashed line)"}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
