"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PayrollItem, PayrollRun, PayrollWorkspace } from "@/services/payroll.service";
import { downloadPayrollCsv } from "./payroll-tables";

export const inputClass =
  "w-full cursor-pointer rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
export const date = (value: string) => value.slice(0, 10);
export const money = (value: string, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value));

export type PayrollSectionProps = {
  data: PayrollWorkspace;
  organizationId: string;
  can: (permission: string) => boolean;
  busy: boolean;
  action: (work: () => Promise<unknown>, message: string) => Promise<void>;
  setForm: Dispatch<SetStateAction<"profile" | "structure" | "assignment" | "claim" | "variable" | null>>;
  setDrawer: Dispatch<SetStateAction<{ run?: PayrollRun } | null>>;
  setDecision: Dispatch<SetStateAction<{ runId: string; action: "cancel" | "reject" } | null>>;
  setSlip: Dispatch<SetStateAction<{ run: PayrollRun; item: PayrollItem } | null>>;
};

export function exportRun(run: PayrollRun) {
  downloadPayrollCsv(`payroll-register-${run.period}.csv`, [
    [
      "Period",
      "Employee number",
      "Name",
      "Currency",
      "Gross",
      "Deductions",
      "Reimbursements",
      "Net",
      "Status",
      "Proration policy",
      "Period days",
      "Employment days",
      "Unpaid days",
      "Payable days",
      "Variable input basis",
      "Period employer cost",
      "Previous period",
      "Previous net",
      "Gross change",
      "Deductions change",
      "Net change",
      "Net change percent",
      "Period start",
      "Period end",
      "Frequency",
      "Salary allocation",
      "Scheduled pay date",
      "Selected pay date",
      "Calendar allocation basis",
    ],
    ...run.snapshot.items.map((item) => [
      run.period,
      item.employeeNumber,
      item.name,
      run.profile.currency,
      item.gross,
      item.deductions,
      item.reimbursements,
      item.net,
      run.status,
      run.snapshot.prorationPolicy ?? "NONE",
      item.proration ? String(item.proration.periodDays) : "",
      item.proration ? String(item.proration.employmentDays) : "",
      item.proration ? String(item.proration.unpaidDays) : "",
      item.proration ? String(item.proration.employmentDays - item.proration.unpaidDays) : "",
      (item.variableInputs ?? [])
        .map(
          (input) =>
            `${input.id}: ${input.name}; ${input.calculation}; ${input.quantity} x ${input.rate} x ${input.multiplier} = ${input.amount}; ${input.reason}`,
        )
        .join(" | "),
      item.periodEmployerCost ?? "",
      item.variance?.previousPeriod ?? "",
      item.variance?.previousNet ?? "",
      item.variance?.grossDelta ?? "",
      item.variance?.deductionsDelta ?? "",
      item.variance?.netDelta ?? "",
      item.variance?.netPercent ?? "",
      run.snapshot.periodStart ?? "",
      run.snapshot.periodEnd ?? "",
      run.profile.frequency,
      run.snapshot.salaryAllocation ?? "",
      run.snapshot.scheduledPayDate ?? "",
      date(run.payDate),
      (item.proration?.segments ?? [])
        .map(
          (segment) =>
            `${segment.assignmentId}: ${segment.month ?? run.period}; ${segment.monthlyGross}/month; ${segment.payableDays}/${segment.monthDays ?? item.proration?.periodDays} days`,
        )
        .join(" | "),
    ]),
  ]);
}
