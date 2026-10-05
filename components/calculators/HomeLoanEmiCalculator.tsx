import { EmiCalculatorEngine } from "./EmiCalculatorEngine";

export function HomeLoanEmiCalculator() {
  return (
    <EmiCalculatorEngine
      config={{
        calculatorId: "home-loan-emi",
        formLabel: "Home loan EMI calculator inputs",
        amountLabel: "Home loan amount",
        defaults: { amount: 50_00_000, rate: 8.5, years: 20 },
        amount: { min: 1_00_000, max: 10_00_00_000, step: 50_000 },
        rate: { min: 0, max: 20, step: 0.05 },
        years: { min: 1, max: 30, step: 1 },
        presetsLabel: "Quick loan amounts",
        presets: [
          { label: "₹25 Lakh", value: 25_00_000 },
          { label: "₹50 Lakh", value: 50_00_000 },
          { label: "₹75 Lakh", value: 75_00_000 },
          { label: "₹1 Crore", value: 1_00_00_000 },
        ],
        insightsHeading: "What your home loan EMI means",
      }}
    />
  );
}
