"use client";

import { useState } from "react";
import { DhritiCheckboxField, DhritiDateField, DhritiNumberField, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import type { HrmsProfileFieldDefinition } from "@dhriti/types";

type Values = Record<string, string | number | boolean | null>;
/** Numeric drafts stay strings until save so decimal edits are not prematurely normalized. */
export function OrganizationProfileFields({
  definitions,
  values,
  onChange,
  readOnly,
  disabled,
  errors,
}: {
  definitions: readonly HrmsProfileFieldDefinition[];
  values: Values;
  onChange: (values: Values) => void;
  readOnly: boolean;
  disabled: boolean;
  errors: Record<string, string>;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [months, setMonths] = useState<Record<string, string>>({});
  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold text-text-primary">Organization fields</legend>
      {!definitions.some((field) => !field.archived) && (
        <p className="text-sm text-text-muted">No organization fields configured.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {definitions
          .filter((field) => !field.archived)
          .map((field) => {
            const value = values[field.id];
            const set = (value: Values[string]) => onChange({ ...values, [field.id]: value });
            const props = { label: field.label, required: field.required, readOnly, disabled, error: errors[field.id] };
            if (field.type === "checkbox")
              return (
                <DhritiCheckboxField
                  key={field.id}
                  {...props}
                  checked={value === true}
                  onChange={set}
                  helperText={field.required ? "This required checkbox must be checked." : undefined}
                />
              );
            if (field.type === "number")
              return (
                <DhritiNumberField
                  key={field.id}
                  {...props}
                  value={typeof value === "number" || typeof value === "string" ? String(value) : ""}
                  step={0.01}
                  onChange={set}
                />
              );
            if (field.type === "select")
              return (
                <DhritiSelectMenu
                  key={field.id}
                  {...props}
                  value={typeof value === "string" ? value : null}
                  onChange={set}
                  options={field.options.map((option) => ({ value: option, label: option }))}
                  open={open === field.id}
                  onOpenChange={(shown) => setOpen(shown ? field.id : null)}
                  clearable
                  placeholder="Select an option"
                />
              );
            if (field.type === "date")
              return (
                <DhritiDateField
                  key={field.id}
                  {...props}
                  value={typeof value === "string" ? value : ""}
                  onChange={set}
                  month={
                    months[field.id] ??
                    (typeof value === "string" && value ? value.slice(0, 7) : new Date().toISOString().slice(0, 7))
                  }
                  onMonthChange={(month) => setMonths((current) => ({ ...current, [field.id]: month }))}
                  open={open === field.id}
                  onOpenChange={(shown) => setOpen(shown ? field.id : null)}
                  clearable
                />
              );
            return (
              <DhritiTextField
                key={field.id}
                {...props}
                value={typeof value === "string" ? value : ""}
                onChange={set}
                maxLength={1000}
              />
            );
          })}
      </div>
    </fieldset>
  );
}
