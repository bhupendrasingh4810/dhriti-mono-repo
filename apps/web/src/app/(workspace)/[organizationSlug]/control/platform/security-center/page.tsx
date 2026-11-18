"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast, ToastContainer } from "@/components/shared/Toast";
import { Pagination } from "@/components/shared/pagination";
import { DhritiButton } from "@dhriti/ui";
import { OrganizationSsoConfiguration } from "@/features/control/security/organization-sso-configuration";
import { SecurityEventFilterForm } from "@/features/control/security/security-event-filters";
import { SecurityEventDetailDialog } from "@/features/control/security/security-event-detail";
import { SecurityBlockDialog } from "@/features/control/security/security-block-dialog";
import { SecurityOperations } from "@/features/control/security/security-operations";
import {
  controlPlatformService,
  type PlatformSecurityOverview,
  type PlatformSecurityEvent,
  type PlatformBlockedIp,
  type SecurityPage,
  type SecurityEventFilters,
} from "@/services/control.service";

type SecurityEvent = PlatformSecurityEvent;

const severityColors: Record<SecurityEvent["severity"], { bg: string; color: string }> = {
  critical: { bg: "#fee2e2", color: "#dc2626" },
  high: { bg: "#ffedd5", color: "#c2410c" },
  medium: { bg: "#fef9c3", color: "#92400e" },
  low: { bg: "#dbeafe", color: "#1d4ed8" },
};

