"use client";

import { useMemo, useState } from "react";
import { DonutChart } from "@/components/charts/DonutChart";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { NumberField } from "@/components/ui/NumberField";
import { ResultStat } from "@/components/ui/ResultStat";
import { buildSipGrowth, calculateSip } from "@/lib/calculations/sip";
import { formatINR, formatINRCompact, formatMonths } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

export function SipCalculator() {
  const [monthly, setMonthly] = useState(10_000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);

  const input = useMemo(() => ({ monthlyInvestment: monthly, annualReturn, years }), [monthly, annualReturn, years]);
  const result = useMemo(() => calculateSip(input), [input]);
  const growth = useMemo(() => buildSipGrowth(input), [input]);
  const { markInteraction } = useCalculatorAnalytics("sip", result.isValid, `${monthly}|${annualReturn}|${years}`);

  const multiple = result.totalInvested > 0 ? result.futureValue / result.totalInvested : 0;

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="SIP calculator inputs"
        resultsHeading="Estimated results"
        inputs={
          <>
            <NumberField
              label="Monthly investment"
              prefix="₹"
              showWords
              min={100}
              max={10_00_000}
              step={500}
              value={monthly}
              onChange={setMonthly}
              onInteract={markInteraction}
            />
            <NumberField
              label="Expected annual return"
              suffix="%"
              min={0}
              max={30}
              step={0.1}
              value={annualReturn}
              onChange={setAnnualReturn}
              onInteract={markInteraction}
              hint="An assumption, not a promise. Actual returns vary year to year."
            />
            <NumberField
              label="Investment duration"
              suffix="years"
              min={1}
              max={40}
              step={1}
              value={years}
              onChange={setYears}
              onInteract={markInteraction}
              hint={`${formatMonths(result.months)} of monthly instalments.`}
            />
          </>
        }
        results={
          result.isValid ? (
            <div className="space-y-5">
              <dl>
                <div aria-live="polite" aria-atomic="true">
                  <ResultStat
                    emphasis
                    label="Estimated total value"
                    value={formatINR(result.futureValue)}
                    note={`About ${multiple.toFixed(2)}× the amount invested, if returns average ${annualReturn}% a year.`}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                  <ResultStat swatch="principal" label="Invested amount" value={formatINR(result.totalInvested)} />
                  <ResultStat swatch="interest" label="Estimated returns" value={formatINR(result.estimatedReturns)} />
                </div>
              </dl>
              <DonutChart
                primary={{ label: "Invested", value: result.totalInvested }}
                secondary={{ label: "Estimated returns", value: result.estimatedReturns }}
                centerLabel="Total value"
                centerValue={formatINRCompact(result.futureValue)}
              />
              <p className="border-l-2 border-accent pl-3 text-xs text-ink-muted">
                <strong className="text-ink">Returns are not guaranteed.</strong> Market-linked investments can lose
                value. This projection assumes a constant return, which real markets do not deliver.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Enter a monthly amount and duration to see an estimate.</p>
          )
        }
      />

      {growth.length > 0 && (
        <section aria-labelledby="growth-heading" className="border-t border-line pt-6">
          <h2 id="growth-heading" className="text-xl">
            How your SIP could grow, year by year
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Notice how the hatched &ldquo;returns&rdquo; portion grows faster in later years. That is compounding at
            work.
          </p>
          <div className="mt-5">
            <StackedBarChart
              title={`Estimated SIP value at the end of each of ${growth.length} years, split into amount invested and estimated returns.`}
              xLabel="Year"
              baseLabel="Amount invested"
              topLabel="Estimated returns"
              data={growth.map((g) => ({ label: String(g.year), base: g.invested, top: g.estimatedReturns }))}
            />
          </div>
          <details className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-brand">View year-by-year table</summary>
            <div className="max-h-96 overflow-auto border-t border-line" tabIndex={0} role="region" aria-label="Year-by-year SIP growth table, scrollable">
              <table className="w-full text-sm">
                <caption className="sr-only">Estimated SIP value at the end of each year</caption>
                <thead className="sticky top-0 bg-paper">
                  <tr className="border-b border-line">
                    <th scope="col" className="px-3 py-2 text-left font-semibold">Year</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Invested</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Est. returns</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">Est. value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line tabular-nums">
                  {growth.map((g) => (
                    <tr key={g.year}>
                      <th scope="row" className="px-3 py-2 text-left font-medium">{g.year}</th>
                      <td className="px-3 py-2 text-right">{formatINR(g.invested)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(g.estimatedReturns)}</td>
                      <td className="px-3 py-2 text-right">{formatINR(g.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
