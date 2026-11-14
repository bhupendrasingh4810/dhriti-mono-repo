import { Prisma } from "@prisma/client";
import { applyVariablePay, payrollVariance, variablePayAmount } from "./payroll-variable-calculation";

describe("payroll variable amounts and variance", () => {
  it("calculates fixed amounts and explicit hours using decimal HALF_UP currency rounding", () => {
    expect(variablePayAmount({ calculation: "FIXED", quantity: "1", rate: "1500", multiplier: "1" }, 2)).toBe(
      "1500.00",
    );
    expect(variablePayAmount({ calculation: "HOURS", quantity: "10.5", rate: "125.25", multiplier: "1.5" }, 2)).toBe(
      "1972.69",
    );
    expect(variablePayAmount({ calculation: "HOURS", quantity: "1", rate: "1.5", multiplier: "1" }, 0)).toBe("2");
    expect(variablePayAmount({ calculation: "FIXED", quantity: "1", rate: "1.2345", multiplier: "1" }, 3)).toBe(
      "1.235",
    );
  });
  it("rejects zero, excessive, nonfinite amounts and fixed values with hidden multipliers", () => {
    for (const rate of ["0", "-1", "Infinity", "0.0001", "100000000000000"]) {
      expect(() => variablePayAmount({ calculation: "FIXED", quantity: "1", rate, multiplier: "1" }, 2)).toThrow();
    }
    expect(() => variablePayAmount({ calculation: "FIXED", quantity: "2", rate: "100", multiplier: "1" }, 2)).toThrow(
      "require",
    );
  });
  const salary = { gross: "1000.00", deductions: "100.00", employer: "50.00", net: "900.00", lines: [] };
  it("adds variable earnings, deductions and employer costs without mutating salary or annualizing variable amounts", () => {
    const result = applyVariablePay(
      salary,
      [
        { id: "bonus", name: "Bonus", type: "EARNING", amount: new Prisma.Decimal(100) },
        { id: "deduction", name: "Deduction", type: "DEDUCTION", amount: new Prisma.Decimal(20) },
        { id: "cost", name: "Employer", type: "EMPLOYER", amount: new Prisma.Decimal(30) },
      ],
      2,
    );
    expect(result).toMatchObject({
      gross: "1100.00",
      deductions: "120.00",
      employer: "80.00",
      net: "980.00",
      periodEmployerCost: "1180.00",
    });
    expect(result.lines.map((line) => line.code)).toEqual(["VAR_bonus", "VAR_deduction", "VAR_cost"]);
    expect(result).not.toHaveProperty("annualCtc");
    expect(salary.gross).toBe("1000.00");
  });
  it("blocks deductions above earned gross rather than using reimbursements to hide negative salary", () => {
    expect(() =>
      applyVariablePay(
        salary,
        [{ id: "deduction", name: "Recovery", type: "DEDUCTION", amount: new Prisma.Decimal(1000) }],
        2,
      ),
    ).toThrow("reimbursements cannot fund");
  });
  it("rejects aggregate storage overflow even when each individual variable amount fits", () => {
    expect(() =>
      applyVariablePay(
        salary,
        [
          { id: "large-a", name: "Large award", type: "EARNING", amount: new Prisma.Decimal("60000000000000") },
          { id: "large-b", name: "Large cost", type: "EMPLOYER", amount: new Prisma.Decimal("60000000000000") },
        ],
        2,
      ),
    ).toThrow("exceed supported storage");
  });
  const previous = {
    id: "previous",
    period: "2026-10",
    currency: "INR",
    grossSalary: 1000,
    totalDeductions: 100,
    netPay: 900,
  };
  it("shows all exact deltas including small changes, zero-baseline percentages, and absent baselines", () => {
    expect(payrollVariance({ gross: "1100", deductions: "120", net: "980" }, previous, 2)).toMatchObject({
      previousRecordId: "previous",
      previousNet: "900.00",
      grossDelta: "100.00",
      deductionsDelta: "20.00",
      netDelta: "80.00",
      netPercent: "8.89",
    });
    expect(payrollVariance({ gross: "1000", deductions: "100", net: "899.99" }, previous, 2)?.netDelta).toBe("-0.01");
    expect(
      payrollVariance({ gross: "0", deductions: "0", net: "0" }, { ...previous, netPay: 0 }, 2)?.netPercent,
    ).toBeNull();
    expect(payrollVariance({ gross: "0", deductions: "0", net: "0" }, null, 2)).toBeNull();
    expect(() => payrollVariance({ gross: "0", deductions: "0", net: "0" }, { ...previous, netPay: NaN }, 2)).toThrow(
      "invalid amounts",
    );
  });
});