export default function SecurityCenter() {
  const { toasts, addToast, removeToast } = useToast();
  const [overview, setOverview] = useState<PlatformSecurityOverview | null>(null);
  const [events, setEvents] = useState<SecurityPage<SecurityEvent> | null>(null);
  const [blocks, setBlocks] = useState<SecurityPage<PlatformBlockedIp> | null>(null);
  const [eventPage, setEventPage] = useState(1);
  const [blockPage, setBlockPage] = useState(1);
  const [eventLimit, setEventLimit] = useState(20);
  const [blockLimit, setBlockLimit] = useState(20);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState<SecurityEventFilters>({});
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [blockAddress, setBlockAddress] = useState<string | null>(null);
  const operation = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(
    async (isActive: () => boolean = () => true) => {
      const request = ++generation.current;
      const [summary, eventData, blockedData] = await Promise.all([
        controlPlatformService.securityOverview(),
        controlPlatformService.securityEvents(eventPage, eventLimit, filters),
        controlPlatformService.blockedIps(blockPage, blockLimit),
      ]);
      if (request !== generation.current || !isActive()) return;
      setOverview(summary);
      setEvents(eventData);
      setBlocks(blockedData);
      setError("");
      if (eventPage > 1 && !eventData.items.length) setEventPage(Math.max(1, eventData.pagination.totalPages));
      if (blockPage > 1 && !blockedData.items.length) setBlockPage(Math.max(1, blockedData.pagination.totalPages));
    },
    [eventPage, eventLimit, blockPage, blockLimit, filters],
  );
  const currentRefresh = useRef(refresh);
  useEffect(() => {
    currentRefresh.current = refresh;
  }, [refresh]);
  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => refresh(() => active))
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load Security Center");
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const run = async (action: () => Promise<void>, success: string) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      await action();
      addToast(success, "success");
      try {
        await currentRefresh.current();
      } catch (reason) {
        setError(
          reason instanceof Error
            ? `Action saved, but refresh failed: ${reason.message}`
            : "Action saved, but refresh failed. Please retry.",
        );
      }
    } catch (reason) {
      addToast(reason instanceof Error ? reason.message : "Unable to apply security action", "error");
    } finally {
      operation.current = false;
      setBusy(false);
    }
  };
  const secEvents = events?.items ?? [];
  const metrics = [
    { label: "Active Threats", value: overview?.activeThreats ?? "—", color: "text-error" },
    { label: "Blocked IPs", value: overview?.blockedIps ?? "—", color: "text-warning" },
    { label: "MFA Adoption", value: overview ? `${overview.mfaAdoption}%` : "—", color: "text-success" },
    { label: "SSO Orgs", value: overview?.ssoOrgs ?? "—", color: "text-brand" },
  ];

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-4 rounded-md border border-error p-3 text-sm text-error"
        >
          {error}
          <DhritiButton
            variant="secondary"
            onClick={() =>
              void refresh().catch((reason: unknown) =>
                setError(reason instanceof Error ? reason.message : "Unable to reload Security Center"),
              )
            }
          >
            Retry
          </DhritiButton>
        </div>
      )}
      {!overview && !error && (
        <p role="status" className="sr-only">
          Loading Security Center
        </p>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Security Center</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
          Monitor and respond to security threats across the platform
        </p>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 8 }}>{m.label}</div>
            <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Security events */}
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
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Security Events</h2>
        </div>
        <SecurityEventFilterForm
          onApply={(value) => {
            setFilters(value);
            setEventPage(1);
          }}
        />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              {["Severity", "Type", "Description", "IP Address", "Time", "Actions"].map((h) => (
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
            {!events && (
              <tr>
                <td colSpan={6} className="p-4 text-sm text-text-muted">
                  {error ? "Security events unavailable." : "Loading security events..."}
                </td>
              </tr>
            )}
            {events && !secEvents.length && (
              <tr>
                <td colSpan={6} className="p-4 text-sm text-text-muted">
                  No security events detected.
                </td>
              </tr>
            )}
            {secEvents.map((ev) => {
              const sc = severityColors[ev.severity];
              return (
                <tr key={ev.id} style={{ borderTop: "1px solid #f1f5f9", opacity: ev.resolvedAt ? 0.5 : 1 }}>
                  <td style={{ padding: "12px 16px" }}>
                    <DhritiButton variant="secondary" size="sm" onClick={() => setSelectedEvent(ev.id)}>
                      Details
                    </DhritiButton>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 20,
                        backgroundColor: sc.bg,
                        color: sc.color,
                        textTransform: "capitalize",
                      }}
                    >
                      {ev.severity}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{ev.type}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#475569" }}>{ev.description}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>
                    {ev.ipAddress ?? "Unavailable"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8" }}>
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {ev.resolvedAt ? (
                      <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>Resolved</span>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(
                              () => controlPlatformService.resolveSecurityEvent(ev.id),
                              "Security event marked as resolved",
                            )
                          }
                          style={{
                            padding: "4px 10px",
                            borderRadius: 5,
                            border: "1px solid #e2e8f0",
                            backgroundColor: "white",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "#475569",
                          }}
                        >
                          Resolve
                        </button>
                        <button
                          disabled={busy || !ev.ipAddress}
                          onClick={() => setBlockAddress(ev.ipAddress)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 5,
                            border: "1px solid #fecaca",
                            backgroundColor: "#fff5f5",
                            cursor: "pointer",
                            fontSize: 12,
                            color: "#dc2626",
                          }}
                        >
                          Block IP
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {events && (
          <Pagination
            ariaLabel="Security events pagination"
            page={eventPage}
            pageSize={eventLimit}
            total={events.pagination.total}
            totalPages={events.pagination.totalPages}
            onPageChange={setEventPage}
            onPageSizeChange={(value) => {
              setEventLimit(value);
              setEventPage(1);
            }}
          />
        )}
      </div>

      {/* MFA & SSO summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>MFA Status</h3>
          {[
            { label: "MFA Enforced", count: overview?.mfaStatus.enforced },
            { label: "MFA Optional", count: overview?.mfaStatus.optional },
            { label: "No MFA", count: overview?.mfaStatus.none },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                  {item.count === undefined ? "—" : `${item.count} orgs`}
                </span>
              </div>
              <div style={{ height: 6, backgroundColor: "#f1f5f9", borderRadius: 3 }}>
                <div
                  className="h-full rounded bg-brand"
                  style={{
                    width: `${overview?.mfaStatus.total ? ((item.count ?? 0) / overview.mfaStatus.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" }}>Blocked IPs</h3>
          <DhritiButton size="sm" variant="secondary" disabled={busy} onClick={() => setBlockAddress("")}>
            Add IP block
          </DhritiButton>
          {!blocks && (
            <p className="text-sm text-text-muted">{error ? "Blocked IPs unavailable." : "Loading blocked IPs..."}</p>
          )}
          {blocks && !blocks.items.length && <p className="text-sm text-text-muted">No blocked IPs.</p>}
          {(blocks?.items ?? []).map(({ ipAddress: ip, reason, expiresAt }) => (
            <div
              key={ip}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div className="min-w-0 break-all text-sm text-text-secondary">
                <span>{ip}</span>
                <p>{reason}</p>
                <p>{expiresAt ? `Expires ${new Date(expiresAt).toLocaleString()}` : "Until manually unblocked"}</p>
              </div>
              <button
                disabled={busy}
                onClick={() => void run(() => controlPlatformService.unblockIp(ip), `${ip} unblocked`)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 5,
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "#475569",
                }}
              >
                Unblock
              </button>
            </div>
          ))}
          {blocks && (
            <Pagination
              ariaLabel="Blocked IPs pagination"
              page={blockPage}
              pageSize={blockLimit}
              total={blocks.pagination.total}
              totalPages={blocks.pagination.totalPages}
              onPageChange={setBlockPage}
              onPageSizeChange={(value) => {
                setBlockLimit(value);
                setBlockPage(1);
              }}
            />
          )}
        </div>
      </div>
      <OrganizationSsoConfiguration busy={busy} run={run} />
      <SecurityOperations busy={busy} run={run} />
      {selectedEvent && (
        <SecurityEventDetailDialog key={selectedEvent} id={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {blockAddress !== null && (
        <SecurityBlockDialog
          key={blockAddress}
          ip={blockAddress}
          busy={busy}
          run={run}
          onClose={() => setBlockAddress(null)}
        />
      )}
    </div>
  );
}
