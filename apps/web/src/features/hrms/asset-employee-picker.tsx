"use client";

import { useEffect, useState } from "react";
import { DhritiComboboxFlat } from "@dhriti/ui";
import { hrmsService } from "@/services/hrms.service";
import { Button } from "./components/ui-primitives";

/** Remote search is paged, not capped to the first 100 employees. Selected chip labels survive searches. */
export function AssetEmployeePicker({
  organizationId,
  value,
  onChange,
  label,
  error,
  disabled,
  required = false,
  includeInactive = false,
}: {
  organizationId: string;
  value: { id: string; label: string } | null;
  onChange: (value: { id: string; label: string } | null) => void;
  label: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  includeInactive?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const key = `${organizationId}:${query}:${includeInactive}`;
  const [result, setResult] = useState<{
    key: string;
    page: number;
    total: number;
    options: { value: string; label: string }[];
    error?: string;
  } | null>(null);
  const current = result?.key === key ? result : null;
  const loading = current?.page !== page;
  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = window.setTimeout(() => {
      hrmsService.assets
        .employees(organizationId, { page, pageSize: 50, query, includeInactive: String(includeInactive) })
        .then((data) => {
          if (active)
            setResult((old) => ({
              key,
              page,
              total: data.total,
              options: [
                ...(page > 1 && old?.key === key ? old.options : []),
                ...data.items.map((employee) => ({
                  value: employee.id,
                  label: `${employee.user.name} (${employee.employeeNumber})`,
                })),
              ],
            }));
        })
        .catch((reason: unknown) => {
          if (active)
            setResult((old) => ({
              key,
              page,
              total: old?.key === key ? old.total : 0,
              options: old?.key === key ? old.options : [],
              error: reason instanceof Error ? reason.message : "Unable to load employees.",
            }));
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [key, organizationId, query, page, open, retry, includeInactive]);
  const options = [
    ...new Map([
      ...(value ? [[value.id, { value: value.id, label: value.label }] as const] : []),
      ...(current?.options ?? []).map((option) => [option.value, option] as const),
    ]).values(),
  ];
  return (
    <div className="space-y-2">
      <DhritiComboboxFlat
        label={label}
        required={required}
        value={value ? [value.id] : []}
        options={options}
        search={query}
        onSearchChange={(search) => {
          setQuery(search);
          setPage(1);
        }}
        open={open}
        onOpenChange={setOpen}
        onChange={(ids) => {
          const selected = options.find((option) => option.value === ids.at(-1));
          onChange(selected ? { id: selected.value, label: selected.label } : null);
          setOpen(false);
        }}
        clearable
        disabled={disabled}
        error={error}
        placeholder="Search by name or employee number"
        emptyText={loading ? "Loading employees…" : "No employees found."}
      />
      {open && current?.error && (
        <p role="alert" className="text-sm text-error">
          {current.error}{" "}
          <button type="button" className="cursor-pointer underline" onClick={() => setRetry((value) => value + 1)}>
            Retry
          </button>
        </p>
      )}
      {open && current && !current.error && current.options.length < current.total && (
        <Button variant="secondary" disabled={loading || disabled} onClick={() => setPage((value) => value + 1)}>
          {loading ? "Loading…" : "Load more employees"}
        </Button>
      )}
    </div>
  );
}
