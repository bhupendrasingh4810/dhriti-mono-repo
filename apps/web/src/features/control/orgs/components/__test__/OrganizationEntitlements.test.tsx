import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationEntitlements } from "../../organization-entitlements";
import { controlPlatformService, type PlatformOrganizationEntitlement } from "@/services/control.service";

vi.mock("@/services/control.service", () => ({
  controlPlatformService: { listOrganizationEntitlements: vi.fn(), updateOrganizationEntitlement: vi.fn() },
}));

const feature: PlatformOrganizationEntitlement = {
  id: "feature-a",
  key: "hrms.enabled",
  name: "HRMS",
  kind: "FEATURE",
  enabled: false,
  value: null,
  productKey: "hrms",
  description: null,
  unit: null,
};
const limit: PlatformOrganizationEntitlement = {
  ...feature,
  id: "limit-a",
  key: "max_users",
  name: "Maximum users",
  kind: "LIMIT",
  enabled: true,
  value: 25,
  unit: "users",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(controlPlatformService.listOrganizationEntitlements).mockResolvedValue([feature, limit]);
  vi.mocked(controlPlatformService.updateOrganizationEntitlement).mockImplementation(async (_id, input) => ({
    ...(input.key === feature.key ? feature : limit),
    enabled: input.enabled,
    value: input.value ?? null,
  }));
});
afterEach(cleanup);

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}

describe("OrganizationEntitlements", () => {
  it("renders uniform cards with exactly one disabled header save until edits exist", async () => {
    render(<OrganizationEntitlements organizationId="org-a" />);
    const card = await screen.findByRole("group", { name: "HRMS" });
    expect(screen.getAllByRole("button", { name: "Save" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(card.parentElement).toHaveClass("grid", "auto-rows-fr", "items-stretch", "xl:grid-cols-4");
    for (const item of screen.getAllByRole("group")) {
      expect(item).toHaveClass("h-full", "min-w-0", "flex", "flex-col");
      expect(item.firstElementChild).toHaveClass("flex-1");
    }
    expect(within(card).getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("spinbutton")).toHaveValue(25);
  });

  it("saves all changed cards together and does not resubmit unchanged values", async () => {
    render(<OrganizationEntitlements organizationId="org-b" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Enable HRMS" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
    expect(controlPlatformService.updateOrganizationEntitlement).not.toHaveBeenCalled();
    save();
    await screen.findByText("Entitlements updated.");
    expect(controlPlatformService.updateOrganizationEntitlement).toHaveBeenCalledTimes(2);
    expect(controlPlatformService.updateOrganizationEntitlement).toHaveBeenCalledWith("org-b", {
      key: feature.key,
      enabled: true,
    });
    expect(controlPlatformService.updateOrganizationEntitlement).toHaveBeenCalledWith("org-b", {
      key: limit.key,
      enabled: true,
      value: 0,
    });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("disables a limit using the header save", async () => {
    render(<OrganizationEntitlements organizationId="org-a" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Enable Maximum users" }));
    expect(screen.getByRole("spinbutton")).toBeDisabled();
    save();
    await screen.findByText("Entitlements updated.");
    expect(controlPlatformService.updateOrganizationEntitlement).toHaveBeenCalledWith("org-a", {
      key: limit.key,
      enabled: false,
    });
  });

  it.each(["", "-1", "0.5", "2147483648"])("blocks the entire save for invalid limit %s", async (value) => {
    render(<OrganizationEntitlements organizationId="org-a" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Enable HRMS" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value } });
    save();
    expect(screen.getByText("Enter a whole number between 0 and 2147483647.")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-invalid", "true");
    expect(controlPlatformService.updateOrganizationEntitlement).not.toHaveBeenCalled();
  });

  it("preserves failed edits after a partial save and retries only failed cards", async () => {
    vi.mocked(controlPlatformService.updateOrganizationEntitlement)
      .mockResolvedValueOnce({ ...feature, enabled: true })
      .mockRejectedValueOnce(new Error("Update denied"));
    render(<OrganizationEntitlements organizationId="org-a" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Enable HRMS" }));
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "30" } });
    save();
    await screen.findByText("Update denied");
    expect(screen.queryByText("Entitlements updated.")).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(30);
    save();
    await screen.findByText("Entitlements updated.");
    expect(controlPlatformService.updateOrganizationEntitlement).toHaveBeenCalledTimes(3);
    expect(controlPlatformService.updateOrganizationEntitlement).toHaveBeenLastCalledWith("org-a", {
      key: limit.key,
      enabled: true,
      value: 30,
    });
  });

  it("locks all controls while saving", async () => {
    let finish!: (item: PlatformOrganizationEntitlement) => void;
    vi.mocked(controlPlatformService.updateOrganizationEntitlement).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    render(<OrganizationEntitlements organizationId="org-a" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Enable HRMS" }));
    save();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("spinbutton")).toBeDisabled();
    for (const toggle of screen.getAllByRole("checkbox")) expect(toggle).toBeDisabled();
    finish({ ...feature, enabled: true });
    await screen.findByText("Entitlements updated.");
  });

  it("retries a failed load and shows an empty catalog explicitly", async () => {
    vi.mocked(controlPlatformService.listOrganizationEntitlements).mockRejectedValueOnce(
      new Error("Network unavailable"),
    );
    render(<OrganizationEntitlements organizationId="org-a" />);
    await screen.findByText("Network unavailable");
    vi.mocked(controlPlatformService.listOrganizationEntitlements).mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(screen.getByText("No entitlement definitions are available.")).toBeInTheDocument());
  });
});
