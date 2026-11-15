"use client";

import { useEffect, useState } from "react";
import type { HrmsEmployeeTimelinePage } from "@dhriti/types";
import { hrmsService } from "@/services/hrms.service";
import { Button, Card, Icon } from "../components/ui-primitives";

const titles: Record<string, string> = {
  "hrms.employee.created": "Employee record created",
  "hrms.employee.imported": "Employee record imported",
  "hrms.employee.updated": "Employee details updated",
  "hrms.employee.lifecycle.configure": "Lifecycle tracking configured",
  "hrms.employee.lifecycle.confirm_probation": "Probation confirmed",
  "hrms.employee.lifecycle.extend_probation": "Probation extended",
  "hrms.employee.lifecycle.renew_contract": "Contract renewed",
  "hrms.employee.lifecycle.approve_last_working_date": "Last working date approved",
};

/** This is recorded edit history, not a claim of scheduled changes or a reconstructed complete career. */
export function EmployeeTimeline({ organizationId, employeeId }: { organizationId: string; employeeId: string }) {
  const [result, setResult] = useState<{ key: string; data: HrmsEmployeeTimelinePage | null; error: string } | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [retry, setRetry] = useState(0);
  const requestKey = JSON.stringify([organizationId, employeeId, page, pageSize, retry]);
  const data = result?.key === requestKey ? result.data : null;
  const error = result?.key === requestKey ? result.error : "";
  useEffect(() => {
    let active = true;
    void hrmsService.employees
      .timeline(organizationId, employeeId, page, pageSize)
      .then((data) => {
        if (active) setResult({ key: requestKey, data, error: "" });
      })
      .catch((reason: unknown) => {
        if (active)
          setResult({
            key: requestKey,
            data: null,
            error: reason instanceof Error ? reason.message : "Unable to load employee timeline.",
          });
      });
    return () => {
      active = false;
    };
  }, [organizationId, employeeId, page, pageSize, requestKey]);

  return (
    <section aria-label="Employee career timeline" className="space-y-4">
      <h3 className="text-base font-semibold text-text-primary">Career timeline</h3>
      <p className="text-sm text-text-secondary">
        Recorded job edits, HR lifecycle decisions and employee creation/import events. Earlier changes may not have detailed history. Dates
        below are recording times; employment dates appear in the changes.
      </p>
      {error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
          <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
            Retry timeline
          </Button>
        </div>
      ) : !data ? (
        <p role="status" className="text-sm text-text-secondary">
          Loading employee timeline...
        </p>
      ) : (
        <>
          {data.items.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No recorded events on this page. Pre-existing history is not reconstructed.
            </p>
          ) : (
            <ol className="space-y-4">
              {data.items.map((event) => (
                <li key={event.id}>
                  <Card className="space-y-3 p-4">
                    <h4 className="font-semibold text-text-primary">{titles[event.action] ?? "Employee event"}</h4>
                    <p className="text-xs text-text-secondary">
                      <time dateTime={event.recordedAt}>{new Date(event.recordedAt).toLocaleString()}</time>
                      {" · "}
                      {event.actor?.name ?? "Former or unavailable user"}
                    </p>
                    {event.changes.length ? (
                      <dl className="space-y-3">
                        {event.changes.map((change) => (
                          <div key={change.field}>
                            <dt className="text-sm font-semibold text-text-primary">{change.label}</dt>
                            <dd className="break-words text-sm text-text-secondary">
                              {change.before ?? "Not set"}
                              {" → "}
                              {change.after ?? "Not set"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-text-secondary">
                        {event.hasChangeDetails
                          ? "No tracked job fields changed."
                          : "Detailed field history was not recorded for this event."}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ol>
          )}
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-text-secondary">
            <label className="flex items-center gap-2">
              Rows per page
              <select
                aria-label="Timeline rows per page"
                className="cursor-pointer rounded-md border border-border bg-surface p-2"
                value={pageSize}
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
              aria-label="Previous timeline page"
              disabled={page === 1}
              className="cursor-pointer rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((value) => value - 1)}
            >
              <Icon name="chevron" className="rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next timeline page"
              disabled={page * pageSize >= data.total}
              className="cursor-pointer rounded-md p-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((value) => value + 1)}
            >
              <Icon name="chevron" />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
