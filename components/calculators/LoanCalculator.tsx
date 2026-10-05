"use client";

import { useId, useMemo, useState } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { ResultStat } from "@/components/ui/ResultStat";
import { calculateLoan, tenureToMonths, type TenureUnit } from "@/lib/calculations/loan";
import { formatPercent } from "@/lib/format";
import { AmortizationTable } from "./AmortizationTable";
import { CalculatorCard } from "./CalculatorCard";
import { LoanInsights } from "./LoanInsights";
import { LoanResults } from "./LoanResults";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const TENURE_LIMITS: Record<TenureUnit, { min: number; max: number; step: number }> = {
  years: { min: 0.5, max: 30, step: 0.5 },
  months: { min: 3, max: 360, step: 1 },
};

export function LoanCalculator() {
  const unitGroupId = useId();
  const [amount, setAmount] = useState(5_00_000);
  const [rate, setRate] = useState(12);
  const [tenure, setTenure] = useState(3);
  const [unit, setUnit] = useState<TenureUnit>("years");

  const result = useMemo(
    () => calculateLoan({ principal: amount, annualRate: rate, tenure, tenureUnit: unit }),
    [amount, rate, tenure, unit],
  );
  const emiInput = useMemo(
    () => ({ principal: amount, annualRate: rate, tenureMonths: tenureToMonths(tenure, unit) }),
    [amount, rate, tenure, unit],
  );
  const { markInteraction, trackScenario } = useCalculatorAnalytics("loan", result.isValid, `${amount}|${rate}|${tenure}|${unit}`);

  function switchUnit(next: TenureUnit) {
    if (next === unit) return;
    trackScenario("tenure_unit");
    const months = tenureToMonths(tenure, unit);
    const converted = next === "months" ? months : Math.round((months / 12) * 100) / 100;
    const { min, max } = TENURE_LIMITS[next];
    setUnit(next);
    setTenure(Math.min(max, Math.max(min, converted)));
  }

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Loan calculator inputs"
        inputs={
          <>
            <NumberField
              label="Loan amount"
              prefix="₹"
              showWords
              min={5_000}
              max={2_00_00_000}
              step={5_000}
              value={amount}
              onChange={setAmount}
              onInteract={markInteraction}
              hint="The principal you borrow, excluding interest."
            />
            <NumberField
              label="Interest rate (per annum)"
              suffix="%"
              min={0}
              max={36}
              step={0.05}
              value={rate}
              onChange={setRate}
              onInteract={markInteraction}
              hint="Use the reducing-balance rate quoted by the lender, not a flat rate."
            />
            <div>
              <fieldset className="mb-2">
                <legend className="sr-only">Enter tenure in</legend>
                <div className="inline-flex rounded-lg border border-line-strong p-0.5">
                {(["years", "months"] as const).map((u) => (
                  <label
                    key={u}
                    className={`cursor-pointer rounded-md px-3.5 py-1 text-sm font-semibold capitalize has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-brand ${
                      unit === u ? "bg-brand text-white" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name={unitGroupId}
                      value={u}
                      checked={unit === u}
                      onChange={() => switchUnit(u)}
                      className="sr-only"
                    />
                    {u}
                  </label>
                ))}
                </div>
              </fieldset>
              <NumberField
                key={unit}
                label={`Loan tenure (${unit})`}
                suffix={unit}
                value={tenure}
                onChange={setTenure}
                onInteract={markInteraction}
                hint={`${tenureToMonths(tenure, unit)} monthly instalments.`}
                {...TENURE_LIMITS[unit]}
              />
            </div>
          </>
        }
        results={
          <div className="space-y-5">
            <LoanResults result={result} />
            {result.isValid && (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line pt-4 min-[420px]:grid-cols-2">
                <ResultStat
                  label="Interest as % of loan"
                  value={formatPercent(result.interestToPrincipalPercent)}
                  note="Extra you repay on top of the amount borrowed."
                />
                <ResultStat
                  label="Interest share of repayments"
                  value={formatPercent(result.interestShareOfPaymentPercent)}
                  note="Portion of all EMIs that goes to interest."
                />
              </dl>
            )}
          </div>
        }
      />
      <LoanInsights input={emiInput} heading="What this loan really costs" />
      <AmortizationTable input={emiInput} onViewChange={() => trackScenario("schedule_view")} />
    </div>
  );
}
