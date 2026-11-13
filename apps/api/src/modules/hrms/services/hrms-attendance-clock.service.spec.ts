 
import { computeWorkHours, HrmsAttendanceClockService } from "./hrms-attendance-clock.service";
import { HrmsAttendanceRegularizationService } from "./hrms-attendance-regularization.service";

const day = new Date("2026-11-13");

const rules = { attendanceClockInWindowMinutes: 30, attendanceLateAfterMinutes: 60 };
const settings = { get: jest.fn().mockResolvedValue(rules) };

function build(shift: { startTime: string; timeZone: string } | null = null) {
  const records = new Map<string, Record<string, unknown>>();
  const prisma: Record<string, any> = {
    hrmsEmployee: { findFirst: jest.fn().mockResolvedValue({ id: "emp-1", shift }) },
    hrmsAttendanceRecord: {
      findFirst: jest.fn(async () => [...records.values()].find((r) => r.checkIn && !r.checkOut) ?? null),
      findUnique: jest.fn(async () => records.get(day.toISOString()) ?? null),
      upsert: jest.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        const key = (create.date as Date).toISOString();
        const next = { id: "rec-1", breakMinutes: 0, breakStartedAt: null, ...(records.get(key) ?? create), ...(records.has(key) ? update : {}) };
        records.set(key, next);
        return next;
      }),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const [key, current] = [...records.entries()][0];
        const next = { ...current, ...data };
        records.set(key, next);
        return next;
      }),
    },
    hrmsAttendanceRegularization: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "reg-1", status: "APPROVED" }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  return { prisma, records };
}

describe("attendance clock", () => {
  it("computes net work hours minus breaks", () => {
    expect(computeWorkHours(new Date("2026-11-13T09:00:00Z"), new Date("2026-11-13T18:00:00Z"), 60)).toBe(8);
  });

  it("clocks in, tracks a break, and clocks out with net hours", async () => {
    const { prisma, records } = build();
    const service = new HrmsAttendanceClockService(prisma as never, settings as never);
    await service.clockIn("org", "user", "2026-11-13");
    await expect(service.clockIn("org", "user", "2026-11-13")).rejects.toMatchObject({ status: 409 });
    await service.startBreak("org", "user");
    await expect(service.startBreak("org", "user")).rejects.toMatchObject({ status: 409 });
    await service.endBreak("org", "user");
    const out = await service.clockOut("org", "user");
    expect(out.checkOut).toBeInstanceOf(Date);
    expect(out.workHours).toBe(0);
    expect(records.size).toBe(1);
    await expect(service.clockOut("org", "user")).rejects.toMatchObject({ status: 409 });
    await expect(service.clockIn("org", "user", "2026-11-13")).rejects.toMatchObject({ status: 409 });
  });
});

describe("shift clock-in rules", () => {
  afterEach(() => jest.useRealTimers());
  const at = (iso: string) => jest.useFakeTimers().setSystemTime(new Date(iso));

  it("rejects clock-in before the window opens", async () => {
    at("2026-11-13T08:29:00Z");
    const service = new HrmsAttendanceClockService(build({ startTime: "09:00", timeZone: "UTC" }).prisma as never, settings as never);
    await expect(service.clockIn("org", "user", "2026-11-13")).rejects.toMatchObject({ status: 409 });
  });

  it("allows clock-in at window open and marks it present", async () => {
    at("2026-11-13T08:30:00Z");
    const service = new HrmsAttendanceClockService(build({ startTime: "09:00", timeZone: "UTC" }).prisma as never, settings as never);
    expect(await service.clockIn("org", "user", "2026-11-13")).toMatchObject({ status: "PRESENT" });
  });

  it("marks clock-in after the late threshold as LATE", async () => {
    at("2026-11-13T10:01:00Z");
    const service = new HrmsAttendanceClockService(build({ startTime: "09:00", timeZone: "UTC" }).prisma as never, settings as never);
    expect(await service.clockIn("org", "user", "2026-11-13")).toMatchObject({ status: "LATE" });
  });

  it("resolves the shift start in the shift's time zone", async () => {
    at("2026-11-13T03:30:00Z"); // 09:00 in Asia/Kolkata
    const service = new HrmsAttendanceClockService(build({ startTime: "09:00", timeZone: "Asia/Kolkata" }).prisma as never, settings as never);
    expect(await service.clockIn("org", "user", "2026-11-13")).toMatchObject({ status: "PRESENT" });
  });
});

describe("attendance regularization", () => {
  it("requires the time a type needs and a reason", async () => {
    const { prisma } = build();
    const service = new HrmsAttendanceRegularizationService(prisma as never, { record: jest.fn() } as never);
    await expect(
      service.create("org", "user", { date: "2026-11-12", type: "MISSED_CLOCK_OUT", reason: "forgot" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.create("org", "user", { date: "2026-11-12", type: "OTHER", reason: "  " }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("applies requested times to the attendance record on approval", async () => {
    const { prisma, records } = build();
    const request = {
      id: "reg-1",
      organizationId: "org",
      employeeId: "emp-1",
      date: day,
      status: "PENDING",
      requestedCheckIn: new Date("2026-11-13T09:00:00Z"),
      requestedCheckOut: new Date("2026-11-13T17:30:00Z"),
    };
    prisma.hrmsAttendanceRegularization.findFirst.mockResolvedValue(request);
    const audit = { record: jest.fn() };
    const service = new HrmsAttendanceRegularizationService(prisma as never, audit as never);
    await service.decide("org", "reg-1", "admin", "APPROVED", "ok");
    const stored = records.get(day.toISOString())!;
    expect(stored.checkIn).toEqual(request.requestedCheckIn);
    expect(stored.checkOut).toEqual(request.requestedCheckOut);
    expect(stored.workHours).toBe(8.5);
    expect(audit.record).toHaveBeenCalled();
  });

  it("does not touch attendance when rejected", async () => {
    const { prisma, records } = build();
    prisma.hrmsAttendanceRegularization.findFirst.mockResolvedValue({ id: "reg-1", organizationId: "org", employeeId: "emp-1", date: day, status: "PENDING" });
    const service = new HrmsAttendanceRegularizationService(prisma as never, { record: jest.fn() } as never);
    await service.decide("org", "reg-1", "admin", "REJECTED", "no");
    expect(records.size).toBe(0);
  });
});
