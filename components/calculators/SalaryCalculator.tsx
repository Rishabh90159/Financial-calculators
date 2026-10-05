"use client";

import { useId, useMemo, useState } from "react";
import { DonutChart } from "@/components/charts/DonutChart";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable } from "@/components/ui/ScenarioTable";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { buildCtcComparison, calculateSalary, type PfMode, type SalaryInput } from "@/lib/calculations/salary";
import { TAX_RULES, type TaxRegime } from "@/lib/calculations/taxRules";
import { formatDate, formatINR, formatINRCompact, formatPercent } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const CTC_PRESETS = [
  { label: "₹6L", value: 6_00_000 },
  { label: "₹10L", value: 10_00_000 },
  { label: "₹15L", value: 15_00_000 },
  { label: "₹25L", value: 25_00_000 },
  { label: "₹50L", value: 50_00_000 },
];

const EMPLOYER_PF_OPTIONS = [
  { value: "full", label: "12% of basic" },
  { value: "ceiling", label: "12% of ₹15,000" },
  { value: "none", label: "Not in CTC" },
] as const satisfies readonly { value: PfMode; label: string }[];

const EMPLOYEE_PF_OPTIONS = [
  { value: "full", label: "12% of basic" },
  { value: "ceiling", label: "12% of ₹15,000" },
  { value: "none", label: "No PF" },
] as const satisfies readonly { value: PfMode; label: string }[];

const REGIME_OPTIONS = [
  { value: "new", label: "New regime" },
  { value: "old", label: "Old regime" },
] as const satisfies readonly { value: TaxRegime; label: string }[];

const REGIME_NAME: Record<TaxRegime, string> = { new: "new regime", old: "old regime" };

