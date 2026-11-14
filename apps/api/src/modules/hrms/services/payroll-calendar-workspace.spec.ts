import { Prisma } from "@prisma/client";
import { HrmsPayrollWorkspaceService } from "./hrms-payroll-workspace.service";

describe("payroll calendar orchestration", () => {
  const profile = {
    id: "profile",
    frequency: "WEEKLY",
    calendarAnchor: new Date("2026-01-05"),
    payDateOffset: 2,
    effectiveFrom: new Date("2026-01-05"),
    employmentModel: "EMPLOYEE",
    currency: "INR",
    minorUnits: 2,
    rulesVerified: true,
    workLocationId: null,
  };
  const assignment = {
    id: "salary",
    employeeId: "employee",
    effectiveFrom: new Date("2026-01-05"),
    monthlyGross: new Prisma.Decimal(10000),
    structure: {
      profileId: "profile",
      components: [{ code: "BASIC", name: "Basic", type: "EARNING", calculation: "REMAINDER", value: "0" }],
    },
    employee: {
      id: "employee",
      employeeNumber: "E1",
      user: { name: "Synthetic employee" },
      startDate: null,
      endDate: null,
    },
  };
  const input = {
    profileId: "profile",
    period: "2026-11-02",
    payDate: "2026-11-10",
    prorationPolicy: "CALENDAR_DAYS" as const,
  };
  function setup() {
    const db = {
      hrmsPayrollProfile: { findFirst: jest.fn().mockResolvedValue(profile), create: jest.fn() },
      hrmsSalaryAssignment: { findMany: jest.fn().mockResolvedValue([assignment]) },
      hrmsLeaveRequest: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      hrmsAttendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
      hrmsExpenseClaim: { findMany: jest.fn().mockResolvedValue([]) },
      hrmsPayrollRecord: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), createMany: jest.fn() },
      hrmsVariablePayInput: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      hrmsEmployee: { findFirst: jest.fn().mockResolvedValue(null) },
      hrmsPayrollRun: {
        findFirst: jest.fn().mockResolvedValue({
          id: "run",
          profileId: "profile",
          scopeKey: "ALL",
          period: input.period,
          payDate: new Date(input.payDate),
          preparedById: "preparer",
          status: "DRAFT",
          snapshot: { prorationPolicy: "CALENDAR_DAYS" },
        }),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    const prisma = { ...db, $transaction: <T>(callback: (client: typeof db) => Promise<T>) => callback(db) };
    const service = new HrmsPayrollWorkspaceService(prisma as never, { record: jest.fn() } as never);
    return { db, service };
  }
  it("uses configured weekly dates for attendance, claims, variance, snapshots and canonical approval records", async () => {
    const { db, service } = setup();
    const result = await service.preview("org", input);
    expect(result).toMatchObject({
      periodStart: "2026-11-02",
      periodEnd: "2026-11-08",
      scheduledPayDate: "2026-11-10",
      salaryAllocation: "MONTHLY_CALENDAR",
      totalNet: "2333.34",
      items: [{ monthlyCtc: "10000.00", proration: { allocation: "MONTHLY_CALENDAR", periodDays: 7 } }],
    });
    expect(db.hrmsAttendanceRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ date: { gte: new Date("2026-11-02"), lte: new Date("2026-11-08") } }),
      }),
    );
    await service.transition("org", "approver", "run", "approve");
    expect(db.hrmsPayrollRecord.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          period: "2026-11-02",
          periodStart: new Date("2026-11-02"),
          periodEnd: new Date("2026-11-08"),
          netPay: 2333.34,
        }),
      ],
    });
  });
  it("rejects malformed, unaligned, legacy-policy and pre-end-date runs without creating records", async () => {
    const { service, db } = setup();
    for (const patch of [
      { period: "2026-11" },
      { period: "2026-11-03" },
      { prorationPolicy: "NONE" as const },
      { payDate: "2026-11-07" },
    ]) {
      await expect(service.preview("org", { ...input, ...patch })).rejects.toThrow();
    }
    db.hrmsPayrollRecord.findFirst.mockResolvedValue({ id: "legacy" });
    await expect(service.transition("org", "approver", "run", "approve")).rejects.toThrow("overlapping");
    expect(db.hrmsPayrollRecord.createMany).not.toHaveBeenCalled();
  });
  it("resolves tenant calendars and validates immutable calendar configuration before writing profiles", async () => {
    const { service, db } = setup();
    expect((await service.calendar("org", "profile", 2026)).some((period) => period.key === input.period)).toBe(true);
    expect(db.hrmsPayrollProfile.findFirst).toHaveBeenCalledWith({ where: { id: "profile", organizationId: "org" } });
    db.hrmsPayrollProfile.findFirst.mockResolvedValueOnce(null);
    await expect(service.calendar("other-org", "profile", 2026)).rejects.toThrow("not found");
    const dto = {
      name: "Weekly",
      frequency: "WEEKLY" as const,
      countryCode: "IN",
      currency: "INR",
      minorUnits: 2,
      effectiveFrom: "2026-01-05",
      calendarAnchor: "2026-01-05",
      employmentModel: "EMPLOYEE",
      rulesVerified: true,
    };
    await expect(service.profile("org", "preparer", { ...dto, calendarAnchor: undefined })).rejects.toThrow("anchor");
    await expect(service.profile("org", "preparer", { ...dto, effectiveFrom: "2026-01-06" })).rejects.toThrow("align");
    expect(db.hrmsPayrollProfile.create).not.toHaveBeenCalled();
  });
  it("keeps exact-period hours out of adjacent runs and requires target dates for non-monthly inputs", async () => {
    const { service, db } = setup();
    const variable = {
      employeeId: "employee",
      profileId: "profile",
      name: "Approved hours",
      type: "EARNING" as const,
      calculation: "HOURS" as const,
      quantity: "10",
      rate: "100",
      multiplier: "1.5",
      startPeriod: "2026-11",
      endPeriod: "2026-11",
      targetPeriod: input.period,
      reason: "Timesheet reference",
    };
    db.hrmsEmployee.findFirst.mockResolvedValueOnce(assignment.employee);
    await expect(service.variableInput("org", "preparer", { ...variable, targetPeriod: undefined })).rejects.toThrow(
      "target",
    );
    db.hrmsEmployee.findFirst.mockResolvedValueOnce(assignment.employee);
    db.hrmsVariablePayInput.create.mockResolvedValueOnce({ id: "hours" });
    await service.variableInput("org", "preparer", variable);
    db.hrmsVariablePayInput.findMany.mockResolvedValue([
      {
        ...variable,
        id: "hours",
        status: "APPROVED",
        amount: new Prisma.Decimal(1500),
        quantity: new Prisma.Decimal(10),
        rate: new Prisma.Decimal(100),
        multiplier: new Prisma.Decimal(1.5),
      },
    ]);
    expect((await service.preview("org", input)).totalNet).toBe("3833.34");
    expect(
      (await service.preview("org", { ...input, period: "2026-11-09", payDate: "2026-11-17" })).items[0].variableInputs,
    ).toEqual([]);
  });
});
