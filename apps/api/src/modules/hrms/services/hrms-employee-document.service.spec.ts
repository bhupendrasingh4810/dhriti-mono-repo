import { Prisma } from "@prisma/client";
import { HrmsEmployeeDocumentService, EMPLOYEE_DOCUMENT_MAX_BYTES } from "./hrms-employee-document.service";

const file = { originalName: "contract.pdf", contentType: "application/pdf", data: Buffer.from("%PDF-1.7\nfixture") };
const document = {
  id: "document-a",
  title: "Employment contract",
  category: "EMPLOYMENT",
  createdAt: new Date("2026-11-15"),
  file: { originalName: "contract.pdf", contentType: "application/pdf", sizeBytes: file.data.length },
  employee: { id: "employee-a", employeeNumber: "EMP-1", user: { name: "Employee" } },
};

function setup() {
  const db = {
    hrmsEmployee: { findFirst: jest.fn().mockResolvedValue({ id: "employee-a" }) },
    hrmsEmployeeDocument: {
      findMany: jest.fn().mockResolvedValue([document]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue({ fileId: "file-a" }),
      create: jest.fn().mockResolvedValue(document),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    ...db,
    $transaction: jest.fn(async (operation: unknown[] | ((tx: typeof db) => unknown)) =>
      Array.isArray(operation) ? Promise.all(operation) : operation(db),
    ),
  };
  const files = {
    upload: jest.fn().mockResolvedValue({ id: "file-a" }),
    delete: jest.fn(),
    getDownloadUrl: jest.fn().mockResolvedValue({ url: "https://storage.example.test/private", expiresIn: 900 }),
  };
  return { prisma, files, service: new HrmsEmployeeDocumentService(prisma as never, files as never) };
}

describe("HR-managed employee documents", () => {
  it("scopes lists to the employee, organization and private active files with bounded stable pagination", async () => {
    const { service, prisma } = setup();
    expect(await service.list("org-a", "employee-a", { page: 2, pageSize: 10 })).toEqual({
      items: [
        {
          id: "document-a",
          title: document.title,
          category: document.category,
          ...document.file,
          employee: { id: "employee-a", employeeNumber: "EMP-1", name: "Employee" },
          createdAt: document.createdAt.toISOString(),
        },
      ],
      total: 1,
      page: 2,
      pageSize: 10,
    });
    expect(prisma.hrmsEmployeeDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org-a",
          employeeId: "employee-a",
          archivedAt: null,
          employee: { organizationId: "org-a", deletedAt: null },
          file: { organizationId: "org-a", accessScope: "HRMS_EMPLOYEE_DOCUMENT", deletedAt: null },
        },
        skip: 10,
        take: 10,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });
  it("lists the organization library without admitting removed or foreign employees", async () => {
    const { service, prisma } = setup();
    await service.list("org-a", undefined, { page: 1, pageSize: 20 });
    expect(prisma.hrmsEmployee.findFirst).not.toHaveBeenCalled();
    expect(prisma.hrmsEmployeeDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-a",
          employee: { organizationId: "org-a", deletedAt: null },
        }),
      }),
    );
  });
  it("does not expose private storage identifiers in document responses", async () => {
    const { service } = setup();
    const result = await service.list("org-a", "employee-a", { page: 1, pageSize: 20 });
    expect(result.items[0]).not.toHaveProperty("fileId");
    expect(result.items[0]).not.toHaveProperty("objectKey");
    expect(result.items[0]).not.toHaveProperty("uploadedById");
  });
  it.each(["list", "upload", "download", "archive"] as const)(
    "rejects foreign/deleted employees before %s",
    async (operation) => {
      const { service, prisma, files } = setup();
      prisma.hrmsEmployee.findFirst.mockResolvedValue(null);
      const request =
        operation === "list"
          ? service.list("org-a", "foreign", { page: 1, pageSize: 20 })
          : operation === "upload"
            ? service.upload("org-a", "foreign", "actor", { title: "Contract", category: "EMPLOYMENT" }, file)
            : operation === "download"
              ? service.download("org-a", "foreign", "doc-a", "actor")
              : service.archive("org-a", "foreign", "doc-a", "actor");
      await expect(request).rejects.toMatchObject({ status: 404 });
      expect(files.upload).not.toHaveBeenCalled();
      expect(files.getDownloadUrl).not.toHaveBeenCalled();
      expect(prisma.hrmsEmployeeDocument.updateMany).not.toHaveBeenCalled();
    },
  );
  it("uploads into private storage and commits the employee link with its audit event", async () => {
    const { service, prisma, files } = setup();
    await service.upload("org-a", "employee-a", "actor", { title: " Contract ", category: "EMPLOYMENT" }, file);
    expect(files.upload).toHaveBeenCalledWith("org-a", "actor", file, { accessScope: "HRMS_EMPLOYEE_DOCUMENT" });
    expect(prisma.hrmsEmployeeDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          organizationId: "org-a",
          employeeId: "employee-a",
          fileId: "file-a",
          uploadedById: "actor",
          title: "Contract",
          category: "EMPLOYMENT",
        },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "hrms.employee.document_uploaded",
        organizationId: "org-a",
        actorUserId: "actor",
        resourceType: "HrmsEmployeeDocument",
        resourceId: "document-a",
        metadata: { employeeId: "employee-a", category: "EMPLOYMENT" },
      },
    });
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("contract.pdf");
  });
  it.each([
    { title: "", category: "PERSONAL" },
    { title: " ", category: "PERSONAL" },
    { title: "A".repeat(161), category: "PERSONAL" },
    { title: "Contract", category: "INVALID" },
    { title: "Contract", category: "PERSONAL", fileId: "existing-public-file" },
  ])("rejects invalid document metadata before storage writes: %#", async (input) => {
    const { service, files } = setup();
    await expect(service.upload("org-a", "employee-a", "actor", input, file)).rejects.toMatchObject({ status: 400 });
    expect(files.upload).not.toHaveBeenCalled();
  });
  it.each([
    undefined,
    { ...file, data: Buffer.alloc(0) },
    { ...file, originalName: "bad\nfile.pdf" },
    { ...file, originalName: "a".repeat(256) },
    { ...file, data: Buffer.from("not a pdf") },
    { ...file, contentType: "application/zip" },
    { ...file, contentType: "image/png" },
  ])("rejects empty, unsupported or spoofed files: %#", async (invalidFile) => {
    const { service, files } = setup();
    await expect(
      service.upload("org-a", "employee-a", "actor", { title: "Contract", category: "EMPLOYMENT" }, invalidFile),
    ).rejects.toMatchObject({ status: expect.any(Number) });
    expect(files.upload).not.toHaveBeenCalled();
  });
  it("enforces the exact 10 MB maximum and accepts matching PNG/JPEG signatures", async () => {
    const { service, files } = setup();
    const exact = Buffer.alloc(EMPLOYEE_DOCUMENT_MAX_BYTES);
    file.data.copy(exact);
    await service.upload(
      "org-a",
      "employee-a",
      "actor",
      { title: "Contract", category: "EMPLOYMENT" },
      { ...file, data: exact },
    );
    await expect(
      service.upload(
        "org-a",
        "employee-a",
        "actor",
        { title: "Contract", category: "EMPLOYMENT" },
        { ...file, data: Buffer.alloc(EMPLOYEE_DOCUMENT_MAX_BYTES + 1) },
      ),
    ).rejects.toMatchObject({ status: 413 });
    for (const [contentType, data] of [
      ["image/png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])],
      ["image/jpeg", Buffer.from([255, 216, 255, 217])],
    ] as const) {
      await service.upload(
        "org-a",
        "employee-a",
        "actor",
        { title: "Proof", category: "PERSONAL" },
        { originalName: "proof", contentType, data },
      );
    }
    expect(files.upload).toHaveBeenCalledTimes(3);
  });
  it("cleans up the private upload when the employee was removed during storage upload", async () => {
    const { service, prisma, files } = setup();
    prisma.hrmsEmployee.findFirst.mockResolvedValueOnce({ id: "employee-a" }).mockResolvedValueOnce(null);
    await expect(
      service.upload("org-a", "employee-a", "actor", { title: "Contract", category: "EMPLOYMENT" }, file),
    ).rejects.toMatchObject({ status: 404 });
    expect(files.delete).toHaveBeenCalledWith("org-a", "file-a", "actor", "HRMS_EMPLOYEE_DOCUMENT");
    expect(prisma.hrmsEmployeeDocument.create).not.toHaveBeenCalled();
  });
  it("cleans up an unlinked private file on history failure without returning success", async () => {
    const { service, prisma, files } = setup();
    prisma.auditLog.create.mockRejectedValue(new Error("History unavailable"));
    await expect(
      service.upload("org-a", "employee-a", "actor", { title: "Contract", category: "EMPLOYMENT" }, file),
    ).rejects.toThrow("History unavailable");
    expect(files.delete).toHaveBeenCalledWith("org-a", "file-a", "actor", "HRMS_EMPLOYEE_DOCUMENT");
  });
  it("maps transaction conflicts to a retry error after cleaning up storage", async () => {
    const { service, prisma, files } = setup();
    prisma.hrmsEmployeeDocument.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Conflict", { code: "P2034", clientVersion: "test" }),
    );
    await expect(
      service.upload("org-a", "employee-a", "actor", { title: "Contract", category: "EMPLOYMENT" }, file),
    ).rejects.toMatchObject({ status: 409 });
    expect(files.delete).toHaveBeenCalled();
  });
  it("downloads only an active document belonging to the requested employee through the private storage scope", async () => {
    const { service, prisma, files } = setup();
    await expect(service.download("org-a", "employee-a", "document-a", "actor")).resolves.toMatchObject({
      expiresIn: 900,
    });
    expect(prisma.hrmsEmployeeDocument.findFirst).toHaveBeenCalledWith({
      where: {
        id: "document-a",
        organizationId: "org-a",
        employeeId: "employee-a",
        archivedAt: null,
        file: { organizationId: "org-a", accessScope: "HRMS_EMPLOYEE_DOCUMENT", deletedAt: null },
      },
      select: { fileId: true },
    });
    expect(files.getDownloadUrl).toHaveBeenCalledWith("org-a", "file-a", "actor", {
      accessScope: "HRMS_EMPLOYEE_DOCUMENT",
    });
    prisma.hrmsEmployeeDocument.findFirst.mockResolvedValue(null);
    await expect(service.download("org-a", "employee-a", "foreign-doc", "actor")).rejects.toMatchObject({
      status: 404,
    });
    expect(files.getDownloadUrl).toHaveBeenCalledTimes(1);
  });
  it("archives and audits together while retaining the file and refusing repeated/foreign archives", async () => {
    const { service, prisma, files } = setup();
    await service.archive("org-a", "employee-a", "document-a", "actor");
    expect(prisma.hrmsEmployeeDocument.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "document-a",
          organizationId: "org-a",
          employeeId: "employee-a",
          archivedAt: null,
        }),
        data: { archivedAt: expect.any(Date), archivedById: "actor" },
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "hrms.employee.document_archived", resourceId: "document-a" }),
      }),
    );
    expect(files.delete).not.toHaveBeenCalled();
    prisma.hrmsEmployeeDocument.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.archive("org-a", "employee-a", "document-a", "actor")).rejects.toMatchObject({ status: 404 });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });
  it("surfaces invalid persisted categories", async () => {
    const { service, prisma } = setup();
    prisma.hrmsEmployeeDocument.findMany.mockResolvedValue([{ ...document, category: "INVALID" }]);
    await expect(service.list("org-a", "employee-a", { page: 1, pageSize: 20 })).rejects.toMatchObject({ status: 500 });
  });
});
