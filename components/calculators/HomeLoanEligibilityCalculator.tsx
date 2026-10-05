"use client";

import { useMemo, useState } from "react";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable, type ScenarioRow } from "@/components/ui/ScenarioTable";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  calculateHomeLoanEligibility,
  loanPerRupeeOfEmi,
  type HomeLoanEligibilityInput,
  type HomeLoanEligibilityResult,
} from "@/lib/calculations/homeLoanEligibility";
import { formatINR, formatINRCompact, formatMonths, formatNumber, formatPercent } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

type Applicants = "single" | "joint";
type Comparison = "income" | "emis" | "tenure" | "rate";

const APPLICANT_OPTIONS = [
  { value: "single", label: "Just me" },
  { value: "joint", label: "With co-applicant" },
] as const;

const COMPARISON_OPTIONS = [
  { value: "income", label: "Income" },
  { value: "emis", label: "Existing EMIs" },
  { value: "tenure", label: "Tenure" },
  { value: "rate", label: "Interest rate" },
] as const;

const FOIR_PRESETS = [40, 50, 60].map((v) => ({ label: `${v}%`, value: v }));
const INCOME_LEVELS = [75_000, 1_00_000, 1_25_000, 1_50_000];
const TENURE_LEVELS = [10, 15, 20, 25, 30];
const RATE_STEPS = [-1, 0, 1, 2];

function tenureLabel(months: number): string {
  return formatMonths(months);
}

/** "+₹1,15,231", "−₹1,15,231" or "—" for (near) zero differences. */
function signedINR(diff: number): string {
  if (!Number.isFinite(diff) || Math.abs(diff) < 0.5) return "—";
  return `${diff > 0 ? "+" : "−"}${formatINR(Math.abs(diff))}`;
}

