import { FileService } from "./file.service";

const file = {
  originalName: "private-contract.pdf",
  contentType: "application/pdf",
  data: Buffer.from("%PDF-fixture"),
};
function setup() {
  const prisma = {
    storedFile: {
      create: jest.fn().mockResolvedValue({ id: "file-a", sizeBytes: file.data.length }),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
  };
  const storage = {
    upload: jest.fn(),
    presignDownload: jest.fn().mockResolvedValue("https://storage.example.test/download"),
    delete: jest.fn(),
  };
  const config = { s3: { bucket: "test-bucket", presignTtlSeconds: 900 }, fileMaxSizeBytes: 10 * 1024 * 1024 };
  const audit = { record: jest.fn() };
  return {
    prisma,
    storage,
    audit,
    service: new FileService(prisma as never, storage as never, config as never, audit as never),
  };
}
describe("shared storage access scopes", () => {
  it("reports unavailable storage explicitly and does not create metadata or claim upload success", async () => {
    const { service, prisma, storage } = setup();
    storage.upload.mockRejectedValue(new Error("Storage connection failed"));
    await expect(service.upload("org-a", "actor", file)).rejects.toMatchObject({
      code: "FILE_STORAGE_UNAVAILABLE", status: 503,
      message: "Document storage is unavailable. Please retry or contact your administrator.",
    });
    expect(prisma.storedFile.create).not.toHaveBeenCalled();
  });
  it("preserves ordinary organization uploads while explicitly marking private feature uploads", async () => {
    const { service, prisma, audit } = setup();
    await service.upload("org-a", "actor", file);
    expect(prisma.storedFile.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accessScope: "ORGANIZATION" }),
      }),
    );
    await service.upload("org-a", "actor", file, { accessScope: "HRMS_EMPLOYEE_DOCUMENT" });
    expect(prisma.storedFile.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ accessScope: "HRMS_EMPLOYEE_DOCUMENT" }),
      }),
    );
    expect(audit.record).toHaveBeenLastCalledWith(
      expect.objectContaining({ metadata: { sizeBytes: file.data.length } }),
    );
  });
  it("excludes employee documents from generic file lists", async () => {
    const { service, prisma } = setup();
    await service.listFiles("org-a");
    expect(prisma.storedFile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org-a", deletedAt: null, accessScope: "ORGANIZATION" },
      }),
    );
  });
  it("refuses generic download/delete of a guessed private file id", async () => {
    const { service, prisma, storage } = setup();
    prisma.storedFile.findFirst.mockImplementation(async ({ where }) =>
      where.accessScope === "HRMS_EMPLOYEE_DOCUMENT"
        ? { id: "file-a", objectKey: "private-key", uploadedById: "actor", originalName: file.originalName }
        : null,
    );
    await expect(service.getDownloadUrl("org-a", "file-a", "actor")).rejects.toMatchObject({ status: 404 });
    await expect(service.delete("org-a", "file-a", "actor")).rejects.toMatchObject({ status: 404 });
    expect(storage.presignDownload).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
    await expect(
      service.getDownloadUrl("org-a", "file-a", "actor", { accessScope: "HRMS_EMPLOYEE_DOCUMENT" }),
    ).resolves.toMatchObject({ expiresIn: 900 });
  });
  it("enforces tenant and deletion scope for authorized download calls too", async () => {
    const { service, prisma } = setup();
    prisma.storedFile.findFirst.mockResolvedValue(null);
    await expect(
      service.getDownloadUrl("org-b", "file-a", "actor", { accessScope: "HRMS_EMPLOYEE_DOCUMENT" }),
    ).rejects.toMatchObject({ status: 404 });
    expect(prisma.storedFile.findFirst).toHaveBeenCalledWith({
      where: { id: "file-a", organizationId: "org-b", deletedAt: null, accessScope: "HRMS_EMPLOYEE_DOCUMENT" },
    });
  });
  it("cleans up uploaded objects when metadata persistence fails and propagates the failure", async () => {
    const { service, prisma, storage } = setup();
    prisma.storedFile.create.mockRejectedValue(new Error("Database unavailable"));
    await expect(service.upload("org-a", "actor", file)).rejects.toThrow("Database unavailable");
    expect(storage.delete).toHaveBeenCalledWith(expect.stringContaining("org-a/"));
  });
  it("preserves uploader-only deletion for ordinary files", async () => {
    const { service, prisma, storage } = setup();
    prisma.storedFile.findFirst.mockResolvedValue({ id: "file-a", uploadedById: "other" });
    await expect(service.delete("org-a", "file-a", "actor")).rejects.toMatchObject({ status: 403 });
    expect(prisma.storedFile.update).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
