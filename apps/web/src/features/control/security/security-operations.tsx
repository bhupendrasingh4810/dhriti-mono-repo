"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DhritiButton, DhritiTextField } from "@dhriti/ui";
import { Pagination } from "@/components/shared/pagination";
import { logout } from "@/services/auth.service";
import {
  controlPlatformService,
  type SecurityCompliance,
  type SecurityDelivery,
  type SecurityPage,
  type SecuritySession,
} from "@/services/control.service";
import type { RunSecurityAction } from "./security-block-dialog";

const sectionClass = "mt-4 rounded-xl border border-border bg-surface p-5";
const cellClass = "border-b border-border p-3 text-left text-sm text-text-secondary";

export function SecurityOperations({ busy, run }: { busy: boolean; run: RunSecurityAction }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SecurityPage<SecuritySession> | null>(null);
  const [compliance, setCompliance] = useState<SecurityPage<SecurityCompliance> | null>(null);
  const [deliveries, setDeliveries] = useState<SecurityPage<SecurityDelivery> | null>(null);
  const [integrations, setIntegrations] = useState<{ email: boolean; webhook: boolean; ingestion: boolean } | null>(
    null,
  );
  const [sessionQuery, setSessionQuery] = useState({ page: 1, limit: 20 });
  const [complianceQuery, setComplianceQuery] = useState({ page: 1, limit: 20 });
  const [deliveryQuery, setDeliveryQuery] = useState({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [revoking, setRevoking] = useState<SecuritySession | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const generation = useRef(0);
  const load = useCallback(
    async (active: () => boolean) => {
      const request = ++generation.current;
      const [sessionData, complianceData, integrationData, deliveryData] = await Promise.all([
        controlPlatformService.securitySessions(sessionQuery.page, sessionQuery.limit, appliedSearch),
        controlPlatformService.securityCompliance(complianceQuery.page, complianceQuery.limit),
        controlPlatformService.securityIntegrationStatus(),
        controlPlatformService.securityDeliveries(deliveryQuery.page, deliveryQuery.limit),
      ]);
      if (!active() || request !== generation.current) return;
      setSessions(sessionData);
      setCompliance(complianceData);
      setIntegrations(integrationData);
      setDeliveries(deliveryData);
      setError("");
      if (sessionQuery.page > 1 && !sessionData.items.length)
        setSessionQuery((value) => ({ ...value, page: Math.max(1, sessionData.pagination.totalPages) }));
      if (complianceQuery.page > 1 && !complianceData.items.length)
        setComplianceQuery((value) => ({ ...value, page: Math.max(1, complianceData.pagination.totalPages) }));
      if (deliveryQuery.page > 1 && !deliveryData.items.length)
        setDeliveryQuery((value) => ({ ...value, page: Math.max(1, deliveryData.pagination.totalPages) }));
    },
    [sessionQuery, complianceQuery, deliveryQuery, appliedSearch],
  );
  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => load(() => active))
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Unable to load security operations");
      });
    return () => {
      active = false;
    };
  }, [load, revision]);

  return (
    <>
      <div className="mt-4 flex items-center justify-between gap-3">
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <DhritiButton variant="secondary" onClick={() => setRevision((value) => value + 1)}>
          Refresh security operations
        </DhritiButton>
      </div>
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-text-primary">Active sessions</h2>
        <p className="my-3 text-sm text-text-secondary">
          Inspect user, tenant, device and IP details. Revocation invalidates access and refresh tokens and disconnects
          live sessions.
        </p>
        <form
          className="mb-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(search.trim());
            setSessionQuery((value) => ({ ...value, page: 1 }));
          }}
        >
          <DhritiTextField label="Search sessions by email or IP" value={search} onChange={setSearch} />
          <DhritiButton type="submit" variant="secondary">
            Search sessions
          </DhritiButton>
        </form>
        {!sessions ? (
          <p className="text-sm text-text-secondary">{error ? "Sessions unavailable." : "Loading sessions..."}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {["User", "Organization", "IP / device", "Created / expires", "Session action"].map((heading) => (
                      <th key={heading} className={cellClass}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.items.map((session) => (
                    <tr key={session.id}>
                      <td className={cellClass}>
                        {session.user.name}
                        <p>{session.user.email}</p>
                        {session.current && <p className="text-warning">Current session</p>}
                      </td>
                      <td className={`${cellClass} break-all`}>{session.organizationId ?? "Platform"}</td>
                      <td className={`${cellClass} break-all`}>
                        {session.ipAddress ?? "Unavailable"}
                        <p>{session.userAgent ?? "Unknown device"}</p>
                      </td>
                      <td className={cellClass}>
                        {new Date(session.createdAt).toLocaleString()}
                        <p>{new Date(session.expiresAt).toLocaleString()}</p>
                      </td>
                      <td className={cellClass}>
                        <DhritiButton
                          variant="danger"
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setRevoking(session);
                            setReason("");
                            setReasonError("");
                          }}
                        >
                          Revoke session
                        </DhritiButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!sessions.items.length && <p className="p-3 text-sm text-text-secondary">No active sessions match.</p>}
            <Pagination
              ariaLabel="Active sessions pagination"
              {...{
                page: sessionQuery.page,
                pageSize: sessionQuery.limit,
                total: sessions.pagination.total,
                totalPages: sessions.pagination.totalPages,
              }}
              onPageChange={(page) => setSessionQuery((value) => ({ ...value, page }))}
              onPageSizeChange={(limit) => setSessionQuery({ page: 1, limit })}
            />
          </>
        )}
      </section>
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-text-primary">SSO verification and MFA compliance</h2>
        <p className="my-3 text-sm text-text-secondary">
          Verified means a successful SSO login since the last configuration change, not a continuous health check. MFA
          gaps count active members without local MFA; an enforced policy alone does not prove provider MFA compliance.
        </p>
        {!compliance ? (
          <p className="text-sm text-text-secondary">{error ? "Compliance unavailable." : "Loading compliance..."}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {[
                      "Organization",
                      "SSO status",
                      "Last verified",
                      "MFA policy",
                      "MFA enabled / active",
                      "MFA gap",
                    ].map((heading) => (
                      <th key={heading} className={cellClass}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compliance.items.map((org) => (
                    <tr key={org.id}>
                      <td className={cellClass}>
                        {org.name}
                        <p>{org.slug}</p>
                      </td>
                      <td className={cellClass}>
                        {org.ssoStatus === "not_configured"
                          ? "Not configured"
                          : org.ssoStatus === "verified"
                            ? "Verified"
                            : org.ssoStatus === "disabled"
                              ? "Disabled"
                              : "Configured, not verified"}
                      </td>
                      <td className={cellClass}>
                        {org.lastVerifiedAt ? new Date(org.lastVerifiedAt).toLocaleString() : "Never"}
                      </td>
                      <td className={cellClass}>{org.mfaEnforced ? "Enforced" : "Optional"}</td>
                      <td className={cellClass}>
                        {org.mfaEnabledMembers} / {org.activeMembers}
                      </td>
                      <td className={cellClass}>{org.mfaGap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!compliance.items.length && <p className="p-3 text-sm text-text-secondary">No organizations.</p>}
            <Pagination
              ariaLabel="Security compliance pagination"
              page={complianceQuery.page}
              pageSize={complianceQuery.limit}
              total={compliance.pagination.total}
              totalPages={compliance.pagination.totalPages}
              onPageChange={(page) => setComplianceQuery((value) => ({ ...value, page }))}
              onPageSizeChange={(limit) => setComplianceQuery({ page: 1, limit })}
            />
          </>
        )}
      </section>
      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-text-primary">Alerts and SIEM / WAF integrations</h2>
        <p className="my-3 text-sm text-text-secondary">
          Email alerts cover high and critical events. Signed outbound webhooks export events; authenticated inbound
          webhooks accept normalized SIEM, WAF and IdP findings. No advanced detector is implied until a source is
          connected.
        </p>
        {!integrations ? (
          <p className="text-sm text-text-secondary">
            {error ? "Integration status unavailable." : "Loading integration status..."}
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-text-secondary">
            <li>Email alerts: {integrations.email ? "Configured" : "Not configured"}</li>
            <li>Outbound webhook: {integrations.webhook ? "Configured" : "Not configured"}</li>
            <li>Inbound SIEM / WAF events: {integrations.ingestion ? "Configured" : "Not configured"}</li>
          </ul>
        )}
        <p className="my-3 text-sm text-text-secondary">
          An operator must configure recipients, webhook destination/signing secret and ingestion token on the API
          server. Secrets are never shown here. Delivery is at least once with up to 8 attempts; receivers must
          deduplicate delivery IDs.
        </p>
        <h3 className="my-3 text-sm font-semibold text-text-primary">Alert delivery history</h3>
        {!deliveries ? (
          <p className="text-sm text-text-secondary">
            {error ? "Delivery history unavailable." : "Loading delivery history..."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {["Channel", "Event", "Delivery status", "Attempts", "Error / next retry", "Delivery action"].map(
                      (heading) => (
                        <th key={heading} className={cellClass}>
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.items.map((delivery) => (
                    <tr key={delivery.id}>
                      <td className={cellClass}>{delivery.channel}</td>
                      <td className={`${cellClass} break-all`}>{delivery.eventId}</td>
                      <td className={cellClass}>
                        {delivery.deliveredAt
                          ? "Delivered"
                          : delivery.attempts >= 8
                            ? "Failed - retries exhausted"
                            : "Pending"}
                      </td>
                      <td className={cellClass}>{delivery.attempts}</td>
                      <td className={cellClass}>
                        {delivery.lastError ?? "None"}
                        {!delivery.deliveredAt && delivery.attempts < 8 && (
                          <p>{new Date(delivery.availableAt).toLocaleString()}</p>
                        )}
                      </td>
                      <td className={cellClass}>
                        {!delivery.deliveredAt && delivery.lastError && (
                          <DhritiButton
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await controlPlatformService.retrySecurityDelivery(delivery.id);
                                setRevision((value) => value + 1);
                              }, "Delivery queued for retry")
                            }
                          >
                            Retry delivery
                          </DhritiButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!deliveries.items.length && <p className="p-3 text-sm text-text-secondary">No alert deliveries yet.</p>}
            <Pagination
              ariaLabel="Alert deliveries pagination"
              page={deliveryQuery.page}
              pageSize={deliveryQuery.limit}
              total={deliveries.pagination.total}
              totalPages={deliveries.pagination.totalPages}
              onPageChange={(page) => setDeliveryQuery((value) => ({ ...value, page }))}
              onPageSizeChange={(limit) => setDeliveryQuery({ page: 1, limit })}
            />
          </>
        )}
      </section>
      {revoking && (
        <Dialog
          open
          title="Revoke active session"
          onClose={() => setRevoking(null)}
          secondaryActionLabel=""
          isSubmitting={busy}
        >
          <p className="text-sm text-text-secondary">
            Revoke the session for {revoking.user.email}?
            {revoking.current ? " This is your current session; you will be signed out." : ""}
          </p>
          <form
            noValidate
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reason.trim()) {
                setReasonError("Revocation reason is required.");
                return;
              }
              void run(async () => {
                await controlPlatformService.revokeSecuritySession(revoking.id, reason.trim());
                setRevoking(null);
                if (revoking.current) {
                  await logout();
                  router.replace("/login");
                  router.refresh();
                } else setRevision((value) => value + 1);
              }, "Session revoked");
            }}
          >
            <DhritiTextField
              label="Revocation reason"
              required
              maxLength={500}
              disabled={busy}
              value={reason}
              error={reasonError}
              onChange={setReason}
            />
            <div className="flex justify-end gap-2">
              <DhritiButton variant="secondary" disabled={busy} onClick={() => setRevoking(null)}>
                Cancel
              </DhritiButton>
              <DhritiButton type="submit" variant="danger" disabled={busy}>
                Confirm session revocation
              </DhritiButton>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
