import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsWorkWeek } from "../../HrmsWorkWeek";
import { presetWorkWeek } from "../../work-week-pattern";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  setDefault: vi.fn(),
  assign: vi.fn(),
  assignments: vi.fn(),
  employees: vi.fn(),
  can: vi.fn(),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org" } } }) }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: mocks.can, loading: false }) }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { workWeeks: mocks, employees: { list: mocks.employees } } }));
const date = new Date().toISOString().slice(0, 10);
const rule = {
  id: "rule",
  name: "Saturday Half Day",
  description: "Office schedule",
  revision: 1,
  versions: [{ id: "v1", effectiveFrom: `${date}T00:00:00Z`, pattern: presetWorkWeek("Saturday Half Day") }],
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.can.mockReturnValue(true);
  mocks.list.mockResolvedValue({ rules: [rule], defaults: [{ id: "default", ruleId: "rule", effectiveFrom: date }] });
  mocks.create.mockResolvedValue({ ...rule, id: "new-rule" });
  mocks.update.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue(undefined);
  mocks.setDefault.mockResolvedValue(undefined);
  mocks.assign.mockResolvedValue(undefined);
  mocks.assignments.mockResolvedValue([]);
  mocks.employees.mockResolvedValue({
    items: [{ id: "employee", employeeNumber: "EMP-1", user: { name: "Alex" } }],
    total: 1,
    page: 1,
    pageSize: 20,
  });
});
afterEach(cleanup);

describe("work-week settings", () => {
  it("shows a real saved pattern and supports cell cycling with required inline validation", async () => {
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit work-week rule" }));
    fireEvent.click(screen.getByRole("button", { name: "Occurrence 1 Sat: Half day" }));
    expect(screen.getByRole("button", { name: "Occurrence 1 Sat: Weekly off" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Rule name" }), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save rule" }));
    expect(screen.getByRole("textbox", { name: "Rule name" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Rule name is required.")).toBeInTheDocument();
    expect(mocks.update).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Rule name" }), { target: { value: "Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Save rule" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        "org",
        "rule",
        expect.objectContaining({ name: "Updated", revision: 1, effectiveFrom: date }),
      ),
    );
    expect(mocks.update.mock.calls[0][2].pattern[0][5]).toBe("OFF");
  });

  it("duplicates a rule without mutating its source and saves it separately", async () => {
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Duplicate" }));
    expect(screen.getByRole("textbox", { name: "Rule name" })).toHaveValue("Saturday Half Day (copy)");
    fireEvent.click(screen.getByRole("button", { name: "Save rule" }));
    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        "org",
        expect.objectContaining({ name: "Saturday Half Day (copy)", pattern: rule.versions[0].pattern }),
      ),
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("persists dated defaults and reports referenced-rule deletion errors honestly", async () => {
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Set as default" }));
    fireEvent.click(screen.getByRole("button", { name: "Set default" }));
    await waitFor(() => expect(mocks.setDefault).toHaveBeenCalledWith("org", "rule", date));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Set default work week" })).not.toBeInTheDocument(),
    );
    mocks.remove.mockRejectedValue(new Error("Rule is referenced by assignment history"));
    fireEvent.click(screen.getByRole("button", { name: "Delete work-week rule" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Rule is referenced");
    expect(screen.getByRole("heading", { name: "Saturday Half Day" })).toBeInTheDocument();
  });

  it("assigns selected employees from a date and supports default-following", async () => {
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    await screen.findByRole("heading", { name: "Saturday Half Day" });
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Employees" }));
    fireEvent.click(await screen.findByRole("option", { name: "Alex (EMP-1)" }));
    expect(screen.getByRole("button", { name: "Remove Alex (EMP-1)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Work-week rule" }));
    fireEvent.click(screen.getByRole("option", { name: "Follow organization default" }));
    fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
    await waitFor(() =>
      expect(mocks.assign).toHaveBeenCalledWith("org", {
        employeeIds: ["employee"],
        ruleId: null,
        effectiveFrom: date,
      }),
    );
  });

  it("assigns all employees independently of search and selection", async () => {
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    await screen.findByRole("heading", { name: "Saturday Half Day" });
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));
    const picker = screen.getByRole("combobox", { name: "Employees" });
    fireEvent.change(picker, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: "Assign all employees" }));
    expect(screen.queryByRole("combobox", { name: "Employees" })).not.toBeInTheDocument();
    expect(screen.getByText(/every non-archived employee/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
    await waitFor(() =>
      expect(mocks.assign).toHaveBeenCalledWith("org", {
        allEmployees: true,
        ruleId: "rule",
        effectiveFrom: date,
      }),
    );
  });

  it("preserves chips across searches, supports removal, and loads more matches", async () => {
    mocks.employees.mockImplementation((_org, query) =>
      Promise.resolve({
        items:
          query.query === "Sam"
            ? [{ id: "sam", employeeNumber: "EMP-2", user: { name: "Sam" } }]
            : query.page === 1
              ? [{ id: "employee", employeeNumber: "EMP-1", user: { name: "Alex" } }]
              : [{ id: "jane", employeeNumber: "EMP-3", user: { name: "Jane" } }],
        total: query.query ? 1 : 2,
        page: query.page,
        pageSize: 50,
      }),
    );
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    await screen.findByRole("heading", { name: "Saturday Half Day" });
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));
    const picker = screen.getByRole("combobox", { name: "Employees" });
    expect(screen.queryByRole("option", { name: "Alex (EMP-1)" })).not.toBeInTheDocument();
    fireEvent.click(picker);
    fireEvent.click(await screen.findByRole("option", { name: "Alex (EMP-1)" }));
    fireEvent.click(await screen.findByRole("button", { name: "Load more employees" }));
    expect(await screen.findByRole("option", { name: "Jane (EMP-3)" })).toBeInTheDocument();
    fireEvent.change(picker, { target: { value: "Sam" } });
    fireEvent.click(await screen.findByRole("option", { name: "Sam (EMP-2)" }));
    expect(screen.getByRole("button", { name: "Remove Alex (EMP-1)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Sam (EMP-2)" }));
    fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
    await waitFor(() =>
      expect(mocks.assign).toHaveBeenCalledWith("org", {
        employeeIds: ["employee"],
        ruleId: "rule",
        effectiveFrom: date,
      }),
    );
  });

  it("validates the employee combobox and shows bulk-assignment failures without success", async () => {
    mocks.assign.mockRejectedValue(new Error("Assignment conflict"));
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    await screen.findByRole("heading", { name: "Saturday Half Day" });
    fireEvent.click(screen.getByRole("button", { name: "Assign" }));
    fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
    expect(screen.getByRole("combobox", { name: "Employees" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Select at least one employee.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Assign all employees" }));
    fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Assignment conflict");
    expect(screen.getByRole("dialog", { name: "Assign work week" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose specific employees" }));
    expect(screen.getByRole("combobox", { name: "Employees" })).toBeInTheDocument();
  });

  it("blocks configuration without settings permission", async () => {
    mocks.can.mockReturnValue(false);
    render(<HrmsWorkWeek onToast={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Organization settings permission");
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
