"use client";

import { useState } from "react";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

import type { HrmsEmployee } from "@/services/hrms.service";
import { Avatar, Badge, Button, Card, CardTitle, Icon } from "../components/ui-primitives";
import { formatDate, initialsOf, statusLabels, statusTone } from "./shared";
import { EmployeePersonalProfile } from "./employee-personal-profile";
import { EmployeeTimeline } from "./employee-timeline";
import { EmployeeDocuments } from "./employee-documents";
import { EmployeeLifecycle } from "./employee-lifecycle";

const tabs = ["Overview", "Personal", "Lifecycle", "Timeline", "Attendance", "Leave", "Payroll", "Performance", "Documents"];

/** Job overview, personal profile, timeline and private documents are live; other tabs remain integrations. */
export function EmployeeProfileDrawer({
  employee,
  organizationId,
  onClose,
  onEdit,
}: {
  employee: HrmsEmployee;
  organizationId: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [dirty, setDirty] = useState(false);
  const [documentsDirty, setDocumentsDirty] = useState(false);
  const [documentsOpened, setDocumentsOpened] = useState(false);
  const [documentsBusy, setDocumentsBusy] = useState(false);
  const [lifecycleOpened, setLifecycleOpened] = useState(false);
  const [lifecycleDirty, setLifecycleDirty] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const leave = (action: () => void) => {
    if (documentsBusy || lifecycleBusy) return;
    if (dirty || documentsDirty || lifecycleDirty) setPendingLeave(() => action);
    else action();
  };
  const details: [string, string][] = [
    ["Employee number", employee.employeeNumber],
    ["Designation", employee.designation?.name ?? "—"],
    ["Department", employee.department?.name ?? "—"],
    ["Location", employee.workLocation?.name ?? "—"],
    ["Employment type", employee.employmentType ?? "—"],
    ["Date of joining", formatDate(employee.startDate)],
    ["Biometric ID", employee.biometricId ?? "—"],
    ["Employment end date", formatDate(employee.endDate)],
    ["Retirement date", formatDate(employee.retirementDate ?? null)],
    ["Resignation date", formatDate(employee.resignationDate ?? null)],
  ];
  return (
    <div className="fixed inset-0 z-50 bg-text-primary/30 backdrop-blur-[1px]" onClick={() => leave(onClose)}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Employee profile"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-2xl flex-col bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Employees</span>
            <Icon name="chevron" size={12} />
            <span>Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon="edit" disabled={documentsBusy || lifecycleBusy} onClick={() => leave(onEdit)}>
              Edit job details
            </Button>
            <button
              onClick={() => leave(onClose)}
              className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised"
              aria-label="Close profile"
              disabled={documentsBusy || lifecycleBusy}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto">
          <div className="border-b border-border bg-gradient-to-r from-brand-muted to-surface p-6">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar initials={initialsOf(employee.user.name)} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-text-primary">{employee.user.name}</h2>
                  <Badge tone={statusTone(employee.status)}>{statusLabels[employee.status] ?? employee.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {[employee.designation?.name, employee.department?.name].filter(Boolean).join(" · ") ||
                    "No designation assigned"}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {employee.employeeNumber} · Joined {formatDate(employee.startDate)}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border bg-surface/80 p-3">
                <p className="text-xs text-text-muted">Reporting manager</p>
                <p className="mt-1 text-sm font-semibold">{employee.reportingManager?.user.name ?? "—"}</p>
              </div>
              <div className="rounded-md border border-border bg-surface/80 p-3">
                <p className="text-xs text-text-muted">Work email</p>
                <p className="mt-1 truncate text-sm font-semibold">{employee.user.email}</p>
              </div>
              <div className="rounded-md border border-border bg-surface/80 p-3">
                <p className="text-xs text-text-muted">Employment</p>
                <p className="mt-1 text-sm font-semibold">{employee.employmentType ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="flex overflow-x-auto border-b border-border px-6">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setTab(item);
                  if (item === "Documents") setDocumentsOpened(true);
                  if (item === "Lifecycle") setLifecycleOpened(true);
                }}
                className={`shrink-0 cursor-pointer border-b-2 px-3 py-3 text-xs font-semibold ${tab === item ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === "Overview" ? (
              <Card>
                <CardTitle title="Job information" />
                <dl className="space-y-3 p-5 text-sm">
                  {details.map(([term, value]) => (
                    <div key={term} className="flex justify-between gap-4">
                      <dt className="text-text-muted">{term}</dt>
                      <dd className="text-right font-medium text-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ) : tab === "Timeline" ? (
              <EmployeeTimeline
                key={`${organizationId}:${employee.id}`}
                organizationId={organizationId}
                employeeId={employee.id}
              />
            ) : tab === "Personal" || tab === "Documents" || tab === "Lifecycle" ? null : (
              <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <p className="font-semibold text-text-primary">{tab} records</p>
                <p className="mt-1 text-sm text-text-muted">
                  {tab} details for this employee are available in the {tab} module.
                </p>
              </Card>
            )}
            <div hidden={tab !== "Personal"}>
              <EmployeePersonalProfile
                key={`${organizationId}:${employee.id}`}
                organizationId={organizationId}
                employeeId={employee.id}
                onDirtyChange={setDirty}
              />
            </div>
            {lifecycleOpened && <div hidden={tab !== "Lifecycle"}>
              <EmployeeLifecycle key={`${organizationId}:${employee.id}`} organizationId={organizationId} employeeId={employee.id}
                onDirtyChange={setLifecycleDirty} onBusyChange={setLifecycleBusy} />
            </div>}
            {documentsOpened && (
              <div hidden={tab !== "Documents"}>
                <EmployeeDocuments
                  key={`${organizationId}:${employee.id}`}
                  organizationId={organizationId}
                  employeeId={employee.id}
                  onDirtyChange={setDocumentsDirty}
                  onBusyChange={setDocumentsBusy}
                />
              </div>
            )}
          </div>
        </div>
      </aside>
      <div onClick={(event) => event.stopPropagation()}>
        <ConfirmationDialog
          open={pendingLeave !== null}
          title="Discard unsaved changes?"
          description="Your unsaved profile changes and selected document will be lost."
          confirmLabel="Discard changes"
          cancelLabel="Keep editing"
          confirmColor="error"
          onCancel={() => setPendingLeave(null)}
          onConfirm={() => {
            const action = pendingLeave;
            setPendingLeave(null);
            action?.();
          }}
        />
      </div>
    </div>
  );
}
