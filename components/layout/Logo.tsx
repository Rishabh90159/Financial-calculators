import { siteConfig } from "@/lib/site";

/** Wordmark: a ledger-rule glyph beside the name. Pure SVG + text, no image request. */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 28 28" className="h-7 w-7" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="var(--color-brand)" />
        <path d="M8 9.5h12M8 14h12M8 18.5h7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="20" cy="18.5" r="1.6" fill="#f2c27b" />
      </svg>
      <span className="font-serif text-xl font-semibold tracking-tight text-ink">{siteConfig.name}</span>
    </span>
  );
}
