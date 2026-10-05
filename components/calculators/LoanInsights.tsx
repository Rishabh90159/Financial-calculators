import { calculateEmiSensitivity, type EmiInput } from "@/lib/calculations/emi";
import { formatINR, formatMonths, formatPercent } from "@/lib/format";

/**
 * Plain-language "what this means" panel computed from the user's own inputs.
 * Answers: how much of my repayment is interest, and what happens if the rate
 * or tenure changes?
 */
export function LoanInsights({ input, heading = "Key insights" }: { input: EmiInput; heading?: string }) {
  const s = calculateEmiSensitivity(input);
  if (!s.base.isValid) return null;

  const { base, higherRate, longerTenure, shorterTenure } = s;
  const interestPerRupee = base.principal > 0 ? base.totalInterest / base.principal : 0;
  const insights: string[] = [
    `For every ₹1 you borrow, you repay about ₹${(1 + interestPerRupee).toFixed(2)} — interest adds ${formatPercent(interestPerRupee * 100, 0)} to the loan amount.`,
    `If the rate rises by ${s.rateStep} percentage point to ${formatPercent(higherRate.annualRate, 2)}, your EMI goes up by ${formatINR(higherRate.emi - base.emi)} a month and total interest by ${formatINR(higherRate.totalInterest - base.totalInterest)}.`,
    `Stretching the tenure by 5 years to ${formatMonths(longerTenure.tenureMonths)} lowers the EMI by ${formatINR(base.emi - longerTenure.emi)} but adds ${formatINR(longerTenure.totalInterest - base.totalInterest)} in interest.`,
  ];
  if (shorterTenure) {
    insights.push(
      `Cutting the tenure by 5 years raises the EMI by ${formatINR(shorterTenure.emi - base.emi)} but saves ${formatINR(base.totalInterest - shorterTenure.totalInterest)} in interest.`,
    );
  }

  return (
    <section aria-labelledby="insights-heading" className="border-t border-line pt-6">
      <h2 id="insights-heading" className="text-xl">
        {heading}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">Based on the values you entered above. Updates as you change them.</p>
      <ul className="mt-4 max-w-3xl space-y-2.5">
        {insights.map((text) => (
          <li key={text.slice(0, 40)} className="flex gap-3 text-[0.95rem] leading-relaxed">
            <span aria-hidden="true" className="mt-[0.7rem] h-px w-3 shrink-0 bg-ink-muted" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
