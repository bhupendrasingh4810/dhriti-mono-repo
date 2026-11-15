import { HrmsEmployeeFoundationService } from "./hrms-employee-foundation.service";
import { HrmsEmployeeController } from "../controllers/hrms-employee.controller";
import { ACCESS_REQUIREMENTS_KEY } from "../../../common/decorators/access.decorator";

function fixture() {
  const tx = {
    hrmsEmployee: {
      findFirst: jest
        .fn()
        .mockResolvedValue({ lifecycleData: {}, lifecycleVersion: 0, startDate: null, resignationDate: null }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    user: { findMany: jest.fn() },
    hrmsWorkWeekAssignment: { findFirst: jest.fn().mockResolvedValue(null) },
    hrmsWorkWeekDefault: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn(async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx)),
  };
  const employees = {
    get: jest.fn().mockResolvedValue({}),
    profile: jest.fn().mockResolvedValue({ profile: { organizationFields: {} }, catalog: { definitions: [] } }),
  };
  return { service: new HrmsEmployeeFoundationService(prisma as never, employees as never), prisma, employees };
}
describe("employee foundation persistence contracts", () => {
  it("keeps all new routes behind HRMS entitlement and employee management", () => {
    for (const action of ["readiness", "lifecycle", "updateLifecycle"] as const) {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsEmployeeController.prototype[action])).toEqual({
        entitlement: "hrms.enabled",
        permission: "hrms.workforce.manage",
      });
    }
  });
  it("scopes reads and writes to non-archived tenant employees and records atomic history", async () => {
    const { service, prisma } = fixture();
    await service.updateLifecycle("org", "employee", "actor", {
      action: "CONFIGURE",
      version: 0,
      reason: "Initial tracking",
      data: { probationEndDate: null, contractStartDate: null, contractEndDate: null, noticePeriodDays: 30 },
    });
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "employee", organizationId: "org", deletedAt: null },
      }),
    );
    expect(prisma.hrmsEmployee.updateMany).toHaveBeenCalledWith({
      where: { id: "employee", organizationId: "org", deletedAt: null, lifecycleVersion: 0 },
      data: { lifecycleData: expect.objectContaining({ noticePeriodDays: 30 }), lifecycleVersion: { increment: 1 } },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org",
        actorUserId: "actor",
        action: "hrms.employee.lifecycle.configure",
        metadata: expect.objectContaining({
          reason: "Initial tracking",
          timeline: {
            version: 1,
            changes: [{ field: "noticePeriodDays", label: "Notice period days", before: null, after: "30" }],
          },
        }),
      }),
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });
  it("rejects stale editors and missing tenant employees without recording success", async () => {
    const { service, prisma } = fixture();
    prisma.hrmsEmployee.updateMany.mockResolvedValue({ count: 0 });
    const input = {
      action: "CONFIGURE",
      version: 0,
      reason: "Setup",
      data: { probationEndDate: null, contractStartDate: null, contractEndDate: null, noticePeriodDays: null },
    };
    await expect(service.updateLifecycle("org", "employee", "actor", input)).rejects.toMatchObject({ status: 409 });
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    await expect(service.lifecycle("org", "foreign")).rejects.toMatchObject({ status: 404 });
  });
  it("surfaces corrupted stored values instead of unconfigured-success defaults", async () => {
    const { service, prisma } = fixture();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ lifecycleData: { probationEndDate: "BAD" } });
    await expect(service.lifecycle("org", "employee")).rejects.toMatchObject({ status: 500 });
  });
  it("checks required fields without counting optional or archived fields as missing", async () => {
    const { service, employees } = fixture();
    employees.profile.mockResolvedValue({
      profile: { organizationFields: { zero: 0, optional: "ignored", archived: "" } },
      catalog: {
        definitions: [
          { id: "zero", label: "Number", type: "number", required: true, archived: false },
          { id: "missing", label: "Required desk", type: "text", required: true, archived: false },
          { id: "optional", label: "Optional", type: "text", required: false, archived: false },
          { id: "archived", label: "Old field", type: "text", required: true, archived: true },
        ],
      },
    });
    const result = await service.readiness("org", "employee");
    expect(result.checks.find((check) => check.key === "requiredProfile")).toMatchObject({
      status: "ATTENTION",
      message: "Review: Required desk.",
    });
    expect(result.checks.find((check) => check.key === "workWeek")?.message).toContain("legacy");
    expect(employees.get).toHaveBeenCalledWith("org", "employee");
  });
});
