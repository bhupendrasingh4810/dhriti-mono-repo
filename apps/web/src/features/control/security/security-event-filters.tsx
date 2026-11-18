"use client";

import { useState } from "react";
import { DhritiButton, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import type { SecurityEventFilters } from "@/services/control.service";

export function SecurityEventFilterForm({ onApply }: { onApply: (filters: SecurityEventFilters) => void }) {
  const [values, setValues] = useState({ severity: "", status: "", ipAddress: "", from: "", to: "" });
  const [open, setOpen] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"from" | "to", string>>>({});
  return (
    <form
      noValidate
      className="grid gap-3 border-b border-border p-4 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: typeof errors = {};
        for (const key of ["from", "to"] as const) {
          if (
            values[key] &&
            (!/^\d{4}-\d{2}-\d{2}$/.test(values[key]) ||
              !Number.isFinite(Date.parse(values[key])) ||
              new Date(values[key]).toISOString().slice(0, 10) !== values[key])
          )
            nextErrors[key] = "Enter a valid date as YYYY-MM-DD.";
        }
        if (!Object.keys(nextErrors).length && values.from && values.to && values.from > values.to)
          nextErrors.to = "End date must be on or after start date.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        // Calendar dates use explicit inclusive UTC day boundaries, independent of the operator's browser timezone.
        onApply({
          severity:
            values.severity === "critical" ||
            values.severity === "high" ||
            values.severity === "medium" ||
            values.severity === "low"
              ? values.severity
              : undefined,
          status: values.status === "open" || values.status === "resolved" ? values.status : undefined,
          ipAddress: values.ipAddress.trim() || undefined,
          from: values.from ? `${values.from}T00:00:00.000Z` : undefined,
          to: values.to ? `${values.to}T23:59:59.999Z` : undefined,
        });
      }}
    >
      <DhritiSelectMenu
        label="Filter severity"
        value={values.severity}
        open={open === "severity"}
        onOpenChange={(value) => setOpen(value ? "severity" : "")}
        onChange={(value) => setValues((current) => ({ ...current, severity: value ?? "" }))}
        options={["", "critical", "high", "medium", "low"].map((value) => ({
          value,
          label: value || "All severities",
        }))}
      />
      <DhritiSelectMenu
        label="Filter status"
        value={values.status}
        open={open === "status"}
        onOpenChange={(value) => setOpen(value ? "status" : "")}
        onChange={(value) => setValues((current) => ({ ...current, status: value ?? "" }))}
        options={[
          { value: "", label: "All statuses" },
          { value: "open", label: "Open" },
          { value: "resolved", label: "Resolved" },
        ]}
      />
      <DhritiTextField
        label="Filter IP address"
        value={values.ipAddress}
        onChange={(ipAddress) => setValues((current) => ({ ...current, ipAddress }))}
      />
      <DhritiTextField
        label="From date (UTC)"
        placeholder="YYYY-MM-DD"
        error={errors.from}
        value={values.from}
        onChange={(from) => setValues((current) => ({ ...current, from }))}
      />
      <DhritiTextField
        label="To date (UTC)"
        placeholder="YYYY-MM-DD"
        error={errors.to}
        value={values.to}
        onChange={(to) => setValues((current) => ({ ...current, to }))}
      />
      <div className="flex items-end gap-2">
        <DhritiButton type="submit">Apply filters</DhritiButton>
        <DhritiButton
          variant="secondary"
          onClick={() => {
            setValues({ severity: "", status: "", ipAddress: "", from: "", to: "" });
            setErrors({});
            onApply({});
          }}
        >
          Clear filters
        </DhritiButton>
      </div>
    </form>
  );
}
