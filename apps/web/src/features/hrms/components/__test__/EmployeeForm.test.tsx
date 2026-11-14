import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HrmsEmployeeOptions } from "@/services/hrms.service";
import { EmployeeForm } from "../../workforce/employee-form";

afterEach(cleanup);
const options: HrmsEmployeeOptions = {
  members: [{ id: "user-1", name: "Alex", email: "alex@example.com" }],
  departments: [
    { id: "engineering", name: "Engineering" },
    { id: "design", name: "Design" },
  ],
  designations: [
    { id: "developer", name: "Developer", departmentId: "engineering" },
    { id: "designer", name: "Designer", departmentId: "design" },
  ],
  locations: [{ id: "office", name: "Head office" }],
  employmentTypes: [{ id: "full-time", name: "Full time" }],
  shifts: [],
  managers: [],
};
function select(label: string, option: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}
function setup() {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(<EmployeeForm employee={null} options={options} onClose={vi.fn()} onSubmit={onSubmit} />);
  return onSubmit;
}
describe("Employee form shared fields", () => {
  it("renders shared controls and required inline validation", () => {
    const onSubmit = setup();
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    expect(screen.getByRole("button", { name: "Member" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "Employee number" })).toHaveClass("text-sm");
    expect(screen.getByRole("textbox", { name: "Employee number" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Employee number is required.")).toHaveAttribute("role", "alert");
    expect(onSubmit).not.toHaveBeenCalled();
  });
  it("preserves designation filtering and resets designation after department changes", () => {
    setup();
    select("Department", "Engineering");
    fireEvent.click(screen.getByRole("button", { name: "Designation" }));
    expect(screen.getByRole("option", { name: "Developer" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Designer" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Developer" }));
    select("Department", "Design");
    expect(screen.getByRole("button", { name: "Designation" })).toHaveTextContent("Not specified");
    fireEvent.click(screen.getByRole("button", { name: "Designation" }));
    expect(screen.getByRole("option", { name: "Designer" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Developer" })).not.toBeInTheDocument();
  });
  it("preserves optional clearing and submission contracts including UTC joining date", async () => {
    const onSubmit = setup();
    select("Member", "Alex (alex@example.com)");
    fireEvent.change(screen.getByRole("textbox", { name: "Employee number" }), { target: { value: " EMP-001 " } });
    select("Work location", "Head office");
    select("Work location", "Not specified");
    fireEvent.click(screen.getByRole("button", { name: "Date of joining" }));
    const day = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.textContent === "14")
      ?.querySelector("button");
    if (!day) throw new Error("Calendar day not found");
    const calendar = screen.getByRole("grid").getAttribute("aria-label");
    fireEvent.click(day);
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      userId: "user-1",
      employeeNumber: "EMP-001",
      status: "ACTIVE",
      workLocationId: null,
      designationId: null,
    });
    expect(payload.startDate).toMatch(/T00:00:00.000Z$/);
    expect(
      new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(
        new Date(payload.startDate),
      ),
    ).toBe(calendar);
  });
  it("surfaces save failures inline", async () => {
    const onSubmit = setup();
    onSubmit.mockRejectedValue(new Error("Employee number already exists."));
    select("Member", "Alex (alex@example.com)");
    fireEvent.change(screen.getByRole("textbox", { name: "Employee number" }), { target: { value: "EMP-001" } });
    fireEvent.click(screen.getByRole("button", { name: "Add employee" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Employee number already exists."));
    expect(screen.getByRole("button", { name: "Add employee" })).not.toBeDisabled();
  });
});
