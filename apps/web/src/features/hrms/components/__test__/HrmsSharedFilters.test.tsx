import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hrmsService,
  type HrmsAttendanceRegularization,
  type HrmsEmployeeOptions,
  type HrmsLeaveCenterRequest,
} from "@/services/hrms.service";
import { EmployeeDirectory } from "../../workforce/employee-directory";
import { RegularizationList } from "../../attendance-regularization";
import { HrmsLeave } from "../../leave";

const navigation = vi.hoisted(() => ({ tab: "requests" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/acme/hrms/leave",
  useSearchParams: () => new URLSearchParams(`tab=${navigation.tab}`),
}));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: "org-1", slug: "acme" } } }) }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: () => true }) }));
vi.mock("@/features/settings/use-app-settings", () => ({ useAppSettingsState: () => ({ data: {} }) }));
vi.mock("../../components/upcoming-holidays", () => ({ useUpcomingHolidays: () => [] }));
vi.mock("@/services/hrms.service", () => ({
  hrmsService: {
    employees: { list: vi.fn(), options: vi.fn() },
    leave: {
      balances: vi.fn(),
      types: vi.fn(),
      myRequests: vi.fn(),
      myCompOff: vi.fn(),
      requests: vi.fn(),
      compOff: vi.fn(),
      team: vi.fn(),
    },
  },
}));
const options: HrmsEmployeeOptions = {
  members: [],
  departments: [{ id: "engineering", name: "Engineering" }],
  designations: [],
  locations: [],
  employmentTypes: [],
  shifts: [],
  managers: [],
};
const leaveRequest = (overrides: Partial<HrmsLeaveCenterRequest> = {}): HrmsLeaveCenterRequest => ({
  id: "leave-1",
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
  createdAt: "2026-11-14T10:00:00Z",
  employee: { id: "employee-1", employeeNumber: "EMP-1", user: { id: "user-1", name: "Alex Morgan", avatarUrl: null } },
  type: { id: "annual", name: "Annual leave", code: "AL" },
  ...overrides,
});
beforeEach(() => {
  vi.clearAllMocks();
  navigation.tab = "requests";
  vi.mocked(hrmsService.employees.options).mockResolvedValue(options);
  vi.mocked(hrmsService.employees.list).mockResolvedValue({
    items: [],
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    summary: { total: 0, active: 0, onLeave: 0, newJoiners: 0 },
  });
  vi.mocked(hrmsService.leave.balances).mockResolvedValue([]);
  vi.mocked(hrmsService.leave.types).mockResolvedValue([]);
  vi.mocked(hrmsService.leave.myRequests).mockResolvedValue([]);
  vi.mocked(hrmsService.leave.myCompOff).mockResolvedValue([]);
  vi.mocked(hrmsService.leave.requests).mockResolvedValue([
    leaveRequest(),
    leaveRequest({
      id: "leave-2",
      status: "APPROVED",
      employee: {
        id: "employee-2",
        employeeNumber: "EMP-2",
        user: { id: "user-2", name: "Sam Taylor", avatarUrl: null },
      },
    }),
  ]);
  vi.mocked(hrmsService.leave.compOff).mockResolvedValue([]);
  vi.mocked(hrmsService.leave.team).mockResolvedValue([]);
});
afterEach(cleanup);
describe("HRMS shared filters", () => {
  it("debounces workforce search and sends department/status filters without changing their API contract", async () => {
    render(<EmployeeDirectory onToast={vi.fn()} />);
    await waitFor(() => expect(hrmsService.employees.list).toHaveBeenCalled());
    fireEvent.change(screen.getByRole("textbox", { name: "Search employees" }), { target: { value: " Alex " } });
    expect(hrmsService.employees.list).not.toHaveBeenCalledWith("org-1", expect.objectContaining({ query: "Alex" }));
    await waitFor(() =>
      expect(hrmsService.employees.list).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({ query: "Alex", page: 1 }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Filter by department" }));
    fireEvent.click(await screen.findByRole("option", { name: "Engineering" }));
    await waitFor(() =>
      expect(hrmsService.employees.list).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({ departmentId: "engineering" }),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Filter by status" }));
    fireEvent.click(screen.getByRole("option", { name: "Active" }));
    await waitFor(() =>
      expect(hrmsService.employees.list).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({ status: "ACTIVE", departmentId: "engineering" }),
      ),
    );
  });
  it("filters regularization statuses using the shared selection", () => {
    const request = (id: string, status: HrmsAttendanceRegularization["status"]): HrmsAttendanceRegularization => ({
      id,
      employeeId: "employee-1",
      date: "2026-11-16",
      type: "OTHER",
      requestedCheckIn: null,
      requestedCheckOut: null,
      reason: id,
      status,
      decisionNote: null,
      decidedAt: null,
      createdAt: "2026-11-16T10:00:00Z",
      employee: { id: "employee-1", employeeNumber: "EMP-1", user: { id: "user-1", name: "Alex", avatarUrl: null } },
    });
    render(
      <RegularizationList
        requests={[request("pending request", "PENDING"), request("approved request", "APPROVED")]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Filter by status" }));
    fireEvent.click(screen.getByRole("option", { name: "Approved" }));
    expect(screen.getByText("approved request")).toBeInTheDocument();
    expect(screen.queryByText("pending request")).not.toBeInTheDocument();
  });
  it("spaces leave search from its header and filters request statuses and kinds", async () => {
    render(<HrmsLeave onToast={vi.fn()} />);
    await screen.findByText("Alex Morgan");
    const search = screen.getByRole("textbox", { name: "Search requests" });
    expect(search.closest(".flex.shrink-0.flex-wrap")).toHaveClass("py-3");
    fireEvent.change(search, { target: { value: "Alex" } });
    await waitFor(() => expect(screen.queryByText("Sam Taylor")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Clear Search requests" }));
    await screen.findByText("Sam Taylor");
    fireEvent.click(screen.getByRole("button", { name: "Filter by status" }));
    fireEvent.click(screen.getByRole("option", { name: "Approved" }));
    expect(screen.queryByText("Alex Morgan")).not.toBeInTheDocument();
    expect(screen.getByText("Sam Taylor")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Request type" }));
    fireEvent.click(screen.getByRole("option", { name: /Comp-off requests/ }));
    expect(screen.getByRole("heading", { name: "Comp-off requests" })).toBeInTheDocument();
  });
  it("uses shared Month/Week calendar selection", async () => {
    navigation.tab = "dashboard";
    render(<HrmsLeave onToast={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Calendar view" });
    fireEvent.click(trigger);
    fireEvent.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Week" }));
    expect(trigger).toHaveTextContent("Week");
  });
});
