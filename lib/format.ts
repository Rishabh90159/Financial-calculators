/**
 * Indian-locale formatters. Intl output is identical on the server (Node, full ICU)
 * and in modern browsers, so server-rendered numbers hydrate without mismatch.
 */

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const plain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** ₹12,34,568 */
export function formatINR(n: number): string {
  return inr.format(Math.round(safe(n)));
}

/** ₹12,34,567.89 */
export function formatINRPrecise(n: number): string {
  return inrPaise.format(safe(n));
}

/** 12,34,567.5 — for input fields. */
export function formatNumber(n: number): string {
  return plain.format(safe(n));
}

export function formatPercent(n: number, decimals = 1): string {
  return `${safe(n).toFixed(decimals)}%`;
}

/** Compact Indian notation: ₹12.35 L, ₹1.2 Cr, ₹45,000. */
export function formatINRCompact(n: number): string {
  const v = safe(n);
  const abs = Math.abs(v);
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, "");
  if (abs >= 1e7) return `₹${trim(v / 1e7)} Cr`;
  if (abs >= 1e5) return `₹${trim(v / 1e5)} L`;
  return formatINR(v);
}

/** Spoken form for amounts: "12.35 lakh", "1.2 crore". Used under amount inputs. */
export function amountInWords(n: number): string {
  const v = safe(n);
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, "");
  if (v >= 1e7) return `${trim(v / 1e7)} crore`;
  if (v >= 1e5) return `${trim(v / 1e5)} lakh`;
  if (v >= 1e3) return `${trim(v / 1e3)} thousand`;
  return "";
}

export function formatMonths(months: number): string {
  const m = Math.max(0, Math.round(safe(months)));
  const y = Math.floor(m / 12);
  const r = m % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} ${y === 1 ? "year" : "years"}`);
  if (r) parts.push(`${r} ${r === 1 ? "month" : "months"}`);
  return parts.join(" ") || "0 months";
}

/** Parses user-typed numbers, tolerating commas, spaces and a leading ₹. Returns null if not a number. */
export function parseNumberInput(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "");
  if (cleaned === "" || !/^\d*\.?\d*$/.test(cleaned) || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
