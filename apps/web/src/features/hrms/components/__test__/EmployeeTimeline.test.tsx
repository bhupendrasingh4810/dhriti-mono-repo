import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeTimeline } from "../../workforce/employee-timeline";

const mocks = vi.hoisted(() => ({ timeline: vi.fn() }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { employees: mocks } }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.timeline.mockResolvedValue({
    total: 25,
    page: 1,
    pageSize: 20,
    items: [
      {
        id: "event-a",
        action: "hrms.employee.updated",
        recordedAt: "2026-11-01T10:00:00Z",
        actor: { id: "actor-a", name: "HR manager" },
        hasChangeDetails: true,
        changes: [{ field: "designationId", label: "Designation", before: "Engineer", after: "Senior engineer" }],
      },
    ],
  });
});
describe("employee career timeline", () => {
  it("shows persisted changes, the actor and accessible pagination", async () => {
    render(<EmployeeTimeline organizationId="org-a" employeeId="employee-a" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading employee timeline");
    await screen.findByText("Employee details updated");
    expect(screen.getByText("Engineer → Senior engineer")).toBeInTheDocument();
    expect(screen.getByText(/HR manager/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous timeline page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next timeline page" }));
    await waitFor(() => expect(mocks.timeline).toHaveBeenLastCalledWith("org-a", "employee-a", 2, 20));
    await screen.findByText("Employee details updated");
    fireEvent.change(screen.getByRole("combobox", { name: "Timeline rows per page" }), { target: { value: "10" } });
    await waitFor(() => expect(mocks.timeline).toHaveBeenLastCalledWith("org-a", "employee-a", 1, 10));
  });
  it("handles empty data without implying earlier history exists", async () => {
    mocks.timeline.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    render(<EmployeeTimeline organizationId="org-a" employeeId="employee-a" />);
    await screen.findByText(/No recorded events on this page/);
    expect(screen.getByRole("button", { name: "Next timeline page" })).toBeDisabled();
    expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
  });
  it("distinguishes legacy history from an edit with no tracked job changes", async () => {
    mocks.timeline.mockResolvedValue({
      items: [
        {
          id: "a",
          action: "hrms.employee.created",
          recordedAt: "2026-01-01T00:00:00Z",
          actor: null,
          changes: [],
          hasChangeDetails: false,
        },
        {
          id: "b",
          action: "hrms.employee.updated",
          recordedAt: "2026-11-01T00:00:00Z",
          actor: null,
          changes: [],
          hasChangeDetails: true,
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    });
    render(<EmployeeTimeline organizationId="org-a" employeeId="employee-a" />);
    await screen.findByText("Detailed field history was not recorded for this event.");
    expect(screen.getByText("No tracked job fields changed.")).toBeInTheDocument();
    expect(screen.getAllByText(/Former or unavailable user/)).toHaveLength(2);
  });
  it("surfaces errors and retries without showing stale history", async () => {
    mocks.timeline.mockRejectedValueOnce(new Error("Timeline unavailable"));
    render(<EmployeeTimeline organizationId="org-a" employeeId="employee-a" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Timeline unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry timeline" }));
    await screen.findByText("Employee details updated");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("ignores responses for an employee after the selection changes", async () => {
    let resolveOld: (value: unknown) => void = () => {};
    mocks.timeline.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    const view = render(<EmployeeTimeline organizationId="org-a" employeeId="employee-a" />);
    view.rerender(<EmployeeTimeline organizationId="org-b" employeeId="employee-b" />);
    await screen.findByText("Employee details updated");
    resolveOld({ items: [], total: 0, page: 1, pageSize: 20 });
    await waitFor(() => expect(screen.getByText("Employee details updated")).toBeInTheDocument());
    expect(mocks.timeline).toHaveBeenLastCalledWith("org-b", "employee-b", 1, 20);
  });
});
