import { Prisma } from "@prisma/client";
import { HrmsPayrollWorkspaceService } from "./hrms-payroll-workspace.service";
import type { PayrollProfileDto } from "../dto/hrms-payroll-workspace.dto";
import { enqueueNotification } from "../../notification/notification-events";

jest.mock("../../notification/notification-events", () => ({
  enqueueNotification: jest.fn().mockResolvedValue(undefined),
}));

const profile = {
  id: "profile-a",
  organizationId: "org-a",
  name: "India",
  countryCode: "IN",
  currency: "INR",
  minorUnits: 2,
  frequency: "MONTHLY",
  rulesVerified: true,
  employmentModel: "EMPLOYEE",
  workLocationId: null,
  effectiveFrom: new Date("2026-01-01"),
};
const input = { profileId: "profile-a", period: "2026-11", payDate: "2026-11-30" };
const assignment = {
  id: "assignment-a",
  employeeId: "employee-a",
  monthlyGross: new Prisma.Decimal("10000"),
  effectiveFrom: new Date("2026-01-01"),
  structure: {
    id: "structure-a",
    profileId: "profile-a",
    profile,
    components: [{ code: "BASIC", name: "Basic", type: "EARNING", calculation: "REMAINDER", value: "0" }],
  },
  employee: {
    id: "employee-a",
    employeeNumber: "E001",
    workLocationId: null,
    startDate: null,
    endDate: null,
    user: { name: "Payroll Employee" },
  },
};
const run = {
  id: "run-a",
  organizationId: "org-a",
  profileId: "profile-a",
  period: "2026-11",
  scopeKey: "ALL",
  payDate: new Date("2026-11-30"),
  preparedById: "preparer",
  status: "DRAFT",
  sandboxReference: null,
  sandboxStatus: null,
  snapshot: {},
};

function setup() {
  const db = {
    hrmsPayrollProfile: {
      findFirst: jest.fn().mockResolvedValue(profile),
      create: jest.fn().mockResolvedValue(profile),
      updateMany: jest.fn(),
    },
    hrmsLocation: { findFirst: jest.fn() },
    organizationDepartment: { findFirst: jest.fn() },
    hrmsEmployee: { findFirst: jest.fn().mockResolvedValue(assignment.employee) },
    hrmsSalaryAssignment: {
      findMany: jest.fn().mockResolvedValue([assignment]),
      create: jest.fn().mockResolvedValue({ id: "salary-a" }),
    },
    hrmsSalaryStructure: { findFirst: jest.fn().mockResolvedValue(assignment.structure), create: jest.fn() },
    hrmsExpenseClaim: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    hrmsVariablePayInput: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    hrmsAttendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
    hrmsLeaveRequest: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    hrmsPayrollRecord: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([{ id: "record-a", employee: { userId: "employee-user" } }]),
    },
    hrmsPayrollRun: {
      findFirst: jest.fn().mockResolvedValue(run),
      create: jest.fn().mockResolvedValue(run),
      update: jest
        .fn()
        .mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...run, ...data })),
      findUniqueOrThrow: jest.fn().mockResolvedValue(run),
    },
  };
  const prisma = {
    ...db,
    $transaction: jest.fn(async <T>(callback: (client: typeof db) => Promise<T>) => callback(db)),
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return { db, prisma, audit, service: new HrmsPayrollWorkspaceService(prisma as never, audit as never) };
}

