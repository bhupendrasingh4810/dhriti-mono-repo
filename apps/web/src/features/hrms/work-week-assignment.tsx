"use client";

import { useEffect, useState } from "react";
import { DhritiComboboxFlat, DhritiDateField, DhritiSelectMenu } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import type { WorkWeekAssignment, WorkWeekRule } from "@dhriti/types";
import { hrmsService } from "@/services/hrms.service";
import { Button } from "./components/ui-primitives";

type EmployeeOption = { value: string; label: string };
type EmployeeResults = { key: string; options: EmployeeOption[]; total: number; page: number; error?: string };

const errorMessage = (reason: unknown) =>
  reason instanceof Error ? reason.message : "Unable to load employee assignments.";

export function WorkWeekAssignmentDialog({
  organizationId,
  rules,
  selectedRuleId,
  onClose,
  onDone,
}: {
  organizationId: string;
  rules: WorkWeekRule[];
  selectedRuleId: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [employeeResult, setEmployeeResult] = useState<EmployeeResults | null>(null);
  const employeeKey = `${organizationId}:${query}`;
  const employees = employeeResult?.key === employeeKey ? employeeResult : null;
  const employeeError = employees?.error;
  const loading = employees?.page !== page;
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [allEmployees, setAllEmployees] = useState(false);
  const [ruleId, setRuleId] = useState(selectedRuleId ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [month, setMonth] = useState(date.slice(0, 7));
  const [open, setOpen] = useState<"rule" | "date" | "employees" | "history" | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [historyResult, setHistoryResult] = useState<{
    employeeId: string;
    assignments?: WorkWeekAssignment[];
    error?: string;
  } | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState("");
  const history = historyResult?.employeeId === viewingEmployee ? historyResult?.assignments : null;
  const historyError = historyResult?.employeeId === viewingEmployee ? historyResult?.error : null;
  useEffect(() => {
    let active = true;
    if (allEmployees) return;
    const timer = window.setTimeout(() => {
      hrmsService.employees
        .list(organizationId, { page, pageSize: 50, query })
        .then((result) => {
          if (active)
            setEmployeeResult((previous) => ({
              key: employeeKey,
              options: [
                ...(page > 1 && previous?.key === employeeKey ? previous.options : []),
                ...result.items.map((employee) => ({
                  value: employee.id,
                  label: `${employee.user.name} (${employee.employeeNumber})`,
                })),
              ],
              total: result.total,
              page,
            }));
        })
        .catch((reason) => {
          if (active)
            setEmployeeResult((previous) => ({
              key: employeeKey,
              options: previous?.key === employeeKey ? previous.options : [],
              total: previous?.key === employeeKey ? previous.total : 0,
              page,
              error: errorMessage(reason),
            }));
        });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [organizationId, page, query, employeeKey, retry, allEmployees]);
  useEffect(() => {
    if (!viewingEmployee) return;
    let active = true;
    hrmsService.workWeeks
      .assignments(organizationId, viewingEmployee)
      .then((assignments) => {
        if (active) setHistoryResult({ employeeId: viewingEmployee, assignments });
      })
      .catch((reason) => {
        if (active) setHistoryResult({ employeeId: viewingEmployee, error: errorMessage(reason) });
      });
    return () => {
      active = false;
    };
  }, [organizationId, viewingEmployee]);

  const selectedIds = Object.keys(selected);
  // Retain selected labels across remote searches so chips never degrade to employee IDs.
  const options = [
    ...new Map([
      ...Object.entries(selected).map(([value, label]) => [value, { value, label }] as const),
      ...(employees?.options ?? []).map((option) => [option.value, option] as const),
    ]).values(),
  ];
  const invalidDate = !date || date < new Date().toISOString().slice(0, 10);
  const save = async () => {
    setAttempted(true);
    if ((!allEmployees && !selectedIds.length) || invalidDate) return;
    setSaving(true);
    setError("");
    try {
      await hrmsService.workWeeks.assign(organizationId, {
        ruleId: ruleId || null,
        effectiveFrom: date,
        ...(allEmployees ? { allEmployees: true } : { employeeIds: selectedIds }),
      });
      onDone();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog
      open
      title="Assign work week"
      onClose={() => {
        if (!saving) onClose();
      }}
      maxWidth="md"
      primaryActionLabel="Save assignments"
      onPrimaryAction={save}
      isSubmitting={saving}
    >
      <fieldset disabled={saving} className="max-h-[70vh] space-y-4 overflow-y-auto">
        <p className="text-sm text-text-secondary">
          Choose employees or assign everyone. Earlier assignments are preserved. Following the default replaces the
          explicit rule from the chosen date until a later scheduled assignment.
        </p>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <DhritiSelectMenu
          label="Work-week rule"
          value={ruleId || "DEFAULT"}
          options={[
            { value: "DEFAULT", label: "Follow organization default" },
            ...rules.map((rule) => ({ value: rule.id, label: rule.name })),
          ]}
          open={open === "rule"}
          onOpenChange={(shown) => setOpen(shown ? "rule" : null)}
          onChange={(value) => setRuleId(value === "DEFAULT" ? "" : (value ?? ""))}
        />
        <DhritiDateField
          label="Applies from (UTC)"
          required
          value={date}
          onChange={(value) => setDate(value ?? "")}
          month={month}
          onMonthChange={setMonth}
          open={open === "date"}
          onOpenChange={(shown) => setOpen(shown ? "date" : null)}
          error={attempted && invalidDate ? "Choose today or a future date." : undefined}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-text-secondary">
            {allEmployees ? "All employees selected" : `${selectedIds.length} selected`}
          </span>
          <Button
            variant="secondary"
            disabled={saving}
            onClick={() => {
              setAllEmployees((value) => !value);
              setOpen(null);
            }}
          >
            {allEmployees ? "Choose specific employees" : "Assign all employees"}
          </Button>
        </div>
        {allEmployees ? (
          <p role="status" className="rounded-md border border-brand bg-brand-muted p-3 text-sm text-brand">
            Assigns every non-archived employee in this organization at save time, regardless of search. Future
            employees are not automatically assigned.
          </p>
        ) : (
          <>
            <DhritiComboboxFlat
              label="Employees"
              required
              placeholder="Search employees"
              value={selectedIds}
              options={options}
              search={query}
              onSearchChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              open={open === "employees"}
              onOpenChange={(shown) => setOpen(shown ? "employees" : null)}
              onChange={(ids) => {
                setSelected(
                  Object.fromEntries(
                    options
                      .filter((option) => ids.includes(option.value))
                      .map((option) => [option.value, option.label]),
                  ),
                );
                if (!ids.includes(viewingEmployee)) setViewingEmployee("");
              }}
              disabled={saving}
              clearable
              emptyText={
                loading ? "Loading employees…" : employeeError ? "Unable to load employees." : "No employees found."
              }
              error={attempted && !selectedIds.length ? "Select at least one employee." : undefined}
            />
            {employeeError && (
              <p role="alert" className="text-sm text-error">
                {employeeError}{" "}
                <button
                  type="button"
                  className="cursor-pointer underline"
                  onClick={() => setRetry((value) => value + 1)}
                >
                  Retry
                </button>
              </p>
            )}
            {open === "employees" && !employeeError && !!employees && employees.options.length < employees.total && (
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => {
                  setPage((value) => value + 1);
                  setOpen("employees");
                }}
              >
                {loading ? "Loading employees…" : "Load more employees"}
              </Button>
            )}
            {selectedIds.length > 0 && (
              <DhritiSelectMenu
                label="Assignment history for"
                placeholder="Select an employee"
                value={viewingEmployee || null}
                options={Object.entries(selected).map(([value, label]) => ({ value, label }))}
                open={open === "history"}
                onOpenChange={(shown) => setOpen(shown ? "history" : null)}
                onChange={(value) => setViewingEmployee(value ?? "")}
              />
            )}
          </>
        )}
        {!allEmployees && viewingEmployee && historyError && (
          <p role="alert" className="text-sm text-error">
            {historyError}
          </p>
        )}
        {!allEmployees && viewingEmployee && !history && !historyError && (
          <p role="status" className="text-sm text-text-muted">
            Loading assignment history…
          </p>
        )}
        {!allEmployees && viewingEmployee && history && (
          <section className="rounded-md border border-border p-3">
            <h3 className="text-sm font-semibold text-text-primary">Assignment history</h3>
            <ul className="mt-2 space-y-1 text-xs text-text-secondary">
              {history.length ? (
                history.map((entry) => (
                  <li key={entry.id}>
                    {entry.effectiveFrom.slice(0, 10)} ·{" "}
                    {entry.ruleId
                      ? rules.find((rule) => rule.id === entry.ruleId)?.name
                      : "Follow organization default"}
                  </li>
                ))
              ) : (
                <li>Follows organization default.</li>
              )}
            </ul>
          </section>
        )}
      </fieldset>
    </Dialog>
  );
}
