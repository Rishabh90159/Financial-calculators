import { buildAmortizationSchedule, calculateEmi, type EmiInput } from "./calculations/emi";
import { roundTo } from "./calculations/utils";

/**
 * Month-by-month amortization schedule as CSV, for spreadsheets. Plain numbers
 * (no ₹ or digit grouping), rounded to the paisa, with the inputs listed first so
 * the file explains itself. Uses the same engine as the on-screen schedule.
 */
export function amortizationCsv(input: EmiInput): string {
  const result = calculateEmi(input);
  const schedule = buildAmortizationSchedule(input);
  const n = (v: number) => roundTo(v, 2).toFixed(2);

  const lines = [
    `Loan amount,${n(result.principal)}`,
    `Interest rate (% per annum),${result.annualRate}`,
    `Tenure (months),${result.tenureMonths}`,
    `Monthly EMI,${n(result.emi)}`,
    `Total interest,${n(result.totalInterest)}`,
    `Total payment,${n(result.totalPayment)}`,
    "",
    "Month,Loan year,Principal,Interest,Payment,Closing balance",
    ...schedule.map((m) =>
      [m.month, Math.floor((m.month - 1) / 12) + 1, n(m.principalPaid), n(m.interestPaid), n(m.payment), n(m.closingBalance)].join(","),
    ),
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Triggers a browser download of text content. Client-side only. */
export function downloadTextFile(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
