"use client";

import { DhritiButton } from "@dhriti/ui";
import type { SystemHealthStatus } from "@dhriti/types";
import { useToast, ToastContainer } from "@/components/shared/Toast";
import { HealthReportExport } from "@/features/control/system-health/health-report-export";
import { useSystemHealth } from "@/features/control/system-health/use-system-health";
import { SystemHealthSkeletonValue } from "@/features/control/system-health/system-health-skeleton";

const statusColors: Record<SystemHealthStatus, { text: string; dot: string }> = {
  operational: { text: "text-success", dot: "bg-success" },
  degraded: { text: "text-warning", dot: "bg-warning" },
  outage: { text: "text-error", dot: "bg-error" },
  unavailable: { text: "text-text-muted", dot: "bg-text-muted" },
};

const serviceRows = [
  { id: "api", name: "API Gateway" },
  { id: "auth", name: "Auth Service" },
  { id: "database", name: "Database (Primary)" },
  { id: "replica", name: "Database (Replica)" },
  { id: "redis", name: "Redis Cache" },
  { id: "storage", name: "File Storage (S3)" },
  { id: "email", name: "Email Service" },
  { id: "websocket", name: "WebSocket Server" },
  { id: "search", name: "Search (Elasticsearch)" },
  { id: "cdn", name: "CDN" },
];

const resourceMetrics = [
  { id: "cpu", label: "CPU Usage", text: "text-brand", bar: "bg-brand" },
  { id: "memory", label: "Memory", text: "text-info", bar: "bg-info" },
  { id: "disk", label: "Disk I/O", text: "text-metric-storage", bar: "bg-metric-storage" },
  { id: "network", label: "Network", text: "text-warning", bar: "bg-warning" },
];

export default function SystemHealth() {
  const { toasts, addToast, removeToast } = useToast();
  const { snapshot, error, retry, refreshing, initialLoading } = useSystemHealth();

  return (
    <div aria-busy={initialLoading}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {initialLoading && (
        <p role="status" aria-label="Loading System Health" className="sr-only">
          Loading System Health
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-md border border-error p-3 text-sm text-error"
        >
          <span>
            {snapshot ? "Refresh failed. Showing the last successful readings. " : "Unable to load System Health. "}
            {error}
          </span>
          <DhritiButton variant="secondary" onClick={retry} disabled={refreshing}>
            Retry
          </DhritiButton>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>System Health</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            Infrastructure status and performance metrics
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Sampled:{" "}
            {snapshot ? (
              <time dateTime={snapshot.timestamp}>{new Date(snapshot.timestamp).toLocaleString()}</time>
            ) : initialLoading ? (
              <SystemHealthSkeletonValue wide />
            ) : (
              "Unavailable"
            )}
          </p>
        </div>
        <DhritiButton variant="secondary" disabled={refreshing} aria-busy={refreshing} onClick={retry}>
          Refresh
        </DhritiButton>
      </div>

      {/* Status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Operational", count: snapshot?.summary.operational, color: "#166534", bg: "#dcfce7" },
          { label: "Degraded", count: snapshot?.summary.degraded, color: "#92400e", bg: "#fef9c3" },
          { label: "Outage", count: snapshot?.summary.outage, color: "#991b1b", bg: "#fee2e2" },
        ].map((item) => (
          <div
            key={item.label}
            style={{ backgroundColor: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0" }}
          >
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>{item.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: item.color }}>
                {initialLoading ? <SystemHealthSkeletonValue /> : (item.count ?? "—")}
              </span>
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 20,
                  backgroundColor: item.bg,
                  color: item.color,
                  fontWeight: 600,
                }}
              >
                services
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>
        {/* Services table */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2
              style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}
              title="Sampled availability over the last 24 hours or since this API instance started; not an SLA. Unavailable checks are excluded from the three status counts."
            >
              Service Status
            </h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                {["Service", "Status", "Uptime", "Latency", "Last Check"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {serviceRows.map((row) => {
                const svc = snapshot?.services.find((service) => service.id === row.id);
                const sc = statusColors[svc?.status ?? "unavailable"];
                return (
                  <tr key={row.id} title={svc?.detail} style={{ borderTop: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>
                      {row.name}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {initialLoading ? (
                        <SystemHealthSkeletonValue wide />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div className={`size-2 rounded-full ${sc.dot}`} />
                          <span className={`text-xs font-semibold capitalize ${sc.text}`}>
                            {svc?.status ?? "unavailable"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td
                      title={`Sampled availability; ${svc?.samples ?? 0} checks. Degraded samples count as available.`}
                      style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}
                    >
                      {initialLoading ? (
                        <SystemHealthSkeletonValue />
                      ) : svc?.uptimePercent == null ? (
                        "—"
                      ) : (
                        `${svc.uptimePercent}%`
                      )}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontFamily: "monospace",
                      }}
                      className={(svc?.latencyMs ?? 0) > 100 ? "text-warning" : "text-text-secondary"}
                    >
                      {initialLoading ? (
                        <SystemHealthSkeletonValue />
                      ) : svc?.latencyMs == null ? (
                        "—"
                      ) : (
                        `${svc.latencyMs}ms`
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                      {initialLoading ? (
                        <SystemHealthSkeletonValue />
                      ) : svc ? (
                        <time dateTime={svc.checkedAt} title={new Date(svc.checkedAt).toLocaleString()}>
                          {new Date(svc.checkedAt).toLocaleTimeString()}
                        </time>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resource metrics */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 20px" }}>Resource Usage</h2>
          {resourceMetrics.map((rm) => {
            const reading = snapshot?.resources.find((resource) => resource.id === rm.id);
            return (
              <div key={rm.label} title={reading?.detail} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{rm.label}</span>
                  <span className={`text-sm font-bold ${rm.text}`}>
                    {initialLoading ? (
                      <SystemHealthSkeletonValue />
                    ) : reading?.value == null ? (
                      "—"
                    ) : (
                      `${reading.value}%`
                    )}
                  </span>
                </div>
                <div style={{ height: 10, backgroundColor: "#f1f5f9", borderRadius: 5 }}>
                  <div
                    style={{
                      height: "100%",
                      width: initialLoading ? "100%" : `${reading?.value ?? 0}%`,
                      borderRadius: 5,
                      opacity: 0.85,
                    }}
                    className={initialLoading ? "w-full bg-surface-raised motion-safe:animate-pulse" : rm.bar}
                  />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 20, padding: 14, backgroundColor: "#f8fafc", borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Active Connections</div>
            <div title={snapshot?.connections.detail} style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
              {initialLoading ? (
                <SystemHealthSkeletonValue wide />
              ) : (
                (snapshot?.connections.active.toLocaleString() ?? "—")
              )}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              {initialLoading ? (
                <SystemHealthSkeletonValue wide />
              ) : snapshot?.connections.changeLast5m == null ? (
                "5m comparison unavailable"
              ) : (
                `${snapshot.connections.changeLast5m >= 0 ? "+" : ""}${snapshot.connections.changeLast5m} in last 5m`
              )}
            </div>
          </div>
          <HealthReportExport disabled={!snapshot} notify={addToast} />
        </div>
      </div>
    </div>
  );
}
