"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { Callout } from "@/components/ui/Callout";
import { NumberField } from "@/components/ui/NumberField";
import { ResultStat } from "@/components/ui/ResultStat";
import { ScenarioTable } from "@/components/ui/ScenarioTable";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  calculateRentVsBuy,
  calculateRentVsBuySensitivity,
  type RentVsBuyResult,
  type SensitivityKey,
} from "@/lib/calculations/rentVsBuy";
import { amountInWords, formatINR, formatPercent } from "@/lib/format";
import { CalculatorCard } from "./CalculatorCard";
import { CalculatorSection } from "./CalculatorSection";
import { useCalculatorAnalytics } from "./useCalculatorAnalytics";

type HorizonMode = "5" | "10" | "15" | "custom";
type SensitivityView = SensitivityKey | "holding";

const HORIZON_OPTIONS = [
  { value: "5", label: "5 years" },
  { value: "10", label: "10 years" },
  { value: "15", label: "15 years" },
  { value: "custom", label: "Custom" },
] as const;

const SENSITIVITY_OPTIONS = [
  { value: "propertyAppreciation", label: "Appreciation" },
  { value: "rentIncrease", label: "Rent increase" },
  { value: "investmentReturn", label: "Investment return" },
  { value: "loanRate", label: "Loan rate" },
  { value: "holding", label: "Holding period" },
] as const;

/** Treats sub-rupee values as 0 so formatting never shows "-₹0". */
const tidy = (n: number) => (Math.abs(n) < 0.5 ? 0 : n);
const inr = (n: number) => formatINR(tidy(n));

/** "₹31.83 lakh" for sentences; full rupees below one lakh. */
function approx(n: number): string {
  const abs = Math.abs(tidy(n));
  return abs >= 1e5 ? `₹${amountInWords(abs)}` : formatINR(abs);
}

function signedINR(diff: number): string {
  const d = tidy(diff);
  if (d === 0) return formatINR(0);
  return `${d > 0 ? "+" : "−"}${formatINR(Math.abs(d))}`;
}

function aheadLabel(diff: number): string {
  const d = tidy(diff);
  return d > 0 ? "Buying" : d < 0 ? "Renting" : "Level";
}

/** Percentage label without float noise (e.g. 5.1 − 2 → "3.1%"). */
const pct = (v: number) => `${Number(v.toFixed(2))}%`;

function rangeLabel(values: number[]): string {
  if (values.length === 0) return "—";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return lo === hi ? pct(lo) : `${pct(lo)} to ${pct(hi)}`;
}

const yearsText = (n: number) => `${n} ${n === 1 ? "year" : "years"}`;

function headlineSentence(r: RentVsBuyResult): string {
  const period = yearsText(r.horizonYears);
  if (r.ahead === "even") return `On these assumptions, buying and renting end up roughly level after ${period}.`;
  const who = r.ahead === "buy" ? "buying" : "renting and investing the difference";
  return `On these assumptions, ${who} comes out about ${approx(r.difference)} ahead after ${period}.`;
}

function breakEvenText(r: RentVsBuyResult): { value: string; note: string } {
  const b = r.breakEven;
  if (b.status === "never") {
    return { value: "Not within 30 years", note: "Renting stays ahead in every year up to 30 on these assumptions." };
  }
  const later = b.staysAhead ? "" : " It does not stay ahead in every later year.";
  if (b.status === "from-start") {
    return { value: "From year 1", note: `Buying is ahead from the first year.${later}` };
  }
  return { value: `Year ${b.year}`, note: `First year in which buying catches up with renting.${later}` };
}

function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <legend className="mb-1 font-sans text-xs font-semibold tracking-[0.12em] text-ink-muted uppercase">{children}</legend>
  );
}

