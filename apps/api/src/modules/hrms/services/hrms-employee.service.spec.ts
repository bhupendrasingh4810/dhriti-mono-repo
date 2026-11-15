import { ErrorCode } from "../../../common/errors/error-codes";
import { Prisma } from "@prisma/client";
import { HrmsEmployeeService } from "./hrms-employee.service";
import {
  hrmsEmployeeProfileSchema,
  updateHrmsEmployeeProfileSchema,
  validateHrmsOrganizationFields,
  hrmsProfileFieldDefinitionsSchema,
} from "@dhriti/validation";

const fieldId = "11111111-1111-4111-8111-111111111111";
const definition = { id: fieldId, label: "Desk", type: "text" as const, required: true, archived: false, options: [] };

function makePrisma() {
  const prisma = {
    hrmsEmployee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    organizationMember: { findFirst: jest.fn() },
    hrmsAsset: { findMany: jest.fn().mockResolvedValue([]) },
    auditLog: { create: jest.fn(), createMany: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    user: { findMany: jest.fn() },
    organization: {
      findFirst: jest.fn().mockResolvedValue({ hrmsProfileFields: [], hrmsProfileFieldsVersion: 0 }),
      updateMany: jest.fn(),
    },
  };
  prisma.hrmsEmployee.update.mockImplementation(async ({ data }) => ({
    ...(await prisma.hrmsEmployee.findFirst()),
    ...data,
  }));
  return {
    ...prisma,
    $transaction: jest.fn(async (operation: ((tx: typeof prisma) => unknown) | unknown[]) =>
      Array.isArray(operation) ? Promise.all(operation) : operation(prisma),
    ),
  };
}

function makeAudit() {
  return { record: jest.fn() };
}

describe("HrmsEmployeeService", () => {
  it("rejects self-reporting and an already cyclic manager chain inside the write transaction", async () => {
    const prisma = makePrisma();
    const employee = { id: "employee", startDate: null, endDate: null, retirementDate: null, resignationDate: null };
    prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.update("org", "employee", "actor", { reportingManagerId: "employee" })).rejects.toThrow("themselves");
    prisma.hrmsEmployee.findFirst
      .mockReset()
      .mockResolvedValueOnce(employee)
      .mockResolvedValueOnce({ id: "manager" })
      .mockResolvedValueOnce({ reportingManagerId: "other-manager" })
      .mockResolvedValueOnce({ reportingManagerId: "manager" });
    await expect(service.update("org", "employee", "actor", { reportingManagerId: "manager" })).rejects.toThrow("circular");
    expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });
  it("prevents a joining-date edit from invalidating configured lifecycle dates", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({
      id: "employee", startDate: new Date("2026-01-01"), endDate: null, retirementDate: null, resignationDate: null,
      lifecycleData: { probationEndDate: "2026-03-01" },
    });
    await expect(new HrmsEmployeeService(prisma as never, makeAudit() as never).update(
      "org", "employee", "actor", { startDate: "2026-04-01" },
    )).rejects.toThrow("joining");
    expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
  });
  it("validates organization-required fields on the server before profile writes", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ profileData: {}, profileVersion: 0 });
    prisma.organization.findFirst.mockResolvedValue({ hrmsProfileFields: [definition], hrmsProfileFieldsVersion: 1 });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(
      service.updateProfile("org-a", "employee-a", "actor", { version: 0, catalogVersion: 1, profile: {} }),
    ).rejects.toMatchObject({
      status: 400,
      details: { fields: { [fieldId]: "Desk is required." } },
    });
    expect(prisma.hrmsEmployee.updateMany).not.toHaveBeenCalled();
  });
  it("rejects an editor with an obsolete field policy", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ profileData: {}, profileVersion: 0 });
    prisma.organization.findFirst.mockResolvedValue({ hrmsProfileFields: [definition], hrmsProfileFieldsVersion: 1 });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(
      service.updateProfile("org-a", "employee-a", "actor", { version: 0, catalogVersion: 0, profile: {} }),
    ).rejects.toMatchObject({ status: 409 });
    expect(prisma.hrmsEmployee.updateMany).not.toHaveBeenCalled();
  });
  it("preserves archived employee values and rejects edits or deletion of those values", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({
      profileData: { organizationFields: { [fieldId]: "A12" } },
      profileVersion: 0,
    });
    prisma.organization.findFirst.mockResolvedValue({
      hrmsProfileFields: [{ ...definition, archived: true }],
      hrmsProfileFieldsVersion: 1,
    });
    prisma.hrmsEmployee.updateMany.mockResolvedValue({ count: 1 });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(
      service.updateProfile("org-a", "employee-a", "actor", { version: 0, catalogVersion: 1, profile: {} }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.updateProfile("org-a", "employee-a", "actor", {
        version: 0,
        catalogVersion: 1,
        profile: { organizationFields: { [fieldId]: "B12" } },
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.updateProfile("org-a", "employee-a", "actor", {
        version: 0,
        catalogVersion: 1,
        profile: { organizationFields: { [fieldId]: "A12" } },
      }),
    ).resolves.toMatchObject({ version: 1 });
  });
  it("scopes catalog writes to the organization and versions policies without touching employee data", async () => {
    const prisma = makePrisma(),
      audit = makeAudit();
    prisma.organization.updateMany.mockResolvedValue({ count: 1 });
    const service = new HrmsEmployeeService(prisma as never, audit as never);
    await expect(
      service.updateProfileFields("org-a", "actor", { definitions: [definition], version: 0 }),
    ).resolves.toEqual({ definitions: [definition], version: 1 });
    expect(prisma.organization.updateMany).toHaveBeenCalledWith({
      where: { id: "org-a", deletedAt: null, hrmsProfileFieldsVersion: 0 },
      data: { hrmsProfileFields: [definition], hrmsProfileFieldsVersion: { increment: 1 } },
    });
    expect(prisma.hrmsEmployee.updateMany).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorUserId: "actor", action: "hrms.employee.profile_fields_updated" }),
    );
  });
  it("rejects stale catalog writes and missing organizations", async () => {
    const prisma = makePrisma();
    prisma.organization.updateMany.mockResolvedValue({ count: 0 });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.updateProfileFields("org-a", "actor", { definitions: [], version: 0 })).rejects.toMatchObject({
      status: 409,
    });
    prisma.organization.findFirst.mockResolvedValue(null);
    await expect(service.profileFields("org-b")).rejects.toMatchObject({ status: 404 });
  });
  it.each([{ definitions: [] }, { definitions: [{ ...definition, type: "number" }] }])(
    "requires existing fields to be archived instead of deleted or retyped",
    async ({ definitions }) => {
      const prisma = makePrisma();
      prisma.organization.findFirst.mockResolvedValue({ hrmsProfileFields: [definition], hrmsProfileFieldsVersion: 1 });
      const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
      await expect(service.updateProfileFields("org-a", "actor", { definitions, version: 1 })).rejects.toMatchObject({
        status: 400,
      });
      expect(prisma.organization.updateMany).not.toHaveBeenCalled();
    },
  );
  it("validates every typed value without confusing zero or false with missing values", () => {
    expect(validateHrmsOrganizationFields([{ ...definition, type: "number" }], { [fieldId]: 0 })).toEqual({});
    expect(
      validateHrmsOrganizationFields([{ ...definition, type: "checkbox", required: false }], { [fieldId]: false }),
    ).toEqual({});
    for (const [type, value] of [
      ["number", "12"],
      ["date", "2026-02-30"],
      ["select", "Other"],
      ["checkbox", false],
    ] as const) {
      expect(
        validateHrmsOrganizationFields([{ ...definition, type, options: type === "select" ? ["Yes"] : [] }], {
          [fieldId]: value,
        }),
      ).toHaveProperty(fieldId);
    }
    expect(validateHrmsOrganizationFields([{ ...definition, type: "date" }], { [fieldId]: "2024-02-29" })).toEqual({});
    expect(validateHrmsOrganizationFields([], { [fieldId]: "foreign" })).toHaveProperty(fieldId);
  });
  it("rejects duplicate catalog labels/options and invalid definitions", () => {
    const otherId = "22222222-2222-4222-8222-222222222222";
    expect(
      hrmsProfileFieldDefinitionsSchema.safeParse([definition, { ...definition, id: otherId, label: "desk" }]).success,
    ).toBe(false);
    expect(
      hrmsProfileFieldDefinitionsSchema.safeParse([{ ...definition, type: "select", options: ["Yes", "yes"] }]).success,
    ).toBe(false);
    expect(hrmsProfileFieldDefinitionsSchema.safeParse([{ ...definition, type: "select", options: [] }]).success).toBe(
      false,
    );
    expect(hrmsProfileFieldDefinitionsSchema.safeParse([{ ...definition, label: "" }]).success).toBe(false);
  });
  it("clears employment dates explicitly while omitted fields remain unchanged", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({
      id: "employee-a",
      lifecycleData: {},
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-11-01"),
      retirementDate: null,
      resignationDate: null,
    });
    prisma.hrmsEmployee.update.mockResolvedValue({ id: "employee-a" });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await service.update("org-a", "employee-a", "actor", { startDate: null, endDate: null });
    expect(prisma.hrmsEmployee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "employee-a", organizationId: "org-a", deletedAt: null, updatedAt: undefined },
        data: { startDate: null, endDate: null },
      }),
    );
  });

  describe("employee career timeline", () => {
    const employee = {
      id: "employee-a",
      employeeNumber: "EMP-1",
      status: "ACTIVE",
      employmentType: "Full time",
      startDate: new Date("2026-01-01"),
      endDate: null,
      retirementDate: null,
      resignationDate: null,
      updatedAt: new Date("2026-11-01"),
      departmentId: "dept-a",
      department: { name: "Engineering" },
      designationId: null,
      designation: null,
      workLocationId: null,
      workLocation: null,
      shiftId: null,
      shift: null,
      reportingManagerId: null,
      reportingManager: null,
      biometricId: "PRIVATE-BIOMETRIC",
      profileData: { personalEmail: "private@example.test" },
    };
    it("records normalized job changes with snapshotted labels inside the employee transaction", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      prisma.hrmsEmployee.update.mockResolvedValue({
        ...employee,
        employeeNumber: "EMP-2",
        departmentId: null,
        department: null,
        biometricId: "NEW-PRIVATE-BIOMETRIC",
      });
      const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
      await service.update("org-a", "employee-a", "actor-a", {
        departmentId: null,
        employeeNumber: " EMP-2 ",
        biometricId: "NEW-PRIVATE-BIOMETRIC",
      });
      expect(prisma.hrmsEmployee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "employee-a", organizationId: "org-a", deletedAt: null, updatedAt: employee.updatedAt },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: "hrms.employee.updated",
          organizationId: "org-a",
          actorUserId: "actor-a",
          resourceType: "HrmsEmployee",
          resourceId: "employee-a",
          metadata: {
            timeline: {
              version: 1,
              changes: [
                { field: "employeeNumber", label: "Employee number", before: "EMP-1", after: "EMP-2" },
                { field: "departmentId", label: "Department", before: "Engineering", after: null },
              ],
            },
          },
        },
      });
      expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("PRIVATE");
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
    });
    it("does not fabricate changes for a no-op edit", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      await new HrmsEmployeeService(prisma as never, makeAudit() as never).update("org-a", "employee-a", "actor-a", {
        employeeNumber: " EMP-1 ",
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ metadata: { timeline: { version: 1, changes: [] } } }),
        }),
      );
    });
    it("surfaces failed history writes rather than returning success", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      prisma.auditLog.create.mockRejectedValue(new Error("History write failed"));
      await expect(
        new HrmsEmployeeService(prisma as never, makeAudit() as never).update("org-a", "employee-a", "actor-a", {
          status: "INACTIVE",
        }),
      ).rejects.toThrow("History write failed");
    });
    it("does not mask a history failure as a duplicate employee on creation", async () => {
      const prisma = makePrisma();
      prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
      prisma.hrmsEmployee.create.mockResolvedValue({ id: "employee-a" });
      prisma.auditLog.create.mockRejectedValue(new Error("History write failed"));
      await expect(
        new HrmsEmployeeService(prisma as never, makeAudit() as never).create("org-a", "actor-a", {
          userId: "user-a",
          employeeNumber: "EMP-1",
          status: "ACTIVE",
        }),
      ).rejects.toThrow("History write failed");
    });
    it("rejects concurrent employee edits with an explicit reload conflict", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      prisma.hrmsEmployee.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Changed employee", { code: "P2025", clientVersion: "test" }),
      );
      await expect(
        new HrmsEmployeeService(prisma as never, makeAudit() as never).update("org-a", "employee-a", "actor-a", {
          status: "INACTIVE",
        }),
      ).rejects.toMatchObject({ status: 409 });
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });
    it("records report detachment when their manager is removed", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      prisma.hrmsEmployee.findMany.mockResolvedValue([
        {
          ...employee,
          id: "report-a",
          reportingManagerId: "manager-a",
          reportingManager: { employeeNumber: "MGR-1", user: { name: "Manager" } },
        },
      ]);
      await new HrmsEmployeeService(prisma as never, makeAudit() as never).delete("org-a", "manager-a", "actor-a");
      expect(prisma.auditLog.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              resourceId: "report-a",
              metadata: {
                timeline: {
                  version: 1,
                  changes: [
                    {
                      field: "reportingManagerId",
                      label: "Reporting manager",
                      before: "Manager (MGR-1)",
                      after: null,
                    },
                  ],
                },
              },
            }),
          ]),
        }),
      );
    });
    it("enforces tenant scope before reading history", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
      await expect(
        new HrmsEmployeeService(prisma as never, makeAudit() as never).timeline("org-a", "foreign", {
          page: 1,
          pageSize: 20,
        }),
      ).rejects.toMatchObject({ status: 404 });
      expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
    });
    it("paginates only job events and safely returns legacy detail availability and actor names", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      prisma.auditLog.count.mockResolvedValue(25);
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: "event-a",
          action: "hrms.employee.updated",
          createdAt: new Date("2026-11-01"),
          actorUserId: "actor-a",
          metadata: { timeline: { version: 1, changes: [] }, privateData: "SECRET" },
        },
        {
          id: "event-b",
          action: "hrms.employee.created",
          createdAt: new Date("2026-01-01"),
          actorUserId: null,
          metadata: null,
        },
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: "actor-a", name: "HR manager" }]);
      const result = await new HrmsEmployeeService(prisma as never, makeAudit() as never).timeline(
        "org-a",
        "employee-a",
        { page: 2, pageSize: 10 },
      );
      expect(result).toMatchObject({
        total: 25,
        page: 2,
        pageSize: 10,
        items: [
          { actor: { id: "actor-a", name: "HR manager" }, hasChangeDetails: true },
          { actor: null, hasChangeDetails: false, changes: [] },
        ],
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: "org-a",
            resourceType: "HrmsEmployee",
            resourceId: "employee-a",
            OR: [
              { action: { in: ["hrms.employee.created", "hrms.employee.updated", "hrms.employee.imported"] } },
              { action: { startsWith: "hrms.employee.lifecycle." } },
            ],
          },
          skip: 10,
          take: 10,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
      );
      expect(JSON.stringify(result)).not.toContain("SECRET");
    });
    it("reports corrupt recorded details instead of silently losing history", async () => {
      const prisma = makePrisma();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(employee);
      prisma.auditLog.count.mockResolvedValue(1);
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: "event-a",
          action: "hrms.employee.updated",
          createdAt: new Date(),
          actorUserId: null,
          metadata: { timeline: { version: 1, changes: "invalid" } },
        },
      ]);
      await expect(
        new HrmsEmployeeService(prisma as never, makeAudit() as never).timeline("org-a", "employee-a", {
          page: 1,
          pageSize: 20,
        }),
      ).rejects.toMatchObject({ status: 500 });
    });
  });
  it("rejects employment end dates before joining on update", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ startDate: new Date("2026-01-01"), endDate: null });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.update("org-a", "employee-a", "actor", { endDate: "2025-12-31" })).rejects.toMatchObject({
      status: 400,
    });
    expect(prisma.hrmsEmployee.update).not.toHaveBeenCalled();
  });
  it("reads tenant-local profiles with safe empty defaults and does not expose them in directory queries", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ profileData: {}, profileVersion: 0 });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.profile("org-a", "employee-a")).resolves.toEqual({
      profile: hrmsEmployeeProfileSchema.parse({}),
      version: 0,
      catalog: { definitions: [], version: 0 },
    });
    expect(prisma.hrmsEmployee.findFirst).toHaveBeenCalledWith({
      where: { id: "employee-a", organizationId: "org-a", deletedAt: null },
      select: { profileData: true, profileVersion: true },
    });
    service.listForExport("org-a", {});
    expect(prisma.hrmsEmployee.findMany.mock.calls[0][0].select).not.toHaveProperty("profileData");
  });

  it("rejects cross-tenant profile reads and writes", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.profile("org-a", "foreign")).rejects.toMatchObject({ status: 404 });
    await expect(service.updateProfile("org-a", "foreign", "actor", { profile: {}, version: 0 })).rejects.toMatchObject(
      { status: 404 },
    );
    expect(prisma.hrmsEmployee.updateMany).not.toHaveBeenCalled();
  });

  it("normalizes and replaces profile values without changing cross-organization user data", async () => {
    const prisma = makePrisma(),
      audit = makeAudit();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ profileData: {}, profileVersion: 0 });
    prisma.hrmsEmployee.updateMany.mockResolvedValue({ count: 1 });
    const service = new HrmsEmployeeService(prisma as never, audit as never);
    const result = await service.updateProfile("org-a", "employee-a", "actor", {
      version: 0,
      profile: {
        preferredName: " Alex ",
        skills: [" TypeScript "],
        customFields: [{ name: " Desk ", value: " A12 " }],
      },
    });
    expect(result.profile.preferredName).toBe("Alex");
    expect(result.profile.skills).toEqual(["TypeScript"]);
    expect(result.profile.customFields).toEqual([{ name: "Desk", value: "A12" }]);
    expect(result.version).toBe(1);
    expect(prisma.hrmsEmployee.updateMany).toHaveBeenCalledWith({
      where: { id: "employee-a", organizationId: "org-a", deletedAt: null, profileVersion: 0 },
      data: { profileData: result.profile, profileVersion: { increment: 1 } },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "actor",
        metadata: { fields: ["preferredName", "skills", "customFields"] },
      }),
    );
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain("A12");
  });

  it("rejects stale profile writes without reporting success or auditing a change", async () => {
    const prisma = makePrisma(),
      audit = makeAudit();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ profileData: {}, profileVersion: 2 });
    prisma.hrmsEmployee.updateMany.mockResolvedValue({ count: 0 });
    const service = new HrmsEmployeeService(prisma as never, audit as never);
    await expect(
      service.updateProfile("org-a", "employee-a", "actor", { version: 1, profile: {} }),
    ).rejects.toMatchObject({ status: 409 });
    expect(audit.record).not.toHaveBeenCalled();
  });

  it("surfaces invalid persisted profiles instead of silently replacing them with empty data", async () => {
    const prisma = makePrisma();
    prisma.hrmsEmployee.findFirst.mockResolvedValue({ profileData: { skills: "invalid" }, profileVersion: 0 });
    const service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.profile("org-a", "employee-a")).rejects.toMatchObject({ status: 500 });
  });

  it.each([
    { profile: { skills: ["TypeScript", "typescript"] }, version: 0 },
    { profile: { customFields: [{ name: " ", value: "" }] }, version: 0 },
    { profile: { customFields: [{ name: "Desk" }, { name: " desk " }] }, version: 0 },
    { profile: { dateOfBirth: "2026-02-30" }, version: 0 },
    { profile: { dateOfBirth: "2999-01-01" }, version: 0 },
    { profile: { personalEmail: "invalid" }, version: 0 },
    { profile: { skills: Array.from({ length: 51 }, (_, i) => `Skill ${i}`) }, version: 0 },
    { profile: { organizationId: "other" }, version: 0 },
    { profile: {}, version: -1 },
  ])("rejects invalid profile payload %# before any write", async (input) => {
    expect(updateHrmsEmployeeProfileSchema.safeParse(input).success).toBe(false);
    const prisma = makePrisma(),
      service = new HrmsEmployeeService(prisma as never, makeAudit() as never);
    await expect(service.updateProfile("org-a", "employee-a", "actor", input)).rejects.toMatchObject({ status: 400 });
    expect(prisma.hrmsEmployee.updateMany).not.toHaveBeenCalled();
  });
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
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "hrms.employee.created",
          organizationId: "org-a",
          actorUserId: "actor-a",
        }),
      }),
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
      lifecycleData: {},
      startDate: new Date("2026-01-01T00:00:00Z"),
      retirementDate: new Date("2055-06-30T00:00:00Z"),
      resignationDate: null,
    });
    const service = new HrmsEmployeeService(prisma as never, audit as never);
    await service.update("org-a", "employee-a", "actor-a", {
      employeeNumber: " EMP-43 ",
      biometricId: null,
      retirementDate: null,
      resignationDate: "2026-10-28",
    });
    expect(prisma.hrmsEmployee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "employee-a", organizationId: "org-a", deletedAt: null, updatedAt: undefined },
        data: {
          employeeNumber: "EMP-43",
          biometricId: null,
          retirementDate: null,
          resignationDate: new Date("2026-10-28T00:00:00Z"),
        },
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "hrms.employee.updated",
          organizationId: "org-a",
          actorUserId: "actor-a",
        }),
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
