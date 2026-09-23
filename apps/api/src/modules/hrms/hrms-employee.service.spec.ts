import { ErrorCode } from "../../common/errors/error-codes";
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

    await expect(service.get("org-a", "employee-from-org-b")).rejects.toMatchObject({ code: ErrorCode.EMPLOYEE_NOT_FOUND, status: 404 });
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "employee-from-org-b", organizationId: "org-a", deletedAt: null }) }));
  });

  it("does not mutate an employee that belongs to another organization", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);

    await expect(service.update("org-a", "employee-from-org-b", "actor-a", { status: "INACTIVE" })).rejects.toMatchObject({ code: ErrorCode.EMPLOYEE_NOT_FOUND, status: 404 });
    await expect(service.delete("org-a", "employee-from-org-b", "actor-a")).rejects.toMatchObject({ code: ErrorCode.EMPLOYEE_NOT_FOUND, status: 404 });
    expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
  });

  it("requires an active organization membership before creating an employee", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);

    await expect(service.create("org-a", "actor-a", { userId: "user-b", employeeNumber: "EMP-1", status: "ACTIVE" })).rejects.toMatchObject({ code: ErrorCode.MEMBER_NOT_FOUND, status: 400 });
    expect(prisma.hrmsEmployee.create).not.toHaveBeenCalled();
  });

  it("creates an employee only after validating an active member and audits the change", async () => {
    const prisma = makePrisma();
    const audit = makeAudit();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.hrmsEmployee.create.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsEmployeeService(prisma as never, audit as never);

    await expect(service.create("org-a", "actor-a", { userId: "user-a", employeeNumber: " EMP-1 ", status: " ACTIVE " })).resolves.toEqual({ id: "employee-a" });
    expect(prisma.hrmsEmployee.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ organizationId: "org-a", userId: "user-a", employeeNumber: "EMP-1", status: "ACTIVE" }) }));
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "hrms.employee.created", organizationId: "org-a", actorUserId: "actor-a" }));
  });
});