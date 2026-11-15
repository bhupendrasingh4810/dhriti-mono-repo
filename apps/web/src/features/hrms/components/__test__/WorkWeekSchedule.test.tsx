import { cleanup, render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkWeekSchedule } from "../../use-work-week-schedule";
import { buildAttendanceRange } from "../../attendance-data";

const mocks = vi.hoisted(() => ({ schedule: vi.fn() }));
vi.mock("@/services/hrms.service", () => ({ hrmsService: { workWeeks: mocks } }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function Preview({ organizationId, employeeId }: { organizationId: string; employeeId?: string }) {
  const schedule = useWorkWeekSchedule(organizationId, "2026-08-01", "2026-08-02", employeeId);
  return (
    <p>
      {schedule.error ??
        (schedule.days ? `Units ${schedule.days.reduce((sum, day) => sum + day.units, 0)}` : "Loading")}
    </p>
  );
}
describe("dated schedule consumers", () => {
  it("uses resolved weekly-off and half-day units instead of organization weekday assumptions", () => {
    const days = [
      {
        date: "2026-08-01",
        kind: "HALF_DAY" as const,
        units: 0.5,
        ruleId: "rule",
        ruleName: "Half Saturday",
        versionId: "v1",
      },
      {
        date: "2026-08-02",
        kind: "OFF" as const,
        units: 0,
        ruleId: "rule",
        ruleName: "Half Saturday",
        versionId: "v1",
      },
    ];
    const rows = buildAttendanceRange(dayjs("2026-08-01"), dayjs("2026-08-02"), [], [1, 2, 3, 4, 5, 6, 7], days);
    expect(rows[0].scheduledUnits).toBe(0.5);
    expect(rows[1].status).toBe("Weekly off");
  });
  it("ignores late responses after the target employee changes", async () => {
    let resolveOld: (result: unknown) => void = () => {};
    mocks.schedule.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
    );
    mocks.schedule.mockResolvedValue({ days: [{ date: "2026-08-01", units: 0.5 }] });
    const view = render(<Preview organizationId="org" employeeId="old" />);
    view.rerender(<Preview organizationId="org" employeeId="new" />);
    expect(await screen.findByText("Units 0.5")).toBeInTheDocument();
    resolveOld({ days: [{ date: "2026-08-01", units: 10 }] });
    await waitFor(() => expect(screen.getByText("Units 0.5")).toBeInTheDocument());
  });
  it("surfaces schedule failure instead of silently falling back", async () => {
    mocks.schedule.mockRejectedValue(new Error("Schedule unavailable"));
    render(<Preview organizationId="org" />);
    expect(await screen.findByText("Schedule unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/Units/)).not.toBeInTheDocument();
  });
});
