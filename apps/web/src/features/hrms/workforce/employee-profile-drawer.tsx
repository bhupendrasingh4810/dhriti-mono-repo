"use client";

import { useState } from "react";

import type { HrmsEmployee } from "@/services/hrms.service";
import { Avatar, Badge, Button, Card, CardTitle, Icon } from "../components/ui-primitives";
import { formatDate, initialsOf, statusLabels, statusTone } from "./shared";

const tabs = ["Overview", "Attendance", "Leave", "Payroll", "Performance", "Documents"];

/** Employee profile built from the directory record; module tabs other than Overview are not yet connected. */
export function EmployeeProfileDrawer({
  employee,
  onClose,
  onEdit,
}: {
  employee: HrmsEmployee;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const details: [string, string][] = [
    ["Employee number", employee.employeeNumber],
    ["Designation", employee.designation?.name ?? "—"],
    ["Department", employee.department?.name ?? "—"],
    ["Location", employee.workLocation?.name ?? "—"],
    ["Employment type", employee.employmentType ?? "—"],
    ["Date of joining", formatDate(employee.startDate)],
    ["Biometric ID", employee.biometricId ?? "—"],
  ];
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-[1px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Employee profile"
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span>Employees</span>
            <Icon name="chevron" size={12} />
            <span>Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon="edit" onClick={onEdit}>
              Edit profile
            </Button>
            <button onClick={onClose} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-slate-100" aria-label="Close profile">
              <Icon name="close" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto">
          <div className="border-b border-border bg-gradient-to-r from-brand-muted to-white p-6">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar initials={initialsOf(employee.user.name)} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-text-primary">{employee.user.name}</h2>
                  <Badge tone={statusTone(employee.status)}>{statusLabels[employee.status] ?? employee.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {[employee.designation?.name, employee.department?.name].filter(Boolean).join(" · ") || "No designation assigned"}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {employee.employeeNumber} · Joined {formatDate(employee.startDate)}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-white bg-white/80 p-3">
                <p className="text-xs text-text-muted">Reporting manager</p>
                <p className="mt-1 text-sm font-semibold">{employee.reportingManager?.user.name ?? "—"}</p>
              </div>
              <div className="rounded-md border border-white bg-white/80 p-3">
                <p className="text-xs text-text-muted">Work email</p>
                <p className="mt-1 truncate text-sm font-semibold">{employee.user.email}</p>
              </div>
              <div className="rounded-md border border-white bg-white/80 p-3">
                <p className="text-xs text-text-muted">Employment</p>
                <p className="mt-1 text-sm font-semibold">{employee.employmentType ?? "—"}</p>
              </div>
            </div>
          </div>
          <div className="flex overflow-x-auto border-b border-border px-6">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
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
            ) : (
              <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <p className="font-semibold text-text-primary">{tab} records</p>
                <p className="mt-1 text-sm text-text-muted">
                  {tab} details for this employee are available in the {tab} module.
                </p>
              </Card>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
