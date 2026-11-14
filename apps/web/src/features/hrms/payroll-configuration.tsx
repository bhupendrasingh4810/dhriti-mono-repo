"use client";

import { useState } from "react";
import { payrollService } from "@/services/payroll.service";
import { Button } from "./components/ui-primitives";
import { PayrollField, PayrollPeriodPicker, frequencyLabel } from "./payroll-forms";
import { PayrollTable } from "./payroll-tables";
import { date, inputClass, type PayrollSectionProps } from "./payroll-shared";

export function PayrollConfiguration({
  data,
  organizationId,
  can,
  busy,
  action,
  setForm,
}: Pick<PayrollSectionProps, "data" | "organizationId" | "can" | "busy" | "action" | "setForm">) {
  const [calendarProfileId, setCalendarProfileId] = useState("");
  const [calendarPeriod, setCalendarPeriod] = useState("");
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-3xl text-sm text-text-secondary">
          Pay groups isolate country, currency, employment model, and location. Statutory rates and filing integrations
          are not bundled. Create new effective-dated profiles when rules change.
        </p>
        <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("profile")}>
          Add payroll profile
        </Button>
      </div>
      <PayrollTable
        label="Payroll profiles"
        rows={data.profiles}
        rowKey={(row) => row.id}
        columns={[
          { key: "name", label: "Name", value: (row) => row.name },
          { key: "country", label: "Country", value: (row) => row.countryCode },
          { key: "currency", label: "Currency", value: (row) => row.currency },
          { key: "frequency", label: "Frequency", value: (row) => frequencyLabel(row.frequency) },
          {
            key: "anchor",
            label: "Calendar anchor",
            value: (row) => (row.calendarAnchor ? date(row.calendarAnchor) : "Not required"),
          },
          {
            key: "offset",
            label: "Pay-date offset",
            value: (row) => `${row.payDateOffset ?? 0} calendar days`,
          },
          { key: "model", label: "Employment model", value: (row) => row.employmentModel },
          {
            key: "verified",
            label: "Rules",
            value: (row) => (row.rulesVerified ? "Admin verified" : "Not verified"),
          },
          { key: "effective", label: "Effective", value: (row) => date(row.effectiveFrom) },
        ]}
        actions={(profile) =>
          !profile.rulesVerified &&
          can("hrms.payroll.manage") && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm("Confirm that local payroll rules have been independently verified for this profile.")
                )
                  void action(
                    () => payrollService.verifyProfile(organizationId, profile.id),
                    "Payroll rules marked administrator-verified.",
                  );
              }}
            >
              Verify rules
            </Button>
          )
        }
      />
      {data.profiles.length > 0 && (
        <section className="mt-4 space-y-3 rounded-lg border border-border p-4" aria-label="Payroll calendar">
          <h3 className="text-sm font-semibold">Payroll calendar</h3>
          <PayrollField label="Calendar pay group">
            <select
              className={inputClass}
              value={calendarProfileId}
              onChange={(event) => {
                setCalendarProfileId(event.target.value);
                setCalendarPeriod("");
              }}
            >
              <option value="">Select a pay group to view its calendar</option>
              {data.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} · {frequencyLabel(profile.frequency)}
                </option>
              ))}
            </select>
          </PayrollField>
          {data.profiles
            .filter((profile) => profile.id === calendarProfileId)
            .map((profile) => (
              <PayrollPeriodPicker
                key={profile.id}
                organizationId={organizationId}
                profile={profile}
                value={calendarPeriod}
                onClear={() => setCalendarPeriod("")}
                onChange={(period) => setCalendarPeriod(period.key)}
                showTable
              />
            ))}
        </section>
      )}
    </>
  );
}
