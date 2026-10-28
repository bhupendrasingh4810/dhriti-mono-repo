import { ErrorCode } from "../../../common/errors/error-codes";
import { HrmsEmployeeService } from "./hrms-employee.service";

function makePrisma() {
  return {
    hrmsEmployee: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
  };
}

function makeAudit() {
  return { record: jest.fn() };
}

describe("HrmsEmployeeService", () => {
  it("hides an employee id belonging to another organization", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);

    await expect(service.get("org-a", "employee-from-org-b")).rejects.toMatchObject({
      code: ErrorCode.EMPLOYEE_NOT_FOUND,
      status: 404,
    });
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "employee-from-org-b", organizationId: "org-a", deletedAt: null }),
      }),
    );
  });

  it("does not mutate an employee that belongs to another organization", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);

    await expect(
      service.update("org-a", "employee-from-org-b", "actor-a", { status: "INACTIVE" }),
    ).rejects.toMatchObject({ code: ErrorCode.EMPLOYEE_NOT_FOUND, status: 404 });
    await expect(service.delete("org-a", "employee-from-org-b", "actor-a")).rejects.toMatchObject({
      code: ErrorCode.EMPLOYEE_NOT_FOUND,
      status: 404,
    });
    expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
  });

  it("requires an active organization membership before creating an employee", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);

    await expect(
      service.create("org-a", "actor-a", { userId: "user-b", employeeNumber: "EMP-1", status: "ACTIVE" }),
    ).rejects.toMatchObject({ code: ErrorCode.MEMBER_NOT_FOUND, status: 400 });
    expect(prisma.hrmsEmployee.create).not.toHaveBeenCalled();
  });

  it("creates an employee only after validating an active member and audits the change", async () => {
    const prisma = makePrisma();
    const audit = makeAudit();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.hrmsEmployee.create.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsEmployeeService(prisma as never, audit as never);

    await expect(
      service.create("org-a", "actor-a", { userId: "user-a", employeeNumber: " EMP-1 ", status: " ACTIVE " }),
    ).resolves.toEqual({ id: "employee-a" });
    expect(prisma.hrmsEmployee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: "org-a",
          userId: "user-a",
          employeeNumber: "EMP-1",
          status: "ACTIVE",
        }),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "hrms.employee.created", organizationId: "org-a", actorUserId: "actor-a" }),
    );
  });

  it("records biometric and lifecycle dates on employee creation", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.hrmsEmployee.create.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await service.create("org-a", "actor-a", {
      userId: "user-a",
      employeeNumber: "EMP-42",
      status: "ACTIVE",
      employmentType: "FULL_TIME",
      startDate: "2026-01-01",
      biometricId: " BIO-42 ",
      retirementDate: "2055-06-30",
      resignationDate: "2026-10-28",
    });
    expect(prisma.hrmsEmployee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeNumber: "EMP-42",
          biometricId: "BIO-42",
          retirementDate: new Date("2055-06-30T00:00:00Z"),
          resignationDate: new Date("2026-10-28T00:00:00Z"),
        }),
      }),
    );
  });

  it("updates and clears HR-managed fields and audits the operation", async () => {
    const prisma = makePrisma();
    const audit = makeAudit();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({
      id: "employee-a",
      startDate: new Date("2026-01-01T00:00:00Z"),
      retirementDate: new Date("2055-06-30T00:00:00Z"),
      resignationDate: null,
    });
    prisma.hrmsEmployee.update.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsEmployeeService(prisma as never, audit as never);
    await service.update("org-a", "employee-a", "actor-a", {
      employeeNumber: " EMP-43 ",
      biometricId: null,
      retirementDate: null,
      resignationDate: "2026-10-28",
    });
    expect(prisma.hrmsEmployee.update).toHaveBeenCalledWith({
      where: { id: "employee-a" },
      data: {
        employeeNumber: "EMP-43",
        biometricId: null,
        retirementDate: null,
        resignationDate: new Date("2026-10-28T00:00:00Z"),
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "hrms.employee.updated",
        organizationId: "org-a",
        actorUserId: "actor-a",
      }),
    );
  });

  it.each([{ retirementDate: "2025-01-01" }, { resignationDate: "2025-01-01" }])(
    "rejects lifecycle dates before joining: %j",
    async (input) => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue({
        id: "employee-a",
        startDate: new Date("2026-01-01T00:00:00Z"),
        retirementDate: null,
        resignationDate: null,
      });
      const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
      await expect(service.update("org-a", "employee-a", "actor-a", input)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_FAILED,
        status: 400,
      });
      expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
    },
  );

  it("checks existing lifecycle dates when the joining date is moved", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({
      id: "employee-a",
      startDate: new Date("2026-01-01T00:00:00Z"),
      retirementDate: null,
      resignationDate: new Date("2026-06-01T00:00:00Z"),
    });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.update("org-a", "employee-a", "actor-a", { startDate: "2026-07-01" })).rejects.toMatchObject({
      code: ErrorCode.VALIDATION_FAILED,
      status: 400,
    });
    expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
  });
});
