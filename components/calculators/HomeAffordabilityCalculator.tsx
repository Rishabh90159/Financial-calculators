"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable } from "@/components/ui/ScenarioTable";
import {
  calculateHomeAffordability,
  checkPropertyAffordability,
  type AffordabilityBand,
  type AffordabilityScenario,
  type BindingConstraint,
  type HomeAffordabilityInput,
  type HomeAffordabilityResult,
} from "@/lib/calculations/homeAffordability";
import { amountInWords, formatINR, formatPercent } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const INCOME_PRESETS = [50_000, 75_000, 1_00_000, 1_50_000, 2_00_000];
const TENURE_PRESETS = [15, 20, 25, 30];
const PRICE_PRESETS = [40_00_000, 60_00_000, 80_00_000, 1_00_00_000, 1_50_00_000];

const SCENARIO_LABEL: Record<AffordabilityScenario["key"], string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

const BINDING_SHORT: Record<BindingConstraint, string> = {
  "emi-ratio": "EMI-to-income limit",
  "cash-flow": "Monthly budget",
  savings: "Savings for down payment",
  ltv: "Loan-to-value slab",
  none: "—",
};

function lakhWords(n: number): string {
  const words = amountInWords(n);
  return words ? `about ₹${words}` : formatINR(n);
}

function bindingExplanation(s: AffordabilityScenario, r: HomeAffordabilityResult): ReactNode {
  const tenureYears = r.tenureMonths / 12;
  switch (s.binding) {
    case "emi-ratio":
      return (
        <>
          <strong>Your EMI-to-income limit.</strong> At {formatPercent(s.ratioPercent, 0)} of take-home income, all
          your EMIs together can be {formatINR((r.monthlyIncome * s.ratioPercent) / 100)} a month
          {r.existingEmis > 0 ? `, leaving ${formatINR(s.ratioCapEmi)} for the home loan after existing EMIs` : ""}.
          That supports a loan of {lakhWords(s.maxLoanFromEmi)} at {formatPercent(r.annualRate, 2)} over{" "}
          {tenureYears} years. Your savings could stretch further, but the EMI could not.
        </>
      );
    case "cash-flow":
      return (
        <>
          <strong>Your monthly budget.</strong> After expenses, investments
          {r.existingEmis > 0 ? ", existing EMIs" : ""} and ownership costs, {formatINR(s.cashFlowCapEmi)} a month is
          left for a home loan EMI — less than the {formatPercent(s.ratioPercent, 0)} limit of{" "}
          {formatINR(Math.max(0, (r.monthlyIncome * s.ratioPercent) / 100 - r.existingEmis))}. Cutting expenses or
          investing less would raise the budget, at the cost of your other goals.
        </>
      );
    case "savings":
      return (
        <>
          <strong>Your savings for the down payment.</strong> Lenders finance at most{" "}
          {formatPercent(s.appliedLtvPercent, 0)} of the price at this loan size, so the rest plus{" "}
          {formatPercent(r.purchaseCostPercent, 1)} purchase costs must come from your {formatINR(r.cashAvailable)} of
          savings above the emergency fund.
          {s.emiCapacity > s.emi + 1
            ? ` Your EMI room of ${formatINR(s.emiCapacity)} could service a bigger loan, but the down payment runs out first.`
            : ""}
        </>
      );
    case "ltv":
      return (
        <>
          <strong>The RBI loan-to-value slab.</strong> The loan is held at {formatINR(s.loanAmount)} because a bigger
          loan falls into a slab with a lower maximum LTV, which would need a larger down payment than your savings
          allow.
        </>
      );
    default:
      return <>Enter your take-home income and a loan tenure to see what limits your budget.</>;
  }
}

const BAND_TEXT: Record<AffordabilityBand, string> = {
  conservative: "Within your Conservative limit",
  balanced: "Within your Balanced limit",
  aggressive: "Within your Aggressive limit",
  above: "Above your Aggressive limit",
};

