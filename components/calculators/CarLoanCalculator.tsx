"use client";

import { useId, useMemo, useState } from "react";
import { DonutChart } from "@/components/charts/DonutChart";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable } from "@/components/ui/ScenarioTable";
import {
  assessCarAffordability,
  calculateCarLoan,
  compareCarLoanTenures,
  TOTAL_EMI_CAUTION_PERCENT,
  type CarEmiShareBand,
} from "@/lib/calculations/carLoan";
import { calculateEmiSensitivity } from "@/lib/calculations/emi";
import { formatINR, formatINRCompact, formatINRPrecise, formatPercent } from "@/lib/format";
import { AmortizationTable } from "./AmortizationTable";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const DOWN_PAYMENT_SHARES = [10, 15, 20, 30];

const BAND_LABEL: Record<CarEmiShareBand, string> = {
  lower: "Lower share",
  moderate: "Moderate share",
  higher: "Higher share",
};

const BAND_TEXT: Record<CarEmiShareBand, string> = {
  lower: "The car EMI takes 10% or less of your take-home pay.",
  moderate: "The car EMI takes more than 10% and up to 20% of your take-home pay.",
  higher: "The car EMI takes more than 20% of your take-home pay. Check that fuel, insurance and servicing still fit.",
};

function formatYears(years: number): string {
  return `${years} ${years === 1 ? "year" : "years"}`;
}