export function HomeLoanEligibilityCalculator() {
  const [income, setIncome] = useState(1_00_000);
  const [applicants, setApplicants] = useState<Applicants>("single");
  const [coIncome, setCoIncome] = useState(0);
  const [existingEmis, setExistingEmis] = useState(0);
  const [otherObligations, setOtherObligations] = useState(0);
  const [age, setAge] = useState(30);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [foir, setFoir] = useState(50);
  const [retirementAge, setRetirementAge] = useState(60);
  const [ltv, setLtv] = useState(80);
  const [comparison, setComparison] = useState<Comparison>("income");

  const input: HomeLoanEligibilityInput = useMemo(
    () => ({
      monthlyIncome: income,
      coApplicantIncome: applicants === "joint" ? coIncome : 0,
      existingEmis,
      otherObligations,
      age,
      tenureYears: years,
      annualRate: rate,
      foirPercent: foir,
      retirementAge,
      ltvPercent: ltv,
    }),
    [income, applicants, coIncome, existingEmis, otherObligations, age, years, rate, foir, retirementAge, ltv],
  );
  const result = useMemo(() => calculateHomeLoanEligibility(input), [input]);

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "home-loan-eligibility",
    result.isValid,
    `${income}|${applicants}|${coIncome}|${existingEmis}|${otherObligations}|${age}|${years}|${rate}|${foir}|${retirementAge}|${ltv}`,
  );

  const tenureText = tenureLabel(result.tenureMonths);

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Home loan eligibility calculator inputs"
        resultsHeading="Your estimate"
        inputs={
          <>
            <NumberField
              label="Your monthly take-home income"
              prefix="₹"
              showWords
              min={0}
              max={20_00_000}
              step={1_000}
              value={income}
              onChange={setIncome}
              onInteract={markInteraction}
              hint="Net salary credited each month, after tax and deductions."
            />
            <div className="space-y-4">
              <SegmentedControl
                legend="Applying"
                options={APPLICANT_OPTIONS}
                value={applicants}
                onChange={(v) => {
                  trackScenario("option_toggle");
                  setApplicants(v);
                }}
              />
              {applicants === "joint" && (
                <NumberField
                  label="Co-applicant's monthly take-home income"
                  prefix="₹"
                  showWords
                  min={0}
                  max={20_00_000}
                  step={1_000}
                  value={coIncome}
                  onChange={setCoIncome}
                  onInteract={markInteraction}
                  hint="Many lenders add an earning spouse or parent's income."
                />
              )}
            </div>
            <NumberField
              label="Existing monthly EMIs"
              prefix="₹"
              showWords
              min={0}
              max={10_00_000}
              step={500}
              value={existingEmis}
              onChange={setExistingEmis}
              onInteract={markInteraction}
              hint="Car, personal, education or other loans that will continue."
            />
            <NumberField
              label="Other monthly obligations"
              prefix="₹"
              showWords
              min={0}
              max={10_00_000}
              step={500}
              value={otherObligations}
              onChange={setOtherObligations}
              onInteract={markInteraction}
              hint="Fixed commitments a lender may count, such as credit card dues."
            />
            <NumberField
              label="Your age"
              suffix="years"
              min={21}
              max={65}
              step={1}
              value={age}
              onChange={setAge}
              onInteract={markInteraction}
            />
            <NumberField
              label="Desired loan tenure"
              suffix="years"
              min={1}
              max={30}
              step={1}
              value={years}
              onChange={setYears}
              onInteract={markInteraction}
              hint={result.tenureCappedByAge ? `Capped at ${tenureText} by the retirement-age assumption.` : undefined}
            />
            <NumberField
              label="Interest rate (per annum)"
              suffix="%"
              min={0}
              max={20}
              step={0.05}
              value={rate}
              onChange={setRate}
              onInteract={markInteraction}
              hint="Use the rate you expect to be offered."
            />

            <fieldset className="space-y-5 border-t border-line pt-5">
              <legend className="float-left mb-1 w-full text-sm font-semibold text-ink">Assumptions you can change</legend>
              <p className="clear-both text-xs text-ink-muted">
                Lenders set their own limits. These defaults are common starting points, not rules.
              </p>
              <div className="space-y-3">
                <NumberField
                  label="Max share of income for all EMIs (FOIR)"
                  suffix="%"
                  min={30}
                  max={70}
                  step={1}
                  value={foir}
                  onChange={setFoir}
                  onInteract={markInteraction}
                  hint="Includes the new home loan EMI and existing EMIs."
                />
                <PresetButtons
                  label="Quick FOIR"
                  presets={FOIR_PRESETS}
                  current={foir}
                  onSelect={(v) => {
                    trackScenario("preset");
                    setFoir(v);
                  }}
                />
              </div>
              <NumberField
                label="Loan must end by age"
                suffix="years"
                min={55}
                max={70}
                step={1}
                value={retirementAge}
                onChange={setRetirementAge}
                onInteract={markInteraction}
                hint="Often retirement age for salaried borrowers; some lenders allow later."
              />
              <NumberField
                label="Loan-to-value (LTV) for property budget"
                suffix="%"
                min={50}
                max={90}
                step={1}
                value={ltv}
                onChange={setLtv}
                onInteract={markInteraction}
                hint="Share of the property price the loan covers. RBI slabs may lower it."
              />
            </fieldset>
          </>
        }
        results={
          <div className="space-y-5">
            <dl>
              <div aria-live="polite" aria-atomic="true">
                <ResultStat
                  emphasis
                  label="Estimated eligible loan amount"
                  value={formatINR(result.eligibleLoan)}
                  note={
                    result.isValid
                      ? `Estimate: an EMI of ${formatINR(result.maxEmi)} for ${tenureText} at ${formatPercent(result.annualRate, 2)}.`
                      : "No loan can be estimated with these inputs. See the note below."
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                <ResultStat
                  label="Estimated max EMI"
                  value={formatINR(result.maxEmi)}
                  note={`${formatPercent(result.foirPercent, 0)} of ${formatINR(result.combinedIncome)} − ${formatINR(result.existingObligations)} existing`}
                />
                <ResultStat
                  label="Estimated property budget"
                  value={formatINR(result.propertyBudget)}
                  note={`Loan + down payment at ${formatPercent(result.appliedLtvPercent, 0)} LTV`}
                />
                <ResultStat label="Down payment needed" value={formatINR(result.downPayment)} note="Excludes stamp duty and other costs." />
                <ResultStat
                  label="LTV used"
                  value={formatPercent(result.appliedLtvPercent, 0)}
                  note={result.ltvCappedByRbi ? `RBI slab for this loan size (you set ${result.assumedLtvPercent}%)` : "Your assumption"}
                />
                <ResultStat label="Effective tenure" value={tenureText} note={result.tenureCappedByAge ? "Capped by age" : "As chosen"} />
                <ResultStat label="FOIR used" value={formatPercent(result.foirPercent, 0)} />
                <ResultStat label="Total repayment" value={formatINR(result.totalRepayment)} note="EMI × number of months." />
                <ResultStat label="Total interest" value={formatINR(result.totalInterest)} />
              </div>
            </dl>

            {result.notes.length > 0 && (
              <Callout tone="warn" title={result.isValid ? "Check these adjustments" : "Why the estimate is zero"}>
                <ul className="list-disc space-y-1 pl-5">
                  {result.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </Callout>
            )}

            <Callout tone="info" title="This is an estimate, not a loan approval or offer">
              Lenders also look at your credit score and history, income stability, employer or business profile, age,
              existing obligations, the property&apos;s type and legal status, LTV limits and their own FOIR norms. Many
              lenders work from gross income, or use different FOIR bands at different income levels, so their figure
              can be higher or lower than this.
            </Callout>
          </div>
        }
      />

      <CalculatorSection
        id="eligibility-scenarios"
        title="Compare eligibility scenarios"
        description="Each table changes one thing and keeps everything else as you entered it, including the assumptions."
      >
        <div className="space-y-4">
          <SegmentedControl
            legend="Compare by"
            options={COMPARISON_OPTIONS}
            value={comparison}
            onChange={(v) => {
              trackComparison();
              setComparison(v);
            }}
          />
          <ComparisonTable kind={comparison} input={input} result={result} />
        </div>
      </CalculatorSection>

      <EligibilityInsights input={input} result={result} />
    </div>
  );
}

