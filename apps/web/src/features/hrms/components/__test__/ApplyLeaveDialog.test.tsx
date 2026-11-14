import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hrmsService, type HrmsLeaveBalance } from "@/services/hrms.service";
import { ApplyLeaveDialog } from "../../leave-dialogs";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { organization: { id: "org-1" } } }),
}));
vi.mock("@/services/hrms.service", () => ({
  hrmsService: { leave: { apply: vi.fn() } },
}));
vi.mock("../../components/date-fields", () => ({
  DateField: ({ label, value }: { label: string; value: dayjs.Dayjs }) => (
    <button type="button" aria-label={label}>
      {value.format("YYYY-MM-DD")}
    </button>
  ),
}));

const balance = (overrides: Partial<HrmsLeaveBalance> = {}): HrmsLeaveBalance => ({
  typeId: "annual",
  name: "Annual leave",
  code: "AL",
  isPaid: true,
  isCompOff: false,
  allowHalfDay: true,
  unlimited: false,
  entitled: 12,
  annualDays: 12,
  accruedMonths: 12,
  used: 0,
  pending: 0,
  available: 12,
  ...overrides,
});
function setup(balances: HrmsLeaveBalance[] = [balance()]) {
  const onDone = vi.fn();
  render(
    <ApplyLeaveDialog
      balances={balances}
      workingDays={[1, 2, 3, 4, 5]}
      halfDayAllowed
      employees={null}
      initialDate={dayjs("2026-11-16")}
      onClose={vi.fn()}
      onDone={onDone}
    />,
  );
  return { onDone };
}
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("Apply Leave shared selection", () => {
  it("uses the default shared select and preserves balance labels and comp-off eligibility", () => {
    setup([
      balance(),
      balance({ typeId: "unlimited", name: "Unpaid leave", available: null, unlimited: true }),
      balance({ typeId: "empty-comp", name: "Empty comp-off", isCompOff: true, available: 0 }),
      balance({ typeId: "comp", name: "Comp-off", isCompOff: true, available: 2 }),
    ]);
    const trigger = screen.getByRole("button", { name: "Leave type" });
    expect(trigger).toHaveTextContent("Select leave type");
    expect(trigger.parentElement).toHaveClass("rounded-md", "bg-surface");
    fireEvent.click(trigger);
    expect(screen.getByRole("option", { name: "Annual leave · 12 days" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Unpaid leave" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Comp-off · 2 days" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Empty comp-off/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Annual leave · 12 days" }));
    expect(trigger).toHaveTextContent("Annual leave · 12 days");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows required validation directly under the selection and clears it on selection", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    const trigger = screen.getByRole("button", { name: "Leave type" });
    const message = screen.getByText("Select a leave type.");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger.parentElement).toHaveClass("border-error");
    expect(trigger.parentElement?.parentElement?.nextElementSibling).toBe(message);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Annual leave · 12 days" }));
    expect(trigger).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByText("Select a leave type.")).not.toBeInTheDocument();
    expect(hrmsService.leave.apply).not.toHaveBeenCalled();
  });

  it("resets half-day selection when changing the leave type", () => {
    setup([balance(), balance({ typeId: "sick", name: "Sick leave", available: 5 })]);
    const trigger = screen.getByRole("button", { name: "Leave type" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Annual leave · 12 days" }));
    const halfDay = screen.getByRole("checkbox");
    fireEvent.click(halfDay);
    expect(halfDay).toBeChecked();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("option", { name: "Sick leave · 5 days" }));
    expect(halfDay).not.toBeChecked();
    expect(screen.getByText("1 day(s)")).toBeInTheDocument();
  });

  it("submits the selected leave type id using the existing request contract", async () => {
    vi.mocked(hrmsService.leave.apply).mockResolvedValue({
      id: "request-1",
      employeeId: "employee-1",
      leaveTypeId: "annual",
      startDate: "2026-11-16",
      endDate: "2026-11-16",
      totalDays: 1,
      reason: "Family visit",
      status: "PENDING",
      rejectionReason: null,
      moreInfoNote: null,
      moreInfoReply: null,
      attachmentFileId: null,
      attachmentName: null,
    });
    const { onDone } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Leave type" }));
    fireEvent.click(screen.getByRole("option", { name: "Annual leave · 12 days" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Reason/ }), { target: { value: "Family visit" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith("Leave request submitted for approval"));
    expect(hrmsService.leave.apply).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        leaveTypeId: "annual",
        startDate: "2026-11-16",
        endDate: "2026-11-16",
        totalDays: 1,
        reason: "Family visit",
      }),
      false,
    );
  });

  it("shows an explicit empty state when no eligible leave types exist", () => {
    setup([]);
    fireEvent.click(screen.getByRole("button", { name: "Leave type" }));
    expect(screen.getByText("No leave types available")).toBeInTheDocument();
  });
});
