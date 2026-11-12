"use client";

import { useRef, useState, type DragEvent } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  hrmsService,
  type HrmsEmployeeImportOutcome,
  type HrmsEmployeeImportParse,
  type HrmsEmployeeImportRow,
  type HrmsEmployeeImportValidation,
} from "@/services/hrms.service";
import { Badge, Button, Card, CardTitle, Icon } from "../components/ui-primitives";

const steps = ["Upload file", "Map columns", "Validate", "Result"];
const MAX_VISIBLE_ISSUES = 200;

/**
 * Four-step bulk import: upload → map columns → validate → result. Parsing, validation and the final
 * write all happen on the API; the server re-validates on import, so skipped rows are reported, never silently dropped.
 */
export function EmployeeImportFlow({ onToast, onDone }: { onToast: (message: string) => void; onDone: () => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<HrmsEmployeeImportParse | null>(null);
  const [mapping, setMapping] = useState<Record<string, number | null>>({});
  const [validation, setValidation] = useState<HrmsEmployeeImportValidation | null>(null);
  const [outcome, setOutcome] = useState<HrmsEmployeeImportOutcome | null>(null);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep(0);
    setParsed(null);
    setValidation(null);
    setOutcome(null);
    setFileName("");
    setError("");
  };

  const upload = (file: File | undefined) => {
    if (!file || !organizationId) return;
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setError("Only .csv and .xlsx files are supported.");
      return;
    }
    void run(async () => {
      const result = await hrmsService.employees.parseImport(organizationId, file);
      setFileName(file.name);
      setParsed(result);
      setMapping(result.suggestedMapping);
      setStep(1);
    });
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files[0]);
  };

  const buildRows = (): HrmsEmployeeImportRow[] =>
    (parsed?.rows ?? []).map((row) => {
      const mapped: HrmsEmployeeImportRow = { rowNumber: row.rowNumber };
      for (const [key, column] of Object.entries(mapping)) {
        const value = column === null ? "" : (row.values[column] ?? "").trim();
        if (value) mapped[key] = value;
      }
      return mapped;
    });

  const missingRequired = parsed?.fields.filter((field) => field.required && mapping[field.key] == null) ?? [];

  const validate = () =>
    void run(async () => {
      if (!organizationId) return;
      setValidation(await hrmsService.employees.validateImport(organizationId, buildRows()));
      setStep(2);
    });

  const importRows = () =>
    void run(async () => {
      if (!organizationId) return;
      const result = await hrmsService.employees.import(organizationId, buildRows());
      setOutcome(result);
      setStep(3);
      onToast(`${result.created} employee${result.created === 1 ? "" : "s"} imported.`);
    });

  const issues = validation?.results.filter((row) => !row.valid) ?? [];

  return (
    <div className="space-y-5">
      <ol className="flex flex-wrap gap-2" aria-label="Import progress">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${index === step ? "bg-brand text-white" : index < step ? "bg-brand-muted text-brand" : "bg-slate-100 text-text-muted"}`}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="rounded-md border border-error bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {step === 0 && (
        <Card>
          <CardTitle
            title="Upload employee file"
            subtitle="CSV or XLSX, up to 5,000 employees. Each row links an existing organization member by work email."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" icon="download" onClick={() => organizationId && void hrmsService.employees.downloadTemplate(organizationId, "xlsx").catch((reason) => onToast(reason.message))}>
                  Template (.xlsx)
                </Button>
                <Button variant="secondary" icon="download" onClick={() => organizationId && void hrmsService.employees.downloadTemplate(organizationId, "csv").catch((reason) => onToast(reason.message))}>
                  Template (.csv)
                </Button>
              </div>
            }
          />
          <div className="p-6">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => input.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && input.current?.click()}
              className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${dragging ? "border-brand bg-brand-muted" : "border-border hover:border-brand"}`}
            >
              <Icon name="download" size={28} className="rotate-180 text-brand" />
              <p className="mt-3 font-semibold text-text-primary">{busy ? "Reading file…" : "Drop a CSV or XLSX file here, or click to browse"}</p>
              <p className="mt-1 text-xs text-text-muted">Download the template to see the columns the import expects.</p>
              <input
                ref={input}
                type="file"
                hidden
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  upload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {step === 1 && parsed && (
        <Card>
          <CardTitle title="Map columns" subtitle={`${fileName} · ${parsed.rows.length} data rows. Match each employee field to a column.`} />
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {parsed.fields.map((field) => {
              const column = mapping[field.key];
              const invalid = field.required && column == null;
              return (
                <label key={field.key} className="block text-sm font-medium text-text-primary">
                  {field.label}
                  {field.required && <span className="text-error"> *</span>}
                  <select
                    value={column ?? ""}
                    onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value === "" ? null : Number(event.target.value) }))}
                    className={`mt-1.5 w-full cursor-pointer rounded-md border bg-white px-3 py-2 text-sm ${invalid ? "border-error" : "border-border"}`}
                  >
                    <option value="">Do not import</option>
                    {parsed.headers.map((header, index) => (
                      <option key={index} value={index}>
                        {header || `Column ${index + 1}`}
                      </option>
                    ))}
                  </select>
                  {invalid && <p role="alert" className="mt-1 text-xs font-normal text-error">{field.label} must be mapped to a column.</p>}
                </label>
              );
            })}
          </div>
          <div className="flex justify-between border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={reset}>
              Choose another file
            </Button>
            <Button disabled={busy || missingRequired.length > 0} onClick={validate}>
              {busy ? "Validating…" : "Validate data"}
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && validation && (
        <Card>
          <CardTitle
            title="Validation results"
            subtitle="Rows with issues are skipped on import; fix them in the file and re-upload to include them."
          />
          <div className="grid gap-3 p-6 sm:grid-cols-3">
            {[
              ["Total rows", validation.summary.total, "neutral"],
              ["Ready to import", validation.summary.valid, "success"],
              ["With issues", validation.summary.invalid, "danger"],
            ].map(([label, value, tone]) => (
              <div key={String(label)} className="rounded-md border border-border p-4">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="mt-1 flex items-center gap-2 font-display text-2xl font-bold">
                  {value}
                  <Badge tone={tone as "neutral" | "success" | "danger"}>{label}</Badge>
                </p>
              </div>
            ))}
          </div>
          {issues.length > 0 && (
            <div className="max-h-80 overflow-auto border-t border-border">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-6 py-2">Row</th>
                    <th className="px-3 py-2">Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {issues.slice(0, MAX_VISIBLE_ISSUES).map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="px-6 py-2 font-semibold">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-error">{row.errors.join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {issues.length > MAX_VISIBLE_ISSUES && (
                <p className="px-6 py-3 text-xs text-text-muted">Showing the first {MAX_VISIBLE_ISSUES} of {issues.length} rows with issues.</p>
              )}
            </div>
          )}
          <div className="flex justify-between border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back to mapping
            </Button>
            <Button disabled={busy || validation.summary.valid === 0} onClick={importRows}>
              {busy ? "Importing…" : `Import ${validation.summary.valid} employee${validation.summary.valid === 1 ? "" : "s"}`}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && outcome && (
        <Card>
          <CardTitle title="Import complete" subtitle={fileName} />
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <div className="rounded-md border border-border p-4">
              <p className="text-xs text-text-muted">Employees created</p>
              <p className="mt-1 font-display text-2xl font-bold text-text-primary">{outcome.created}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-xs text-text-muted">Rows skipped</p>
              <p className="mt-1 font-display text-2xl font-bold text-text-primary">{outcome.skipped}</p>
            </div>
          </div>
          {outcome.errors.length > 0 && (
            <ul className="max-h-64 divide-y divide-border overflow-auto border-t border-border text-sm">
              {outcome.errors.slice(0, MAX_VISIBLE_ISSUES).map((row) => (
                <li key={row.rowNumber} className="px-6 py-2">
                  <span className="font-semibold">Row {row.rowNumber}:</span> <span className="text-error">{row.errors.join("; ")}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={reset}>
              Import another file
            </Button>
            <Button onClick={onDone}>View directory</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
