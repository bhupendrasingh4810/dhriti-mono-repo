import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "@/components/layout/workspace/sidebar";
import { MobileNavOverlays } from "@/components/layout/workspace/mobile-nav";
import { APP_ENTITLEMENTS_CHANGED } from "@/hooks/use-app-entitlements";
import { tenantRequest } from "@/services/request.service";

const auth = vi.hoisted(() => ({ user: { organization: { id: "org-a" }, isPlatformUser: false } }));
const featuresRequest = vi.hoisted(() => vi.fn());
const controlAccess = vi.hoisted(() => ({ isOrganizationAdministrator: true }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => auth }));
vi.mock("@/services/request.service", () => ({
  tenantRequest: vi.fn(),
  pathSegment: encodeURIComponent,
}));
vi.mock("@/contexts/mobile-nav-context", () => ({
  useMobileNav: () => ({
    appsOpen: true, menuOpen: false, setAppsOpen: vi.fn(), setMenuOpen: vi.fn(), setDrawerEl: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  controlAccess.isOrganizationAdministrator = true;
  vi.mocked(tenantRequest).mockImplementation((_organizationId, path) =>
    path.endsWith("/control-access") ? Promise.resolve(controlAccess) : featuresRequest(),
  );
  auth.user = { organization: { id: "org-a" }, isPlatformUser: false };
  featuresRequest.mockResolvedValue([
    { key: "connect.enabled", enabled: false },
    { key: "flow.enabled", enabled: true },
  ]);
});
afterEach(cleanup);

describe("Entitlement-aware app navigation", () => {
  it("hides disabled and missing products in desktop and mobile menus, including for platform staff", async () => {
    auth.user.isPlatformUser = true;
    render(<><Sidebar activeView="home" organizationSlug="acme" />
      <MobileNavOverlays activeView="home" organizationSlug="acme" /></>);
    await waitFor(() => expect(screen.getAllByRole("link", { name: /Flow/ })).toHaveLength(2));
    expect(screen.queryByRole("link", { name: /Connect/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /HRMS/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Home" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Control" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();
    expect(tenantRequest).toHaveBeenCalledTimes(2);
    expect(tenantRequest).toHaveBeenCalledWith("org-a", "/api/organizations/org-a/me/entitlements");
  });

  it.each([false, true])("applies explicit Control and Notes entitlements in both menus (platform staff: %s)", async (isPlatformUser) => {
    auth.user.isPlatformUser = isPlatformUser;
    featuresRequest.mockResolvedValue([
      { key: "control.enabled", enabled: true },
      { key: "notes.enabled", enabled: true },
    ]);
    render(<><Sidebar activeView="home" organizationSlug="acme" />
      <MobileNavOverlays activeView="home" organizationSlug="acme" /></>);
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Control" })).toHaveLength(2);
      expect(screen.getAllByRole("link", { name: "Notes" })).toHaveLength(2);
    });
    featuresRequest.mockResolvedValue([
      { key: "control.enabled", enabled: false },
      { key: "notes.enabled", enabled: false },
    ]);
    fireEvent(window, new Event(APP_ENTITLEMENTS_CHANGED));
    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "Control" })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();
    });
  });

  it("updates app access on focus and after a save event", async () => {
    render(<Sidebar activeView="home" organizationSlug="acme" />);
    await screen.findByRole("link", { name: /Flow/ });
    featuresRequest.mockResolvedValue([{ key: "connect.enabled", enabled: true }]);
    fireEvent(window, new Event("focus"));
    await screen.findByRole("link", { name: /Connect/ });
    expect(screen.queryByRole("link", { name: /Flow/ })).not.toBeInTheDocument();
    featuresRequest.mockResolvedValue([]);
    fireEvent(window, new Event(APP_ENTITLEMENTS_CHANGED));
    await waitFor(() => expect(screen.queryByRole("link", { name: /Connect/ })).not.toBeInTheDocument());
  });

  it("never carries enabled features into a different organization", async () => {
    const view = render(<Sidebar activeView="home" organizationSlug="acme" />);
    await screen.findByRole("link", { name: /Flow/ });
    auth.user.organization.id = "org-b";
    featuresRequest.mockResolvedValue([]);
    view.rerender(<Sidebar activeView="home" organizationSlug="other" />);
    expect(screen.queryByRole("link", { name: /Flow/ })).not.toBeInTheDocument();
    await waitFor(() => expect(tenantRequest).toHaveBeenCalledWith("org-b", "/api/organizations/org-b/me/entitlements"));
    await act(async () => {});
  });

  it("reports load failures and hides gated apps rather than granting fallback access", async () => {
    featuresRequest.mockRejectedValue(new Error("Service unavailable"));
    render(<Sidebar activeView="home" organizationSlug="acme" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("App access unavailable");
    expect(screen.queryByRole("link", { name: /Connect/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Flow/ })).not.toBeInTheDocument();
  });

  it("hides Control from ordinary members even with its entitlement enabled", async () => {
    controlAccess.isOrganizationAdministrator = false;
    featuresRequest.mockResolvedValue([
      { key: "control.enabled", enabled: true },
      { key: "notes.enabled", enabled: true },
    ]);
    render(<><Sidebar activeView="home" organizationSlug="acme" />
      <MobileNavOverlays activeView="home" organizationSlug="acme" /></>);
    await waitFor(() => expect(screen.getAllByRole("link", { name: "Notes" })).toHaveLength(2));
    expect(screen.queryByRole("link", { name: "Control" })).not.toBeInTheDocument();
  });
});
