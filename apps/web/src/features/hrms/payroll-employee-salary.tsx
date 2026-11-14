"use client";

import type { PayrollSectionProps } from "./payroll-shared";
import { payrollService } from "@/services/payroll.service";
import { Button } from "./components/ui-primitives";
import { PayrollTable } from "./payroll-tables";
import { date, money } from "./payroll-shared";

export function PayrollEmployeeSalary({
  data,
  organizationId,
  can,
  busy,
  action,
  setForm,
}: Pick<PayrollSectionProps, "data" | "organizationId" | "can" | "busy" | "action" | "setForm">) {
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          Effective-dated salary history. New assignments preserve prior revisions.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("variable")}>
            Add variable pay input
          </Button>
          <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("assignment")}>
            Assign / revise salary
          </Button>
        </div>
      </div>
      <PayrollTable
        label="Employee salary"
        rows={data.assignments}
        rowKey={(row) => row.id}
        columns={[
          {
            key: "name",
            label: "Employee",
            value: (row) => `${row.employee.employeeNumber} · ${row.employee.user.name}`,
          },
          { key: "structure", label: "Structure", value: (row) => row.structure.name },
          { key: "currency", label: "Currency", value: (row) => row.structure.profile.currency },
          {
            key: "gross",
            label: "Monthly gross",
            value: (row) => row.monthlyGross,
            render: (row) => money(row.monthlyGross, row.structure.profile.currency),
          },
          {
            key: "ctc",
            label: "Monthly CTC",
            value: (row) => row.breakdown.monthlyCtc,
            render: (row) => money(row.breakdown.monthlyCtc, row.structure.profile.currency),
          },
          {
            key: "annualCtc",
            label: "Annual CTC",
            value: (row) => row.breakdown.annualCtc,
            render: (row) => money(row.breakdown.annualCtc, row.structure.profile.currency),
          },
          {
            key: "net",
            label: "Monthly net",
            value: (row) => row.breakdown.net,
            render: (row) => money(row.breakdown.net, row.structure.profile.currency),
          },
          { key: "date", label: "Effective from", value: (row) => date(row.effectiveFrom) },
        ]}
      />
      <p className="mt-4 text-xs text-text-secondary">
        Variable inputs require independent approval. Fixed inputs recur over the inclusive month range; hours are
        period-specific. Approved inputs are immutable and apply only to their pay group. Tax is not recalculated
        automatically. Employee approval must also be performed by another user.
      </p>
      <PayrollTable
        label="Variable pay inputs"
        rows={data.variableInputs}
        rowKey={(row) => row.id}
        columns={[
          {
            key: "employee",
            label: "Employee",
            value: (row) => `${row.employee.employeeNumber} · ${row.employee.user.name}`,
          },
          { key: "profile", label: "Pay group", value: (row) => row.profile.name },
          { key: "name", label: "Input", value: (row) => row.name },
          { key: "type", label: "Type", value: (row) => row.type },
          {
            key: "basis",
            label: "Calculation basis",
            value: (row) => `${row.quantity} × ${row.rate} × ${row.multiplier}`,
          },
          {
            key: "amount",
            label: "Amount per period",
            value: (row) => row.amount,
            render: (row) => money(row.amount, row.profile.currency),
          },
          {
            key: "period",
            label: "Month range / target period",
            value: (row) => row.targetPeriod ?? `${row.startPeriod} - ${row.endPeriod}`,
          },
          { key: "reason", label: "Reason", value: (row) => row.reason },
          { key: "status", label: "Status", value: (row) => row.status },
        ]}
        actions={(input) =>
          input.status === "PENDING" && (
            <>
              {can("hrms.payroll.approve") && (
                <>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void action(
                        () => payrollService.decideVariable(organizationId, input.id, "approve"),
                        "Variable pay input approved",
                      )
                    }
                  >
                    Approve input
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void action(
                        () => payrollService.decideVariable(organizationId, input.id, "reject"),
                        "Variable pay input rejected",
                      )
                    }
                  >
                    Reject input
                  </Button>
                </>
              )}
              {can("hrms.payroll.manage") && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void action(
                      () => payrollService.decideVariable(organizationId, input.id, "cancel"),
                      "Variable pay input cancelled",
                    )
                  }
                >
                  Cancel input
                </Button>
              )}
            </>
          )
        }
      />
    </>
  );
}