export function RentVsBuyCalculator() {
  const [price, setPrice] = useState(80_00_000);
  const [down, setDown] = useState(16_00_000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [purchaseCosts, setPurchaseCosts] = useState(6_00_000);
  const [maintenance, setMaintenance] = useState(3_000);
  const [costGrowth, setCostGrowth] = useState(5);
  const [ownershipCosts, setOwnershipCosts] = useState(6_000);
  const [sellingPct, setSellingPct] = useState(1);
  const [rent, setRent] = useState(25_000);
  const [rentIncrease, setRentIncrease] = useState(5);
  const [investReturn, setInvestReturn] = useState(10);
  const [appreciation, setAppreciation] = useState(5);
  const [horizonMode, setHorizonMode] = useState<HorizonMode>("10");
  const [customYears, setCustomYears] = useState(10);
  const [view, setView] = useState<SensitivityView>("propertyAppreciation");

  const horizonYears = horizonMode === "custom" ? customYears : Number(horizonMode);

  const input = useMemo(
    () => ({
      propertyPrice: price,
      downPayment: down,
      loanRate,
      loanTenureYears: tenure,
      purchaseCosts,
      monthlyMaintenance: maintenance,
      annualOwnershipCosts: ownershipCosts,
      ownershipCostGrowth: costGrowth,
      sellingCostPercent: sellingPct,
      monthlyRent: rent,
      rentIncrease,
      investmentReturn: investReturn,
      propertyAppreciation: appreciation,
      horizonYears,
    }),
    [price, down, loanRate, tenure, purchaseCosts, maintenance, ownershipCosts, costGrowth, sellingPct, rent, rentIncrease, investReturn, appreciation, horizonYears],
  );
  const result = useMemo(() => calculateRentVsBuy(input), [input]);
  const sensitivity = useMemo(() => calculateRentVsBuySensitivity(input, result), [input, result]);

  const { markInteraction, trackScenario, trackComparison } = useCalculatorAnalytics(
    "rent-vs-buy",
    result.isValid,
    Object.values(input).join("|"),
  );

  function handlePrice(next: number) {
    setPrice(next);
    if (down > next) setDown(next);
  }

  const H = result.horizonYears;
  const breakEven = breakEvenText(result);
  const downPct = price > 0 ? (Math.min(down, price) / price) * 100 : 0;
  const group = view === "holding" ? null : sensitivity.groups.find((g) => g.key === view);

  const assumptions: { label: string; value: string }[] = [
    { label: "Property price", value: inr(price) },
    { label: "Down payment", value: `${inr(Math.min(down, price))} (${formatPercent(downPct)})` },
    { label: "Home loan", value: `${inr(result.loanAmount)} at ${loanRate}% for ${yearsText(tenure)}` },
    { label: "Purchase costs", value: inr(purchaseCosts) },
    { label: "Maintenance", value: `${inr(maintenance)} a month, rising ${costGrowth}% a year` },
    { label: "Property tax and other ownership costs", value: `${inr(ownershipCosts)} a year, rising ${costGrowth}% a year` },
    { label: "Cost of selling", value: `${sellingPct}% of the home's value at the end` },
    { label: "Rent", value: `${inr(rent)} a month, rising ${rentIncrease}% a year` },
    { label: "Investment return", value: `${investReturn}% a year` },
    { label: "Property appreciation", value: `${appreciation}% a year` },
    { label: "Time horizon", value: yearsText(H) },
  ];

  return (
    <div className="space-y-6">
      <CalculatorCard
        formLabel="Rent vs buy calculator inputs"
        resultsHeading="Estimated results"
        inputs={
          <>
            <fieldset className="space-y-5">
              <GroupHeading>Property &amp; loan</GroupHeading>
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
              />
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
                hint={`${formatPercent(downPct)} of the price. Loan: ${inr(result.loanAmount)}.`}
              />
              <NumberField
                label="Loan interest rate (per annum)"
                suffix="%"
                min={0}
                max={20}
                step={0.05}
                value={loanRate}
                onChange={setLoanRate}
                onInteract={markInteraction}
              />
              <NumberField
                label="Loan tenure"
                suffix="years"
                min={1}
                max={30}
                step={1}
                value={tenure}
                onChange={setTenure}
                onInteract={markInteraction}
                hint={result.emi > 0 ? `EMI about ${inr(result.emi)} a month.` : "No loan needed at this down payment."}
              />
              <div>
                <NumberField
                  label="Purchase costs (stamp duty, registration, etc.)"
                  prefix="₹"
                  showWords
                  min={0}
                  max={2_00_00_000}
                  step={10_000}
                  value={purchaseCosts}
                  onChange={setPurchaseCosts}
                  onInteract={markInteraction}
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Not sure? Estimate them with the{" "}
                  <Link href="/calculators/property-purchase-cost-calculator" className="text-brand underline underline-offset-2">
                    Property Purchase Cost Calculator
                  </Link>
                  .
                </p>
              </div>
              <NumberField
                label="Monthly maintenance"
                prefix="₹"
                min={0}
                max={1_00_000}
                step={500}
                value={maintenance}
                onChange={setMaintenance}
                onInteract={markInteraction}
              />
              <NumberField
                label="Property tax and other yearly ownership costs"
                prefix="₹"
                min={0}
                max={5_00_000}
                step={1_000}
                value={ownershipCosts}
                onChange={setOwnershipCosts}
                onInteract={markInteraction}
                hint="Per year. Repairs, society charges not in maintenance, etc."
              />
              <NumberField
                label="Annual increase in maintenance and ownership costs"
                suffix="%"
                min={0}
                max={15}
                step={0.5}
                value={costGrowth}
                onChange={setCostGrowth}
                onInteract={markInteraction}
              />
              <NumberField
                label="Cost of selling at the end"
                suffix="%"
                min={0}
                max={10}
                step={0.25}
                value={sellingPct}
                onChange={setSellingPct}
                onInteract={markInteraction}
                hint="Brokerage and other selling costs, as % of the home's value then."
              />
            </fieldset>

            <fieldset className="space-y-5 border-t border-line pt-5">
              <GroupHeading>Renting</GroupHeading>
              <NumberField
                label="Monthly rent for a similar home"
                prefix="₹"
                showWords
                min={0}
                max={10_00_000}
                step={500}
                value={rent}
                onChange={setRent}
                onInteract={markInteraction}
              />
              <NumberField
                label="Annual rent increase"
                suffix="%"
                min={0}
                max={15}
                step={0.5}
                value={rentIncrease}
                onChange={setRentIncrease}
                onInteract={markInteraction}
                hint="Applied once every 12 months."
              />
            </fieldset>

            <fieldset className="space-y-5 border-t border-line pt-5">
              <GroupHeading>Investing &amp; growth</GroupHeading>
              <NumberField
                label="Expected investment return"
                suffix="%"
                min={0}
                max={20}
                step={0.1}
                value={investReturn}
                onChange={setInvestReturn}
                onInteract={markInteraction}
                hint="Return on money not spent on the home. An assumption, not a promise."
              />
              <NumberField
                label="Expected property appreciation"
                suffix="%"
                min={0}
                max={15}
                step={0.1}
                value={appreciation}
                onChange={setAppreciation}
                onInteract={markInteraction}
                hint="Average yearly change in the home's value. Not guaranteed."
              />
            </fieldset>

            <fieldset className="space-y-4 border-t border-line pt-5">
              <GroupHeading>Time horizon</GroupHeading>
              <SegmentedControl
                legend="How long you expect to stay"
                options={HORIZON_OPTIONS}
                value={horizonMode}
                onChange={(v) => {
                  trackScenario("option_toggle");
                  setHorizonMode(v);
                }}
              />
              {horizonMode === "custom" && (
                <NumberField
                  label="Custom horizon"
                  suffix="years"
                  min={1}
                  max={30}
                  step={1}
                  value={customYears}
                  onChange={setCustomYears}
                  onInteract={markInteraction}
                />
              )}
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
                    label={`Estimated financial position after ${yearsText(H)}`}
                    value={
                      result.ahead === "even" ? (
                        "Roughly level"
                      ) : (
                        <>
                          <span className="block font-sans text-base font-semibold text-ink-muted">
                            {aheadLabel(result.difference)} ahead by
                          </span>
                          {inr(Math.abs(result.difference))}
                        </>
                      )
                    }
                    note={headlineSentence(result)}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                  <ResultStat
                    swatch="principal"
                    label="Buy: net position"
                    value={inr(result.buyNet)}
                    note="Home value − loan − selling cost + any investments."
                  />
                  <ResultStat
                    swatch="interest"
                    label="Rent: net position"
                    value={inr(result.rentNet)}
                    note="Value of the renter's investments."
                  />
                  <ResultStat label="Break-even" value={breakEven.value} note={breakEven.note} />
                  <ResultStat
                    label="Monthly cost now"
                    value={inr(result.firstMonthBuyCost)}
                    note={`Owning (EMI + maintenance + tax) vs rent ${inr(result.firstMonthRent)}.`}
                  />
                  <ResultStat label={`Property value in year ${H}`} value={inr(result.propertyValue)} />
                  <ResultStat label={`Loan outstanding in year ${H}`} value={inr(result.outstandingLoan)} />
                  <ResultStat label="Total rent paid" value={inr(result.totalRentPaid)} />
                  <ResultStat
                    label="Total paid by the buyer"
                    value={inr(result.totalBuyerOutflow)}
                    note="Down payment, purchase costs, EMIs, maintenance and tax."
                  />
                  <ResultStat label="Loan interest paid" value={inr(result.interestPaid)} />
                  <ResultStat label="Loan principal repaid" value={inr(result.principalRepaid)} />
                </div>
              </dl>

              {result.notes.length > 0 && (
                <Callout tone="warn" title="Worth noting">
                  <ul className="list-disc space-y-1 pl-5">
                    {result.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </Callout>
              )}

              <p className="border-l-2 border-accent pl-3 text-xs text-ink-muted">
                <strong className="text-ink">An estimate, not a recommendation.</strong> Returns, rents and property
                prices do not grow at steady rates. Tax effects, rent deposit and moving costs are not included.
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Enter a property price to compare renting and buying.</p>
          )
        }
      />

      <CalculatorSection
        id="rvb-assumptions"
        title="Your assumptions"
        description="The result depends entirely on these inputs. Change any of them above to see how the comparison moves."
      >
        <dl className="grid gap-x-6 sm:grid-cols-2">
          {assumptions.map((a) => (
            <div key={a.label} className="border-t border-line py-2">
              <dt className="text-sm text-ink-muted">{a.label}</dt>
              <dd className="text-sm font-semibold text-ink tabular-nums">{a.value}</dd>
            </div>
          ))}
        </dl>
      </CalculatorSection>

      {result.isValid && (
        <CalculatorSection
          id="rvb-yearly"
          title="Net position, year by year"
          description={
            result.breakEven.status === "never"
              ? "On these assumptions the buy line stays below the rent line for the full 30 years the calculator checks."
              : result.breakEven.status === "from-start"
                ? "On these assumptions the buy line is above the rent line from the first year."
                : `On these assumptions the buy line first reaches the rent line in year ${result.breakEven.year}.`
          }
        >
          <LineChart
            labels={result.years.map((y) => String(y.year))}
            series={[
              { label: "Buy: net position", values: result.years.map((y) => y.buyNet) },
              { label: "Rent: net position", values: result.years.map((y) => y.rentNet) },
            ]}
            title={`Estimated net position of buying and of renting over ${yearsText(H)}`}
            description={`Solid line: buying. Dashed line: renting and investing. After ${yearsText(H)}, buying is estimated at ${inr(result.buyNet)} and renting at ${inr(result.rentNet)}.`}
            xLabel="Year"
          />
          <div className="mt-5">
            <ScenarioTable
              caption="Estimated net position of buying and renting at the end of each year"
              columns={[
                { label: "Year" },
                { label: "Buy net", numeric: true },
                { label: "Rent net", numeric: true },
                { label: "Buy − Rent", numeric: true },
                { label: "Ahead", numeric: false },
              ]}
              rows={result.years.map((y) => ({
                label: `Year ${y.year}`,
                current: y.year === H,
                cells: [inr(y.buyNet), inr(y.rentNet), signedINR(y.difference), aheadLabel(y.difference)],
              }))}
            />
          </div>
        </CalculatorSection>
      )}

      {result.isValid && (
        <CalculatorSection
          id="rvb-sensitivity"
          title="Which assumption matters most?"
          description={`Each table changes one input and keeps the rest as entered, showing Buy − Rent after ${yearsText(H)}. Positive means buying is ahead; negative means renting is ahead.`}
        >
          <p className="max-w-3xl text-sm text-ink">
            {sensitivity.mostSensitive
              ? `Within the ranges tested, the result is most sensitive to ${sensitivity.mostSensitive.label.toLowerCase()}: it moves the outcome by about ${approx(sensitivity.mostSensitive.swing)} from the lowest to the highest value tried.`
              : "Within the ranges tested, none of these assumptions changes the result."}
          </p>

          <div className="mt-4">
            <ScenarioTable
              caption={`How much Buy − Rent after ${yearsText(H)} moves across the range tested for each assumption`}
              columns={[
                { label: "Assumption" },
                { label: "Range tested", numeric: false },
                { label: "Swing in result", numeric: true },
              ]}
              rows={sensitivity.groups.map((g) => ({
                label: g.label,
                cells: [
                  rangeLabel(g.rows.map((r) => r.value)),
                  inr(g.swing),
                ],
              }))}
            />
          </div>

          <div className="mt-5">
            <SegmentedControl
              legend="Show details for"
              options={SENSITIVITY_OPTIONS}
              value={view}
              onChange={(v) => {
                trackComparison();
                setView(v);
              }}
            />
          </div>
          <div className="mt-3">
            {group ? (
              <ScenarioTable
                caption={`Buy − Rent after ${yearsText(H)} at different values of ${group.label.toLowerCase()}`}
                columns={[
                  { label: group.label },
                  { label: "Buy − Rent", numeric: true },
                  { label: "Ahead", numeric: false },
                ]}
                rows={group.rows.map((r) => ({
                  label: `${pct(r.value)} a year`,
                  current: r.current,
                  cells: [signedINR(r.difference), aheadLabel(r.difference)],
                }))}
              />
            ) : (
              <ScenarioTable
                caption="Net positions of buying and renting for different holding periods"
                columns={[
                  { label: "Holding period" },
                  { label: "Buy net", numeric: true },
                  { label: "Rent net", numeric: true },
                  { label: "Buy − Rent", numeric: true },
                ]}
                rows={sensitivity.holding.map((h) => ({
                  label: yearsText(h.years),
                  current: h.current,
                  cells: [inr(h.buyNet), inr(h.rentNet), signedINR(h.difference)],
                }))}
              />
            )}
          </div>
        </CalculatorSection>
      )}

      <Callout tone="neutral" title="How this comparison works">
        <ul className="list-disc space-y-1 pl-5">
          <li>Both sides start with the same cash. The renter invests the down payment and purchase costs instead.</li>
          <li>
            Both sides spend the same each month: whoever pays less (rent, or EMI + maintenance + tax) invests the
            difference at your expected return, compounded monthly.
          </li>
          <li>Rent, maintenance and ownership costs step up once a year. The home&apos;s value grows at your appreciation rate.</li>
          <li>
            Buy net position = home value − outstanding loan − selling cost + buyer&apos;s investments. Rent net position =
            renter&apos;s investments.
          </li>
          <li>
            Not included: income-tax effects (home loan deductions, capital gains, tax on investment returns), rent
            deposit, moving costs, home insurance, rental income and the non-financial value of owning.
          </li>
        </ul>
      </Callout>
    </div>
  );
}
