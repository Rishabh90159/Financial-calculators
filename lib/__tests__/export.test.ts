import { describe, expect, it } from "vitest";
import { buildAmortizationSchedule } from "../calculations/emi";
import { amortizationCsv } from "../export";

const INPUT = { principal: 50_00_000, annualRate: 8.5, tenureMonths: 240 };

describe("amortizationCsv", () => {
  const lines = amortizationCsv(INPUT).trimEnd().split("\r\n");
  const headerIndex = lines.indexOf("Month,Loan year,Principal,Interest,Payment,Closing balance");
  const rows = lines.slice(headerIndex + 1).map((l) => l.split(","));

  it("lists the inputs and the EMI first", () => {
    expect(lines[0]).toBe("Loan amount,5000000.00");
    expect(lines[1]).toBe("Interest rate (% per annum),8.5");
    expect(lines[2]).toBe("Tenure (months),240");
    expect(lines[3]).toMatch(/^Monthly EMI,43391\.\d\d$/);
  });

  it("has one row per instalment, matching the on-screen schedule", () => {
    const schedule = buildAmortizationSchedule(INPUT);
    expect(headerIndex).toBeGreaterThan(0);
    expect(rows).toHaveLength(240);
    expect(Number(rows[0]?.[3])).toBeCloseTo(schedule[0]!.interestPaid, 2);
    expect(rows[11]?.[1]).toBe("1");
    expect(rows[12]?.[1]).toBe("2");
  });

  it("ends with a zero balance and principal that adds up to the loan", () => {
    expect(rows.at(-1)?.[5]).toBe("0.00");
    const principal = rows.reduce((sum, r) => sum + Number(r[2]), 0);
    expect(principal).toBeCloseTo(50_00_000, 0);
  });

  it("uses plain numbers with no currency symbols or digit grouping", () => {
    for (const r of rows) for (const cell of r) expect(cell).toMatch(/^\d+(\.\d\d)?$/);
  });

  it("returns only the input block for an invalid loan", () => {
    const csv = amortizationCsv({ principal: 0, annualRate: 8.5, tenureMonths: 240 });
    expect(csv.trimEnd().split("\r\n").at(-1)).toBe("Month,Loan year,Principal,Interest,Payment,Closing balance");
  });
});
