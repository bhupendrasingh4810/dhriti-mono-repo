"use client";

import { useState } from "react";
import type { PayrollItem } from "@/services/payroll.service";
import { Button } from "./components/ui-primitives";
import { PayrollField } from "./payroll-forms";
import { PayrollTable } from "./payroll-tables";
import { exportRun, inputClass, type PayrollSectionProps } from "./payroll-shared";

export function PayrollResults({
  data,
  setSlip,
  tab,
}: Pick<PayrollSectionProps, "data" | "setSlip"> & { tab: "Payslips" | "Reports" }) {
  const [selectedRunId, setSelectedRunId] = useState("");
  const processed = data.runs.filter((run) => run.status === "PROCESSED");
  const selectedRun = processed.find((run) => run.id === selectedRunId) ?? processed[0];
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <PayrollField label="Processed payroll period">
          <select
            className={inputClass}
            value={selectedRun?.id ?? ""}
            onChange={(event) => setSelectedRunId(event.target.value)}
          >
            {!processed.length && <option value="">No processed payroll</option>}
            {processed.map((run) => (
              <option key={run.id} value={run.id}>
                {run.snapshot.periodStart ? `${run.snapshot.periodStart} – ${run.snapshot.periodEnd}` : run.period} ·{" "}
                {run.profile.name}
              </option>
            ))}
          </select>
        </PayrollField>
        <Button
          variant="secondary"
          icon="download"
          disabled={!selectedRun}
          onClick={() => selectedRun && exportRun(selectedRun)}
        >
          Export payroll register
        </Button>
      </div>
      {tab === "Reports" && (
        <>
          <p className="mt-3 text-sm text-text-secondary">
            Variance compares the latest earlier approved/paid employee payroll in the same currency. Net includes
            reimbursements; scope, pay group and month length can differ. All changes are shown without an anomaly
            threshold; a zero prior net has no percentage.
          </p>
          <p className="mt-3 rounded-md border border-warning/30 p-3 text-sm text-warning">
            Payroll register export is available. Bank-specific advice formats, statutory ECR/ESIC/PT/24Q/Form 16,
            journal vouchers, and tax filings need country/provider adapters; this is not a filing-ready export.
          </p>
        </>
      )}
      <PayrollTable
        label={tab}
        rows={selectedRun?.snapshot.items ?? []}
        rowKey={(row) => row.employeeId}
        columns={[
          { key: "code", label: "Employee ID", value: (row) => row.employeeNumber },
          { key: "name", label: "Employee", value: (row) => row.name },
          { key: "gross", label: "Gross", value: (row) => row.gross },
          {
            key: "days",
            label: "Payable calendar days",
            value: (row) =>
              row.proration
                ? `${row.proration.employmentDays - row.proration.unpaidDays} / ${row.proration.periodDays}`
                : "Full month",
          },
          { key: "deductions", label: "Deductions", value: (row) => row.deductions },
          { key: "reimbursements", label: "Reimbursements", value: (row) => row.reimbursements },
          {
            key: "net",
            label: `Net (${selectedRun?.profile.currency ?? "currency"})`,
            value: (row) => row.net,
          },
          ...(tab === "Reports"
            ? [
                {
                  key: "previous",
                  label: "Previous period",
                  value: (row: PayrollItem) => row.variance?.previousPeriod ?? "No baseline",
                },
                {
                  key: "grossChange",
                  label: "Gross change",
                  value: (row: PayrollItem) => row.variance?.grossDelta ?? "—",
                },
                {
                  key: "deductionsChange",
                  label: "Deductions change",
                  value: (row: PayrollItem) => row.variance?.deductionsDelta ?? "—",
                },
                {
                  key: "netChange",
                  label: "Net change",
                  value: (row: PayrollItem) =>
                    row.variance
                      ? `${row.variance.netDelta} (${row.variance.netPercent === null ? "prior net zero" : `${row.variance.netPercent}%`})`
                      : "No baseline",
                },
              ]
            : []),
        ]}
        actions={
          tab === "Payslips"
            ? (item) => (
                <Button variant="secondary" onClick={() => selectedRun && setSlip({ run: selectedRun, item })}>
                  View payslip
                </Button>
              )
            : undefined
        }
      />
    </>
  );
}