export function CarLoanCalculator() {
  const costsId = useId();
  const affordId = useId();
  const [price, setPrice] = useState(10_00_000);
  const [down, setDown] = useState(2_00_000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(5);
  const [showCosts, setShowCosts] = useState(false);
  const [processingFee, setProcessingFee] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [showAfford, setShowAfford] = useState(false);
  const [income, setIncome] = useState(75_000);
  const [existingEmis, setExistingEmis] = useState(0);

  const result = useMemo(
    () =>
      calculateCarLoan({
        onRoadPrice: price,
        downPayment: down,
        annualRate: rate,
        tenureYears: years,
        processingFee: showCosts ? processingFee : 0,
        otherUpfrontCosts: showCosts ? otherCosts : 0,
      }),
    [price, down, rate, years, showCosts, processingFee, otherCosts],
  );
  const emiInput = useMemo(
    () => ({ principal: result.loanAmount, annualRate: rate, tenureMonths: result.tenureMonths }),
    [result.loanAmount, rate, result.tenureMonths],
  );
  const comparison = useMemo(
    () => compareCarLoanTenures(result.loanAmount, rate, result.tenureYears),
    [result.loanAmount, rate, result.tenureYears],
  );
  const sensitivity = useMemo(() => calculateEmiSensitivity(emiInput, 1, 12), [emiInput]);
  const afford = useMemo(
    () => assessCarAffordability({ carEmi: result.emi.emi, monthlyIncome: income, existingEmis }),
    [result.emi.emi, income, existingEmis],
  );

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "car-loan",
    result.isValid,
    `${price}|${down}|${rate}|${years}|${showCosts}|${processingFee}|${otherCosts}|${showAfford}|${income}|${existingEmis}`,
  );

  const hasLoan = result.emi.isValid;
  const { base, higherRate, longerTenure, shorterTenure } = sensitivity;
  const interestPerRupee = base.principal > 0 ? base.totalInterest / base.principal : 0;

  function handlePrice(next: number) {
    setPrice(next);
    if (down > next) setDown(next);
  }

  const baselineLabel = formatYears(comparison.baselineYears);

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Car loan calculator inputs"
        inputs={
          <>
            <NumberField
              label="On-road price"
              prefix="₹"
              showWords
              min={1_00_000}
              max={2_00_00_000}
              step={10_000}
              value={price}
              onChange={handlePrice}
              onInteract={markInteraction}
              hint="Ex-showroom + registration/RTO + insurance + other charges."
            />
            <div className="space-y-3">
              <NumberField
                label="Down payment"
                prefix="₹"
                showWords
                min={0}
                max={price}
                step={5_000}
                value={Math.min(down, price)}
                onChange={setDown}
                onInteract={markInteraction}
                hint={`${formatPercent(result.downPaymentPercent)} of the on-road price.`}
              />
              <PresetButtons
                label="Down payment as % of on-road price"
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
              <output aria-live="polite" className="block font-serif text-2xl font-semibold tabular-nums text-ink">
                {formatINR(result.loanAmount)}
              </output>
              <p className="text-xs text-ink-muted">
                On-road price − down payment. If your lender finances a different amount, adjust the down payment to
                match.
              </p>
            </div>
            <NumberField
              label="Interest rate (per annum)"
              suffix="%"
              min={0}
              max={25}
              step={0.05}
              value={rate}
              onChange={setRate}
              onInteract={markInteraction}
              hint="Reducing-balance rate. A dealer's flat rate is not the same — see below."
            />
            <NumberField
              label="Loan tenure"
              suffix="years"
              min={1}
              max={7}
              step={0.5}
              value={years}
              onChange={setYears}
              onInteract={markInteraction}
              hint={`${result.tenureMonths} monthly instalments. Whole or half years.`}
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
                  <span className="block text-sm font-semibold text-ink">Add processing fee and other upfront costs</span>
                  <span className="block text-xs text-ink-muted">Optional. Use the amounts from your loan offer or dealer quote.</span>
                </span>
              </label>
              <div id={costsId} hidden={!showCosts} className="mt-5 space-y-6">
                <NumberField
                  label="Processing fee"
                  prefix="₹"
                  showWords
                  min={0}
                  max={5_00_000}
                  step={500}
                  value={processingFee}
                  onChange={setProcessingFee}
                  onInteract={markInteraction}
                  hint="Often a % of the loan plus GST — enter the rupee amount."
                />
                <NumberField
                  label="Other upfront costs"
                  prefix="₹"
                  showWords
                  min={0}
                  max={20_00_000}
                  step={1_000}
                  value={otherCosts}
                  onChange={setOtherCosts}
                  onInteract={markInteraction}
                  hint="Accessories, extended warranty, documentation charges, etc."
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
                  value={hasLoan ? formatINR(result.emi.emi) : "₹0"}
                  note={
                    hasLoan
                      ? `Exact: ${formatINRPrecise(result.emi.emi)} for ${result.tenureMonths} months`
                      : result.loanAmount === 0
                        ? "No loan needed — your down payment covers the on-road price."
                        : "Enter a tenure to calculate the EMI."
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-2 min-[360px]:grid-cols-2">
                <ResultStat label="Loan amount" swatch="principal" value={formatINR(result.loanAmount)} />
                <ResultStat label="Total interest" swatch="interest" value={formatINR(result.emi.totalInterest)} />
                <ResultStat
                  label="Total repayment"
                  value={formatINR(result.emi.totalPayment)}
                  note="Principal + interest over the full tenure."
                />
                <ResultStat
                  label="Down payment"
                  value={formatINR(result.downPayment)}
                  note={`${formatPercent(result.downPaymentPercent)} of the on-road price.`}
                />
                <ResultStat
                  label="Total upfront cost"
                  value={formatINR(result.upfrontTotal)}
                  note={showCosts ? "Down payment + processing fee + other costs." : "Down payment only. Add fees above."}
                />
              </div>
            </dl>

            {hasLoan && (
              <DonutChart
                primary={{ label: "Principal", value: result.loanAmount }}
                secondary={{ label: "Interest", value: result.emi.totalInterest }}
                centerLabel="Loan repayment"
                centerValue={formatINRCompact(result.emi.totalPayment)}
              />
            )}

            <div className="border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">Total cost of the car with this loan</p>
              <p className="mt-1 font-serif text-2xl font-semibold tabular-nums">{formatINR(result.totalCostWithLoan)}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Upfront {formatINR(result.upfrontTotal)} + all EMIs {formatINR(result.emi.totalPayment)}. Excludes fuel,
                servicing, insurance renewals and any foreclosure charges.
              </p>
            </div>
          </div>
        }
      />

      <Callout tone="neutral" title="Assumptions used in this calculation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Interest is charged monthly on the reducing balance at a fixed rate for the full tenure.</li>
          <li>The loan amount is the on-road price minus your down payment. Lenders may finance less.</li>
          <li>Processing fees and other upfront costs are only what you enter, paid upfront rather than added to the loan.</li>
          <li>EMIs start one month after disbursement; no prepayment, part-payment or foreclosure is assumed.</li>
        </ul>
      </Callout>

      {hasLoan && (
        <CalculatorSection
          id="car-tenure"
          title="Compare tenures"
          description={`The same ${formatINR(result.loanAmount)} loan at ${formatPercent(rate, 2)} over different tenures. Extra interest is measured against ${baselineLabel}.`}
        >
          <ScenarioTable
            caption={`EMI, total interest and total payment by tenure for a ${formatINR(result.loanAmount)} car loan`}
            columns={[
              { label: "Tenure" },
              { label: "EMI", numeric: true },
              { label: "Total interest", numeric: true },
              { label: "Total payment", numeric: true },
              { label: `Extra interest vs ${baselineLabel}`, numeric: true },
              { label: "Try it", numeric: false },
            ]}
            rows={comparison.rows.map((row) => ({
              label: formatYears(row.tenureYears),
              current: row.isCurrent,
              cells: [
                formatINR(row.emi),
                formatINR(row.totalInterest),
                formatINR(row.totalPayment),
                row.interestSavedVsBaseline > 0
                  ? `${formatINR(row.interestSavedVsBaseline)} less`
                  : row.tenureYears === comparison.baselineYears
                    ? "—"
                    : `+${formatINR(row.extraInterestVsBaseline)}`,
                row.isCurrent ? (
                  <span className="text-xs text-ink-muted">Selected</span>
                ) : (
                  <button
                    type="button"
                    className="text-sm font-semibold text-brand underline underline-offset-2 hover:no-underline"
                    aria-label={`Use a ${formatYears(row.tenureYears)} tenure`}
                    onClick={() => {
                      trackComparison();
                      setYears(row.tenureYears);
                    }}
                  >
                    Use
                  </button>
                ),
              ],
            }))}
          />
        </CalculatorSection>
      )}

      {hasLoan && (
        <CalculatorSection
          id="car-insights"
          title="How rate and tenure change your car loan"
          description="Based on the values you entered above. Updates as you change them."
        >
          <ul className="max-w-3xl space-y-2.5">
            <li className="flex gap-3 text-[0.95rem] leading-relaxed">
              <span aria-hidden="true" className="mt-[0.7rem] h-px w-3 shrink-0 bg-ink-muted" />
              <span>
                For every ₹1 you borrow, you repay about ₹{(1 + interestPerRupee).toFixed(2)} — interest adds{" "}
                {formatPercent(interestPerRupee * 100, 1)} to the loan amount.
              </span>
            </li>
            <li className="flex gap-3 text-[0.95rem] leading-relaxed">
              <span aria-hidden="true" className="mt-[0.7rem] h-px w-3 shrink-0 bg-ink-muted" />
              <span>
                A rate 1 percentage point higher ({formatPercent(higherRate.annualRate, 2)}) raises the EMI by{" "}
                {formatINR(higherRate.emi - base.emi)} a month and total interest by{" "}
                {formatINR(higherRate.totalInterest - base.totalInterest)}.
              </span>
            </li>
            <li className="flex gap-3 text-[0.95rem] leading-relaxed">
              <span aria-hidden="true" className="mt-[0.7rem] h-px w-3 shrink-0 bg-ink-muted" />
              <span>
                One extra year lowers the EMI by {formatINR(base.emi - longerTenure.emi)} but adds{" "}
                {formatINR(longerTenure.totalInterest - base.totalInterest)} in interest.
              </span>
            </li>
            {shorterTenure && (
              <li className="flex gap-3 text-[0.95rem] leading-relaxed">
                <span aria-hidden="true" className="mt-[0.7rem] h-px w-3 shrink-0 bg-ink-muted" />
                <span>
                  One year less raises the EMI by {formatINR(shorterTenure.emi - base.emi)} and saves{" "}
                  {formatINR(base.totalInterest - shorterTenure.totalInterest)} in interest.
                </span>
              </li>
            )}
          </ul>
        </CalculatorSection>
      )}

      <CalculatorSection
        id="car-afford"
        title="Check the EMI against your income"
        description="Optional. A rough share-of-income guide for planning — not a lending decision or financial advice."
      >
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
            checked={showAfford}
            aria-controls={affordId}
            onChange={(e) => {
              trackScenario("option_toggle");
              setShowAfford(e.target.checked);
            }}
          />
          <span className="text-sm font-semibold text-ink">Compare the car EMI with my monthly income</span>
        </label>
        <div id={affordId} hidden={!showAfford} className="mt-5">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <NumberField
                label="Monthly take-home income"
                prefix="₹"
                showWords
                min={0}
                max={50_00_000}
                step={1_000}
                value={income}
                onChange={setIncome}
                onInteract={markInteraction}
                hint="In-hand pay after tax and deductions."
              />
              <NumberField
                label="Existing EMIs per month"
                prefix="₹"
                showWords
                min={0}
                max={20_00_000}
                step={500}
                value={existingEmis}
                onChange={setExistingEmis}
                onInteract={markInteraction}
                hint="Home, personal, credit card or other loan EMIs you already pay."
              />
            </div>
            <div>
              {afford.isValid ? (
                <dl className="space-y-2">
                  <ResultStat
                    label="Car EMI as % of take-home"
                    value={formatPercent(afford.carEmiSharePercent)}
                    note={afford.band ? `${BAND_LABEL[afford.band]} (rough estimate). ${BAND_TEXT[afford.band]}` : undefined}
                  />
                  <ResultStat
                    label="All EMIs as % of take-home"
                    value={formatPercent(afford.totalEmiSharePercent)}
                    note={`${formatINR(afford.totalEmis)} a month in total, including the car EMI.`}
                  />
                </dl>
              ) : (
                <p className="text-sm text-ink-muted">Enter your monthly take-home income to see the shares.</p>
              )}
              {afford.isValid && afford.totalAboveCautionLevel && (
                <div className="mt-4">
                  <Callout tone="warn" title={`All EMIs above ${TOTAL_EMI_CAUTION_PERCENT}% of take-home pay`}>
                    As a general observation, many lenders become cautious once total EMIs pass roughly 40–50% of
                    income, and a high share leaves less room for savings and emergencies.
                  </Callout>
                </div>
              )}
              <p className="mt-4 text-xs text-ink-muted">
                Bands: up to 10% lower share, above 10% to 20% moderate share, above 20% higher share. These are
                planning heuristics, not rules; your other expenses and savings goals matter more.
              </p>
            </div>
          </div>
        </div>
      </CalculatorSection>

      <AmortizationTable input={emiInput} onViewChange={() => trackScenario("schedule_view")} />
    </div>
  );
}
