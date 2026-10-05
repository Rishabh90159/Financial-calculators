import { DonutChart } from "@/components/charts/DonutChart";
import { ResultStat } from "@/components/ui/ResultStat";
import type { EmiResult } from "@/lib/calculations/emi";
import { formatINR, formatINRCompact, formatINRPrecise, formatMonths } from "@/lib/format";

/** Headline results shared by every EMI-style calculator. */
export function LoanResults({ result, emiLabel = "Monthly EMI" }: { result: EmiResult; emiLabel?: string }) {
  if (!result.isValid) {
    return (
      <p className="rounded-md border border-line bg-paper p-4 text-sm text-ink-muted">
        Enter a loan amount and tenure greater than zero to see your EMI.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <dl>
        <div aria-live="polite" aria-atomic="true">
          <ResultStat
            emphasis
            label={emiLabel}
            value={formatINR(result.emi)}
            note={`Exact: ${formatINRPrecise(result.emi)} · ${formatMonths(result.tenureMonths)} (${result.tenureMonths} instalments)`}
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 min-[420px]:grid-cols-3">
          <ResultStat swatch="principal" label="Total principal" value={formatINR(result.principal)} />
          <ResultStat swatch="interest" label="Total interest" value={formatINR(result.totalInterest)} />
          <ResultStat swatch="neutral" label="Total payment" value={formatINR(result.totalPayment)} />
        </div>
      </dl>
      <DonutChart
        primary={{ label: "Principal", value: result.principal }}
        secondary={{ label: "Interest", value: result.totalInterest }}
        centerLabel="Total payable"
        centerValue={formatINRCompact(result.totalPayment)}
      />
    </div>
  );
}
