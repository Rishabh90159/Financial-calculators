"use client";

import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { DonutChart } from "@/components/charts/DonutChart";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { PresetButtons } from "@/components/ui/PresetButtons";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable } from "@/components/ui/ScenarioTable";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { indicativeMaxLtv } from "@/lib/calculations/homeLoan";
import {
  calculatePropertyPurchaseCost,
  calculatePurchaseCostScenarios,
  type ChargeMode,
  type PropertyPurchaseCostInput,
  type PropertyType,
} from "@/lib/calculations/propertyPurchaseCost";
import { formatINR, formatINRCompact, formatPercent } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

const PROPERTY_TYPES = [
  { value: "ready", label: "Ready to move" },
  { value: "under-construction", label: "Under construction" },
] as const;

const GST_RATES = [
  { value: "5", label: "5% standard" },
  { value: "1", label: "1% affordable housing" },
] as const;

const CHARGE_MODES = [
  { value: "percent", label: "% of value" },
  { value: "amount", label: "Fixed ₹" },
] as const;

const LOAN_SHARES = [0, 60, 75, 80, 90];

function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <p className="border-t border-line pt-5 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
      {children}
    </p>
  );
}

export function PropertyPurchaseCostCalculator() {
  const dutyValueId = useId();
  const [price, setPrice] = useState(1_00_00_000);
  const [useDutyValue, setUseDutyValue] = useState(false);
  const [dutyValue, setDutyValue] = useState(1_00_00_000);
  const [propertyType, setPropertyType] = useState<PropertyType>("ready");
  const [gstRate, setGstRate] = useState<"5" | "1">("5");
  const [dutyMode, setDutyMode] = useState<ChargeMode>("percent");
  const [dutyPercent, setDutyPercent] = useState(6);
  const [dutyAmount, setDutyAmount] = useState(6_00_000);
  const [regMode, setRegMode] = useState<ChargeMode>("percent");
  const [regPercent, setRegPercent] = useState(1);
  const [regAmount, setRegAmount] = useState(30_000);
  const [regCap, setRegCap] = useState(0);
  const [brokerage, setBrokerage] = useState(1);
  const [legal, setLegal] = useState(25_000);
  const [society, setSociety] = useState(1_00_000);
  const [other, setOther] = useState(0);
  const [loan, setLoan] = useState(75_00_000);
  const [feeMode, setFeeMode] = useState<ChargeMode>("percent");
  const [feePercent, setFeePercent] = useState(0.5);
  const [feeAmount, setFeeAmount] = useState(10_000);
  const [otherLoan, setOtherLoan] = useState(0);

  const input: PropertyPurchaseCostInput = useMemo(
    () => ({
      propertyPrice: price,
      stampDutyValue: useDutyValue ? dutyValue : 0,
      propertyType,
      gstRatePercent: Number(gstRate),
      stampDuty: { mode: dutyMode, value: dutyMode === "percent" ? dutyPercent : dutyAmount },
      registration: { mode: regMode, value: regMode === "percent" ? regPercent : regAmount },
      registrationCap: regCap,
      brokeragePercent: brokerage,
      legalFees: legal,
      societyCharges: society,
      otherCharges: other,
      loanAmount: loan,
      processingFee: { mode: feeMode, value: feeMode === "percent" ? feePercent : feeAmount },
      otherLoanCharges: otherLoan,
    }),
    [
      price, useDutyValue, dutyValue, propertyType, gstRate, dutyMode, dutyPercent, dutyAmount, regMode, regPercent,
      regAmount, regCap, brokerage, legal, society, other, loan, feeMode, feePercent, feeAmount, otherLoan,
    ],
  );

  const result = useMemo(() => calculatePropertyPurchaseCost(input), [input]);
  const scenarios = useMemo(() => calculatePurchaseCostScenarios(input), [input]);

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "property-purchase-cost",
    result.isValid,
    JSON.stringify(input),
  );

  const comparisonTracked = useRef(false);
  function handleComparison() {
    if (comparisonTracked.current) return;
    comparisonTracked.current = true;
    trackComparison();
  }

  function modeSetter(setter: (m: ChargeMode) => void) {
    return (m: ChargeMode) => {
      trackScenario("mode_switch");
      setter(m);
    };
  }

  const maxLtv = indicativeMaxLtv(result.loanAmount);
  const ltvAboveGuide = result.loanAmount > 0 && result.ltvPercent > maxLtv;
  const isUnderConstruction = propertyType === "under-construction";

  const headlineSentence =
    result.loanAmount > 0
      ? `For a ${formatINRCompact(result.propertyPrice)} property with a ${formatINRCompact(result.loanAmount)} loan, you may need about ${formatINRCompact(result.totalUpfrontCash)} upfront — not just the ${formatINRCompact(result.downPayment)} down payment.`
      : `For a ${formatINRCompact(result.propertyPrice)} property bought without a loan, you may need about ${formatINRCompact(result.totalUpfrontCash)} in all — ${formatINRCompact(result.totalExtraCosts)} more than the price.`;

  const pctOfPrice = (n: number) => (result.propertyPrice > 0 ? formatPercent((n / result.propertyPrice) * 100, 2) : "—");

  const breakdownRows: { label: string; value: number; pct?: boolean; strong?: boolean }[] = [
    { label: "Property price", value: result.propertyPrice, pct: true },
    { label: "Stamp duty", value: result.stampDuty, pct: true },
    { label: result.registrationCapApplied ? "Registration (capped)" : "Registration", value: result.registration, pct: true },
    { label: isUnderConstruction ? `GST (${formatPercent(result.gstRatePercent, 0)})` : "GST (not applicable)", value: result.gst, pct: true },
    { label: "Brokerage", value: result.brokerage, pct: true },
    { label: "Legal & documentation", value: result.legalFees, pct: true },
    { label: "Society deposit & transfer", value: result.societyCharges, pct: true },
    { label: "Other charges", value: result.otherCharges, pct: true },
    { label: "Loan processing fee", value: result.processingFee, pct: true },
    { label: "Other loan charges", value: result.otherLoanCharges, pct: true },
    { label: "Total extra costs", value: result.totalExtraCosts, pct: true, strong: true },
    { label: "Down payment", value: result.downPayment, pct: true },
    { label: "Loan amount", value: result.loanAmount, pct: true },
    { label: "Total upfront cash", value: result.totalUpfrontCash, pct: true, strong: true },
    { label: "Total purchase cost", value: result.totalPurchaseCost, pct: true, strong: true },
  ];

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Property purchase cost calculator inputs"
        inputs={
          <>
            <NumberField
              label="Property price (agreement value)"
              prefix="₹"
              showWords
              min={5_00_000}
              max={20_00_00_000}
              step={50_000}
              value={price}
              onChange={setPrice}
              onInteract={markInteraction}
            />
            <div>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
                  checked={useDutyValue}
                  aria-controls={dutyValueId}
                  onChange={(e) => {
                    trackScenario("option_toggle");
                    if (e.target.checked) setDutyValue(price);
                    setUseDutyValue(e.target.checked);
                  }}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">Use a different value for stamp duty</span>
                  <span className="block text-xs text-ink-muted">
                    Stamp duty is usually charged on the higher of the agreement value and the government&apos;s circle
                    rate or guidance value.
                  </span>
                </span>
              </label>
              <div id={dutyValueId} hidden={!useDutyValue} className="mt-4">
                <NumberField
                  label="Value used for stamp duty"
                  prefix="₹"
                  showWords
                  min={0}
                  max={20_00_00_000}
                  step={50_000}
                  value={dutyValue}
                  onChange={setDutyValue}
                  onInteract={markInteraction}
                  hint="Also used for registration when it is a percentage."
                />
              </div>
            </div>
            <SegmentedControl
              legend="Property type"
              options={PROPERTY_TYPES}
              value={propertyType}
              onChange={(v) => {
                trackScenario("option_toggle");
                setPropertyType(v);
              }}
            />
            {isUnderConstruction && (
              <div>
                <SegmentedControl
                  legend="GST rate"
                  options={GST_RATES}
                  value={gstRate}
                  onChange={(v) => {
                    trackScenario("option_toggle");
                    setGstRate(v);
                  }}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Residential under-construction flats generally attract GST of 5% (1% for affordable housing) without
                  input tax credit. A ready-to-move home with a completion certificate has no GST. Check with the
                  builder.
                </p>
              </div>
            )}

            <GroupHeading>Stamp duty and registration</GroupHeading>
            <Callout tone="neutral">
              Defaults are examples only — replace them with your state&apos;s rates. Rates vary by state, city or area,
              property value, property type and sometimes buyer category (some states charge women buyers less). Check
              your state&apos;s registration (IGR) department or the builder&apos;s cost sheet.
            </Callout>
            <div className="space-y-3">
              <SegmentedControl legend="Stamp duty" options={CHARGE_MODES} value={dutyMode} onChange={modeSetter(setDutyMode)} />
              {dutyMode === "percent" ? (
                <NumberField
                  label="Stamp duty rate"
                  suffix="%"
                  min={0}
                  max={15}
                  step={0.1}
                  value={dutyPercent}
                  onChange={setDutyPercent}
                  onInteract={markInteraction}
                  hint={`Example rate. ${formatINR(result.stampDuty)} on ${formatINR(result.stampDutyBase)}.`}
                />
              ) : (
                <NumberField
                  label="Stamp duty amount"
                  prefix="₹"
                  showWords
                  min={0}
                  max={2_00_00_000}
                  step={5_000}
                  value={dutyAmount}
                  onChange={setDutyAmount}
                  onInteract={markInteraction}
                />
              )}
            </div>
            <div className="space-y-3">
              <SegmentedControl legend="Registration" options={CHARGE_MODES} value={regMode} onChange={modeSetter(setRegMode)} />
              {regMode === "percent" ? (
                <NumberField
                  label="Registration rate"
                  suffix="%"
                  min={0}
                  max={5}
                  step={0.1}
                  value={regPercent}
                  onChange={setRegPercent}
                  onInteract={markInteraction}
                  hint="Example rate. Replace with your state's rate."
                />
              ) : (
                <NumberField
                  label="Registration amount"
                  prefix="₹"
                  showWords
                  min={0}
                  max={50_00_000}
                  step={1_000}
                  value={regAmount}
                  onChange={setRegAmount}
                  onInteract={markInteraction}
                />
              )}
              <NumberField
                label="Maximum registration fee (optional)"
                prefix="₹"
                min={0}
                max={10_00_000}
                step={1_000}
                value={regCap}
                onChange={setRegCap}
                onInteract={markInteraction}
                hint={
                  result.registrationCapApplied
                    ? "Cap applied. Some states cap registration fees."
                    : "₹0 = no cap. Some states cap registration fees."
                }
              />
            </div>

            <GroupHeading>Other purchase costs</GroupHeading>
            <NumberField
              label="Brokerage"
              suffix="%"
              min={0}
              max={5}
              step={0.25}
              value={brokerage}
              onChange={setBrokerage}
              onInteract={markInteraction}
              hint={`Enter inclusive of GST. ${formatINR(result.brokerage)}. Use 0 if buying directly.`}
            />
            <NumberField
              label="Legal & documentation fees"
              prefix="₹"
              showWords
              min={0}
              max={10_00_000}
              step={1_000}
              value={legal}
              onChange={setLegal}
              onInteract={markInteraction}
              hint="Inclusive of GST."
            />
            <NumberField
              label="Society / maintenance deposit & transfer charges"
              prefix="₹"
              showWords
              min={0}
              max={25_00_000}
              step={5_000}
              value={society}
              onChange={setSociety}
              onInteract={markInteraction}
            />
            <NumberField
              label="Other charges (parking, club, PLC)"
              prefix="₹"
              showWords
              min={0}
              max={1_00_00_000}
              step={10_000}
              value={other}
              onChange={setOther}
              onInteract={markInteraction}
              hint="Only if not already included in the agreement value."
            />

            <GroupHeading>Home loan</GroupHeading>
            <div className="space-y-3">
              <NumberField
                label="Home loan amount"
                prefix="₹"
                showWords
                min={0}
                max={20_00_00_000}
                step={50_000}
                value={loan}
                onChange={setLoan}
                onInteract={markInteraction}
                hint={`${formatPercent(result.ltvPercent)} of the property price.`}
              />
              <PresetButtons
                label="Loan as % of price"
                presets={LOAN_SHARES.map((pct) => ({ label: `${pct}%`, value: Math.round((price * pct) / 100) }))}
                current={loan}
                onSelect={(v) => {
                  trackScenario("preset");
                  setLoan(v);
                }}
              />
            </div>
            <div className="space-y-3">
              <SegmentedControl legend="Loan processing fee" options={CHARGE_MODES} value={feeMode} onChange={modeSetter(setFeeMode)} />
              {feeMode === "percent" ? (
                <NumberField
                  label="Processing fee (% of loan)"
                  suffix="%"
                  min={0}
                  max={3}
                  step={0.05}
                  value={feePercent}
                  onChange={setFeePercent}
                  onInteract={markInteraction}
                  hint={`Inclusive of GST. ${formatINR(result.processingFee)}.`}
                />
              ) : (
                <NumberField
                  label="Processing fee amount"
                  prefix="₹"
                  showWords
                  min={0}
                  max={5_00_000}
                  step={500}
                  value={feeAmount}
                  onChange={setFeeAmount}
                  onInteract={markInteraction}
                  hint="Inclusive of GST."
                />
              )}
            </div>
            <NumberField
              label="Other loan charges"
              prefix="₹"
              showWords
              min={0}
              max={10_00_000}
              step={1_000}
              value={otherLoan}
              onChange={setOtherLoan}
              onInteract={markInteraction}
              hint="Legal/technical fees, MODT, insurance if paid upfront. Inclusive of GST."
            />
          </>
        }
        results={
          <div className="space-y-5">
            <dl>
              <div aria-live="polite" aria-atomic="true">
                <ResultStat
                  emphasis
                  label="Total upfront cash"
                  value={formatINR(result.totalUpfrontCash)}
                  note={`Down payment ${formatINR(result.downPayment)} + extra costs ${formatINR(result.totalExtraCosts)}`}
                />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-2 min-[380px]:grid-cols-2">
                <ResultStat swatch="principal" label="Down payment" value={formatINR(result.downPayment)} />
                <ResultStat
                  swatch="interest"
                  label="Extra costs"
                  value={formatINR(result.totalExtraCosts)}
                  note={`${formatPercent(result.extraCostsPercentOfPrice)} of the price`}
                />
                <ResultStat label="Loan amount" value={formatINR(result.loanAmount)} note={`LTV ${formatPercent(result.ltvPercent)}`} />
                <ResultStat label="Total purchase cost" value={formatINR(result.totalPurchaseCost)} note="Price + extra costs, excluding loan interest." />
              </div>
            </dl>

            {result.isValid && <p className="text-sm text-ink">{headlineSentence}</p>}

            {result.notes.map((n) => (
              <Callout key={n} tone="warn">
                {n}
              </Callout>
            ))}

            {ltvAboveGuide && (
              <Callout tone="warn" title="Loan above the usual lending limit">
                Your loan is {formatPercent(result.ltvPercent)} of the price. Under RBI guidelines, lenders generally
                finance up to about <strong>{maxLtv}%</strong> of the property value for a loan of this size, so you may
                need more cash upfront. Check with your lender.
              </Callout>
            )}

            {result.totalUpfrontCash > 0 && (
              <DonutChart
                primary={{ label: "Down payment", value: result.downPayment }}
                secondary={{ label: "Extra costs", value: result.totalExtraCosts }}
                centerLabel="Upfront cash"
                centerValue={formatINRCompact(result.totalUpfrontCash)}
              />
            )}
          </div>
        }
      />

      <CalculatorSection
        id="cost-breakdown"
        title="Full cost breakdown"
        description="Every amount below is based on the rates and fees you entered. Fees are taken as inclusive of GST."
      >
        <ScenarioTable
          caption="Property purchase cost breakdown"
          columns={[{ label: "Item" }, { label: "Amount", numeric: true }, { label: "% of price", numeric: true }]}
          rows={breakdownRows.map((r) => ({
            label: r.strong ? <strong>{r.label}</strong> : r.label,
            cells: [
              r.strong ? <strong key="v">{formatINR(r.value)}</strong> : formatINR(r.value),
              r.pct ? pctOfPrice(r.value) : "",
            ],
          }))}
        />
      </CalculatorSection>

      <CalculatorSection
        id="price-scenarios"
        title="Upfront cash at other property prices"
        description={`Uses your rates and the same loan-to-value (${formatPercent(Math.min(100, result.ltvPercent))}). Fixed stamp duty or registration amounts are converted to the equivalent rate; other fixed fees stay as entered.`}
      >
        <div onFocus={handleComparison} onPointerDown={handleComparison}>
          <ScenarioTable
            caption="Upfront cash at different property prices, using your rates"
            columns={[
              { label: "Property price" },
              { label: "Loan", numeric: true },
              { label: "Down payment", numeric: true },
              { label: "Extra costs", numeric: true },
              { label: "Upfront cash", numeric: true },
            ]}
            rows={scenarios.map((s) => ({
              label: formatINRCompact(s.propertyPrice),
              current: Math.round(s.propertyPrice) === Math.round(result.propertyPrice),
              cells: [formatINR(s.loanAmount), formatINR(s.downPayment), formatINR(s.totalExtraCosts), formatINR(s.totalUpfrontCash)],
            }))}
          />
        </div>
      </CalculatorSection>

      <Callout tone="neutral" title="Assumptions used in this calculation">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Stamp duty and registration use only the rates or amounts you enter. No state rates are built in; the
            defaults are examples.
          </li>
          <li>Percentage registration is charged on the same value as stamp duty, then limited by any cap you set.</li>
          <li>
            GST applies only to under-construction homes, at the rate you choose, on the full price. GST rule last
            checked <time dateTime="2026-10-06">6 October 2026</time> (CBIC); rates entered by you.
          </li>
          <li>Brokerage, legal fees and loan fees are taken as inclusive of GST.</li>
          <li>The loan is limited to the property price. Loan interest, EMIs, interiors and moving costs are not included.</li>
        </ul>
      </Callout>
    </div>
  );
}
