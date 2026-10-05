"use client";

import { useMemo, useState } from "react";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { calculateEmi, type EmiInput } from "@/lib/calculations/emi";
import { yearsToMonths } from "@/lib/calculations/utils";
import { AmortizationTable } from "./AmortizationTable";
import { CalculatorCard } from "./CalculatorCard";
import { LoanInsights } from "./LoanInsights";
import { LoanResults } from "./LoanResults";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

export interface EmiEngineConfig {
  calculatorId: string;
  formLabel: string;
  amountLabel: string;
  defaults: { amount: number; rate: number; years: number };
  amount: { min: number; max: number; step: number };
  rate: { min: number; max: number; step: number };
  years: { min: number; max: number; step: number };
  presets?: { label: string; value: number }[];
  presetsLabel?: string;
  insightsHeading?: string;
}

/** Shared engine behind the EMI and Home Loan EMI calculators. */
export function EmiCalculatorEngine({ config }: { config: EmiEngineConfig }) {
  const [amount, setAmount] = useState(config.defaults.amount);
  const [rate, setRate] = useState(config.defaults.rate);
  const [years, setYears] = useState(config.defaults.years);

  const input: EmiInput = useMemo(
    () => ({ principal: amount, annualRate: rate, tenureMonths: yearsToMonths(years) }),
    [amount, rate, years],
  );
  const result = useMemo(() => calculateEmi(input), [input]);
  const { markInteraction, trackScenario } = useCalculatorAnalytics(
    config.calculatorId,
    result.isValid,
    `${amount}|${rate}|${years}`,
  );

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel={config.formLabel}
        inputs={
          <>
            {config.presets && (
              <PresetButtons
                label={config.presetsLabel ?? "Quick amounts"}
                presets={config.presets}
                current={amount}
                onSelect={(v) => {
                  trackScenario("preset");
                  setAmount(v);
                }}
              />
            )}
            <NumberField
              label={config.amountLabel}
              prefix="₹"
              showWords
              value={amount}
              onChange={setAmount}
              onInteract={markInteraction}
              {...config.amount}
            />
            <NumberField
              label="Interest rate (per annum)"
              suffix="%"
              value={rate}
              onChange={setRate}
              onInteract={markInteraction}
              hint="Annual rate, applied monthly on the reducing balance."
              {...config.rate}
            />
            <NumberField
              label="Loan tenure"
              suffix="years"
              value={years}
              onChange={setYears}
              onInteract={markInteraction}
              hint={`${yearsToMonths(years)} monthly instalments. Decimals allowed, e.g. 2.5 years.`}
              {...config.years}
            />
          </>
        }
        results={<LoanResults result={result} />}
      />
      <LoanInsights input={input} heading={config.insightsHeading} />
      <AmortizationTable input={input} onViewChange={() => trackScenario("schedule_view")} />
    </div>
  );
}