function ComparisonTable({
  kind,
  input,
  result,
}: {
  kind: Comparison;
  input: HomeLoanEligibilityInput;
  result: HomeLoanEligibilityResult;
}) {
  const calc = (o: Partial<HomeLoanEligibilityInput>) => calculateHomeLoanEligibility({ ...input, ...o });
  const amountCells = (r: HomeLoanEligibilityResult) => [formatINR(r.maxEmi), formatINR(r.eligibleLoan)];

  if (kind === "income") {
    const levels = Array.from(new Set([...INCOME_LEVELS, input.monthlyIncome])).sort((a, b) => a - b);
    const rows: ScenarioRow[] = levels.map((level) => {
      const r = calc({ monthlyIncome: level });
      return {
        label: `${formatINR(level)} a month`,
        cells: [...amountCells(r), formatINR(r.propertyBudget)],
        current: level === input.monthlyIncome,
      };
    });
    return (
      <ScenarioTable
        caption="Estimated eligibility at different applicant incomes"
        columns={[
          { label: "Your take-home income" },
          { label: "Max EMI", numeric: true },
          { label: "Eligible loan", numeric: true },
          { label: "Property budget", numeric: true },
        ]}
        rows={rows}
      />
    );
  }

  if (kind === "emis") {
    const current = input.existingEmis ?? 0;
    const levels =
      current > 0
        ? [
            { label: `${formatINR(current)} (current)`, value: current },
            { label: `${formatINR(current / 2)} (half)`, value: current / 2 },
            { label: "None", value: 0 },
          ]
        : [
            { label: "None", value: 0 },
            { label: `${formatINR(10_000)}`, value: 10_000 },
            { label: `${formatINR(25_000)}`, value: 25_000 },
          ];
    const rows: ScenarioRow[] = levels.map((l) => {
      const r = calc({ existingEmis: l.value });
      return {
        label: l.label,
        cells: [...amountCells(r), signedINR(r.eligibleLoan - result.eligibleLoan)],
        current: l.value === current,
      };
    });
    return (
      <ScenarioTable
        caption="Estimated eligibility with different existing EMIs"
        columns={[
          { label: "Existing EMIs" },
          { label: "Max EMI", numeric: true },
          { label: "Eligible loan", numeric: true },
          { label: "Change vs now", numeric: true },
        ]}
        rows={rows}
      />
    );
  }

  if (kind === "tenure") {
    const levels = Array.from(new Set([...TENURE_LEVELS, input.tenureYears])).sort((a, b) => a - b);
    const rows: ScenarioRow[] = levels.map((y) => {
      const r = calc({ tenureYears: y });
      return {
        label: formatMonths(y * 12),
        cells: [
          r.tenureCappedByAge ? `${tenureLabel(r.tenureMonths)} (capped by age)` : tenureLabel(r.tenureMonths),
          formatINR(r.eligibleLoan),
          formatINR(r.totalInterest),
        ],
        current: y === input.tenureYears,
      };
    });
    return (
      <ScenarioTable
        caption="Estimated eligibility at different loan tenures"
        columns={[
          { label: "Desired tenure" },
          { label: "Tenure used", numeric: false },
          { label: "Eligible loan", numeric: true },
          { label: "Total interest", numeric: true },
        ]}
        rows={rows}
      />
    );
  }

  const rows: ScenarioRow[] = RATE_STEPS.flatMap((step) => {
    const rate = input.annualRate + step;
    if (rate < 0) return [];
    const r = calc({ annualRate: rate });
    return [
      {
        label: `${formatPercent(rate, 2)}${step === 0 ? "" : ` (${step > 0 ? "+" : "−"}${Math.abs(step)} pt)`}`,
        cells: [formatINR(r.eligibleLoan), formatINR(r.propertyBudget), formatINR(r.totalInterest)],
        current: step === 0,
      },
    ];
  });
  return (
    <ScenarioTable
      caption="Estimated eligibility at different interest rates"
      columns={[
        { label: "Interest rate" },
        { label: "Eligible loan", numeric: true },
        { label: "Property budget", numeric: true },
        { label: "Total interest", numeric: true },
      ]}
      rows={rows}
    />
  );
}

