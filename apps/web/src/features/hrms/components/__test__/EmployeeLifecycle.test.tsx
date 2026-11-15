import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeLifecycle } from "../../workforce/employee-lifecycle";
import type { HrmsEmployeeLifecycleResponse } from "@dhriti/types";

const mocks = vi.hoisted(() => ({ lifecycle: vi.fn(), readiness: vi.fn(), updateLifecycle: vi.fn() }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { employees: mocks } }));
const empty: HrmsEmployeeLifecycleResponse = {
  data: {
    probationEndDate: null,
    probationConfirmedOn: null,
    contractStartDate: null,
    contractEndDate: null,
    noticePeriodDays: null,
    approvedLastWorkingDate: null,
  },
  version: 0,
  asOf: "2026-11-15",
  probationStatus: "UNCONFIGURED",
  contractStatus: "UNCONFIGURED",
  proposedLastWorkingDate: null,
  history: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.lifecycle.mockResolvedValue(empty);
  mocks.readiness.mockResolvedValue({
    complete: 0,
    total: 1,
    checks: [{ key: "manager", label: "Reporting manager", status: "ATTENTION", message: "No manager assigned." }],
  });
  mocks.updateLifecycle.mockResolvedValue({ ...empty, version: 1, data: { ...empty.data, noticePeriodDays: 30 } });
});
afterEach(cleanup);
const renderPanel = () =>
  render(
    <EmployeeLifecycle organizationId="org" employeeId="employee" onDirtyChange={vi.fn()} onBusyChange={vi.fn()} />,
  );
describe("employee lifecycle", () => {
  it("shows unconfigured policies and advisory setup checks without inventing defaults", async () => {
    renderPanel();
    expect(await screen.findByText("Setup checklist · 0/1")).toBeInTheDocument();
    expect(screen.getByText("No manager assigned.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Notice period days" })).toHaveValue("");
    expect(screen.getByText(/No automatic confirmation/)).toBeInTheDocument();
  });
  it("validates reasons inline and submits typed configuration with the saved version", async () => {
    renderPanel();
    await screen.findByRole("button", { name: "Save decision" });
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    expect(screen.getByRole("textbox", { name: "Reason" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Reason is required.")).toBeInTheDocument();
    expect(mocks.updateLifecycle).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Notice period days" }), { target: { value: "30" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Reason" }), { target: { value: "Approved notice terms" } });
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    await waitFor(() =>
      expect(mocks.updateLifecycle).toHaveBeenCalledWith("org", "employee", {
        action: "CONFIGURE",
        version: 0,
        reason: "Approved notice terms",
        data: { probationEndDate: null, contractStartDate: null, contractEndDate: null, noticePeriodDays: 30 },
      }),
    );
    expect(await screen.findByText("Lifecycle decision saved.")).toBeInTheDocument();
  });
  it("does not submit fractional or invalid notice days", async () => {
    renderPanel();
    await screen.findByRole("button", { name: "Save decision" });
    fireEvent.change(screen.getByRole("textbox", { name: "Reason" }), { target: { value: "Reviewed" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Notice period days" }), { target: { value: "1.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    expect(mocks.updateLifecycle).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Notice period days" })).toHaveAttribute("aria-invalid", "true");
  });
  it("surfaces stale-edit errors and retains unsaved values", async () => {
    mocks.updateLifecycle.mockRejectedValue(new Error("Lifecycle data changed. Reload before saving."));
    renderPanel();
    await screen.findByRole("button", { name: "Save decision" });
    fireEvent.change(screen.getByRole("textbox", { name: "Reason" }), { target: { value: "Keep my reason" } });
    fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Lifecycle data changed");
    expect(screen.getByRole("textbox", { name: "Reason" })).toHaveValue("Keep my reason");
    expect(screen.queryByText("Lifecycle decision saved.")).not.toBeInTheDocument();
  });
  it("fails visibly and permits retry when the API is unavailable", async () => {
    mocks.lifecycle.mockRejectedValueOnce(new Error("Foundation API unavailable"));
    renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent("Foundation API unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry foundations" }));
    expect(await screen.findByRole("button", { name: "Save decision" })).toBeInTheDocument();
  });
  it("confirms before discarding drafts to reload a stale editor", async () => {
    renderPanel();
    await screen.findByRole("button", { name: "Save decision" });
    fireEvent.change(screen.getByRole("textbox", { name: "Reason" }), { target: { value: "Unsaved reason" } });
    fireEvent.click(screen.getByRole("button", { name: "Reload tracking" }));
    expect(screen.getByRole("dialog", { name: "Reload lifecycle tracking?" })).toBeInTheDocument();
    expect(mocks.lifecycle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(mocks.lifecycle).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("textbox", { name: "Reason" })).toHaveValue("");
  });
});
