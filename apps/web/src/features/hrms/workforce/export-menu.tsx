"use client";

import { useEffect, useRef, useState } from "react";

import type { HrmsEmployeeExportScope, HrmsEmployeeFileFormat } from "@/services/hrms.service";
import { Icon } from "../components/ui-primitives";

const formats: { value: HrmsEmployeeFileFormat; label: string }[] = [
  { value: "xlsx", label: "Microsoft Excel (.xlsx)" },
  { value: "csv", label: "Comma-separated values (.csv)" },
];

/**
 * Two-level export menu: pick the record scope, then the file format.
 * The "selected" scope is disabled until at least one row is selected.
 */
export function ExportMenu({
  selectedCount,
  busy,
  onExport,
}: {
  selectedCount: number;
  busy: boolean;
  onExport: (scope: HrmsEmployeeExportScope, format: HrmsEmployeeFileFormat) => void;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<HrmsEmployeeExportScope | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !root.current?.contains(event.target as Node)) {
        setOpen(false);
        setScope(null);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const scopes: { value: HrmsEmployeeExportScope; label: string; hint: string; disabled?: boolean }[] = [
    { value: "all", label: "Complete workforce roster", hint: "Every employee in the organization" },
    {
      value: "selected",
      label: `Selected employee records (${selectedCount})`,
      hint: "Rows checked in the directory",
      disabled: selectedCount === 0,
    },
    { value: "filtered", label: "Current directory view", hint: "Employees matching the active search and filters" },
  ];

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-3.5 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name="download" size={16} />
        {busy ? "Exporting…" : "Export"}
        <Icon name="chevron" size={14} className="rotate-90" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1 flex">
          {scope && (
            <div role="menu" aria-label="File format" className="mr-1 w-60 rounded-md border border-border bg-white p-1 shadow-lg">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">File format</p>
              {formats.map((format) => (
                <button
                  key={format.value}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    onExport(scope, format.value);
                    setOpen(false);
                    setScope(null);
                  }}
                  className="block w-full cursor-pointer rounded px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-raised"
                >
                  {format.label}
                </button>
              ))}
            </div>
          )}
          <div className="w-72 rounded-md border border-border bg-white p-1 shadow-lg">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">Export scope</p>
            {scopes.map((item) => (
              <button
                key={item.value}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => setScope(item.value)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-left hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40 ${scope === item.value ? "bg-surface-raised" : ""}`}
              >
                <span>
                  <span className="block text-sm font-medium text-text-primary">{item.label}</span>
                  <span className="block text-xs text-text-muted">{item.hint}</span>
                </span>
                <Icon name="chevron" size={14} className="shrink-0 text-text-muted" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
