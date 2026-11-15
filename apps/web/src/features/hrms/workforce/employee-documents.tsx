"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { hrmsEmployeeDocumentSchema } from "@dhriti/validation";
import type { HrmsEmployeeDocumentPage } from "@dhriti/types";
import { hrmsService } from "@/services/hrms.service";
import { Button, Card, Icon } from "../components/ui-primitives";
import { formatDate } from "./shared";

const categories = [
  { value: "PERSONAL", label: "Personal" },
  { value: "EMPLOYMENT", label: "Employment" },
  { value: "EDUCATION", label: "Education" },
  { value: "COMPLIANCE", label: "Compliance" },
  { value: "OTHER", label: "Other" },
];
const maxBytes = 10 * 1024 * 1024;

/** HR-managed private files; archive retains storage and does not claim document verification or signing. */
export function EmployeeDocuments({
  organizationId,
  employeeId,
  onDirtyChange,
  onBusyChange,
}: {
  organizationId: string;
  employeeId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [result, setResult] = useState<{ key: string; data: HrmsEmployeeDocumentPage | null; error: string } | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [reload, setReload] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("PERSONAL");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<{ employeeId: string; id: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestKey = JSON.stringify([organizationId, employeeId, page, pageSize, reload]);
  const data = result?.key === requestKey ? result.data : null;
  const loadError = result?.key === requestKey ? result.error : "";
  useEffect(() => {
    onDirtyChange?.(busy || !!title || !!file || category !== "PERSONAL");
  }, [title, file, category, busy, onDirtyChange]);
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    let active = true;
    const request = employeeId
      ? hrmsService.employees.documents.list(organizationId, employeeId, page, pageSize)
      : hrmsService.employees.documents.library(organizationId, page, pageSize);
    void request
      .then((data) => {
        if (active) setResult({ key: requestKey, data, error: "" });
      })
      .catch((reason: unknown) => {
        if (active)
          setResult({
            key: requestKey,
            data: null,
            error: reason instanceof Error ? reason.message : "Unable to load employee documents.",
          });
      });
    return () => {
      active = false;
    };
  }, [organizationId, employeeId, page, pageSize, requestKey]);

  async function upload() {
    if (busy || !employeeId) return;
    const parsed = hrmsEmployeeDocumentSchema.safeParse({ title, category });
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) nextErrors[issue.path.join(".")] = issue.message;
    }
    if (!file || file.size === 0) nextErrors.file = "A non-empty document file is required.";
    else if (file.size > maxBytes) nextErrors.file = "Employee documents must not exceed 10 MB.";
    else if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type))
      nextErrors.file = "Choose a PDF, PNG or JPEG file.";
    setErrors(nextErrors);
    if (!parsed.success || !file || Object.keys(nextErrors).length) return;
    setBusy(true);
    setActionError("");
    setStatus("");
    try {
      await hrmsService.employees.documents.upload(organizationId, employeeId, parsed.data, file);
      setTitle("");
      setCategory("PERSONAL");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setPage(1);
      setReload((value) => value + 1);
      setStatus("Employee document uploaded.");
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : "Unable to upload employee document.");
    } finally {
      setBusy(false);
    }
  }

  async function documentAction(ownerEmployeeId: string, id: string, action: "download" | "archive") {
    if (busy) return;
    setBusy(true);
    setActionError("");
    setStatus("");
    try {
      if (action === "download") {
        const result = await hrmsService.employees.documents.download(organizationId, ownerEmployeeId, id);
        // Attachment downloads do not need an asynchronously opened popup, which browsers may block.
        const link = document.createElement("a");
        link.href = result.url;
        link.download = "";
        link.click();
      } else {
        await hrmsService.employees.documents.archive(organizationId, ownerEmployeeId, id);
        setPage(1);
        setReload((value) => value + 1);
        setStatus("Employee document archived.");
      }
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : `Unable to ${action} employee document.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Employee documents" className="space-y-4">
      <h3 className="text-base font-semibold text-text-primary">Employee documents</h3>
      <p className="text-sm text-text-secondary">
        Upload PDF, PNG or JPEG documents up to 10 MB.
      </p>
      {actionError && (
        <p role="alert" className="text-sm text-error">
          {actionError}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-text-secondary">
          {status}
        </p>
      )}
      {employeeId && (
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void upload();
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <DhritiTextField
              id="employee-document-title"
              label="Document title"
              required
              value={title}
              onChange={(value) => {
                setTitle(value);
                setErrors((current) => ({ ...current, title: "" }));
              }}
              error={errors.title}
            />
            <DhritiSelectMenu
              label="Document category"
              value={category}
              options={categories}
              open={categoryOpen}
              onOpenChange={setCategoryOpen}
              onChange={(value) => {
                if (value) setCategory(value);
              }}
              error={errors.category}
            />
            <div>
              <label htmlFor="employee-document-file" className="mb-2 block text-sm font-semibold text-text-primary">
                Document file *
              </label>
              <input
                id="employee-document-file"
                ref={fileInput}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                required
                aria-invalid={!!errors.file}
                aria-describedby={errors.file ? "employee-document-file-error" : undefined}
                className={`block w-full cursor-pointer rounded-md border bg-surface p-2 text-sm text-text-secondary ${errors.file ? "border-error" : "border-border"}`}
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setErrors((current) => ({ ...current, file: "" }));
                }}
              />
              {errors.file && (
                <p id="employee-document-file-error" className="mt-1 text-sm text-error">
                  {errors.file}
                </p>
              )}
            </div>
            <Button disabled={busy} onClick={() => void upload()}>
              {busy ? "Working..." : "Upload document"}
            </Button>
          </fieldset>
        </form>
      )}
      {loadError ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-error">
            {loadError}
          </p>
          <Button variant="secondary" disabled={busy} onClick={() => setReload((value) => value + 1)}>
            Retry documents
          </Button>
        </div>
      ) : !data ? (
        <p role="status" className="text-sm text-text-secondary">
          Loading employee documents...
        </p>
      ) : (
        <>
          {data.items.length === 0 ? (
            <p className="text-sm text-text-secondary">No active employee documents on this page.</p>
          ) : (
            <ul className="space-y-3">
              {data.items.map((document) => (
                <li key={document.id}>
                  <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="break-words text-sm font-semibold text-text-primary">{document.title}</h4>
                      <p className="break-words text-sm text-text-secondary">{document.originalName}</p>
                      {!employeeId && (
                        <p className="text-sm text-text-secondary">
                          {document.employee.name} ({document.employee.employeeNumber})
                        </p>
                      )}
                      <p className="text-xs text-text-secondary">
                        {categories.find((category) => category.value === document.category)?.label} ·{" "}
                        {document.sizeBytes.toLocaleString()} bytes · {formatDate(document.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label={`Download ${document.title}`}
                        disabled={busy}
                        className="cursor-pointer rounded-md p-2 text-brand disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => void documentAction(document.employee.id, document.id, "download")}
                      >
                        <Icon name="download" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Archive ${document.title}`}
                        disabled={busy}
                        className="cursor-pointer rounded-md p-2 text-error disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setArchiveTarget({ employeeId: document.employee.id, id: document.id })}
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-text-secondary">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                aria-label="Document rows per page"
                disabled={busy}
                value={pageSize}
                className="cursor-pointer rounded-md border border-border bg-surface p-2"
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {data.items.length ? (page - 1) * pageSize + 1 : 0}–
              {data.items.length ? (page - 1) * pageSize + data.items.length : 0} of {data.total}
            </span>
            <button
              type="button"
              aria-label="Previous document page"
              disabled={busy || page === 1}
              className="cursor-pointer rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((value) => value - 1)}
            >
              <Icon name="chevron" className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next document page"
              disabled={busy || page * pageSize >= data.total}
              className="cursor-pointer rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((value) => value + 1)}
            >
              <Icon name="chevron" />
            </button>
          </div>
        </>
      )}
      <ConfirmationDialog
        open={archiveTarget !== null}
        title="Archive document?"
        description="This document will be removed from the active list but retained in private storage. Previously issued download links remain valid until they expire."
        confirmLabel="Archive document"
        confirmColor="error"
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => {
          const target = archiveTarget;
          setArchiveTarget(null);
          if (target) void documentAction(target.employeeId, target.id, "archive");
        }}
      />
    </section>
  );
}
