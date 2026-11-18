import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SecurityCenter from "@/app/(workspace)/[organizationSlug]/control/platform/security-center/page";
import { controlPlatformService } from "@/services/control.service";
import { logout } from "@/services/auth.service";
const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/services/auth.service", () => ({ logout: vi.fn() }));

vi.mock("@/services/control.service", () => ({
  controlPlatformService: {
    securityOverview: vi.fn(),
    securityEvents: vi.fn(),
    blockedIps: vi.fn(),
    resolveSecurityEvent: vi.fn(),
    blockIp: vi.fn(),
    unblockIp: vi.fn(),
    configureOrganizationOidc: vi.fn(),
    organizationOidc: vi.fn(),
    securityEvent: vi.fn(),
    securitySessions: vi.fn(),
    revokeSecuritySession: vi.fn(),
    securityCompliance: vi.fn(),
    securityIntegrationStatus: vi.fn(),
    securityDeliveries: vi.fn(),
    retrySecurityDelivery: vi.fn(),
  },
}));
const event = {
  id: "event",
  severity: "high" as const,
  type: "Brute Force",
  description: "Repeated failed logins",
  ipAddress: "192.0.2.2",
  createdAt: "2026-11-17T10:00:00Z",
  resolvedAt: null,
  source: "dhriti",
  externalId: null,
};
const page = <T,>(items: T[], total = items.length) => ({
  items,
  pagination: { page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) },
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(controlPlatformService.securityOverview).mockResolvedValue({
    activeThreats: 1,
    blockedIps: 1,
    mfaAdoption: 50,
    ssoOrgs: 2,
    mfaStatus: { enforced: 1, optional: 1, none: 1, total: 3 },
  });
  vi.mocked(controlPlatformService.securityEvents).mockResolvedValue(page([event]));
  vi.mocked(controlPlatformService.blockedIps).mockResolvedValue(
    page([{ ipAddress: "192.0.2.3", createdAt: event.createdAt, reason: "WAF finding", expiresAt: null }]),
  );
  vi.mocked(controlPlatformService.resolveSecurityEvent).mockResolvedValue(undefined);
  vi.mocked(controlPlatformService.blockIp).mockResolvedValue(undefined);
  vi.mocked(controlPlatformService.unblockIp).mockResolvedValue(undefined);
  vi.mocked(controlPlatformService.securitySessions).mockResolvedValue(page([]));
  vi.mocked(controlPlatformService.securityCompliance).mockResolvedValue(page([]));
  vi.mocked(controlPlatformService.securityIntegrationStatus).mockResolvedValue({
    email: false,
    webhook: false,
    ingestion: false,
  });
  vi.mocked(controlPlatformService.securityDeliveries).mockResolvedValue(page([]));
  vi.mocked(controlPlatformService.revokeSecuritySession).mockResolvedValue(undefined);
  vi.mocked(controlPlatformService.retrySecurityDelivery).mockResolvedValue(undefined);
  vi.mocked(logout).mockResolvedValue(undefined);
});
afterEach(cleanup);

