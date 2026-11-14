"use client";

import type { PayrollSectionProps } from "./payroll-shared";
import { payrollService } from "@/services/payroll.service";
import { Button } from "./components/ui-primitives";
import { frequencyLabel } from "./payroll-forms";
import { PayrollTable } from "./payroll-tables";
import { date, money } from "./payroll-shared";

export function PayrollRunPage({
  data,
  organizationId,
  can,
  busy,
  action,
  setDrawer,
  setDecision,
}: Pick<PayrollSectionProps, "data" | "organizationId" | "can" | "busy" | "action" | "setDrawer" | "setDecision">) {
  return (
    <>
      <PayrollTable
        label="Payroll runs"
        rows={data.runs}
        rowKey={(row) => row.id}
        columns={[
          { key: "period", label: "Period", value: (row) => row.period },
          {
            key: "range",
            label: "Dates",
            value: (row) =>
              row.snapshot.periodStart ? `${row.snapshot.periodStart} – ${row.snapshot.periodEnd}` : row.period,
          },
          { key: "frequency", label: "Frequency", value: (row) => frequencyLabel(row.profile.frequency) },
          { key: "group", label: "Pay group", value: (row) => row.profile.name },
          { key: "currency", label: "Currency", value: (row) => row.profile.currency },
          { key: "count", label: "Employees", value: (row) => String(row.employeeCount) },
          {
            key: "net",
            label: "Net payout",
            value: (row) => row.totalNet,
            render: (row) => money(row.totalNet, row.profile.currency),
          },
          { key: "status", label: "Status", value: (row) => row.status },
          { key: "reason", label: "Closure reason", value: (row) => row.closureReason ?? "—" },
          { key: "bank", label: "Sandbox payment", value: (row) => row.sandboxStatus ?? "Not initiated" },
        ]}
        actions={(run) => (
          <>
            <Button variant="secondary" onClick={() => setDrawer({ run })}>
              Review
            </Button>
            {run.status === "DRAFT" && can("hrms.payroll.manage") && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setDecision({ runId: run.id, action: "cancel" })}
              >
                Cancel draft
              </Button>
            )}
            {run.status === "DRAFT" && can("hrms.payroll.approve") && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => setDecision({ runId: run.id, action: "reject" })}
              >
                Reject draft
              </Button>
            )}
            {run.status === "PROCESSED" && can("hrms.payroll.approve") && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("SANDBOX ONLY: simulate a bank payment? No real funds will move."))
                    void action(
                      () => payrollService.sandbox(organizationId, run.id, "SUBMIT"),
                      "Sandbox payment submitted. No real funds moved.",
                    );
                }}
              >
                Initiate bank payment (sandbox)
              </Button>
            )}
            {run.sandboxStatus === "SUBMITTED" && can("hrms.payroll.approve") && (
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void action(
                      () => payrollService.sandbox(organizationId, run.id, "SETTLE"),
                      "Simulated settlement recorded; payroll is not marked paid.",
                    )
                  }
                >
                  Simulate settlement
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void action(
                      () => payrollService.sandbox(organizationId, run.id, "FAIL"),
                      "Simulated bank failure recorded.",
                    )
                  }
                >
                  Simulate failure
                </Button>
              </>
            )}
          </>
        )}
      />
      <PayrollTable
        label="Employee payroll records (existing API)"
        rows={data.records}
        rowKey={(row) => row.id}
        columns={[
          { key: "period", label: "Period", value: (row) => row.period },
          {
            key: "start",
            label: "Period start",
            value: (row) => (row.periodStart ? date(row.periodStart) : "Not recorded"),
          },
          {
            key: "end",
            label: "Period end",
            value: (row) => (row.periodEnd ? date(row.periodEnd) : "Not recorded"),
          },
          { key: "currency", label: "Currency", value: (row) => row.currency },
          {
            key: "name",
            label: "Employee",
            value: (row) => `${row.employee.employeeNumber} · ${row.employee.user.name}`,
          },
          {
            key: "net",
            label: "Net pay",
            value: (row) => String(row.netPay),
            render: (row) => money(String(row.netPay), row.currency),
          },
          { key: "status", label: "Status", value: (row) => row.status },
        ]}
      />
    </>
  );
}