export function SalaryCalculator() {
  const oldDeductionsId = useId();
  const [ctc, setCtc] = useState(12_00_000);
  const [basicPercent, setBasicPercent] = useState(40);
  const [hraPercent, setHraPercent] = useState(50);
  const [employerPf, setEmployerPf] = useState<PfMode>("full");
  const [employeePf, setEmployeePf] = useState<PfMode>("full");
  const [employeePfTouched, setEmployeePfTouched] = useState(false);
  const [includeGratuity, setIncludeGratuity] = useState(false);
  const [professionalTax, setProfessionalTax] = useState(2_400);
  const [otherMonthly, setOtherMonthly] = useState(0);
  const [regime, setRegime] = useState<TaxRegime>("new");
  const [hraExemption, setHraExemption] = useState(0);
  const [other80C, setOther80C] = useState(0);
  const [deduction80D, setDeduction80D] = useState(0);

  const input = useMemo<SalaryInput>(
    () => ({
      annualCtc: ctc,
      basicPercent,
      hraPercent,
      employerPf,
      employeePf,
      includeGratuity,
      professionalTax,
      otherMonthlyDeductions: otherMonthly,
      regime,
      oldRegime: { hraExemption, other80C, deduction80DAndOther: deduction80D },
    }),
    [ctc, basicPercent, hraPercent, employerPf, employeePf, includeGratuity, professionalTax, otherMonthly, regime, hraExemption, other80C, deduction80D],
  );
  const result = useMemo(() => calculateSalary(input), [input]);
  const ctcRows = useMemo(() => buildCtcComparison(input, CTC_PRESETS.map((p) => p.value)), [input]);

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "salary",
    result.isValid,
    [ctc, basicPercent, hraPercent, employerPf, employeePf, includeGratuity, professionalTax, otherMonthly, regime, hraExemption, other80C, deduction80D].join("|"),
  );

  const monthlyBasic = (ctc * basicPercent) / 100 / 12;
  const deductionsTotal = Math.max(0, result.annualCtc - result.annualTakeHome);
  const { new: newR, old: oldR } = result.byRegime;
  const otherRegime: TaxRegime = regime === "new" ? "old" : "new";
  const regimeGap = Math.abs(newR.monthlyTakeHome - oldR.monthlyTakeHome);

  function handleEmployerPf(next: PfMode) {
    trackScenario("option_toggle");
    setEmployerPf(next);
    if (!employeePfTouched) setEmployeePf(next);
  }

  const breakupRows: { label: string; annual: number; deduction?: boolean; total?: boolean }[] = [
    { label: "Basic salary", annual: result.basic },
    { label: "House rent allowance (HRA)", annual: result.hra },
    { label: "Special allowance", annual: result.specialAllowance },
    { label: "Gross salary", annual: result.grossSalary, total: true },
    { label: "Employee PF", annual: result.employeePf, deduction: true },
    { label: "Professional tax", annual: result.professionalTax, deduction: true },
    { label: "Income tax (TDS estimate)", annual: result.incomeTax, deduction: true },
    { label: "Other deductions", annual: result.otherDeductions, deduction: true },
    { label: "In-hand salary", annual: result.annualTakeHome, total: true },
  ];

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Salary calculator inputs"
        resultsHeading="Estimated take-home"
        inputs={
          <>
            <div className="space-y-3">
              <NumberField
                label="Annual CTC"
                prefix="₹"
                showWords
                min={1_00_000}
                max={5_00_00_000}
                step={50_000}
                value={ctc}
                onChange={setCtc}
                onInteract={markInteraction}
                hint="Cost to company, as written in your offer letter."
              />
              <PresetButtons
                label="Quick CTC"
                presets={CTC_PRESETS}
                current={ctc}
                onSelect={(v) => {
                  trackScenario("preset");
                  setCtc(v);
                }}
              />
            </div>
            <NumberField
              label="Basic salary (% of CTC)"
              suffix="%"
              min={20}
              max={70}
              step={1}
              value={basicPercent}
              onChange={setBasicPercent}
              onInteract={markInteraction}
              hint={`Monthly basic: ${formatINR(monthlyBasic)}. Many employers set basic at 40–50% of CTC.`}
            />
            <NumberField
              label="HRA (% of basic)"
              suffix="%"
              min={0}
              max={100}
              step={5}
              value={hraPercent}
              onChange={setHraPercent}
              onInteract={markInteraction}
              hint="Part of gross salary. Commonly 40–50% of basic."
            />
            <div className="space-y-4 border-t border-line pt-5">
              <div>
                <SegmentedControl legend="Employer PF in CTC" options={EMPLOYER_PF_OPTIONS} value={employerPf} onChange={handleEmployerPf} />
                <p className="mt-1 text-xs text-ink-muted">
                  &ldquo;12% of ₹15,000&rdquo; caps the contribution at ₹1,800 a month.
                </p>
              </div>
              <div>
                <SegmentedControl
                  legend="Employee PF deduction"
                  options={EMPLOYEE_PF_OPTIONS}
                  value={employeePf}
                  onChange={(next) => {
                    trackScenario("option_toggle");
                    setEmployeePfTouched(true);
                    setEmployeePf(next);
                  }}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Statutory employee PF is 12% of basic wages up to the ₹15,000 monthly wage ceiling, unless your employer
                  contributes on full basic.
                </p>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
                  checked={includeGratuity}
                  onChange={(e) => {
                    trackScenario("option_toggle");
                    setIncludeGratuity(e.target.checked);
                  }}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Gratuity is included in my CTC</span>
                  <span className="block text-xs text-ink-muted">
                    4.81% of basic is set aside within CTC but paid only when you leave after qualifying service, so it
                    is not part of monthly salary.
                  </span>
                </span>
              </label>
            </div>
            <NumberField
              label="Professional tax (per year)"
              prefix="₹"
              min={0}
              max={2_500}
              step={100}
              value={professionalTax}
              onChange={setProfessionalTax}
              onInteract={markInteraction}
              hint="Varies by state; some states have none. The maximum is ₹2,500 a year."
            />
            <NumberField
              label="Other deductions (per month)"
              prefix="₹"
              min={0}
              max={1_00_000}
              step={100}
              value={otherMonthly}
              onChange={setOtherMonthly}
              onInteract={markInteraction}
              hint="For example group insurance premium, canteen or transport recovery."
            />
            <div className="space-y-4 border-t border-line pt-5">
              <SegmentedControl
                legend="Tax regime"
                options={REGIME_OPTIONS}
                value={regime}
                onChange={(next) => {
                  trackScenario("mode_switch");
                  setRegime(next);
                }}
              />
              <p className="text-xs text-ink-muted">
                The new regime is the default. HRA exemption, 80C and 80D apply only in the old regime.
              </p>
              <div id={oldDeductionsId} hidden={regime !== "old"} className="space-y-6">
                <NumberField
                  label="HRA exemption (per year)"
                  prefix="₹"
                  showWords
                  min={0}
                  max={10_00_000}
                  step={5_000}
                  value={hraExemption}
                  onChange={setHraExemption}
                  onInteract={markInteraction}
                  hint="The exempt part of your HRA, from your employer's tax computation. Capped at HRA received."
                />
                <NumberField
                  label="Other 80C investments (per year)"
                  prefix="₹"
                  showWords
                  min={0}
                  max={1_50_000}
                  step={5_000}
                  value={other80C}
                  onChange={setOther80C}
                  onInteract={markInteraction}
                  hint={`PPF, ELSS, life insurance, etc. Your employee PF of ${formatINR(result.employeePf)} already counts; the total is capped at ₹1,50,000.`}
                />
                <NumberField
                  label="80D and other deductions (per year)"
                  prefix="₹"
                  showWords
                  min={0}
                  max={10_00_000}
                  step={5_000}
                  value={deduction80D}
                  onChange={setDeduction80D}
                  onInteract={markInteraction}
                  hint="Health insurance premium and any other deductions you are eligible for."
                />
              </div>
            </div>
          </>
        }
        results={
          result.isValid ? (
            <div className="space-y-5">
              <dl>
                <div aria-live="polite" aria-atomic="true">
                  <ResultStat
                    emphasis
                    label="Monthly take-home salary"
                    value={formatINR(result.monthlyTakeHome)}
                    note={`Estimated under the ${REGIME_NAME[regime]}, with TDS spread evenly over 12 months.`}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                  <ResultStat swatch="principal" label="Annual take-home" value={formatINR(result.annualTakeHome)} />
                  <ResultStat label="Annual CTC" value={formatINR(result.annualCtc)} />
                  <ResultStat label="Gross salary" value={formatINR(result.grossSalary)} note={`${formatINR(result.monthlyGross)} a month`} />
                  <ResultStat
                    label="Estimated income tax"
                    value={formatINR(result.incomeTax)}
                    note={`${formatPercent(result.effectiveTaxRatePercent)} of gross salary, incl. 4% cess`}
                  />
                  <ResultStat label="Employee PF" value={formatINR(result.employeePf)} note="Deducted from salary" />
                  <ResultStat label="Employer PF" value={formatINR(result.employerPf)} note="Part of CTC, not paid in salary" />
                  <ResultStat label="Professional tax" value={formatINR(result.professionalTax)} />
                  <ResultStat label="Other deductions" value={formatINR(result.otherDeductions)} />
                  {result.gratuity > 0 && (
                    <ResultStat label="Gratuity (in CTC)" value={formatINR(result.gratuity)} note="Not paid monthly" />
                  )}
                </div>
              </dl>

              {result.notes.length > 0 && (
                <Callout tone="neutral" title="Notes on this calculation">
                  <ul className="list-disc space-y-1 pl-4">
                    {result.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </Callout>
              )}

              <DonutChart
                primary={{ label: "Take-home", value: result.annualTakeHome }}
                secondary={{ label: "Tax, PF & other deductions", value: deductionsTotal }}
                centerLabel="Annual CTC"
                centerValue={formatINRCompact(result.annualCtc)}
              />

              <Callout tone="neutral">
                <strong>Your actual payslip can differ</strong> because employer structure, exemptions, deductions,
                benefits, state rules and tax treatment vary.
              </Callout>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Enter your annual CTC to see your take-home salary.</p>
          )
        }
      />

      {result.isValid && (
        <>
          <CalculatorSection
            id="salary-breakup"
            title="Monthly salary breakup"
            description="How your gross salary is made up, and what is deducted before it reaches your bank account."
          >
            <ScenarioTable
              caption="Salary breakup with monthly and annual amounts"
              columns={[{ label: "Component" }, { label: "Monthly", numeric: true }, { label: "Annual", numeric: true }]}
              rows={breakupRows.map((row) => ({
                label: row.total ? <strong>{row.label}</strong> : row.label,
                cells: [
                  `${row.deduction ? "− " : ""}${formatINR(row.annual / 12)}`,
                  `${row.deduction ? "− " : ""}${formatINR(row.annual)}`,
                ],
              }))}
            />
            {(result.employerPf > 0 || result.gratuity > 0) && (
              <p className="mt-2 text-xs text-ink-muted">
                Not in gross salary: employer PF {formatINR(result.employerPf)}
                {result.gratuity > 0 ? ` and gratuity ${formatINR(result.gratuity)}` : ""} a year. These are part of CTC
                but go to your PF account or gratuity fund, not your monthly pay.
              </p>
            )}
          </CalculatorSection>

          <CalculatorSection
            id="regime-comparison"
            title="New vs old tax regime on these inputs"
            description="Both regimes use the same salary. Old-regime deductions are the ones you entered above (HRA exemption, 80C, 80D)."
          >
            <ScenarioTable
              caption="Comparison of the new and old tax regimes"
              columns={[
                { label: "Regime" },
                { label: "Taxable income", numeric: true },
                { label: "Income tax", numeric: true },
                { label: "Monthly take-home", numeric: true },
              ]}
              rows={[newR, oldR].map((o) => ({
                label: o.regime === "new" ? "New regime" : "Old regime",
                current: o.regime === regime,
                cells: [formatINR(o.taxableIncome), formatINR(o.incomeTax), formatINR(o.monthlyTakeHome)],
              }))}
            />
            <p className="mt-3 text-sm text-ink-muted">
              {result.higherTakeHome === "equal"
                ? "On these inputs, both regimes give about the same take-home."
                : `On these inputs, the ${REGIME_NAME[result.higherTakeHome]} gives about ${formatINR(regimeGap)} a month more take-home. Your result can change if your deductions change.`}
            </p>
            <button
              type="button"
              className="mt-3 rounded border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              onClick={() => {
                trackComparison();
                setRegime(otherRegime);
              }}
            >
              Show results for the {REGIME_NAME[otherRegime]}
            </button>
          </CalculatorSection>

          <CalculatorSection
            id="ctc-comparison"
            title="Take-home at other CTC levels"
            description={`Same structure (${basicPercent}% basic, PF and deductions as entered, ${REGIME_NAME[regime]}).`}
          >
            <ScenarioTable
              caption="Monthly take-home and annual tax at different CTC levels"
              columns={[
                { label: "Annual CTC" },
                { label: "Monthly take-home", numeric: true },
                { label: "Annual income tax", numeric: true },
              ]}
              rows={ctcRows.map((row) => ({
                label: formatINRCompact(row.annualCtc),
                current: row.annualCtc === result.annualCtc,
                cells: [formatINR(row.monthlyTakeHome), formatINR(row.annualTax)],
              }))}
            />
          </CalculatorSection>
        </>
      )}

      <CalculatorSection id="salary-assumptions" title="Calculation assumptions">
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>
            Tax rules for <strong className="text-ink">{TAX_RULES.taxYear}</strong>, last verified on{" "}
            {formatDate(TAX_RULES.lastVerified)} from the{" "}
            <a href={TAX_RULES.source.url} className="text-brand underline underline-offset-2" rel="noopener noreferrer" target="_blank">
              Income Tax Department
            </a>
            . Rules change each year.
          </li>
          <li>Resident individual below 60 years of age; salary is your only income.</li>
          <li>No perquisites, variable pay, bonus or arrears; employer NPS contribution is not modelled.</li>
          <li>
            PF is 12% of basic, or of basic up to the ₹15,000 monthly wage ceiling, as selected. Gratuity, if included, is
            4.81% of basic.
          </li>
          <li>Professional tax is what you enter. It is deductible only in the old regime.</li>
          <li>Income tax includes 4% cess and is spread evenly over 12 months as TDS.</li>
        </ul>
      </CalculatorSection>
    </div>
  );
}