function EligibilityInsights({ input, result }: { input: HomeLoanEligibilityInput; result: HomeLoanEligibilityResult }) {
  if (!result.isValid) return null;

  const perEmi10k = loanPerRupeeOfEmi(result.annualRate, result.tenureMonths) * 10_000;
  const insights: string[] = [
    `Every ₹10,000 of existing EMI reduces your estimated eligibility by about ${formatINRCompact(perEmi10k)}, because it uses up EMI capacity the new loan could have had.`,
  ];

  if (result.existingObligations > 0) {
    const freed = calculateHomeLoanEligibility({ ...input, existingEmis: 0, otherObligations: 0 });
    insights.push(
      `Clearing your current EMIs and obligations of ${formatINR(result.existingObligations)} a month would raise the estimate to about ${formatINRCompact(freed.eligibleLoan)}.`,
    );
  }

  const coIncome = input.coApplicantIncome ?? 0;
  if (coIncome > 0) {
    const alone = calculateHomeLoanEligibility({ ...input, coApplicantIncome: 0 });
    insights.push(
      `Your co-applicant's income adds about ${formatINRCompact(result.eligibleLoan - alone.eligibleLoan)} to the estimate (from ${formatINRCompact(alone.eligibleLoan)} on your income alone).`,
    );
  } else {
    const share = Math.round(input.monthlyIncome / 2 / 1_000) * 1_000 || 50_000;
    const joint = calculateHomeLoanEligibility({ ...input, coApplicantIncome: share });
    insights.push(
      `Adding a co-applicant earning ${formatINR(share)} a month could raise the estimate by about ${formatINRCompact(joint.eligibleLoan - result.eligibleLoan)}, if the lender accepts their income.`,
    );
  }

  const higherRate = calculateHomeLoanEligibility({ ...input, annualRate: result.annualRate + 1 });
  insights.push(
    `A rate 1 percentage point higher would cut the estimate by about ${formatINRCompact(result.eligibleLoan - higherRate.eligibleLoan)}, even though your EMI capacity stays the same.`,
  );

  if (result.tenureCappedByAge) {
    insights.push(
      `Your age limits the tenure to ${formatMonths(result.tenureMonths)}. A younger co-borrower or a lender that allows repayment beyond ${formatNumber(input.retirementAge ?? 60)} could lengthen it.`,
    );
  } else if (result.tenureMonths < 360) {
    const longer = calculateHomeLoanEligibility({ ...input, tenureYears: Math.min(30, result.tenureMonths / 12 + 5) });
    if (longer.eligibleLoan > result.eligibleLoan) {
      insights.push(
        `Stretching the tenure to ${formatMonths(longer.tenureMonths)} would raise the estimate by about ${formatINRCompact(longer.eligibleLoan - result.eligibleLoan)}, but adds ${formatINRCompact(longer.totalInterest - result.totalInterest)} in interest.`,
      );
    }
  }

  return (
    <CalculatorSection id="eligibility-insights" title="Key insights" description="Based on the values you entered above. Updates as you change them.">
      <ul className="max-w-3xl space-y-2.5">
        {insights.map((text) => (
          <li key={text.slice(0, 40)} className="flex gap-3 text-[0.95rem] leading-relaxed">
            <span aria-hidden="true" className="mt-[0.7rem] h-px w-3 shrink-0 bg-ink-muted" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </CalculatorSection>
  );
}
