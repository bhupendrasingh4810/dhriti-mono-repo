"use client";

import type { PayrollSectionProps } from "./payroll-shared";
import { payrollService } from "@/services/payroll.service";
import { Button } from "./components/ui-primitives";
import { PayrollTable } from "./payroll-tables";
import { date, money } from "./payroll-shared";

export function PayrollReimbursements({
  data,
  organizationId,
  can,
  busy,
  action,
  setForm,
}: Pick<PayrollSectionProps, "data" | "organizationId" | "can" | "busy" | "action" | "setForm">) {
  return (
    <>
      <div className="mt-4 flex justify-end">
        <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("claim")}>
          Add reimbursement
        </Button>
      </div>
      <PayrollTable
        label="Reimbursements"
        rows={data.claims}
        rowKey={(row) => row.id}
        columns={[
          { key: "name", label: "Employee", value: (row) => row.employee.user.name },
          { key: "title", label: "Expense", value: (row) => row.title },
          { key: "currency", label: "Currency", value: (row) => row.currency },
          {
            key: "amount",
            label: "Amount",
            value: (row) => row.amount,
            render: (row) => money(row.amount, row.currency),
          },
          { key: "date", label: "Date", value: (row) => date(row.expenseDate) },
          { key: "receipt", label: "Receipt reference", value: (row) => row.receiptReference },
          { key: "status", label: "Status", value: (row) => row.status },
        ]}
        actions={(claim) =>
          claim.status === "PENDING" &&
          can("hrms.payroll.approve") && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void action(() => payrollService.approveClaim(organizationId, claim.id), "Claim approved")}
            >
              Approve
            </Button>
          )
        }
      />
    </>
  );
}
