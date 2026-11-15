"use client";

import { useEffect, useState } from "react";
import {
  dashboardMetricsService,
  type LeaveMetrics,
  type PayrollMetrics,
} from "@/services/hrms-dashboard-metrics.service";
import { Button, Card, CardTitle } from "./components/ui-primitives";

type Result<T> = { key: string; data?: T; error?: string };

function useMetric<T>(organizationId: string, load: (org: string) => Promise<T>) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = `${organizationId}:${retry}`;
  useEffect(() => {
    let active = true;
    load(organizationId)
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((reason: unknown) => {
        if (active)
          setResult({ key, error: reason instanceof Error ? reason.message : "Unable to load dashboard data." });
      });
    return () => {
      active = false;
    };
  }, [organizationId, load, key]);
  return { current: result?.key === key ? result : null, retry: () => setRetry((value) => value + 1) };
}

function MonthBars({
  values,
  format,
}: {
  values: { month: string; value: number }[];
  format: (value: number) => string;
}) {
  const max = Math.max(0, ...values.map(({ value }) => Math.abs(value)));
  return (
    <ul className="space-y-2" aria-label="Monthly totals">
      {values.map(({ month, value }) => (
        <li key={month} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs">
          <span className="text-text-secondary">{month}</span>
          <span className="h-2 overflow-hidden rounded bg-surface-raised" aria-hidden="true">
            <span
              className={`block h-full rounded ${value < 0 ? "bg-error" : "bg-brand"}`}
              style={{ width: `${max ? (Math.abs(value) / max) * 100 : 0}%` }}
            />
          </span>
          <span className="text-text-primary">{format(value)}</span>
        </li>
      ))}
    </ul>
  );
}

function MetricState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="space-y-2">
      <p role="alert" className="text-sm text-error">
        {error}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export function LeaveDashboardWidget({ organizationId }: { organizationId: string }) {
  const { current, retry } = useMetric<LeaveMetrics>(organizationId, dashboardMetricsService.leave);
  return (
    <Card>
      <CardTitle title="Leave taken" subtitle="Approved days · last 6 months through today" />
      <div className="space-y-3 p-5">
        {!current ? (
          <p role="status" className="text-sm text-text-secondary">
            Loading leave data…
          </p>
        ) : current.error ? (
          <MetricState error={current.error} onRetry={retry} />
        ) : (
          current.data && (
            <>
              <MonthBars
                values={current.data.months.map(({ month, days }) => ({ month, value: days }))}
                format={(value) => `${value} days`}
              />
              {current.data.excludedLegacyRequests > 0 && (
                <p className="text-xs text-text-secondary">
                  {current.data.excludedLegacyRequests} historical leave request(s) excluded because daily allocation is
                  unavailable.
                </p>
              )}
            </>
          )
        )}
      </div>
    </Card>
  );
}

export function PayrollDashboardWidget({ organizationId }: { organizationId: string }) {
  const { current, retry } = useMetric<PayrollMetrics>(organizationId, dashboardMetricsService.payroll);
  const data = current?.data;
  return (
    <Card>
      <CardTitle title="Net payroll" subtitle="Approved and paid · by pay date · last 6 months" />
      <div className="space-y-4 p-5">
        {!current ? (
          <p role="status" className="text-sm text-text-secondary">
            Loading payroll data…
          </p>
        ) : current.error ? (
          <MetricState error={current.error} onRetry={retry} />
        ) : (
          data &&
          (data.series.length ? (
            <>
              {data.series.map(({ currency, values }) => (
                <section key={currency} aria-label={`${currency} net payroll`}>
                  <h3 className="mb-2 text-sm font-semibold text-text-primary">{currency}</h3>
                  <MonthBars
                    values={data.months.map((month, index) => ({ month, value: Number(values[index]) }))}
                    format={(value) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value)}
                  />
                </section>
              ))}
              {data.series.length > 1 && <p className="text-xs text-text-secondary">Each currency has its own scale.</p>}
            </>
          ) : (
            <p className="text-sm text-text-secondary">No approved or paid payroll in this period.</p>
          ))
        )}
      </div>
    </Card>
  );
}
