"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable, type ScenarioRow } from "@/components/ui/ScenarioTable";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  calculateLoanPrepayment,
  comparePrepayWithInvesting,
  PREPAYMENT_SCENARIO_AMOUNTS,
  type PrepaymentFrequency,
  type PrepaymentStrategy,
  type StrategyResult,
} from "@/lib/calculations/loanPrepayment";
import { yearsToMonths } from "@/lib/calculations/utils";
import { formatINR, formatINRCompact, formatINRPrecise, formatMonths, formatPercent } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "yearly", label: "Every year" },
] as const;

const STRATEGY_OPTIONS = [
  { value: "reduce-tenure", label: "Reduce tenure (keep EMI)" },
  { value: "reduce-emi", label: "Reduce EMI (keep tenure)" },
] as const;

const PRESETS = PREPAYMENT_SCENARIO_AMOUNTS.map((v) => ({ label: formatINRCompact(v), value: v }));

/**
 * The current calendar month as a single index (year × 12 + month), read only on the client.
 * The server snapshot is null, so the first render matches the server HTML (durations only)
 * and calendar dates appear after hydration.
 */
const noopSubscribe = () => () => {};
function getMonthIndex(): number {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
}
function getServerMonthIndex(): number | null {
  return null;
}

/** Month-year of the k-th instalment, where instalment 1 falls next calendar month. */
function payoffDate(monthIndex: number | null, instalments: number): string | null {
  if (monthIndex === null || !Number.isFinite(instalments) || instalments <= 0) return null;
  const target = monthIndex + Math.round(instalments);
  const date = new Date(Date.UTC(Math.floor(target / 12), target % 12, 1));
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
}

function payoffLabel(monthIndex: number | null, months: number): string {
  const date = payoffDate(monthIndex, months);
  return date ? `${formatMonths(months)} (${date})` : formatMonths(months);
}

