import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HrmsDashboard } from "../../dashboard";

const mocks = vi.hoisted(() => ({ can: vi.fn(), leave: vi.fn(), payroll: vi.fn() }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { organization: { id: "org" } } }),
}));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: mocks.can }) }));
vi.mock("@/services/hrms-dashboard-metrics.service", () => ({
  dashboardMetricsService: { leave: mocks.leave, payroll: mocks.payroll },
}));
vi.mock("../../assets", () => ({
  MyAssets: ({ organizationId }: { organizationId: string }) => <div data-testid="my-assets">{organizationId}</div>,
}));

afterEach(cleanup);

describe("HRMS dashboard", () => {
  it("places authorized metrics beside My Assets below Workforce growth", async () => {
    mocks.can.mockReturnValue(true);
    mocks.leave.mockResolvedValue({ months: [{ month: "2026-11", days: 1.5 }], excludedLegacyRequests: 1 });
    mocks.payroll.mockResolvedValue({
      months: ["2026-11"],
      series: [
        { currency: "INR", values: ["1200"] },
        { currency: "USD", values: ["30"] },
      ],
    });
    render(<HrmsDashboard role="HR Admin" onToast={vi.fn()} />);
    const assets = screen.getByTestId("my-assets");
    const chart = screen.getByText("Workforce growth").closest(".overflow-hidden");
    expect(chart).not.toBeNull();
    expect(chart!.parentElement?.nextElementSibling?.nextElementSibling).toBe(assets.parentElement);
    expect(assets).toHaveTextContent("org");
    expect(screen.getAllByTestId("my-assets")).toHaveLength(1);
    expect(await screen.findByText("1.5 days")).toBeInTheDocument();
    expect(screen.getByText(/1 historical leave request/)).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "INR net payroll" })).toHaveTextContent("1,200");
    expect(screen.getByRole("region", { name: "USD net payroll" })).toHaveTextContent("30");
    expect(mocks.leave).toHaveBeenCalledWith("org");
    expect(mocks.payroll).toHaveBeenCalledWith("org");
  });

  it("does not fetch metrics without their respective permissions", async () => {
    mocks.can.mockReturnValue(false);
    mocks.leave.mockClear();
    mocks.payroll.mockClear();
    render(<HrmsDashboard role="HR Admin" onToast={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("my-assets")).toBeInTheDocument());
    expect(screen.queryByText("Leave taken")).not.toBeInTheDocument();
    expect(screen.queryByText("Net payroll")).not.toBeInTheDocument();
    expect(mocks.leave).not.toHaveBeenCalled();
    expect(mocks.payroll).not.toHaveBeenCalled();
  });

  it("shows loading failures and retries the affected metric independently", async () => {
    mocks.can.mockImplementation((permission: string) => permission === "hrms.leave.read");
    mocks.leave.mockReset();
    mocks.leave
      .mockRejectedValueOnce(new Error("Leave summary unavailable"))
      .mockResolvedValueOnce({ months: [{ month: "2026-11", days: 0.5 }], excludedLegacyRequests: 0 });
    render(<HrmsDashboard role="HR Admin" onToast={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Leave summary unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("0.5 days")).toBeInTheDocument();
    expect(screen.queryByText("Net payroll")).not.toBeInTheDocument();
  });

  it("retains My Assets for other dashboard roles", () => {
    render(<HrmsDashboard role="Employee" onToast={vi.fn()} />);
    expect(screen.getByTestId("my-assets")).toHaveTextContent("org");
  });
});
