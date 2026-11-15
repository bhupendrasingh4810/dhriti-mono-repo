import { HrmsDashboardMetricsService } from "./hrms-dashboard-metrics.service";

const now = new Date("2026-11-15T12:00:00Z");
function setup() {
  const db = {
    hrmsLeaveRequest: { findMany: jest.fn() },
    hrmsPayrollRecord: { groupBy: jest.fn() },
  };
  return { db, service: new HrmsDashboardMetricsService(db as never) };
}

describe("HRMS dashboard metrics", () => {
  it("splits approved leave by actual date, excludes future days and reports ambiguous legacy data", async () => {
    const { db, service } = setup();
    db.hrmsLeaveRequest.findMany.mockResolvedValue([
      {
        startDate: new Date("2026-10-31"),
        endDate: new Date("2026-11-01"),
        totalDays: 1.5,
        dayAllocation: [
          { date: "2026-10-31", units: 1 },
          { date: "2026-11-01", units: 0.5 },
        ],
      },
      { startDate: new Date("2026-11-14"), endDate: new Date("2026-11-16"), totalDays: 3, dayAllocation: null },
      { startDate: new Date("2026-10-30"), endDate: new Date("2026-11-02"), totalDays: 2, dayAllocation: null },
      { startDate: new Date("2026-09-10"), endDate: new Date("2026-09-12"), totalDays: 2, dayAllocation: null },
    ]);
    const result = await service.leave("org", now);
    expect(result.months).toEqual([
      { month: "2026-06", days: 0 },
      { month: "2026-07", days: 0 },
      { month: "2026-08", days: 0 },
      { month: "2026-09", days: 2 },
      { month: "2026-10", days: 1 },
      { month: "2026-11", days: 2.5 },
    ]);
    expect(result.excludedLegacyRequests).toBe(1);
    expect(db.hrmsLeaveRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org", status: "APPROVED" }),
      }),
    );
  });

  it("rejects malformed allocations instead of silently reporting inaccurate days", async () => {
    const { db, service } = setup();
    db.hrmsLeaveRequest.findMany.mockResolvedValue([
      {
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-01"),
        totalDays: 1,
        dayAllocation: [{ date: "2026-11-01", units: 0.5 }],
      },
    ]);
    await expect(service.leave("org", now)).rejects.toThrow("does not match");
  });

  it("groups approved and paid net payroll by pay month and currency", async () => {
    const { db, service } = setup();
    db.hrmsPayrollRecord.groupBy.mockResolvedValue([
      { payDate: new Date("2026-11-01"), currency: "INR", _sum: { netPay: 100 } },
      { payDate: new Date("2026-11-15"), currency: "INR", _sum: { netPay: 50 } },
      { payDate: new Date("2026-10-01"), currency: "USD", _sum: { netPay: 7 } },
    ]);
    const result = await service.payroll("org", now);
    expect(result.series).toEqual([
      { currency: "INR", values: ["0", "0", "0", "0", "0", "150"] },
      { currency: "USD", values: ["0", "0", "0", "0", "7", "0"] },
    ]);
    expect(db.hrmsPayrollRecord.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org", status: { in: ["APPROVED", "PAID"] } }),
      }),
    );
  });
});