export function LoanPrepaymentCalculator() {
  const [outstanding, setOutstanding] = useState(30_00_000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(15);
  const [prepayment, setPrepayment] = useState(2_00_000);
  const [frequency, setFrequency] = useState<PrepaymentFrequency>("once");
  const [firstMonth, setFirstMonth] = useState(1);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [feePercent, setFeePercent] = useState(0);
  const [strategy, setStrategy] = useState<PrepaymentStrategy>("reduce-tenure");
  const [expectedReturn, setExpectedReturn] = useState(10);
  const [taxOnGains, setTaxOnGains] = useState(0);

  const monthIndex = useSyncExternalStore(noopSubscribe, getMonthIndex, getServerMonthIndex);

  const shared = useMemo(
    () => ({ outstanding, annualRate: rate, remainingYears: years, frequency, firstPrepaymentMonth: firstMonth, extraMonthly, feePercent }),
    [outstanding, rate, years, frequency, firstMonth, extraMonthly, feePercent],
  );
  const result = useMemo(() => calculateLoanPrepayment({ ...shared, prepaymentAmount: prepayment }), [shared, prepayment]);

  const scenarioRows = useMemo<ScenarioRow[]>(() => {
    const amounts: number[] = [...PREPAYMENT_SCENARIO_AMOUNTS];
    if (prepayment > 0 && !amounts.includes(prepayment)) amounts.push(prepayment);
    amounts.sort((a, b) => a - b);
    return amounts.map((amount) => {
      const r = calculateLoanPrepayment({ ...shared, prepaymentAmount: amount });
      return {
        label: formatINR(amount),
        current: amount === prepayment,
        cells: [
          formatINR(r.reduceTenure.interestSaved),
          formatMonths(r.reduceTenure.monthsSaved),
          formatINR(r.reduceEmi.emiAfterFirstPrepayment),
          formatINR(r.reduceEmi.interestSaved),
        ],
      };
    });
  }, [shared, prepayment]);

  const horizon = result.isValid && firstMonth <= result.remainingMonths ? result.remainingMonths - firstMonth : 0;
  const invest = useMemo(
    () =>
      comparePrepayWithInvesting({
        amount: prepayment,
        loanAnnualRate: rate,
        expectedAnnualReturn: expectedReturn,
        months: horizon,
        taxOnGainsPercent: taxOnGains,
      }),
    [prepayment, rate, expectedReturn, horizon, taxOnGains],
  );

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "loan-prepayment",
    result.isValid,
    `${outstanding}|${rate}|${years}|${prepayment}|${frequency}|${firstMonth}|${extraMonthly}|${feePercent}|${strategy}`,
  );
  const comparisonTracked = useRef(false);
  function handleComparisonInteract() {
    if (comparisonTracked.current) return;
    comparisonTracked.current = true;
    trackComparison();
  }

  const selected: StrategyResult = strategy === "reduce-tenure" ? result.reduceTenure : result.reduceEmi;
  const remainingMonths = yearsToMonths(years);
  const emiChanges =
    strategy === "reduce-emi" && Math.abs(result.reduceEmi.finalEmi - result.reduceEmi.emiAfterFirstPrepayment) >= 1;

  function strategyRow(label: string, s: StrategyResult, value: PrepaymentStrategy): ScenarioRow {
    return {
      label,
      current: strategy === value,
      cells: [
        s.emiAfterFirstPrepayment > 0 ? formatINR(s.emiAfterFirstPrepayment) : "Loan closed",
        formatMonths(s.months),
        formatINR(s.totalInterest),
        formatINR(s.interestSaved),
        s.netLoss > 0 ? `−${formatINR(s.netLoss)}` : formatINR(s.netSaving),
      ],
    };
  }

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Loan prepayment calculator inputs"
        inputs={
          <>
            <NumberField
              label="Outstanding principal"
              prefix="₹"
              showWords
              min={10_000}
              max={10_00_00_000}
              step={10_000}
              value={outstanding}
              onChange={setOutstanding}
              onInteract={markInteraction}
              hint="From your latest loan statement."
            />
            <NumberField
              label="Current interest rate (per annum)"
              suffix="%"
              min={0}
              max={20}
              step={0.05}
              value={rate}
              onChange={setRate}
              onInteract={markInteraction}
            />
            <NumberField
              label="Remaining tenure"
              suffix="years"
              min={0.5}
              max={30}
              step={0.5}
              value={years}
              onChange={setYears}
              onInteract={markInteraction}
              hint={`${remainingMonths} monthly instalments left. Decimals allowed, e.g. 12.5.`}
            />
            <div className="border-y border-line bg-paper px-4 py-3 -mx-4 sm:-mx-6 sm:px-6">
              <p className="text-sm font-semibold text-ink">Current EMI</p>
              <output aria-live="polite" className="block font-serif text-2xl font-semibold tabular-nums text-ink">
                {result.isValid ? formatINR(result.currentEmi) : "₹0"}
              </output>
              <p className="text-xs text-ink-muted">
                Calculated from the balance, rate and remaining tenure. If your actual EMI differs, adjust the remaining
                tenure.
              </p>
            </div>

            <div className="space-y-3">
              <NumberField
                label="Prepayment amount"
                prefix="₹"
                showWords
                min={0}
                max={1_00_00_000}
                step={10_000}
                value={prepayment}
                onChange={setPrepayment}
                onInteract={markInteraction}
              />
              <PresetButtons
                label="Quick amounts"
                presets={PRESETS}
                current={prepayment}
                onSelect={(v) => {
                  trackScenario("preset");
                  setPrepayment(v);
                }}
              />
            </div>
            <SegmentedControl
              legend="How often"
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onChange={(v) => {
                trackScenario("mode_switch");
                setFrequency(v);
              }}
            />
            <NumberField
              label="Month of first prepayment"
              min={1}
              max={Math.max(1, remainingMonths)}
              step={1}
              value={firstMonth}
              onChange={(v) => setFirstMonth(Math.round(v))}
              onInteract={markInteraction}
              hint={
                frequency === "yearly"
                  ? "1 = with your next EMI. Repeats every 12 months after that."
                  : "1 = with your next EMI."
              }
            />
            <NumberField
              label="Extra payment every month (optional)"
              prefix="₹"
              min={0}
              max={5_00_000}
              step={1_000}
              value={extraMonthly}
              onChange={setExtraMonthly}
              onInteract={markInteraction}
              hint="Paid on top of the EMI from month 1. Always shortens the loan."
            />
            <NumberField
              label="Prepayment fee"
              suffix="%"
              min={0}
              max={5}
              step={0.25}
              value={feePercent}
              onChange={setFeePercent}
              onInteract={markInteraction}
              hint="Many lenders do not charge on floating-rate home loans to individuals; fixed-rate and other loans may carry a fee — check your loan agreement."
            />
            <div className="border-t border-line pt-5">
              <SegmentedControl
                legend="After prepaying, I want to"
                options={STRATEGY_OPTIONS}
                value={strategy}
                onChange={(v) => {
                  trackScenario("option_toggle");
                  setStrategy(v);
                }}
              />
            </div>
          </>
        }
        results={
          <div className="space-y-5">
            <dl>
              <div aria-live="polite" aria-atomic="true">
                <ResultStat
                  emphasis
                  label="Interest saved"
                  value={formatINR(selected.interestSaved)}
                  note={
                    !result.isValid
                      ? "Enter your outstanding balance and remaining tenure."
                      : !result.hasPrepayment
                        ? "Add a prepayment amount or an extra monthly payment to see the saving."
                        : strategy === "reduce-tenure"
                          ? `Loan ends ${formatMonths(selected.monthsSaved)} earlier, with the same EMI.`
                          : `EMI drops to ${formatINRPrecise(selected.emiAfterFirstPrepayment)} after the first prepayment.`
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                <ResultStat label="Original total interest" value={formatINR(result.original.totalInterest)} />
                <ResultStat label="New total interest" swatch="interest" value={formatINR(selected.totalInterest)} />
                <ResultStat
                  label="Total prepaid"
                  value={formatINR(selected.totalPrepaid)}
                  note={selected.lumpSumsApplied > 1 ? `${selected.lumpSumsApplied} lump sums` : undefined}
                />
                <ResultStat label="Prepayment fees" value={formatINR(selected.feesPaid)} />
                {selected.netLoss > 0 ? (
                  <ResultStat label="Net cost after fees" value={formatINR(selected.netLoss)} note="Fees exceed the interest saved." />
                ) : (
                  <ResultStat label="Net saving after fees" value={formatINR(selected.netSaving)} />
                )}
                {strategy === "reduce-tenure" ? (
                  <ResultStat
                    label="Time saved"
                    value={formatMonths(selected.monthsSaved)}
                    note={`EMI stays ${formatINR(result.currentEmi)}.`}
                  />
                ) : (
                  <ResultStat
                    label={emiChanges ? "EMI after first prepayment" : "New EMI"}
                    value={selected.emiAfterFirstPrepayment > 0 ? formatINR(selected.emiAfterFirstPrepayment) : "Loan closed"}
                    note={`Was ${formatINR(result.currentEmi)}.`}
                  />
                )}
                {emiChanges && <ResultStat label="Final EMI" value={formatINR(selected.finalEmi)} note="After the last yearly prepayment." />}
                <ResultStat label="Original payoff" value={formatMonths(result.original.months)} note={payoffDate(monthIndex, result.original.months) ?? undefined} />
                <ResultStat label="New payoff" value={formatMonths(selected.months)} note={payoffDate(monthIndex, selected.months) ?? undefined} />
              </div>
            </dl>
            {result.notes.length > 0 && (
              <Callout tone="warn" title="Please note">
                <ul className="list-disc space-y-1 pl-5">
                  {result.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </Callout>
            )}
            <p className="text-xs text-ink-muted">
              Durations count from your next EMI.{monthIndex !== null ? " Dates assume the next EMI falls next month." : ""}
            </p>
          </div>
        }
      />

      <Callout title="Reduce tenure or reduce EMI?">
        Keeping the EMI and shortening the loan usually saves more interest, because the higher EMI keeps cutting the
        balance faster. Lowering the EMI saves less but frees up monthly cash flow. Many lenders let you choose either
        when you prepay.
      </Callout>

      <CalculatorSection
        id="prepay-compare"
        title="Reduce tenure vs reduce EMI"
        description="Both options calculated for your inputs. The highlighted row is the option you selected above."
      >
        <ScenarioTable
          caption="Loan outcome without prepayment, with reduced tenure and with reduced EMI"
          columns={[
            { label: "Option" },
            { label: "EMI after prepayment", numeric: true },
            { label: "Loan ends after", numeric: true },
            { label: "Total interest", numeric: true },
            { label: "Interest saved", numeric: true },
            { label: "Net saving after fees", numeric: true },
          ]}
          rows={[
            {
              label: "No prepayment",
              cells: [
                formatINR(result.currentEmi),
                formatMonths(result.original.months),
                formatINR(result.original.totalInterest),
                formatINR(0),
                formatINR(0),
              ],
            },
            strategyRow("Reduce tenure", result.reduceTenure, "reduce-tenure"),
            strategyRow("Reduce EMI", result.reduceEmi, "reduce-emi"),
          ]}
        />
        <p className="mt-2 text-xs text-ink-muted">
          With reduced tenure the loan ends after {payoffLabel(monthIndex, result.reduceTenure.months)}; with reduced
          EMI, after {payoffLabel(monthIndex, result.reduceEmi.months)}.
        </p>
      </CalculatorSection>

      <CalculatorSection
        id="prepay-amounts"
        title="Savings at different prepayment amounts"
        description="Uses your other inputs: balance, rate, tenure, frequency, first month, extra monthly payment and fee."
      >
        <ScenarioTable
          caption="Interest saved and EMI for different prepayment amounts"
          columns={[
            { label: "Prepayment" },
            { label: "Interest saved (reduce tenure)", numeric: true },
            { label: "Time saved", numeric: true },
            { label: "New EMI (reduce EMI)", numeric: true },
            { label: "Interest saved (reduce EMI)", numeric: true },
          ]}
          rows={scenarioRows}
        />
      </CalculatorSection>

      <CalculatorSection
        id="prepay-invest"
        title="Prepay or invest the same amount?"
        description="An illustration, not advice. Prepaying earns a guaranteed return equal to your loan rate; an investment's return is uncertain and may be taxed."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <NumberField
              label="Expected investment return (per annum)"
              suffix="%"
              min={0}
              max={20}
              step={0.5}
              value={expectedReturn}
              onChange={setExpectedReturn}
              onInteract={handleComparisonInteract}
              hint="An assumption. Market-linked returns are not guaranteed and can be negative in some years."
            />
            <NumberField
              label="Tax on investment gains"
              suffix="%"
              min={0}
              max={40}
              step={0.5}
              value={taxOnGains}
              onChange={setTaxOnGains}
              onInteract={handleComparisonInteract}
              hint="Your expected effective tax on the gain when you withdraw. 0 ignores tax."
            />
          </div>
          {invest.isValid ? (
            <div>
              <p className="text-sm text-ink-muted">
                One lump sum of {formatINR(invest.amount)}, valued after {formatMonths(invest.months)} — the rest of the
                original tenure after the prepayment.
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                <ResultStat
                  label="Prepay (guaranteed)"
                  value={formatINR(invest.prepayValue)}
                  note={`Grows at your loan rate, ${formatPercent(invest.loanEffectiveAnnualRate, 2)} a year effective.`}
                />
                <ResultStat
                  label={`Invest at ${formatPercent(expectedReturn)} (not guaranteed)`}
                  value={formatINR(invest.investValueAfterTax)}
                  note={taxOnGains > 0 ? "After tax on the gain." : "Before tax."}
                />
                <ResultStat
                  label="Return needed to beat prepaying"
                  value={formatPercent(invest.breakEvenReturn, 2)}
                  note="Per year, before tax on gains."
                />
                <ResultStat
                  label={invest.investAhead > 0 ? "Investing ahead by" : "Prepaying ahead by"}
                  value={formatINR(invest.investAhead > 0 ? invest.investAhead : invest.prepayAhead)}
                  note={invest.investAhead > 0 ? "Only if the assumed return is achieved." : "Guaranteed, if the loan rate stays the same."}
                />
              </dl>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">
              Enter a prepayment amount and a first prepayment month within the remaining tenure to see this comparison.
            </p>
          )}
        </div>
        <p className="mt-4 max-w-3xl text-xs text-ink-muted">
          Both figures show what the same lump sum is worth at the end of the original tenure, so they can be compared
          directly. The &ldquo;interest saved&rdquo; figure above is a different measure: a plain total of interest
          avoided, without compounding. If you claim a tax deduction on home loan interest (old tax regime), your
          effective loan rate — and the return you need from investing — is lower. Keep an emergency fund before
          prepaying, since prepaid money is hard to get back.
        </p>
      </CalculatorSection>

      <Callout tone="neutral" title="Assumptions used in this calculation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Interest is charged monthly on the reducing balance; the rate stays the same for the rest of the loan.</li>
          <li>Prepayments are paid along with the EMI of the chosen month and go entirely towards principal.</li>
          <li>
            With &ldquo;Reduce EMI&rdquo;, the EMI is recalculated after each lump sum over the months left in the
            original tenure. Extra monthly payments never change the EMI; they shorten the loan.
          </li>
          <li>Prepayment fees are paid separately, as a percentage of each amount prepaid, including extra monthly payments.</li>
          <li>Tax benefits, processing charges and changes in your loan rate are not included.</li>
        </ul>
      </Callout>
    </div>
  );
}
