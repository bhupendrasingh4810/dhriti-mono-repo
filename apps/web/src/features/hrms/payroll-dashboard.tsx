"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { PayrollRun, PayrollWorkspace } from "@/services/payroll.service";
import { Button, Card, CardTitle, Icon } from "./components/ui-primitives";
import { PayrollTable } from "./payroll-tables";
import { date, exportRun } from "./payroll-shared";

export function PayrollDashboard({
  data,
  latest,
  setDrawer,
}: {
  data: PayrollWorkspace | null;
  latest: PayrollRun | undefined;
  setDrawer: Dispatch<SetStateAction<{ run?: PayrollRun } | null>>;
}) {
  const [checklistFilters, setChecklistFilters] = useState(false);
  const checklist = [
    [
      "Validate attendance",
      "People Ops",
      latest ? date(latest.payDate) : "Not scheduled",
      "Recorded exceptions checked",
      "Manual completeness review",
    ],
    [
      "Review variable pay",
      "Finance",
      latest ? date(latest.payDate) : "Not scheduled",
      `${data?.variableInputs.filter((input) => input.status === "PENDING").length ?? 0} pending inputs`,
      "Independent input approval required",
    ],
    [
      "Leadership approval",
      "Payroll approver",
      latest ? date(latest.payDate) : "Not scheduled",
      latest?.approvedById ? "100%" : "0%",
      latest?.approvedById ? "Complete" : "Pending",
    ],
    [
      "Bank processing",
      "Finance",
      latest ? date(latest.payDate) : "Not scheduled",
      latest?.sandboxStatus ?? "Not started",
      "Sandbox only",
    ],
  ];
  return (
    <Card className="mt-5 overflow-hidden">
      <CardTitle
        title="Payroll run checklist"
        subtitle="Payroll · Dashboard"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon="filter" onClick={() => setChecklistFilters((current) => !current)}>
              Filters
            </Button>
            <Button variant="secondary" icon="download" disabled={!latest} onClick={() => latest && exportRun(latest)}>
              Export
            </Button>
          </div>
        }
      />
      <PayrollTable<string[]>
        label="Payroll run checklist"
        toolbarActions={false}
        filtersVisible={checklistFilters}
        rows={checklist}
        rowKey={(row) => row[0]}
        columns={["Step", "Owner", "Due date", "Progress", "Status"].map((label, index) => ({
          key: label,
          label,
          value: (row) => row[index],
        }))}
        actions={() => (
          <button
            type="button"
            aria-label="Open payroll run"
            className="cursor-pointer p-2 text-brand"
            disabled={!data}
            onClick={() => setDrawer({ run: latest })}
          >
            <Icon name="dots" />
          </button>
        )}
      />
    </Card>
  );
}
