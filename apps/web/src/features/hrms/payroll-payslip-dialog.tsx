"use client";

import type { PayrollItem, PayrollRun } from "@/services/payroll.service";
import { Button } from "./components/ui-primitives";
import { PayrollDialog, frequencyLabel } from "./payroll-forms";
import { PayrollTable, downloadPayrollCsv } from "./payroll-tables";
import { date, money } from "./payroll-shared";

export function PayrollPayslipDialog({
  slip,
  close,
}: {
  slip: { run: PayrollRun; item: PayrollItem };
  close: () => void;
}) {
  return (
    <PayrollDialog label="Payslip" centered close={() => close()}>
      <section className="max-h-full w-full max-w-2xl overflow-auto rounded-xl bg-surface p-6 text-text-primary">
        <div className="flex justify-between gap-3">
          <h2 className="text-lg font-semibold">Payslip · {slip.run.period}</h2>
          <Button variant="ghost" onClick={() => close()}>
            Close
          </Button>
        </div>
        <p className="mt-2 text-sm">
          {slip.run.profile.name} · {slip.run.profile.countryCode} · {slip.run.profile.currency}
        </p>
        <p className="text-xs text-text-secondary">
          {slip.item.employeeNumber} · {slip.item.name} · Pay date {date(slip.run.payDate)}
        </p>
        {slip.run.snapshot.periodStart && (
          <p className="mt-2 text-xs text-text-secondary">
            Period {slip.run.snapshot.periodStart} through {slip.run.snapshot.periodEnd} ·{" "}
            {frequencyLabel(slip.run.profile.frequency)}.
            {slip.run.snapshot.salaryAllocation === "MONTHLY_CALENDAR" &&
              " Monthly components allocated within each calendar month; not a full monthly salary per period."}
          </p>
        )}
        {slip.item.proration && (
          <p className="mt-2 text-xs text-text-secondary">
            Calendar-day policy: {slip.item.proration.employmentDays} employed days - {slip.item.proration.unpaidDays}{" "}
            unpaid = {slip.item.proration.employmentDays - slip.item.proration.unpaidDays} payable /{" "}
            {slip.item.proration.periodDays} period days.
          </p>
        )}
        {slip.item.proration?.allocation === "MONTHLY_CALENDAR" && (
          <div className="mt-2 text-xs text-text-secondary">
            {slip.item.proration.segments.map((segment) => (
              <p key={`${segment.assignmentId}:${segment.month}`}>
                {segment.month}: {segment.payableDays} payable / {segment.monthDays} calendar days; monthly gross{" "}
                {money(segment.monthlyGross, slip.run.profile.currency)}.
              </p>
            ))}
          </div>
        )}
        <PayrollTable
          label="Payslip components"
          rows={slip.item.lines}
          rowKey={(row) => `${row.code}:${row.type}:${row.name}`}
          columns={[
            { key: "name", label: "Component", value: (row) => row.name },
            { key: "type", label: "Type", value: (row) => row.type },
            { key: "amount", label: "Amount", value: (row) => row.amount },
          ]}
        />
        <p className="mt-4 text-sm">Reimbursements: {money(slip.item.reimbursements, slip.run.profile.currency)}</p>
        <p className="mt-2 font-semibold">Net pay: {money(slip.item.net, slip.run.profile.currency)}</p>
        {slip.item.variableInputs?.length ? (
          <p className="mt-2 text-xs text-text-secondary">
            Includes {slip.item.variableInputs.length} approved variable input(s). Contractual monthly CTC is not
            annualized from bonuses or period-specific hours.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-warning">
          Payroll finalized, not proof of bank payment. Sandbox payments move no funds.
        </p>
        <div className="mt-4">
          <Button
            variant="secondary"
            icon="download"
            onClick={() =>
              downloadPayrollCsv(`payslip-${slip.run.period}-${slip.item.employeeNumber}.csv`, [
                ["Period", slip.run.period],
                ["Period start", slip.run.snapshot.periodStart ?? ""],
                ["Period end", slip.run.snapshot.periodEnd ?? ""],
                ["Frequency", slip.run.profile.frequency],
                ["Salary allocation", slip.run.snapshot.salaryAllocation ?? ""],
                ["Scheduled pay date", slip.run.snapshot.scheduledPayDate ?? ""],
                ["Selected pay date", date(slip.run.payDate)],
                ...(slip.item.proration?.segments ?? []).map((segment) => [
                  "Calendar allocation basis",
                  segment.assignmentId,
                  `${segment.month ?? slip.run.period}: ${segment.monthlyGross}/month; ${segment.payableDays}/${segment.monthDays ?? slip.item.proration?.periodDays} days`,
                ]),
                ["Employee", slip.item.name],
                ["Currency", slip.run.profile.currency],
                ["Proration policy", slip.run.snapshot.prorationPolicy ?? "NONE"],
                ...(slip.item.proration
                  ? [
                      ["Period days", String(slip.item.proration.periodDays)],
                      ["Employment days", String(slip.item.proration.employmentDays)],
                      ["Unpaid days", String(slip.item.proration.unpaidDays)],
                      ["Payable days", String(slip.item.proration.employmentDays - slip.item.proration.unpaidDays)],
                    ]
                  : []),
                ["Component", "Type", "Amount"],
                ...slip.item.lines.map((line) => [line.name, line.type, line.amount]),
                ["Reimbursements", "", slip.item.reimbursements],
                ["Net", "", slip.item.net],
              ])
            }
          >
            Download payslip data
          </Button>
        </div>
      </section>
    </PayrollDialog>
  );
}
