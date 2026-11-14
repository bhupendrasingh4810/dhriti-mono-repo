import { Prisma } from "@prisma/client";
import type { CalculatedComponent } from "./payroll-calculation";

/** Explicit approved input amounts do not recalculate tax or recurring salary formulas. */
export function variablePayAmount(
  input: { calculation: "FIXED" | "HOURS"; quantity: string; rate: string; multiplier: string },
  precision: number,
) {
  const quantity = new Prisma.Decimal(input.quantity);
  const rate = new Prisma.Decimal(input.rate);
  const multiplier = new Prisma.Decimal(input.multiplier);
  if ([quantity, rate, multiplier].some((value) => !value.isFinite() || !value.gt(0))) {
    throw new Error("Quantity, rate and multiplier must be finite and greater than zero");
  }
  if (input.calculation === "FIXED" && (!quantity.eq(1) || !multiplier.eq(1))) {
    throw new Error("Fixed inputs require quantity and multiplier of 1");
  }
  const amount = quantity.mul(rate).mul(multiplier).toDecimalPlaces(precision, Prisma.Decimal.ROUND_HALF_UP);
  if (!amount.gt(0) || amount.gte("100000000000000")) {
    throw new Error("Variable amount is zero at currency precision or exceeds supported storage");
  }
  return amount.toFixed(precision);
}

export function applyVariablePay(
  salary: { gross: string; deductions: string; employer: string; net: string; lines: CalculatedComponent[] },
  inputs: { id: string; name: string; type: string; amount: Prisma.Decimal }[],
  precision: number,
) {
  const sum = (type: string) =>
    inputs.filter((item) => item.type === type).reduce((total, item) => total.plus(item.amount), new Prisma.Decimal(0));
  const gross = new Prisma.Decimal(salary.gross).plus(sum("EARNING"));
  const deductions = new Prisma.Decimal(salary.deductions).plus(sum("DEDUCTION"));
  if (deductions.gt(gross)) {
    throw new Error("Variable deductions exceed earned gross; reimbursements cannot fund salary deductions");
  }
  const employer = new Prisma.Decimal(salary.employer).plus(sum("EMPLOYER"));
  if (
    [gross, deductions, employer, gross.plus(employer)].some(
      (value) => !value.isFinite() || value.gte("100000000000000"),
    )
  ) {
    throw new Error("Combined salary and variable inputs exceed supported storage");
  }
  return {
    gross: gross.toFixed(precision),
    deductions: deductions.toFixed(precision),
    employer: employer.toFixed(precision),
    net: gross.minus(deductions).toFixed(precision),
    periodEmployerCost: gross.plus(employer).toFixed(precision),
    lines: [
      ...salary.lines,
      ...inputs.map((item) => ({
        code: `VAR_${item.id}`,
        name: item.name,
        type: item.type,
        amount: item.amount.toFixed(precision),
      })),
    ],
  };
}

/** Compare only same-currency canonical prior payroll; no threshold or implicit currency conversion. */
export function payrollVariance(
  current: { gross: string; deductions: string; net: string },
  previous: {
    id: string;
    period: string;
    currency: string;
    grossSalary: number;
    totalDeductions: number;
    netPay: number;
  } | null,
  precision: number,
) {
  if (!previous) {
    return null;
  }
  if ([previous.grossSalary, previous.totalDeductions, previous.netPay].some((value) => !Number.isFinite(value))) {
    throw new Error("Prior payroll contains invalid amounts; correct its data before comparing payroll");
  }
  const delta = (value: string, prior: number) => new Prisma.Decimal(value).minus(prior).toFixed(precision);
  const priorNet = new Prisma.Decimal(previous.netPay);
  return {
    previousRecordId: previous.id,
    previousPeriod: previous.period,
    currency: previous.currency,
    previousGross: new Prisma.Decimal(previous.grossSalary).toFixed(precision),
    previousDeductions: new Prisma.Decimal(previous.totalDeductions).toFixed(precision),
    previousNet: priorNet.toFixed(precision),
    grossDelta: delta(current.gross, previous.grossSalary),
    deductionsDelta: delta(current.deductions, previous.totalDeductions),
    netDelta: delta(current.net, previous.netPay),
    netPercent: priorNet.eq(0)
      ? null
      : new Prisma.Decimal(current.net).minus(priorNet).div(priorNet.abs()).mul(100).toFixed(2),
  };
}
