"use client";

import { useId, useMemo, useState } from "react";
import { DonutChart } from "@/components/charts/DonutChart";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { calculateHomeLoan, indicativeMaxLtv } from "@/lib/calculations/homeLoan";
import { yearsToMonths } from "@/lib/calculations/utils";
import { formatINR, formatINRCompact, formatINRPrecise, formatPercent } from "@/lib/format";
import { AmortizationTable } from "./AmortizationTable";
import { CalculatorCard } from "./CalculatorCard";
import { LoanInsights } from "./LoanInsights";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const DOWN_PAYMENT_SHARES = [10, 20, 25, 30];

export function HomeLoanCalculator() {
  const costsId = useId();
  const [price, setPrice] = useState(80_00_000);
  const [down, setDown] = useState(16_00_000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [showCosts, setShowCosts] = useState(false);
  const [stampDuty, setStampDuty] = useState(0);
  const [registration, setRegistration] = useState(0);
  const [other, setOther] = useState(0);

  const result = useMemo(
    () =>
      calculateHomeLoan({
        propertyPrice: price,
        downPayment: down,
        annualRate: rate,
        tenureYears: years,
        costs: showCosts ? { stampDuty, registration, other } : undefined,
      }),
    [price, down, rate, years, showCosts, stampDuty, registration, other],
  );
  const emiInput = useMemo(
    () => ({ principal: result.loanAmount, annualRate: rate, tenureMonths: yearsToMonths(years) }),
    [result.loanAmount, rate, years],
  );
  const { markInteraction, trackScenario } = useCalculatorAnalytics(
    "home-loan",
    result.isValid,
    `${price}|${down}|${rate}|${years}|${showCosts}|${stampDuty}|${registration}|${other}`,
  );

  const maxLtv = indicativeMaxLtv(result.loanAmount);
  const ltvAboveGuide = result.loanAmount > 0 && result.ltvPercent > maxLtv;

  function handlePrice(next: number) {
    setPrice(next);
    // A down payment can never exceed the price; keep the existing share where possible.
    if (down > next) setDown(next);
  }

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Home loan calculator inputs"
        inputs={
          <>
            <NumberField
              label="Property price"
              prefix="₹"
              showWords
              min={5_00_000}
              max={20_00_00_000}
              step={50_000}
              value={price}
              onChange={handlePrice}
              onInteract={markInteraction}
              hint="Agreement value of the home."
            />
            <div className="space-y-3">
              <NumberField
                label="Down payment"
                prefix="₹"
                showWords
                min={0}
                max={price}
                step={10_000}
                value={Math.min(down, price)}
                onChange={setDown}
                onInteract={markInteraction}
                hint={`${formatPercent(result.downPaymentPercent)} of the property price.`}
              />
              <PresetButtons
                label="Down payment as % of price"
                presets={DOWN_PAYMENT_SHARES.map((pct) => ({ label: `${pct}%`, value: Math.round((price * pct) / 100) }))}
                current={down}
                onSelect={(v) => {
                  trackScenario("preset");
                  setDown(v);
                }}
              />
            </div>
            <div className="border-y border-line bg-paper px-4 py-3 -mx-4 sm:-mx-6 sm:px-6">
              <p className="text-sm font-semibold text-ink">Loan amount</p>
              <output
                aria-live="polite"
                className="block font-serif text-2xl font-semibold tabular-nums text-ink"
              >
                {formatINR(result.loanAmount)}
              </output>
              <p className="text-xs text-ink-muted">Calculated automatically: property price − down payment.</p>
            </div>
            <NumberField
              label="Interest rate (per annum)"
              suffix="%"
              min={0}
              max={20}
              step={0.05}
              value={rate}
              onChange={setRate}
              onInteract={markInteraction}
              hint="Floating rates can change during the loan."
            />
            <NumberField
              label="Loan tenure"
              suffix="years"
              min={1}
              max={30}
              step={1}
              value={years}
              onChange={setYears}
              onInteract={markInteraction}
              hint={`${yearsToMonths(years)} monthly instalments.`}
            />

            <div className="border-t border-line pt-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
                  checked={showCosts}
                  aria-controls={costsId}
                  onChange={(e) => {
                    trackScenario("costs_toggle");
                    setShowCosts(e.target.checked);
                  }}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Add stamp duty, registration and other costs</span>
                  <span className="block text-xs text-ink-muted">
                    Optional. Enter amounts from your state&apos;s current schedule or your builder&apos;s quote.
                  </span>
                </span>
              </label>
              <div id={costsId} hidden={!showCosts} className="mt-5 space-y-6">
                <NumberField
                  label="Stamp duty"
                  prefix="₹"
                  showWords
                  min={0}
                  max={2_00_00_000}
                  step={10_000}
                  value={stampDuty}
                  onChange={setStampDuty}
                  onInteract={markInteraction}
                  hint="Varies by state, property value and sometimes buyer category."
                />
                <NumberField
                  label="Registration charges"
                  prefix="₹"
                  showWords
                  min={0}
                  max={50_00_000}
                  step={5_000}
                  value={registration}
                  onChange={setRegistration}
                  onInteract={markInteraction}
                />
                <NumberField
                  label="Other purchase costs"
                  prefix="₹"
                  showWords
                  min={0}
                  max={1_00_00_000}
                  step={5_000}
                  value={other}
                  onChange={setOther}
                  onInteract={markInteraction}
                  hint="Legal fees, loan processing fee, brokerage, GST on under-construction homes, interiors, etc."
                />
              </div>
            </div>
          </>
        }
        results={
          <div className="space-y-5">
            <dl>
              <div aria-live="polite" aria-atomic="true">
                <ResultStat
                  emphasis
                  label="Monthly EMI"
                  value={result.emi.isValid ? formatINR(result.emi.emi) : "₹0"}
                  note={
                    result.emi.isValid
                      ? `Exact: ${formatINRPrecise(result.emi.emi)} on a loan of ${formatINR(result.loanAmount)}`
                      : "No loan needed — your down payment covers the full price."
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                <ResultStat label="Loan amount" value={formatINR(result.loanAmount)} />
                <ResultStat label="Down payment" value={`${formatPercent(result.downPaymentPercent)}`} note={formatINR(result.downPayment)} />
                <ResultStat label="Loan-to-value (LTV)" value={formatPercent(result.ltvPercent)} />
                <ResultStat label="Total interest" swatch="interest" value={formatINR(result.emi.totalInterest)} />
                <ResultStat label="Total loan repayment" value={formatINR(result.emi.totalPayment)} note="Principal + interest over the full tenure." />
                <ResultStat
                  label="Total upfront cash"
                  value={formatINR(result.upfrontTotal)}
                  note={showCosts ? "Down payment + additional costs." : "Down payment only. Add purchase costs above."}
                />
              </div>
            </dl>

            {ltvAboveGuide && (
              <Callout tone="warn" title="LTV above the usual lending limit">
                Your LTV is {formatPercent(result.ltvPercent)}. Under RBI guidelines, lenders in India generally finance up
                to about <strong>{maxLtv}%</strong> of the property value for a loan of this size. You may need a larger
                down payment. Check the exact limit with your lender.
              </Callout>
            )}

            {result.emi.isValid && (
              <DonutChart
                primary={{ label: "Principal", value: result.loanAmount }}
                secondary={{ label: "Interest", value: result.emi.totalInterest }}
                centerLabel="Loan repayment"
                centerValue={formatINRCompact(result.emi.totalPayment)}
              />
            )}

            <div className="border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">Total cost of buying with this loan</p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">{formatINR(result.totalCostOfOwnership)}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Upfront cash {formatINR(result.upfrontTotal)} + all EMIs {formatINR(result.emi.totalPayment)}. Excludes
                maintenance, property tax, insurance and any tax benefits.
              </p>
            </div>
          </div>
        }
      />

      <Callout tone="neutral" title="Assumptions used in this calculation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Interest is charged monthly on the reducing balance at a fixed rate for the full tenure.</li>
          <li>The loan amount is property price minus down payment. Lenders may also cap it based on your income.</li>
          <li>Stamp duty, registration and other costs are only what you enter. No state rates are assumed.</li>
          <li>The LTV check uses RBI&apos;s general slabs and is indicative only; individual lender policy applies.</li>
          <li>Pre-EMI interest, processing fees and insurance premiums are not included unless you add them.</li>
        </ul>
      </Callout>

      <LoanInsights input={emiInput} heading="How rate and tenure change your home loan" />
      <AmortizationTable input={emiInput} onViewChange={() => trackScenario("schedule_view")} />
    </div>
  );
}
