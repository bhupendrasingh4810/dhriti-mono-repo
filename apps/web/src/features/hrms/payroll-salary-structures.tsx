"use client";

import type { PayrollSectionProps } from "./payroll-shared";
import { Button } from "./components/ui-primitives";
import { PayrollTable } from "./payroll-tables";

export function PayrollSalaryStructures({ data, can, setForm }: Pick<PayrollSectionProps, "data" | "can" | "setForm">) {
  return (
    <>
      <div className="mt-4 flex justify-end">
        <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("structure")}>
          Add salary structure
        </Button>
      </div>
      <PayrollTable
        label="Salary structures"
        rows={data.structures}
        rowKey={(row) => row.id}
        columns={[
          { key: "name", label: "Structure", value: (row) => row.name },
          { key: "profile", label: "Payroll profile", value: (row) => row.profile.name },
          { key: "currency", label: "Currency", value: (row) => row.profile.currency },
          {
            key: "components",
            label: "Components / formulas",
            value: (row) =>
              row.components
                .map(
                  (component) =>
                    `${component.name}: ${component.calculation === "REMAINDER" ? "Remaining gross" : component.value + " " + component.calculation}${component.basis ? ` (${component.basis})` : ""}`,
                )
                .join("; "),
          },
        ]}
      />
    </>
  );
}
