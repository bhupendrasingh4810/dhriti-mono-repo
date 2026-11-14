"use client";

import { useCallback, useEffect, useState } from "react";

import { DirectoryTableSkeleton } from "./skeletons";
import { useAuth } from "@/hooks/use-auth";
import {
  hrmsService,
  type HrmsEmployee,
  type HrmsEmployeeExportScope,
  type HrmsEmployeeFileFormat,
  type HrmsEmployeeOptions,
  type HrmsEmployeePage,
  type HrmsEmployeeSortField,
} from "@/services/hrms.service";
import { Avatar, Badge, Button, Card, Icon } from "../components/ui-primitives";
import { EmployeeForm } from "./employee-form";
import { EmployeeProfileDrawer } from "./employee-profile-drawer";
import { ExportMenu } from "./export-menu";
import { initialsOf, statusLabels, statusTone } from "./shared";

const columns: { label: string; sortBy?: HrmsEmployeeSortField }[] = [
  { label: "Employee", sortBy: "name" },
  { label: "Department", sortBy: "department" },
  { label: "Location", sortBy: "location" },
  { label: "Employment", sortBy: "employmentType" },
  { label: "Status", sortBy: "status" },
];

/** Directory tab: server-side search, sorting and pagination over the real employee API. */
export function EmployeeDirectory({
  onToast,
  openProfileId,
  onProfileHandled,
}: {
  onToast: (message: string) => void;
  openProfileId?: string | null;
  onProfileHandled?: () => void;
}) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [data, setData] = useState<HrmsEmployeePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<HrmsEmployeeSortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<HrmsEmployeeOptions | null>(null);
  const [form, setForm] = useState<{ employee: HrmsEmployee | null } | null>(null);
  const [profile, setProfile] = useState<HrmsEmployee | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      setData(
        await hrmsService.employees.list(organizationId, {
          page,
          pageSize,
          query: query || undefined,
          status: status || undefined,
          departmentId: departmentId || undefined,
          sortBy,
          sortOrder,
        }),
      );
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : "Unable to load employees.");
    } finally {
      setLoading(false);
    }
  }, [departmentId, onToast, organizationId, page, pageSize, query, sortBy, sortOrder, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const loadOptions = useCallback(async () => {
    if (!organizationId) return null;
    const next = await hrmsService.employees.options(organizationId);
    setOptions(next);
    return next;
  }, [organizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOptions().catch(() => undefined), 0);
    return () => window.clearTimeout(timer);
  }, [loadOptions]);

  useEffect(() => {
    if (!openProfileId || !organizationId) return;
    hrmsService.employees
      .get(organizationId, openProfileId)
      .then(setProfile)
      .catch((reason) => onToast(reason instanceof Error ? reason.message : "Unable to load the employee."))
      .finally(() => onProfileHandled?.());
  }, [onProfileHandled, onToast, openProfileId, organizationId]);

  const items = data?.items ?? [];
  const toggleSort = (field: HrmsEmployeeSortField) => {
    if (sortBy === field) setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };
  const toggleRow = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const allOnPageSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const togglePage = () =>
    setSelected((current) => {
      const next = new Set(current);
      for (const item of items) {
        if (allOnPageSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });

  const openForm = async (employee: HrmsEmployee | null) => {
    try {
      // Refresh so members that just became employees (or were just invited) are reflected.
      await loadOptions();
      setForm({ employee });
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : "Unable to load form options.");
    }
  };

  const save = async (input: Record<string, unknown>) => {
    if (!organizationId) throw new Error("An organization must be selected.");
    if (form?.employee) await hrmsService.employees.update(organizationId, form.employee.id, input);
    else await hrmsService.employees.create(organizationId, input);
    onToast(form?.employee ? "Employee updated." : "Employee added.");
    setForm(null);
    setProfile(null);
    await load();
  };

  const remove = async (employee: HrmsEmployee) => {
    if (!organizationId || !window.confirm(`Delete ${employee.user.name}? Their direct reports will have no manager.`)) return;
    try {
      await hrmsService.employees.delete(organizationId, employee.id);
      setSelected((current) => {
        const next = new Set(current);
        next.delete(employee.id);
        return next;
      });
      onToast("Employee deleted.");
      if (items.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : "Unable to delete the employee.");
    }
  };

  const exportRecords = async (scope: HrmsEmployeeExportScope, format: HrmsEmployeeFileFormat) => {
    if (!organizationId) return;
    setExporting(true);
    try {
      await hrmsService.employees.export(organizationId, {
        scope,
        format,
        ids: scope === "selected" ? [...selected] : undefined,
        query: query || undefined,
        status: status || undefined,
        departmentId: departmentId || undefined,
        sortBy,
        sortOrder,
      });
      onToast("Export downloaded.");
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : "Unable to export employees.");
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary;
  const kpis: [string, number | string, string][] = [
    ["Total employees", summary?.total ?? 0, "Current organization"],
    [
      "Active",
      summary?.active ?? 0,
      summary?.total ? `${Math.round((summary.active / summary.total) * 100)}% of workforce` : "No employees",
    ],
    ["On leave", summary?.onLeave ?? 0, "Current status"],
    ["New joiners", summary?.newJoiners ?? 0, "Last 30 days"],
  ];
  const range = data?.total ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} of ${data.total}` : "0-0 of 0";
  const selectClass = "cursor-pointer rounded-md border border-border bg-white px-3 py-2 text-sm text-text-secondary";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid shrink-0 gap-4 md:grid-cols-4">
        {kpis.map(([label, value, meta], index) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">{label}</p>
              <Icon name={index === 2 ? "calendar" : "users"} className="text-brand" />
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-text-primary">{value}</p>
            <p className="mt-1 text-xs text-text-muted">{meta}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <label className="relative min-w-64 flex-1">
            <Icon name="search" size={16} className="absolute left-3 top-2.5 text-text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search employees"
              placeholder="Search by name, email, number, department…"
              className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </label>
          <select
            aria-label="Filter by department"
            value={departmentId}
            onChange={(event) => {
              setDepartmentId(event.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All departments</option>
            {options?.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <ExportMenu selectedCount={selected.size} busy={exporting} onExport={exportRecords} />
          <Button icon="plus" onClick={() => void openForm(null)}>
            Add employee
          </Button>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-brand-muted px-5 py-2.5 text-sm text-brand">
            <span className="font-semibold">{selected.size} selected</span>
            <button type="button" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="ml-auto cursor-pointer">
              <Icon name="close" size={16} />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="w-12 px-5 py-3">
                  <input type="checkbox" aria-label="Select all employees on this page" className="cursor-pointer" checked={allOnPageSelected} onChange={togglePage} />
                </th>
                {columns.map((column) => (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={sortBy === column.sortBy ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                    className="px-3 py-3"
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.label}
                      {column.sortBy && (
                        <button
                          type="button"
                          aria-label={`Sort by ${column.label}`}
                          onClick={() => toggleSort(column.sortBy!)}
                          className={`cursor-pointer rounded p-0.5 hover:bg-slate-200 ${sortBy === column.sortBy ? "text-brand" : "text-text-muted"}`}
                        >
                          <Icon name="sort" size={13} className={sortBy === column.sortBy && sortOrder === "desc" ? "rotate-180" : ""} />
                        </button>
                      )}
                    </span>
                  </th>
                ))}
                <th className="w-24 px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((employee, index) => (
                <tr key={employee.id} className={`transition hover:bg-brand-muted/30 ${selected.has(employee.id) ? "bg-brand-muted/50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <input type="checkbox" className="cursor-pointer" checked={selected.has(employee.id)} onChange={() => toggleRow(employee.id)} aria-label={`Select ${employee.user.name}`} />
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar initials={initialsOf(employee.user.name)} index={index} />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setProfile(employee)}
                          className="cursor-pointer text-left text-sm font-semibold text-text-primary hover:text-brand hover:underline"
                        >
                          {employee.user.name}
                        </button>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {[employee.designation?.name, employee.employeeNumber].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-text-secondary">{employee.department?.name ?? "—"}</td>
                  <td className="px-3 py-3.5 text-sm text-text-secondary">{employee.workLocation?.name ?? "—"}</td>
                  <td className="px-3 py-3.5">{employee.employmentType ? <Badge>{employee.employmentType}</Badge> : "—"}</td>
                  <td className="px-3 py-3.5">
                    <Badge tone={statusTone(employee.status)}>{statusLabels[employee.status] ?? employee.status}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button type="button" aria-label={`Edit ${employee.user.name}`} onClick={() => void openForm(employee)} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-slate-100 hover:text-brand">
                        <Icon name="edit" size={16} />
                      </button>
                      <button type="button" aria-label={`Delete ${employee.user.name}`} onClick={() => void remove(employee)} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-slate-100 hover:text-error">
                        <Icon name="delete" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && items.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-semibold text-text-primary">No employees found</p>
              <p className="mt-1 text-sm text-text-muted">Try a different search or filter, or add an employee.</p>
            </div>
          )}
          {loading && items.length === 0 && (
            <DirectoryTableSkeleton />
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-border p-4 text-sm text-text-secondary">
          <label className="flex items-center gap-2">
            Rows per page:
            <select
              value={pageSize}
              onChange={(event) => {
                setPage(1);
                setPageSize(Number(event.target.value));
              }}
              className="cursor-pointer border-0 bg-transparent font-semibold text-text-primary outline-none"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>{range}</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40">
              <Icon name="chevron" size={18} className="rotate-180" />
            </button>
            <button type="button" aria-label="Next page" disabled={!data || page >= data.totalPages} onClick={() => setPage((current) => current + 1)} className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40">
              <Icon name="chevron" size={18} />
            </button>
          </div>
        </div>
      </Card>
      {form && options && <EmployeeForm employee={form.employee} options={options} onClose={() => setForm(null)} onSubmit={save} />}
      {profile && !form && (
        <EmployeeProfileDrawer
          employee={profile}
          onClose={() => setProfile(null)}
          onEdit={() => void openForm(profile)}
        />
      )}
    </div>
  );
}

