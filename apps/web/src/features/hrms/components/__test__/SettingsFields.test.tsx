import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsDepartments } from "../../HrmsDepartments";
import { HrmsLeaveTypes } from "../../HrmsLeaveTypes";
import { HrmsShifts } from "../../HrmsShifts";
import { WorkflowDefinitionEditor } from "../../workflows/WorkflowSetting";

const mocks = vi.hoisted(() => ({
  departments: { list: vi.fn(), create: vi.fn() },
  leave: { types: vi.fn(), saveType: vi.fn() },
  shifts: { list: vi.fn(), create: vi.fn() },
  workflows: { create: vi.fn() },
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useParams: () => ({ organizationSlug: "acme" }), useRouter: () => ({ replace: mocks.replace }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org-1" } } }) }));
vi.mock("@/services/organization-management.service", () => ({ organizationAccessService: { departments: mocks.departments } }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { leave: mocks.leave, shifts: mocks.shifts, workflowDefinitions: mocks.workflows } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.departments.list.mockResolvedValue([{ id: "parent", name: "Operations" }]);
  mocks.departments.create.mockResolvedValue({});
  mocks.leave.types.mockResolvedValue([]);
  mocks.leave.saveType.mockResolvedValue({});
  mocks.shifts.list.mockResolvedValue([]);
  mocks.shifts.create.mockResolvedValue({});
  mocks.workflows.create.mockResolvedValue({ id: "workflow-1" });
});
afterEach(cleanup);

describe("HRMS settings controlled fields", () => {
  it("validates and submits a department with generated code and selected parent", async () => {
    render(<HrmsDepartments onToast={vi.fn()} />);
    await screen.findByText("Operations");
    fireEvent.click(screen.getByRole("button", { name: "Add department" }));
    const dialog = screen.getByRole("dialog", { name: "Add department" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add department" }));
    const name = within(dialog).getByRole("textbox", { name: /Department name/ });
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByText("Name is required.")).toBeInTheDocument();
    fireEvent.change(name, { target: { value: "Customer Support" } });
    expect(within(dialog).getByRole("textbox", { name: /Code/ })).toHaveValue("customer-support");
    fireEvent.click(within(dialog).getByRole("button", { name: "Parent department" }));
    fireEvent.click(screen.getByRole("option", { name: "Operations" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Add department" }));
    await waitFor(() => expect(mocks.departments.create).toHaveBeenCalledWith("org-1", { name: "Customer Support", code: "customer-support", parentId: "parent" }));
  });

  it("retains leave validation, category, and comp-off submission semantics", async () => {
    render(<HrmsLeaveTypes onToast={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add leave type" }));
    const dialog = screen.getByRole("dialog", { name: "Leave type" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByText("Name is required.")).toBeInTheDocument();
    expect(within(dialog).getByText("Use 2–20 capital letters, digits or underscores.")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole("textbox", { name: /Name/ }), { target: { value: "Comp off" } });
    fireEvent.change(within(dialog).getByRole("textbox", { name: /Code/ }), { target: { value: "comp" } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Balance comes from approved comp-off" }));
    expect(within(dialog).getByRole("spinbutton", { name: "Days per year" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.leave.saveType).toHaveBeenCalledWith("org-1", expect.objectContaining({ name: "Comp off", code: "COMP", annualDays: 0, isCompOff: true })));
  });

  it("retains shift required validation and active state", async () => {
    render(<HrmsShifts onToast={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Add shift" }));
    const dialog = screen.getByRole("dialog", { name: "Add shift" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(within(dialog).getByText("Name is required.")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole("textbox", { name: /Shift name/ }), { target: { value: "Day" } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "Active" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.shifts.create).toHaveBeenCalledWith("org-1", expect.objectContaining({ name: "Day", startTime: "09:00", endTime: "18:00", isActive: false })));
  });
  it("validates workflow names and stages and submits controlled stage settings", async () => {
    render(<WorkflowDefinitionEditor />);
    fireEvent.click(screen.getByRole("button", { name: "Add stage" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(screen.getByText("Workflow name is required.")).toBeInTheDocument();
    expect(screen.getByText("Every stage needs a name.")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /Workflow name/ }), { target: { value: "Leave approval" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Stage 2 name" }), { target: { value: "Manager review" } });
    const selects = screen.getAllByRole("button", { name: "Stage type" });
    fireEvent.click(selects[1]);
    fireEvent.click(screen.getByRole("option", { name: "Task" }));
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(mocks.workflows.create).toHaveBeenCalledWith("org-1", expect.objectContaining({ name: "Leave approval", stages: expect.arrayContaining([expect.objectContaining({ name: "Manager review", type: "TASK" })]) })));
  });

});