export function HomeAffordabilityCalculator() {
  const [income, setIncome] = useState(1_00_000);
  const [existingEmis, setExistingEmis] = useState(0);
  const [expenses, setExpenses] = useState(35_000);
  const [investments, setInvestments] = useState(15_000);
  const [savings, setSavings] = useState(20_00_000);
  const [emergency, setEmergency] = useState(3_00_000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [costPct, setCostPct] = useState(7);
  const [ownership, setOwnership] = useState(3_000);
  const [conservative, setConservative] = useState(30);
  const [balanced, setBalanced] = useState(40);
  const [aggressive, setAggressive] = useState(50);
  const [maxLtv, setMaxLtv] = useState(80);
  const [checkPrice, setCheckPrice] = useState(80_00_000);

  const input: HomeAffordabilityInput = useMemo(
    () => ({
      monthlyIncome: income,
      existingEmis,
      monthlyExpenses: expenses,
      monthlyInvestments: investments,
      currentSavings: savings,
      emergencyFund: emergency,
      annualRate: rate,
      tenureYears: years,
      purchaseCostPercent: costPct,
      monthlyOwnershipCosts: ownership,
      ratios: { conservative, balanced, aggressive },
      maxLtvPercent: maxLtv,
    }),
    [income, existingEmis, expenses, investments, savings, emergency, rate, years, costPct, ownership, conservative, balanced, aggressive, maxLtv],
  );
  const result = useMemo(() => calculateHomeAffordability(input), [input]);
  const check = useMemo(() => checkPropertyAffordability(input, checkPrice), [input, checkPrice]);

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "home-affordability",
    result.isValid,
    `${Object.values(input.ratios ?? {}).join(",")}|${income}|${existingEmis}|${expenses}|${investments}|${savings}|${emergency}|${rate}|${years}|${costPct}|${ownership}|${maxLtv}|${checkPrice}`,
  );

  // The property check fires one comparison event per view, not one per keystroke or slider step.
  const comparisonTracked = useRef(false);
  const onCompare = useCallback(() => {
    if (comparisonTracked.current) return;
    comparisonTracked.current = true;
    trackComparison();
  }, [trackComparison]);

  const b = result.scenarios.balanced;
  const a = result.scenarios.aggressive;
  const groupLegend = "mb-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted";

  return (
    <div className="space-y-8">
      <CalculatorCard
        formLabel="Home affordability calculator inputs"
        inputs={
          <>
            <fieldset className="space-y-5">
              <legend className={groupLegend}>Monthly income and budget</legend>
              <div className="space-y-3">
                <NumberField
                  label="Monthly take-home income"
                  prefix="₹"
                  showWords
                  min={10_000}
                  max={20_00_000}
                  step={5_000}
                  value={income}
                  onChange={setIncome}
                  onInteract={markInteraction}
                  hint="In-hand salary after tax and PF. Add a co-applicant's take-home if you will buy jointly."
                />
                <PresetButtons
                  label="Quick income"
                  presets={INCOME_PRESETS.map((v) => ({ label: `₹${amountInWords(v).replace(" thousand", "k")}`, value: v }))}
                  current={income}
                  onSelect={(v) => {
                    trackScenario("preset");
                    setIncome(v);
                  }}
                />
              </div>
              <NumberField
                label="Existing EMIs"
                prefix="₹"
                showWords
                min={0}
                max={5_00_000}
                step={1_000}
                value={existingEmis}
                onChange={setExistingEmis}
                onInteract={markInteraction}
                hint="Car, personal, education or other loan EMIs that will continue."
              />
              <NumberField
                label="Monthly living expenses"
                prefix="₹"
                showWords
                min={0}
                max={10_00_000}
                step={1_000}
                value={expenses}
                onChange={setExpenses}
                onInteract={markInteraction}
                hint="Groceries, utilities, school fees, transport, insurance. Leave out rent you will stop paying."
              />
              <NumberField
                label="Monthly investments you want to keep"
                prefix="₹"
                showWords
                min={0}
                max={10_00_000}
                step={1_000}
                value={investments}
                onChange={setInvestments}
                onInteract={markInteraction}
                hint="SIPs, PPF, retirement savings — what you don't want the EMI to crowd out."
              />
            </fieldset>

            <fieldset className="space-y-5 border-t border-line pt-5">
              <legend className="sr-only">Savings</legend>
              <p aria-hidden="true" className={groupLegend}>Savings</p>
              <NumberField
                label="Current savings available"
                prefix="₹"
                showWords
                min={0}
                max={10_00_00_000}
                step={50_000}
                value={savings}
                onChange={setSavings}
                onInteract={markInteraction}
                hint="Bank balances, FDs and investments you are willing to use, including the emergency fund."
              />
              <NumberField
                label="Emergency fund to keep aside"
                prefix="₹"
                showWords
                min={0}
                max={1_00_00_000}
                step={25_000}
                value={emergency}
                onChange={setEmergency}
                onInteract={markInteraction}
                hint="Often several months of expenses and EMIs. Never spent on the purchase."
              />
            </fieldset>

            <fieldset className="space-y-5 border-t border-line pt-5">
              <legend className="sr-only">Loan and buying costs</legend>
              <p aria-hidden="true" className={groupLegend}>Loan and buying costs</p>
              <NumberField
                label="Interest rate (per annum)"
                suffix="%"
                min={5}
                max={15}
                step={0.05}
                value={rate}
                onChange={setRate}
                onInteract={markInteraction}
                hint="Floating rates can rise; test a rate 1% higher too."
              />
              <div className="space-y-3">
                <NumberField
                  label="Loan tenure"
                  suffix="years"
                  min={5}
                  max={30}
                  step={1}
                  value={years}
                  onChange={setYears}
                  onInteract={markInteraction}
                />
                <PresetButtons
                  label="Quick tenure"
                  presets={TENURE_PRESETS.map((y) => ({ label: `${y} yrs`, value: y }))}
                  current={years}
                  onSelect={(v) => {
                    trackScenario("preset");
                    setYears(v);
                  }}
                />
              </div>
              <NumberField
                label="Purchase costs (% of price)"
                suffix="%"
                min={0}
                max={15}
                step={0.5}
                value={costPct}
                onChange={setCostPct}
                onInteract={markInteraction}
                hint="Stamp duty, registration, legal and similar costs. Varies by state — use the Property Purchase Cost Calculator for an exact figure."
              />
              <NumberField
                label="Monthly ownership costs"
                prefix="₹"
                showWords
                min={0}
                max={1_00_000}
                step={500}
                value={ownership}
                onChange={setOwnership}
                onInteract={markInteraction}
                hint="Maintenance, property tax spread monthly, home insurance."
              />
            </fieldset>

            <fieldset className="space-y-5 rounded-md border border-line bg-paper p-4">
              <legend className="px-1 text-sm font-semibold text-ink">Affordability assumptions</legend>
              <p className="text-xs text-ink-muted">
                Each ratio caps <strong className="text-ink">all EMIs together</strong> (existing + new home loan) as a
                share of take-home income. These are planning rules of thumb, not regulation or advice.
              </p>
              <NumberField
                label="Conservative EMI-to-income"
                suffix="%"
                min={10}
                max={70}
                step={1}
                value={conservative}
                onChange={setConservative}
                onInteract={markInteraction}
              />
              <NumberField
                label="Balanced EMI-to-income"
                suffix="%"
                min={10}
                max={70}
                step={1}
                value={balanced}
                onChange={setBalanced}
                onInteract={markInteraction}
                hint="Used for the headline budget."
              />
              <NumberField
                label="Aggressive EMI-to-income"
                suffix="%"
                min={10}
                max={70}
                step={1}
                value={aggressive}
                onChange={setAggressive}
                onInteract={markInteraction}
              />
              <NumberField
                label="Maximum loan-to-value (LTV)"
                suffix="%"
                min={50}
                max={90}
                step={1}
                value={maxLtv}
                onChange={setMaxLtv}
                onInteract={markInteraction}
                hint="RBI slabs cap it further: 90% for loans up to ₹30 lakh, 80% up to ₹75 lakh, 75% above."
              />
            </fieldset>
          </>
        }
        results={
          result.isValid ? (
            <div className="space-y-5">
              <dl>
                <div aria-live="polite" aria-atomic="true">
                  <ResultStat
                    emphasis
                    label="Comfortable property price (Balanced)"
                    value={formatINR(b.propertyPrice)}
                    note={`${lakhWords(b.propertyPrice)} · total EMIs up to ${formatPercent(b.ratioPercent, 0)} of take-home income, keeping your ${formatINR(result.emergencyFundKept)} emergency fund untouched.`}
                  />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-2 min-[420px]:grid-cols-2">
                  <ResultStat
                    label="Recommended EMI (Balanced)"
                    value={formatINR(b.emi)}
                    note={b.emiCapacity > b.emi + 1 ? `EMI room ${formatINR(b.emiCapacity)}; savings limit the loan.` : undefined}
                  />
                  <ResultStat
                    label="Maximum EMI (Aggressive)"
                    value={formatINR(a.emiCapacity)}
                    note={
                      a.ratioCapEmi > a.cashFlowCapEmi
                        ? `Held below the ${formatPercent(a.ratioPercent, 0)} limit by your monthly budget.`
                        : `${formatPercent(a.ratioPercent, 0)} EMI-to-income limit, after existing EMIs.`
                    }
                  />
                  <ResultStat label="Home loan (Balanced)" value={formatINR(b.loanAmount)} note={`${formatPercent(b.loanToValuePercent)} of the price`} />
                  <ResultStat label="Down payment" value={formatINR(b.downPayment)} />
                  <ResultStat
                    label="Upfront cash required"
                    value={formatINR(b.upfrontCash)}
                    note={`Down payment + ${formatINR(b.purchaseCosts)} purchase costs.`}
                  />
                  <ResultStat
                    label="Savings after buying"
                    value={formatINR(result.emergencyFundKept + b.remainingSavings)}
                    note={`Emergency fund ${formatINR(result.emergencyFundKept)} + ${formatINR(b.remainingSavings)} spare.`}
                  />
                  <ResultStat
                    label="Monthly housing cost"
                    value={formatINR(b.monthlyHousingCost)}
                    note={`EMI + ${formatINR(b.propertyPrice > 0 ? result.monthlyOwnershipCosts : 0)} ownership costs.`}
                  />
                  <ResultStat
                    label="Money left each month"
                    value={formatINR(b.monthlySurplus)}
                    note={
                      b.monthlyShortfall > 0
                        ? `Short by ${formatINR(b.monthlyShortfall)} a month.`
                        : "After expenses, investments, all EMIs and ownership costs."
                    }
                  />
                  <ResultStat label="Total EMIs ÷ take-home (DTI)" value={formatPercent(b.totalEmiToIncomePercent)} />
                  <ResultStat label="Housing cost ÷ take-home" value={formatPercent(b.housingCostToIncomePercent)} />
                </div>
              </dl>

              <Callout tone="info" title="What limits your budget">
                {bindingExplanation(b, result)}
              </Callout>

              {result.notes.map((n) => (
                <Callout key={n} tone="warn">
                  {n}
                </Callout>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-line bg-paper p-4 text-sm text-ink-muted">
              Enter your monthly take-home income and a loan tenure to see a comfortable property budget.
            </p>
          )
        }
      />

      <CalculatorSection
        id="affordability-scenarios"
        title="Conservative, Balanced and Aggressive budgets"
        description="The same inputs under three EMI-to-income limits. These are scenarios to compare, not recommendations — the right level depends on job security, dependants and other goals."
      >
        <ScenarioTable
          caption="Home affordability under three EMI-to-income scenarios"
          columns={[
            { label: "Scenario" },
            { label: "EMI limit", numeric: true },
            { label: "Home loan EMI", numeric: true },
            { label: "Loan", numeric: true },
            { label: "Property price", numeric: true },
            { label: "Upfront cash", numeric: true },
            { label: "Left each month", numeric: true },
            { label: "Limited by", numeric: false },
          ]}
          rows={result.scenarioList.map((s) => ({
            label: SCENARIO_LABEL[s.key],
            current: s.key === "balanced",
            cells: [
              formatPercent(s.ratioPercent, 0),
              formatINR(s.emi),
              formatINR(s.loanAmount),
              formatINR(s.propertyPrice),
              formatINR(s.upfrontCash),
              s.monthlyShortfall > 0 ? `−${formatINR(s.monthlyShortfall)}` : formatINR(s.monthlySurplus),
              result.isValid ? BINDING_SHORT[s.binding] : "—",
            ],
          }))}
        />
        <p className="mt-2 text-xs text-ink-muted">
          Balanced is the scenario shown in your results. &ldquo;Left each month&rdquo; is take-home income minus
          expenses, investments, all EMIs and ownership costs.
        </p>
      </CalculatorSection>

      <CalculatorSection
        id="property-check"
        title="Can I afford this property?"
        description="Enter a price you are considering. The check assumes you borrow the most the LTV limits allow and pay the minimum down payment plus purchase costs."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="space-y-3">
            <NumberField
              label="Property price"
              prefix="₹"
              showWords
              min={5_00_000}
              max={20_00_00_000}
              step={50_000}
              value={checkPrice}
              onChange={setCheckPrice}
              onInteract={onCompare}
            />
            <PresetButtons
              label="Quick price"
              presets={PRICE_PRESETS.map((v) => ({
                label: `₹${amountInWords(v).replace(" lakh", "L").replace(" crore", " Cr")}`,
                value: v,
              }))}
              current={checkPrice}
              onSelect={(v) => {
                onCompare();
                setCheckPrice(v);
              }}
            />
          </div>

          {check.isValid ? (
            <div className="space-y-4">
              <div aria-live="polite" aria-atomic="true" className="space-y-2">
                <p className="text-sm text-ink-muted">Estimate, not advice</p>
                <p className="font-serif text-xl font-semibold text-ink">
                  {BAND_TEXT[check.band]}{" "}
                  <span className="font-sans text-base font-normal text-ink-muted">
                    — total EMIs would be {formatPercent(check.totalEmiToIncomePercent)} of take-home income
                  </span>
                </p>
                <p className="text-sm font-semibold text-ink">
                  {check.cashShortfall > 0
                    ? `Upfront cash short by ${formatINR(check.cashShortfall)}`
                    : `Upfront cash covered, with ${formatINR(check.cashSurplus)} to spare`}
                  {check.monthlyShortfall > 0 ? ` · Monthly budget short by ${formatINR(check.monthlyShortfall)}` : ""}
                </p>
              </div>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-2 min-[420px]:grid-cols-2">
                <ResultStat label="Monthly EMI" value={formatINR(check.emi)} note={`On a loan of ${formatINR(check.loanAmount)}`} />
                <ResultStat
                  label="Required down payment"
                  value={formatINR(check.downPayment)}
                  note={`${formatPercent(100 - check.loanToValuePercent)} of the price`}
                />
                <ResultStat
                  label="Upfront cash needed"
                  value={formatINR(check.upfrontCash)}
                  note={`Down payment + ${formatINR(check.purchaseCosts)} purchase costs; you have ${formatINR(check.cashAvailable)}.`}
                />
                <ResultStat
                  label={check.cashShortfall > 0 ? "Cash shortfall" : "Cash surplus"}
                  value={formatINR(check.cashShortfall > 0 ? check.cashShortfall : check.cashSurplus)}
                />
                <ResultStat
                  label="Monthly housing cost"
                  value={formatINR(check.monthlyHousingCost)}
                  note={`${formatPercent(check.housingCostToIncomePercent)} of take-home income`}
                />
                <ResultStat
                  label={check.monthlyShortfall > 0 ? "Monthly shortfall" : "Money left each month"}
                  value={formatINR(check.monthlyShortfall > 0 ? check.monthlyShortfall : check.monthlySurplus)}
                  note="After expenses, investments, all EMIs and ownership costs."
                />
              </dl>
              {check.cashSurplus > 0 && check.emiUsingSurplus < check.emi - 1 && (
                <p className="text-sm text-ink-muted">
                  Putting the spare {formatINR(check.cashSurplus)} towards the down payment would lower the EMI to about{" "}
                  <strong className="text-ink">{formatINR(check.emiUsingSurplus)}</strong>, but leaves no cushion beyond
                  your emergency fund.
                </p>
              )}
            </div>
          ) : (
            <p className="rounded-md border border-line bg-paper p-4 text-sm text-ink-muted">
              Enter your take-home income above to check a property price.
            </p>
          )}
        </div>
      </CalculatorSection>

      <Callout tone="neutral" title="Assumptions used in this calculation">
        <ul className="list-disc space-y-1 pl-5">
          <li>The interest rate stays fixed for the whole tenure; EMIs use the standard reducing-balance formula.</li>
          <li>The emergency fund is never used for the purchase. All other savings can go towards it.</li>
          <li>Purchase costs are a flat percentage of the price and are paid in cash, not financed.</li>
          <li>
            Loan-to-value uses RBI&apos;s general slabs and your maximum LTV. Lenders also assess income, age, credit
            score and the property itself, so the loan you are offered may differ.
          </li>
          <li>Rent you stop paying after moving in is assumed to be excluded from living expenses.</li>
          <li>Income, expenses and rates are today&apos;s figures; no salary growth or inflation is assumed.</li>
        </ul>
      </Callout>
    </div>
  );
}
