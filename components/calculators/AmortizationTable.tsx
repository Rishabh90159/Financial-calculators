"use client";

import { useMemo, useState } from "react";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { buildAmortizationSchedule, summariseByYear, type EmiInput } from "@/lib/calculations/emi";
import { formatINR } from "@/lib/format";

interface AmortizationTableProps {
  input: EmiInput;
  onViewChange?: () => void;
}

const cell = "px-3 py-2 text-right tabular-nums whitespace-nowrap";
const head = "px-3 py-2.5 text-right font-semibold whitespace-nowrap";

export function AmortizationTable({ input, onViewChange }: AmortizationTableProps) {
  const [view, setView] = useState<"yearly" | "monthly">("yearly");
  const schedule = useMemo(() => buildAmortizationSchedule(input), [input]);
  const years = useMemo(() => summariseByYear(schedule), [schedule]);

  if (schedule.length === 0) return null;

  return (
    <section aria-labelledby="amortization-heading" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-6">
      <h2 id="amortization-heading" className="text-xl">
        Amortization schedule
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        How each payment splits between principal and interest. Early payments are mostly interest; later ones mostly
        principal. Years are loan years counted from your first EMI.
      </p>

      <div className="mt-5">
        <StackedBarChart
          title={`Principal and interest paid each loan year over ${years.length} years. Interest falls and principal rises every year.`}
          xLabel="Loan year"
          baseLabel="Principal paid"
          topLabel="Interest paid"
          data={years.map((y) => ({ label: String(y.year), base: y.principalPaid, top: y.interestPaid }))}
        />
      </div>

      <div role="group" aria-label="Schedule view" className="mt-6 inline-flex rounded-lg border border-line-strong p-0.5">
        {(["yearly", "monthly"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => {
              setView(v);
              onViewChange?.();
            }}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold capitalize ${
              view === v ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div
        className="mt-3 max-h-[28rem] overflow-auto rounded-lg border border-line"
        tabIndex={0}
        role="region"
        aria-label={`${view === "yearly" ? "Yearly" : "Monthly"} amortization table, scrollable`}
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            {view === "yearly" ? "Year-by-year" : "Month-by-month"} breakdown of principal, interest and outstanding
            balance
          </caption>
          <thead className="sticky top-0 bg-paper text-ink">
            <tr className="border-b border-line">
              <th scope="col" className={`${head} text-left`}>
                {view === "yearly" ? "Year" : "Month"}
              </th>
              <th scope="col" className={head}>
                Principal
              </th>
              <th scope="col" className={head}>
                Interest
              </th>
              <th scope="col" className={head}>
                Total paid
              </th>
              <th scope="col" className={head}>
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {view === "yearly"
              ? years.map((y) => (
                  <tr key={y.year}>
                    <th scope="row" className={`${cell} text-left font-medium`}>
                      {y.year}
                    </th>
                    <td className={cell}>{formatINR(y.principalPaid)}</td>
                    <td className={cell}>{formatINR(y.interestPaid)}</td>
                    <td className={cell}>{formatINR(y.totalPaid)}</td>
                    <td className={cell}>{formatINR(y.closingBalance)}</td>
                  </tr>
                ))
              : schedule.map((m) => (
                  <tr key={m.month}>
                    <th scope="row" className={`${cell} text-left font-medium`}>
                      {m.month}
                    </th>
                    <td className={cell}>{formatINR(m.principalPaid)}</td>
                    <td className={cell}>{formatINR(m.interestPaid)}</td>
                    <td className={cell}>{formatINR(m.payment)}</td>
                    <td className={cell}>{formatINR(m.closingBalance)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Figures are rounded to the nearest rupee for display. Lenders may round EMIs differently and the final
        instalment is adjusted so the balance reaches exactly zero.
      </p>
    </section>
  );
}