describe("HrmsPayrollWorkspaceService", () => {
  const variable = {
    id: "variable-a",
    employeeId: "employee-a",
    profileId: "profile-a",
    createdById: "preparer",
    name: "Performance bonus",
    type: "EARNING",
    calculation: "FIXED",
    quantity: new Prisma.Decimal(1),
    rate: new Prisma.Decimal(1000),
    multiplier: new Prisma.Decimal(1),
    amount: new Prisma.Decimal(1000),
    startPeriod: "2026-11",
    endPeriod: "2026-11",
    reason: "Approved performance award",
    status: "APPROVED",
  };
  const variableDto = {
    employeeId: "employee-a",
    profileId: "profile-a",
    name: "Bonus",
    type: "EARNING" as const,
    calculation: "FIXED" as const,
    quantity: "1",
    rate: "1000",
    multiplier: "1",
    startPeriod: "2026-11",
    endPeriod: "2026-11",
    reason: "Performance award",
  };
  it("adds only approved matching variable inputs, captures basis and compares same-currency prior employee pay", async () => {
    const { db, service } = setup();
    db.hrmsVariablePayInput.findMany.mockResolvedValue([variable]);
    db.hrmsPayrollRecord.findMany.mockResolvedValue([
      {
        id: "previous",
        employeeId: "employee-a",
        period: "2026-10",
        currency: "INR",
        grossSalary: 10000,
        totalDeductions: 0,
        netPay: 10000,
      },
    ]);
    const result = await service.preview("org-a", input);
    expect(result.items[0]).toMatchObject({
      gross: "11000.00",
      net: "11000.00",
      monthlyCtc: "10000.00",
      variableInputs: [{ id: variable.id, amount: "1000.00", reason: variable.reason }],
      variance: { previousPeriod: "2026-10", netDelta: "1000.00", netPercent: "10.00" },
    });
    expect(result.componentSummary).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: variable.name, amount: "1000.00" })]),
    );
    expect(db.hrmsVariablePayInput.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-a",
          startPeriod: { lte: "2026-11" },
          endPeriod: { gte: "2026-11" },
        }),
      }),
    );
    expect(db.hrmsPayrollRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          currency: "INR",
          organizationId: "org-a",
          status: { in: ["APPROVED", "PAID"] },
        }),
      }),
    );
  });
  it("does not include pending input money and blocks payroll approval until pending decisions are resolved", async () => {
    const { db, service } = setup();
    db.hrmsVariablePayInput.findMany.mockResolvedValue([{ ...variable, status: "PENDING" }]);
    const result = await service.preview("org-a", input);
    expect(result.totalNet).toBe("10000.00");
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringContaining("Pending variable")]));
    await expect(service.transition("org-a", "approver", "run-a", "approve")).rejects.toThrow("Pending variable");
    expect(db.hrmsPayrollRecord.createMany).not.toHaveBeenCalled();
  });
  it("rejects a wrong-group input instead of silently omitting its money", async () => {
    const { db, service } = setup();
    db.hrmsVariablePayInput.findMany.mockResolvedValue([{ ...variable, profileId: "other-profile" }]);
    await expect(service.preview("org-a", input)).rejects.toThrow("another pay group");
    db.hrmsVariablePayInput.findMany.mockResolvedValue([]);
    db.hrmsSalaryAssignment.findMany.mockResolvedValue([]);
    await expect(service.variableInput("org-a", "preparer", variableDto)).rejects.toThrow("entire input range");
  });
  it("creates bounded inputs with server-calculated money and rejects locked ranges and recurring hours", async () => {
    const { db, service } = setup();
    db.hrmsVariablePayInput.create.mockResolvedValue(variable);
    await service.variableInput("org-a", "preparer", variableDto);
    expect(db.hrmsVariablePayInput.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: "1000.00", organizationId: "org-a", createdById: "preparer" }),
    });
    await expect(service.variableInput("org-a", "preparer", { ...variableDto, endPeriod: "2026-10" })).rejects.toThrow(
      "precede",
    );
    await expect(
      service.variableInput("org-a", "preparer", { ...variableDto, calculation: "HOURS", endPeriod: "2026-12" }),
    ).rejects.toThrow("period-specific");
    db.hrmsPayrollRecord.findFirst.mockResolvedValue({ id: "locked" });
    await expect(service.variableInput("org-a", "preparer", variableDto)).rejects.toThrow("overlaps");
    db.hrmsEmployee.findFirst.mockResolvedValueOnce(null);
    await expect(service.variableInput("org-b", "preparer", variableDto)).rejects.toThrow("not found");
  });
  it("enforces independent input approval, blocks approval of one's own compensation and keeps approved inputs immutable", async () => {
    const { db, service } = setup();
    db.hrmsVariablePayInput.findFirst.mockResolvedValue({ ...variable, status: "PENDING" });
    await expect(service.decideVariable("org-a", "preparer", variable.id, { action: "APPROVE" })).rejects.toThrow(
      "different",
    );
    await expect(service.decideVariable("org-a", "employee-user", variable.id, { action: "APPROVE" })).rejects.toThrow(
      "own variable",
    );
    db.hrmsEmployee.findFirst.mockResolvedValue(null);
    db.hrmsVariablePayInput.update.mockResolvedValue({ ...variable, status: "APPROVED" });
    await service.decideVariable("org-a", "approver", variable.id, { action: "APPROVE" });
    expect(db.hrmsVariablePayInput.update).toHaveBeenCalledWith({
      where: { id: variable.id },
      data: { status: "APPROVED", decidedById: "approver", decidedAt: expect.any(Date) },
    });
    db.hrmsVariablePayInput.findFirst.mockResolvedValue(variable);
    await expect(service.decideVariable("org-a", "preparer", variable.id, { action: "CANCEL" })).rejects.toThrow(
      "Only a pending",
    );
    db.hrmsVariablePayInput.findFirst.mockResolvedValue(null);
    await expect(service.decideVariable("org-b", "approver", variable.id, { action: "APPROVE" })).rejects.toThrow(
      "Only a pending",
    );
  });
  it("retains explicit rejection/cancellation history and rechecks payroll locks before input approval", async () => {
    const { db, service } = setup();
    db.hrmsVariablePayInput.findFirst.mockResolvedValue({ ...variable, status: "PENDING" });
    await expect(service.decideVariable("org-a", "preparer", variable.id, { action: "REJECT" })).rejects.toThrow(
      "different",
    );
    for (const [action, status] of [
      ["REJECT", "REJECTED"],
      ["CANCEL", "CANCELLED"],
    ] as const) {
      await service.decideVariable("org-a", action === "CANCEL" ? "preparer" : "approver", variable.id, { action });
      expect(db.hrmsVariablePayInput.update).toHaveBeenLastCalledWith({
        where: { id: variable.id },
        data: expect.objectContaining({ status }),
      });
    }
    db.hrmsEmployee.findFirst.mockResolvedValue(null);
    db.hrmsPayrollRecord.findFirst.mockResolvedValue({ id: "locked" });
    await expect(service.decideVariable("org-a", "approver", variable.id, { action: "APPROVE" })).rejects.toThrow(
      "overlaps",
    );
  });

  it("prorates joining, salary revisions and approved unpaid leave using the saved calendar policy", async () => {
    const { db, service } = setup();
    db.hrmsPayrollRun.findFirst.mockResolvedValue({
      ...run,
      snapshot: { prorationPolicy: "CALENDAR_DAYS" },
    });
    const employee = { ...assignment.employee, startDate: new Date("2026-11-11") };
    db.hrmsSalaryAssignment.findMany.mockResolvedValue([
      {
        ...assignment,
        id: "revision-b",
        monthlyGross: new Prisma.Decimal("60000"),
        effectiveFrom: new Date("2026-11-21"),
        employee,
      },
      { ...assignment, monthlyGross: new Prisma.Decimal("30000"), employee },
    ]);
    db.hrmsLeaveRequest.findMany.mockResolvedValue([
      { employeeId: employee.id, startDate: new Date("2026-11-12"), endDate: new Date("2026-11-12"), totalDays: 1 },
    ]);
    db.hrmsAttendanceRecord.findMany.mockResolvedValue([{ employeeId: employee.id, date: new Date("2026-11-12") }]);
    const result = await service.preview("org-a", { ...input, prorationPolicy: "CALENDAR_DAYS" });
    expect(result.items[0]).toMatchObject({
      gross: "29000.00",
      net: "29000.00",
      proration: { employmentDays: 20, unpaidDays: 1 },
    });
    expect(result.warnings).toEqual([]);
    await service.transition("org-a", "approver", run.id, "approve");
    expect(db.hrmsPayrollRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          snapshot: expect.objectContaining({ prorationPolicy: "CALENDAR_DAYS", totalNet: "29000.00" }),
        }),
      }),
    );
  });

  it("does not bypass unresolved absences, pending leave, or ambiguous unpaid leave under calendar policy", async () => {
    const { db, service } = setup();
    db.hrmsPayrollRun.findFirst.mockResolvedValue({ ...run, snapshot: { prorationPolicy: "CALENDAR_DAYS" } });
    db.hrmsAttendanceRecord.findMany.mockResolvedValue([{ employeeId: "employee-a", date: new Date("2026-11-02") }]);
    await expect(service.transition("org-a", "approver", run.id, "approve")).rejects.toThrow("requires review");
    db.hrmsAttendanceRecord.findMany.mockResolvedValue([]);
    db.hrmsLeaveRequest.count.mockResolvedValue(1);
    await expect(service.transition("org-a", "approver", run.id, "approve")).rejects.toThrow("requires review");
    db.hrmsLeaveRequest.count.mockResolvedValue(0);
    db.hrmsLeaveRequest.findMany.mockResolvedValue([
      {
        employeeId: "employee-a",
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-11-07"),
        totalDays: 5,
      },
    ]);
    await expect(service.preview("org-a", { ...input, prorationPolicy: "CALENDAR_DAYS" })).rejects.toThrow(
      "allocation",
    );
    expect(db.hrmsPayrollRun.update).not.toHaveBeenCalled();
  });

  it.each(["cancel", "reject"] as const)("closes a tenant draft with a durable reason via %s", async (action) => {
    const { db, service, audit } = setup();
    expect(await service.closeDraft("org-a", "approver", run.id, action, "  Incorrect inputs  ")).toMatchObject({
      status: action === "cancel" ? "CANCELLED" : "REJECTED",
      closedById: "approver",
      closureReason: "Incorrect inputs",
    });
    expect(db.hrmsPayrollRun.findFirst).toHaveBeenCalledWith({ where: { id: run.id, organizationId: "org-a" } });
    expect(db.hrmsPayrollRecord.createMany).not.toHaveBeenCalled();
    expect(db.hrmsExpenseClaim.updateMany).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: `hrms.payroll.run.${action}` }));
  });

  it("rejects self-rejection, invalid reasons, cross-tenant IDs, and closure of locked or already closed runs", async () => {
    const { db, service } = setup();
    await expect(service.closeDraft("org-a", "preparer", run.id, "reject", "Wrong amounts")).rejects.toThrow(
      "different",
    );
    await expect(service.closeDraft("org-a", "preparer", run.id, "cancel", "  ")).rejects.toThrow("reason");
    for (const status of ["APPROVED", "PROCESSED", "CANCELLED", "REJECTED"]) {
      db.hrmsPayrollRun.findFirst.mockResolvedValue({ ...run, status });
      await expect(service.closeDraft("org-a", "actor", run.id, "cancel", "Wrong amounts")).rejects.toThrow(
        "Only a draft",
      );
    }
    db.hrmsPayrollRun.findFirst.mockResolvedValue(null);
    await expect(service.closeDraft("org-b", "actor", run.id, "cancel", "Wrong amounts")).rejects.toThrow(
      "Only a draft",
    );
    expect(db.hrmsPayrollRun.update).not.toHaveBeenCalled();
  });

  it("blocks overlapping legacy records even with a non-month period label", async () => {
    const { db, service } = setup();
    db.hrmsPayrollRecord.findFirst.mockResolvedValue({ id: "legacy" });
    await expect(service.transition("org-a", "approver", "run-a", "approve")).rejects.toMatchObject({ status: 409 });
    expect(db.hrmsPayrollRecord.createMany).not.toHaveBeenCalled();
  });

  it("previews only tenant/profile salaries and approved, unallocated matching-currency claims", async () => {
    const { db, service } = setup();
    db.hrmsExpenseClaim.findMany.mockResolvedValue([{ id: "claim-a", amount: new Prisma.Decimal("25.10") }]);
    const result = await service.preview("org-a", input);
    expect(result.totalNet).toBe("10025.10");
    expect(result.items[0]).toMatchObject({
      gross: "10000.00",
      reimbursements: "25.10",
      net: "10025.10",
      claimIds: ["claim-a"],
    });

    expect(db.hrmsPayrollProfile.findFirst).toHaveBeenCalledWith({
      where: { id: "profile-a", organizationId: "org-a" },
    });
    expect(db.hrmsExpenseClaim.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        organizationId: "org-a",
        employeeId: "employee-a",
        status: "APPROVED",
        runId: null,
        currency: "INR",
      }),
    });
  });

  it("does not reuse an old pay group after an employee changes groups", async () => {
    const { db, service } = setup();
    db.hrmsSalaryAssignment.findMany.mockResolvedValue([
      {
        ...assignment,
        effectiveFrom: new Date("2026-10-01"),
        structure: { ...assignment.structure, profileId: "profile-b" },
      },
      assignment,
    ]);
    await expect(service.preview("org-a", input)).rejects.toThrow("No active employee salaries");
  });

  it("checks department tenancy before selecting department-scoped salaries", async () => {
    const { db, service } = setup();
    await expect(service.preview("org-a", { ...input, departmentId: "department-b" })).rejects.toThrow(
      "Department not found",
    );
    expect(db.hrmsSalaryAssignment.findMany).not.toHaveBeenCalled();
    db.organizationDepartment.findFirst.mockResolvedValue({ id: "department-a" });
    await service.preview("org-a", { ...input, departmentId: "department-a" });
    expect(db.hrmsSalaryAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ employee: expect.objectContaining({ departmentId: "department-a" }) }),
      }),
    );
  });

  it("rejects missing profiles, provider-managed runs, invalid dates and partial-month employees", async () => {
    const { db, service } = setup();
    db.hrmsPayrollProfile.findFirst.mockResolvedValueOnce(null);
    await expect(service.preview("org-a", input)).rejects.toThrow("profile not found");
    db.hrmsPayrollProfile.findFirst.mockResolvedValueOnce({ ...profile, employmentModel: "EOR" });
    await expect(service.preview("org-a", input)).rejects.toThrow("provider-managed");
    await expect(service.preview("org-a", { ...input, payDate: "2026-11-20" })).rejects.toThrow("period ends");
    db.hrmsSalaryAssignment.findMany.mockResolvedValueOnce([{ ...assignment, effectiveFrom: new Date("2026-11-15") }]);
    await expect(service.preview("org-a", input)).rejects.toThrow("proration");
  });

  it("persists draft snapshots with profile relation and serializable transaction boundaries", async () => {
    const { db, prisma, service } = setup();
    await service.createRun("org-a", "preparer", input);
    expect(db.hrmsPayrollRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-a",
          scopeKey: "ALL",
          preparedById: "preparer",
          totalNet: "10000.00",
        }),
        include: { profile: true },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable", timeout: 30000 }),
    );
  });

  it("requires a different user to approve a tenant draft", async () => {
    const { db, service } = setup();
    await expect(service.transition("org-a", "preparer", "run-a", "approve")).rejects.toThrow(
      "different payroll approver",
    );
    expect(db.hrmsPayrollRun.update).not.toHaveBeenCalled();
    expect(db.hrmsPayrollRun.findFirst).toHaveBeenCalledWith({ where: { id: "run-a", organizationId: "org-a" } });
  });

  it.each(["rules", "absence", "leave"])("blocks approval for unverified %s", async (cause) => {
    const { db, service } = setup();
    if (cause === "rules") {
      db.hrmsPayrollProfile.findFirst.mockResolvedValue({ ...profile, rulesVerified: false });
    }
    if (cause === "absence") {
      db.hrmsAttendanceRecord.findMany.mockResolvedValue([{ employeeId: "employee-a", date: new Date("2026-11-02") }]);
    }
    if (cause === "leave") {
      db.hrmsLeaveRequest.count.mockResolvedValue(1);
    }
    await expect(service.transition("org-a", "approver", "run-a", "approve")).rejects.toThrow();
    expect(db.hrmsPayrollRecord.createMany).not.toHaveBeenCalled();
    expect(db.hrmsPayrollRun.update).not.toHaveBeenCalled();
  });

  it("creates canonical employee payroll and reserves claims atomically at approval", async () => {
    const { db, service } = setup();
    db.hrmsExpenseClaim.findMany.mockResolvedValue([{ id: "claim-a", amount: new Prisma.Decimal("5") }]);
    await service.transition("org-a", "approver", "run-a", "approve");
    expect(db.hrmsPayrollRecord.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          organizationId: "org-a",
          employeeId: "employee-a",
          period: "2026-11",
          status: "APPROVED",
          netPay: 10005,
        }),
      ],
    });
    expect(db.hrmsExpenseClaim.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["claim-a"] }, organizationId: "org-a", status: "APPROVED", runId: null },
      data: { runId: "run-a" },
    });
    expect(db.hrmsPayrollRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          approvedById: "approver",
          snapshot: expect.objectContaining({ totalNet: "10005.00" }),
        }),
      }),
    );
  });

  it("rejects expenses already allocated to another run", async () => {
    const { db, service } = setup();
    db.hrmsExpenseClaim.findMany.mockResolvedValue([{ id: "claim-a", amount: new Prisma.Decimal("5") }]);
    db.hrmsExpenseClaim.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.transition("org-a", "approver", "run-a", "approve")).rejects.toThrow("already allocated");
    expect(db.hrmsPayrollRun.update).not.toHaveBeenCalled();
  });

  it("processes only an approved run without recalculating or altering its snapshot or marking it paid", async () => {
    const { db, service } = setup();
    await expect(service.transition("org-a", "processor", "run-a", "process")).rejects.toThrow("approved first");
    db.hrmsPayrollRun.findFirst.mockResolvedValue({ ...run, status: "APPROVED" });
    await service.transition("org-a", "processor", "run-a", "process");
    expect(db.hrmsSalaryAssignment.findMany).not.toHaveBeenCalled();
    expect(db.hrmsPayrollRun.update).toHaveBeenCalledWith({
      where: { id: "run-a" },
      data: { status: "PROCESSED", processedAt: expect.any(Date) },
    });
    expect(db.hrmsExpenseClaim.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a", runId: "run-a" },
      data: { status: "IN_PAYROLL" },
    });
    expect(enqueueNotification).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        type: "HRMS_PAYROLL",
        recipientIds: ["employee-user"],
        dedupKey: "payroll-processed:record-a",
      }),
    );
  });

  it("returns explicit conflicts for duplicate employee/period or concurrent writes", async () => {
    const { db, service } = setup();
    for (const code of ["P2002", "P2034"]) {
      db.hrmsPayrollRun.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Conflict", { code, clientVersion: "test" }),
      );
      await expect(service.createRun("org-a", "preparer", input)).rejects.toMatchObject({ status: 409 });
    }
  });

  it("scopes backdate locks to the employee, rather than blocking the entire organization", async () => {
    const { db, service } = setup();
    await service.assign("org-a", "actor", {
      employeeId: "employee-a",
      structureId: "structure-a",
      monthlyGross: "10000",
      effectiveFrom: "2026-11-01",
    });
    expect(db.hrmsPayrollRecord.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-a",
        employeeId: "employee-a",
        status: { in: ["APPROVED", "PAID"] },
        periodEnd: { gte: new Date("2026-11-01") },
      },
    });
    db.hrmsPayrollRecord.findFirst.mockResolvedValue({ id: "locked" });
    await expect(
      service.assign("org-a", "actor", {
        employeeId: "employee-a",
        structureId: "structure-a",
        monthlyGross: "10000",
        effectiveFrom: "2026-11-01",
      }),
    ).rejects.toThrow("arrears");
  });

  it("rejects unsupported currencies and incorrect currency precision", async () => {
    const { service, db } = setup();
    const dto: PayrollProfileDto = {
      name: "Group",
      countryCode: "IN",
      currency: "ZZZ",
      minorUnits: 2,
      frequency: "MONTHLY",
      employmentModel: "EMPLOYEE",
      rulesVerified: false,
      effectiveFrom: "2026-01-01",
    };
    await expect(service.profile("org-a", "actor", dto)).rejects.toThrow("supported ISO currency");
    await expect(service.profile("org-a", "actor", { ...dto, currency: "JPY" })).rejects.toThrow("precision");
    expect(db.hrmsPayrollProfile.create).not.toHaveBeenCalled();
  });

  it("rejects fractional claims beyond ISO precision and self-approval", async () => {
    const { service, db } = setup();
    await expect(
      service.claim("org-a", "actor", {
        employeeId: "employee-a",
        title: "Travel",
        amount: "1.001",
        currency: "INR",
        expenseDate: "2026-11-01",
        receiptReference: "receipt-a",
      }),
    ).rejects.toThrow("precision");
    db.hrmsExpenseClaim.findFirst.mockResolvedValue({ status: "PENDING", employee: { userId: "actor" } });
    await expect(service.approveClaim("org-a", "actor", "claim-a")).rejects.toThrow("own expense");
    await expect(
      service.claim("org-a", "actor", {
        employeeId: "employee-a",
        title: "Travel",
        amount: "0",
        currency: "INR",
        expenseDate: "2026-11-01",
        receiptReference: "receipt-a",
      }),
    ).rejects.toThrow("greater than zero");
  });

  it("blocks mismatched countries and checks custom unpaid types and unresolved leave", async () => {
    const { db, service } = setup();
    db.hrmsSalaryAssignment.findMany.mockResolvedValueOnce([
      {
        ...assignment,
        employee: { ...assignment.employee, workLocation: { isActive: true, countryCode: "US" } },
      },
    ]);
    await expect(service.preview("org-a", input)).rejects.toThrow("payroll country");
    await service.preview("org-a", input);
    expect(db.hrmsLeaveRequest.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: [{ leaveType: "UNPAID_LEAVE" }, { type: { isPaid: false } }],
        status: "APPROVED",
      }),
    });
    expect(db.hrmsLeaveRequest.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ status: { in: ["PENDING", "NEEDS_INFO"] } }),
    });
  });

  it("requires confirmation and a processed tenant run before sandbox submission", async () => {
    const { db, service } = setup();
    await expect(
      service.sandbox("org-a", "actor", "run-a", { action: "SUBMIT", confirmSandbox: false }),
    ).rejects.toThrow("confirmation");
    expect(db.hrmsPayrollRun.findFirst).not.toHaveBeenCalled();
    db.hrmsPayrollRun.findFirst.mockResolvedValue(null);
    await expect(
      service.sandbox("org-a", "actor", "run-a", { action: "SUBMIT", confirmSandbox: true }),
    ).rejects.toThrow("Process and lock");
    expect(db.hrmsPayrollRun.findFirst).toHaveBeenCalledWith({
      where: { id: "run-a", organizationId: "org-a", status: "PROCESSED" },
    });
  });

  it("submits idempotently and never reports real payment success", async () => {
    const { db, service } = setup();
    db.hrmsPayrollRun.findFirst.mockResolvedValue({ ...run, status: "PROCESSED" });
    const result = await service.sandbox("org-a", "actor", "run-a", { action: "SUBMIT", confirmSandbox: true });
    expect(result).toMatchObject({
      sandboxOnly: true,
      realFundsMoved: false,
      sandboxReference: expect.stringMatching(/^SANDBOX-/),
      sandboxStatus: "SUBMITTED",
    });
    db.hrmsPayrollRun.update.mockClear();
    db.hrmsPayrollRun.findFirst.mockResolvedValue({
      ...run,
      status: "PROCESSED",
      sandboxReference: "SANDBOX-existing",
      sandboxStatus: "SUBMITTED",
    });
    expect(await service.sandbox("org-a", "actor", "run-a", { action: "SUBMIT", confirmSandbox: true })).toMatchObject({
      sandboxReference: "SANDBOX-existing",
    });
    expect(db.hrmsPayrollRun.update).not.toHaveBeenCalled();
  });

  it.each(["SETTLE", "FAIL"] as const)(
    "simulates %s only after submission, without changing actual payroll status",
    async (action) => {
      const { db, service } = setup();
      await expect(service.sandbox("org-a", "actor", "run-a", { action, confirmSandbox: true })).rejects.toThrow(
        "submitted",
      );
      db.hrmsPayrollRun.findFirst.mockResolvedValue({ ...run, status: "PROCESSED", sandboxStatus: "SUBMITTED" });
      const result = await service.sandbox("org-a", "actor", "run-a", { action, confirmSandbox: true });
      expect(result).toMatchObject({
        sandboxOnly: true,
        realFundsMoved: false,
        sandboxStatus: action === "SETTLE" ? "SIMULATED_SETTLED" : "SIMULATED_FAILED",
      });
      expect(db.hrmsPayrollRun.update).toHaveBeenCalledWith({
        where: { id: "run-a" },
        data: { sandboxStatus: expect.stringMatching(/^SIMULATED_/) },
      });
    },
  );
});
