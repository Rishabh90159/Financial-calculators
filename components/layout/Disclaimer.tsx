import Link from "next/link";

export function Disclaimer({ investment = false }: { investment?: boolean }) {
  return (
    <aside aria-label="Disclaimer" className="max-w-4xl border-l-2 border-accent/70 py-1 pl-4 text-sm text-ink-muted">
      <p>
        <strong className="text-ink">Disclaimer:</strong> This calculator gives estimates for informational and
        educational purposes only. It is not financial advice.{" "}
        {investment
          ? "Investment returns are not guaranteed. Mutual fund and other market-linked investments are subject to market risk, and past performance does not indicate future results."
          : "Your actual EMI, interest rate, fees, charges and taxes depend on your lender, credit profile and loan agreement, and floating rates can change during the loan."}{" "}
        <Link href="/disclaimer" className="text-brand underline underline-offset-2">
          Read the full disclaimer
        </Link>
        .
      </p>
    </aside>
  );
}