describe("connected Security Center", () => {
  it("preserves all existing UI sections and uses API data instead of fabricated metrics", async () => {
    render(<SecurityCenter />);
    expect(await screen.findByText("Repeated failed logins")).toBeInTheDocument();
    for (const heading of ["Security Center", "Security Events", "MFA Status", "Blocked IPs"]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    for (const label of ["Active Threats", "MFA Adoption", "SSO Orgs", "MFA Enforced", "MFA Optional", "No MFA"])
      expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.queryByText("127")).not.toBeInTheDocument();
    for (const name of ["Severity", "Type", "Description", "IP Address", "Time", "Actions"])
      expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
  });

  it("waits for resolve to persist before showing success and refreshed state", async () => {
    let finish!: () => void;
    vi.mocked(controlPlatformService.resolveSecurityEvent).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Resolve" }));
    expect(screen.queryByText("Security event marked as resolved")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resolve" })).toBeDisabled();
    vi.mocked(controlPlatformService.securityEvents).mockResolvedValue(
      page([{ ...event, resolvedAt: event.createdAt }]),
    );
    await act(async () => {
      finish();
    });
    expect(await screen.findByText("Resolved")).toBeInTheDocument();
    expect(screen.getByText("Security event marked as resolved")).toBeInTheDocument();
    expect(controlPlatformService.resolveSecurityEvent).toHaveBeenCalledWith("event");
  });

  it("blocks and unblocks persistently, refreshing the summary and lists", async () => {
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Block IP" }));
    fireEvent.change(screen.getByLabelText(/Block reason/), { target: { value: "WAF finding" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm IP block" }));
    await waitFor(() =>
      expect(controlPlatformService.blockIp).toHaveBeenCalledWith("192.0.2.2", "WAF finding", expect.any(String)),
    );
    const expiry = vi.mocked(controlPlatformService.blockIp).mock.calls[0][2];
    expect(Date.parse(expiry ?? "") - Date.now()).toBeGreaterThan(23.9 * 3600000);
    expect(Date.parse(expiry ?? "") - Date.now()).toBeLessThanOrEqual(24 * 3600000);
    await waitFor(() => expect(screen.getByRole("button", { name: "Unblock" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Unblock" }));
    await waitFor(() => expect(controlPlatformService.unblockIp).toHaveBeenCalledWith("192.0.2.3"));
    await waitFor(() => expect(controlPlatformService.securityOverview).toHaveBeenCalledTimes(3));
  });

  it("does not falsely report success on a rejected action", async () => {
    vi.mocked(controlPlatformService.blockIp).mockRejectedValueOnce(new Error("Cannot block current IP"));
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Block IP" }));
    fireEvent.change(screen.getByLabelText(/Block reason/), { target: { value: "Investigate" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm IP block" }));
    expect(await screen.findByText("Cannot block current IP")).toBeInTheDocument();
    expect(screen.queryByText(/has been blocked/)).not.toBeInTheDocument();
  });

  it("shows loading, failure, retry and genuine empty states without demo data", async () => {
    vi.mocked(controlPlatformService.securityOverview).mockRejectedValueOnce(new Error("Access denied"));
    render(<SecurityCenter />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading Security Center");
    expect(await screen.findByRole("alert")).toHaveTextContent("Access denied");
    vi.mocked(controlPlatformService.securityEvents).mockResolvedValue(page([]));
    vi.mocked(controlPlatformService.blockedIps).mockResolvedValue(page([]));
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No security events detected.")).toBeInTheDocument();
    expect(screen.getByText("No blocked IPs.")).toBeInTheDocument();
  });

  it("pages security events through the API", async () => {
    vi.mocked(controlPlatformService.securityEvents).mockResolvedValue(page([event], 25));
    render(<SecurityCenter />);
    await screen.findByText(event.description);
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "Security events pagination" })).getByRole("button", {
        name: "Next page",
      }),
    );
    await waitFor(() => expect(controlPlatformService.securityEvents).toHaveBeenLastCalledWith(2, 20, {}));
  });

  it("refreshes the current page if pagination changes while an action is saving", async () => {
    let finish!: () => void;
    vi.mocked(controlPlatformService.resolveSecurityEvent).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    vi.mocked(controlPlatformService.securityEvents).mockResolvedValue(page([event], 25));
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Resolve" }));
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "Security events pagination" })).getByRole("button", {
        name: "Next page",
      }),
    );
    await waitFor(() => expect(controlPlatformService.securityEvents).toHaveBeenLastCalledWith(2, 20, {}));
    await act(async () => {
      finish();
    });
    expect(controlPlatformService.securityEvents).toHaveBeenLastCalledWith(2, 20, {});
  });

  it("validates the additive SSO form without removing the security dashboard", async () => {
    render(<SecurityCenter />);
    await screen.findByText(event.description);
    fireEvent.click(screen.getByText("Organization SSO configuration (OIDC)"));
    fireEvent.click(screen.getByRole("button", { name: "Save SSO configuration" }));
    expect(screen.getByText("Enter a valid organization ID.")).toBeInTheDocument();
    expect(screen.getByText("Client secret is required.")).toBeInTheDocument();
    expect(controlPlatformService.configureOrganizationOidc).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Security Events" })).toBeInTheDocument();
  });

  it("saves encrypted-server-side SSO configuration and clears the browser's secret field after success", async () => {
    vi.mocked(controlPlatformService.configureOrganizationOidc).mockResolvedValue({
      organizationId: "13f88912-08fd-4c44-9008-31e50142bdbb",
      issuer: "https://idp.example.test",
      clientId: "client",
      enabled: true,
      lastVerifiedAt: null,
      updatedAt: event.createdAt,
    });
    render(<SecurityCenter />);
    await screen.findByText(event.description);
    fireEvent.click(screen.getByText("Organization SSO configuration (OIDC)"));
    fireEvent.change(screen.getByLabelText(/Organization ID/), {
      target: { value: "13f88912-08fd-4c44-9008-31e50142bdbb" },
    });
    fireEvent.change(screen.getByLabelText(/Issuer URL/), { target: { value: "https://idp.example.test" } });
    fireEvent.change(screen.getByLabelText(/Client ID/), { target: { value: "client" } });
    fireEvent.change(screen.getByLabelText("Client secret", { exact: false, selector: "input" }), {
      target: { value: "synthetic-secret" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Enable organization SSO" }));
    fireEvent.click(screen.getByRole("button", { name: "Save SSO configuration" }));
    await waitFor(() =>
      expect(controlPlatformService.configureOrganizationOidc).toHaveBeenCalledWith(
        "13f88912-08fd-4c44-9008-31e50142bdbb",
        {
          issuer: "https://idp.example.test",
          clientId: "client",
          clientSecret: "synthetic-secret",
          enabled: true,
        },
      ),
    );
    expect(await screen.findByText("Organization SSO configuration saved")).toBeInTheDocument();
    expect(screen.getByLabelText("Client secret", { exact: false, selector: "input" })).toHaveValue("");
  });

  it("applies explicit event filters and clear resets them without filtering on each keystroke", async () => {
    render(<SecurityCenter />);
    await screen.findByText(event.description);
    fireEvent.change(screen.getByLabelText("Filter IP address"), { target: { value: "192.0.2.2" } });
    fireEvent.change(screen.getByLabelText("From date (UTC)"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("To date (UTC)"), { target: { value: "2026-11-18" } });
    expect(controlPlatformService.securityEvents).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    await waitFor(() =>
      expect(controlPlatformService.securityEvents).toHaveBeenLastCalledWith(
        1,
        20,
        expect.objectContaining({
          ipAddress: "192.0.2.2",
          from: "2026-11-01T00:00:00.000Z",
          to: "2026-11-18T23:59:59.999Z",
        }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(controlPlatformService.securityEvents).toHaveBeenLastCalledWith(1, 20, {}));
  });

  it("validates date ranges and required block reasons inline", async () => {
    render(<SecurityCenter />);
    await screen.findByText(event.description);
    fireEvent.change(screen.getByLabelText("From date (UTC)"), { target: { value: "2026-02-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByText("Enter a valid date as YYYY-MM-DD.")).toBeInTheDocument();
    expect(controlPlatformService.securityEvents).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Block IP" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm IP block" }));
    expect(screen.getByText("Block reason is required.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Block reason/)).toHaveAttribute("aria-invalid", "true");
    expect(controlPlatformService.blockIp).not.toHaveBeenCalled();
  });

  it("loads real event details and audit history on demand", async () => {
    vi.mocked(controlPlatformService.securityEvent).mockResolvedValue({
      event,
      hasMoreTimeline: false,
      timeline: [
        {
          id: "audit",
          action: "security.ip.blocked",
          createdAt: event.createdAt,
          actorUserId: "operator",
          metadata: { reason: "Investigation" },
        },
      ],
    });
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Details" }));
    const dialog = await screen.findByRole("dialog", { name: "Security event details" });
    expect(await within(dialog).findByText(/security.ip.blocked/)).toBeInTheDocument();
    expect(within(dialog).getByText("Reason: Investigation")).toBeInTheDocument();
    expect(controlPlatformService.securityEvent).toHaveBeenCalledWith("event");
  });

  it("reports unconfigured integrations honestly and renders SSO verification and MFA gaps", async () => {
    vi.mocked(controlPlatformService.securityCompliance).mockResolvedValue(
      page([
        {
          id: "org",
          name: "Test tenant",
          slug: "test",
          mfaEnforced: true,
          activeMembers: 5,
          mfaEnabledMembers: 3,
          mfaGap: 2,
          ssoStatus: "configured",
          lastVerifiedAt: null,
        },
      ]),
    );
    render(<SecurityCenter />);
    expect(await screen.findByText("Email alerts: Not configured")).toBeInTheDocument();
    expect(screen.getByText("Configured, not verified")).toBeInTheDocument();
    expect(screen.getByText("3 / 5")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();
  });

  it("inspects and revokes sessions only after confirming a reason", async () => {
    vi.mocked(controlPlatformService.securitySessions).mockResolvedValue(
      page([
        {
          id: "session",
          user: { id: "user", name: "Member", email: "member@example.test" },
          current: false,
          organizationId: "org",
          ipAddress: "192.0.2.2",
          userAgent: "Test browser",
          createdAt: event.createdAt,
          expiresAt: "2099-01-01T00:00:00Z",
        },
      ]),
    );
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Revoke session" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm session revocation" }));
    expect(screen.getByText("Revocation reason is required.")).toBeInTheDocument();
    expect(controlPlatformService.revokeSecuritySession).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Revocation reason/), { target: { value: "Suspicious session" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm session revocation" }));
    await waitFor(() =>
      expect(controlPlatformService.revokeSecuritySession).toHaveBeenCalledWith("session", "Suspicious session"),
    );
    expect(await screen.findByText("Session revoked")).toBeInTheDocument();
    await waitFor(() => expect(controlPlatformService.securitySessions).toHaveBeenCalledTimes(2));
  });

  it("shows failed delivery status instead of reporting successful alerts", async () => {
    vi.mocked(controlPlatformService.securityDeliveries).mockResolvedValue(
      page([
        {
          id: "delivery",
          eventId: "provider-event",
          channel: "WEBHOOK",
          attempts: 8,
          deliveredAt: null,
          lastError: "Webhook returned HTTP 503",
          createdAt: event.createdAt,
          availableAt: event.createdAt,
        },
      ]),
    );
    render(<SecurityCenter />);
    expect(await screen.findByText("Failed - retries exhausted")).toBeInTheDocument();
    expect(screen.getByText("Webhook returned HTTP 503")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry delivery" }));
    await waitFor(() => expect(controlPlatformService.retrySecurityDelivery).toHaveBeenCalledWith("delivery"));
    expect(await screen.findByText("Delivery queued for retry")).toBeInTheDocument();
  });
  it("clears browser auth cookies and returns to login after confirmed self-revocation", async () => {
    vi.mocked(controlPlatformService.securitySessions).mockResolvedValue(
      page([
        {
          id: "current",
          user: { id: "user", name: "Operator", email: "operator@example.test" },
          current: true,
          organizationId: null,
          ipAddress: "192.0.2.1",
          userAgent: "Test browser",
          createdAt: event.createdAt,
          expiresAt: "2099-01-01T00:00:00Z",
        },
      ]),
    );
    render(<SecurityCenter />);
    fireEvent.click(await screen.findByRole("button", { name: "Revoke session" }));
    expect(screen.getByText(/This is your current session/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Revocation reason/), { target: { value: "Operator test" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm session revocation" }));
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(navigation.replace).toHaveBeenCalledWith("/login");
    expect(navigation.refresh).toHaveBeenCalled();
  });
});
