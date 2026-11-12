import { HrmsEmployeeImportService } from "./hrms-employee-import.service";

const members = [
  { user: { id: "u1", email: "aarav@acme.test" } },
  { user: { id: "u2", email: "simran@acme.test" } },
  { user: { id: "u3", email: "vikram@acme.test" } },
];

function makeService() {
  const prisma = {
    $transaction: jest.fn(async (queries: unknown[]) => Promise.all(queries)),
    organizationMember: { findMany: jest.fn().mockResolvedValue(members) },
    hrmsEmployee: {
      findMany: jest.fn().mockResolvedValue([{ id: "e0", userId: "u9", employeeNumber: "EMP-0", reportingManager: null }]),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    hrmsLocation: { findMany: jest.fn().mockResolvedValue([{ id: "l1", name: "Bengaluru HQ", code: "BLR" }]) },
    organizationDepartment: { findMany: jest.fn().mockResolvedValue([{ id: "d1", name: "Engineering", code: null }]) },
    hrmsDesignation: { findMany: jest.fn().mockResolvedValue([{ id: "g1", name: "Engineer", code: null, departmentId: "d1" }]) },
    hrmsEmploymentType: { findMany: jest.fn().mockResolvedValue([{ name: "Full-time", code: "FT" }]) },
  };
  const audit = { record: jest.fn() };
  return { prisma, audit, service: new HrmsEmployeeImportService(prisma as never, audit as never) };
}

describe("HrmsEmployeeImportService", () => {
  it("round-trips the template through the parser and suggests a full column mapping", async () => {
    const { service } = makeService();
    for (const format of ["csv", "xlsx"] as const) {
      const file = await service.buildTemplate(format);
      const parsed = await service.parseUpload({
        buffer: file.buffer,
        originalname: file.fileName,
        size: file.buffer.length,
      });
      expect(parsed.rows).toHaveLength(1);
      expect(Object.values(parsed.suggestedMapping).every((index) => index !== null)).toBe(true);
    }
  });

  it("rejects unsupported file types and spoofed xlsx content", async () => {
    const { service } = makeService();
    const buffer = Buffer.from("a,b");
    await expect(service.parseUpload({ buffer, originalname: "x.pdf", size: 3 })).rejects.toMatchObject({ status: 400 });
    await expect(service.parseUpload({ buffer, originalname: "x.xlsx", size: 3 })).rejects.toMatchObject({ status: 400 });
  });

  it("validates references, duplicates and reporting cycles per row", async () => {
    const { service } = makeService();
    const { results, summary } = await service.validate("org-a", [
      { rowNumber: 2, email: "aarav@acme.test", employeeNumber: "EMP-1", department: "Engineering", designation: "Engineer", employmentType: "ft" },
      { rowNumber: 3, email: "simran@acme.test", employeeNumber: "EMP-2", reportingManagerEmployeeNumber: "EMP-1" },
      { rowNumber: 4, email: "nobody@acme.test", employeeNumber: "EMP-3" },
      { rowNumber: 5, email: "vikram@acme.test", employeeNumber: "EMP-1" },
      { rowNumber: 6, email: "vikram@acme.test", employeeNumber: "EMP-4", startDate: "2026-02-30" },
    ]);
    expect(results.map((result) => result.valid)).toEqual([true, true, false, false, false]);
    expect(results[3]?.errors).toContain("Duplicate employee number in file");
    expect(summary).toEqual({ total: 5, valid: 2, invalid: 3 });

    const cyclic = await service.validate("org-a", [
      { rowNumber: 2, email: "aarav@acme.test", employeeNumber: "A", reportingManagerEmployeeNumber: "B" },
      { rowNumber: 3, email: "simran@acme.test", employeeNumber: "B", reportingManagerEmployeeNumber: "A" },
    ]);
    expect(cyclic.results.every((result) => !result.valid)).toBe(true);
  });

  it("imports only valid rows in one insert, linking managers created in the same file", async () => {
    const { service, prisma, audit } = makeService();
    const outcome = await service.importRows("org-a", "actor", [
      { rowNumber: 2, email: "aarav@acme.test", employeeNumber: "EMP-1" },
      { rowNumber: 3, email: "simran@acme.test", employeeNumber: "EMP-2", reportingManagerEmployeeNumber: "EMP-1" },
      { rowNumber: 4, email: "bad", employeeNumber: "EMP-3" },
    ]);
    expect(outcome).toMatchObject({ created: 2, skipped: 1 });
    const data = prisma.hrmsEmployee.createMany.mock.calls[0]?.[0].data as Array<{ id: string; reportingManagerId: string | null }>;
    expect(data[1]?.reportingManagerId).toBe(data[0]?.id);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "hrms.employee.imported" }));
  });

  it("neutralises spreadsheet formulas in exports", async () => {
    const { service } = makeService();
    const file = await service.buildExport("csv", [
      {
        employeeNumber: "EMP-1",
        status: "ACTIVE",
        employmentType: null,
        startDate: null,
        user: { name: "=HYPERLINK(1)", email: "a@acme.test" },
        workLocation: null,
        department: null,
        designation: null,
        reportingManager: null,
      },
    ]);
    expect(file.buffer.toString()).toContain("'=HYPERLINK(1)");
  });
});
