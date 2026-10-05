import { EmiCalculatorEngine } from "./EmiCalculatorEngine";

export function EmiCalculator() {
  return (
    <EmiCalculatorEngine
      config={{
        calculatorId: "emi",
        formLabel: "EMI calculator inputs",
        amountLabel: "Loan amount",
        defaults: { amount: 10_00_000, rate: 9, years: 5 },
        amount: { min: 10_000, max: 5_00_00_000, step: 10_000 },
        rate: { min: 0, max: 30, step: 0.05 },
        years: { min: 0.5, max: 30, step: 0.5 },
      }}
    />
  );
}
