import { HrmsLeaveCenterService } from "./hrms-leave-center.service";

const type = { id: "t1", name: "Casual", code: "CASUAL", category: "PERSONAL_LEAVE", annualDays: 6, carryForwardDays: 0, isPaid: true, allowHalfDay: true, isCompOff: false, isActive: true };

function build(settings: Record<string, unknown> = {}) {
  const prisma = {
    hrmsEmployee: {
      findFirst: jest.fn().mockResolvedValue({ id: "self" }),
      findUnique: jest.fn().mockResolvedValue({ startDate: new Date("2020-01-01"), endDate: null, resignationDate: null, status: "ACTIVE" }),
    },
    hrmsLeaveType: { create: jest.fn(), update: jest.fn(), count: jest.fn().mockResolvedValue(1), findMany: jest.fn().mockResolvedValue([type]), findFirst: jest.fn().mockResolvedValue(type) },
    hrmsLeaveRequest: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    hrmsCompOffRequest: { aggregate: jest.fn().mockResolvedValue({ _sum: { days: 0 } }) },
    $transaction: jest.fn(),
  };
  const appSettings = { update: jest.fn(), get: jest.fn().mockResolvedValue({ allowHalfDayLeave: true, maxLeaveRequestDays: null, leaveMinNoticeDays: 0, leaveBackdateLimitDays: null, leaveOnBehalfEnabled: false, ...settings }) };
  const service = new HrmsLeaveCenterService(prisma as never, { record: jest.fn() } as never, appSettings as never);
  return { service, prisma, appSettings };
}

const dates = { startDate: "2099-01-05", endDate: "2099-01-06" };

describe("HrmsLeaveCenterService", () => {
  it("rejects on-behalf requests for others when the setting is off", async () => {
    const { service } = build();
    await expect(
      service.apply("org", "user", { leaveTypeId: "t1", ...dates, totalDays: 2, employeeId: "other" }, true),
    ).rejects.toThrow("disabled in HRMS settings");
  });

  describe("monthly accrual", () => {
    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate", "queueMicrotask"] }).setSystemTime(new Date("2026-06-15T00:00:00Z"));
    });
    afterEach(() => jest.useRealTimers());

    it("credits annualDays / 12 per elapsed month, not the full year up front", async () => {
      const { service } = build();
      const [balance] = await service.balances("org", "user");
      expect(balance?.accruedMonths).toBe(6);
      expect(balance?.entitled).toBe(3);
    });

    it("rejects requests above the accrued balance", async () => {
      const { service } = build();
      await expect(
        service.apply("org", "user", { leaveTypeId: "t1", totalDays: 4, startDate: "2026-06-20", endDate: "2026-06-25" }, false),
      ).rejects.toThrow("Only 3 day(s)");
    });

    it("starts accruing in the joining month", async () => {
      const { service, prisma } = build();
      prisma.hrmsEmployee.findUnique.mockResolvedValue({ startDate: new Date("2026-04-20"), endDate: null, resignationDate: null, status: "ACTIVE" });
      const [balance] = await service.balances("org", "user");
      expect(balance?.accruedMonths).toBe(3);
    });

    it("stops crediting after the resignation date", async () => {
      const { service, prisma } = build();
      prisma.hrmsEmployee.findUnique.mockResolvedValue({ startDate: new Date("2020-01-01"), endDate: null, resignationDate: new Date("2026-03-10"), status: "ACTIVE" });
      const [balance] = await service.balances("org", "user");
      expect(balance?.accruedMonths).toBe(3);
    });
  });

  it("rejects totals larger than the date range", async () => {
    const { service } = build();
    await expect(service.apply("org", "user", { leaveTypeId: "t1", ...dates, totalDays: 3 }, false)).rejects.toThrow("exceed");
  });

  it("enforces minimum notice", async () => {
    const { service } = build({ leaveMinNoticeDays: 5 });
    const start = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await expect(service.apply("org", "user", { leaveTypeId: "t1", startDate: start, endDate: start, totalDays: 1 }, false)).rejects.toThrow("notice");
  });

  it("treats zero-entitlement non-comp-off types as unlimited", async () => {
    const { service, prisma } = build();
    prisma.hrmsLeaveType.findMany.mockResolvedValue([{ ...type, annualDays: 0 }]);
    const [balance] = await service.balances("org", "user");
    expect(balance?.unlimited).toBe(true);
    expect(balance?.available).toBeNull();
  });

  it("creates the birthday type only when enabled in settings", async () => {
    const { service, prisma } = build({ birthdayLeaveEnabled: true, birthdayLeaveDays: 2 });
    prisma.hrmsLeaveType.findMany.mockResolvedValue([]);
    await service.listTypes("org");
    expect(prisma.hrmsLeaveType.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ code: "BIRTHDAY", annualDays: 2 }) }));
    const off = build();
    off.prisma.hrmsLeaveType.findMany.mockResolvedValue([]);
    await off.service.listTypes("org");
    expect(off.prisma.hrmsLeaveType.create).not.toHaveBeenCalled();
  });

  it("turns the setting off when a system type is removed", async () => {
    const { service, prisma, appSettings } = build();
    prisma.hrmsLeaveType.findFirst.mockResolvedValue({ ...type, id: "opt", code: "OPTIONAL", _count: { requests: 0 } });
    (prisma.hrmsLeaveType as Record<string, unknown>).delete = jest.fn();
    await service.removeType("org", "actor", "opt");
    expect(appSettings.update).toHaveBeenCalledWith("hrms", "org", "actor", { optionalLeaveEnabled: false });
  });
});
