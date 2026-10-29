import { NotesService } from "./notes.service";

describe("NotesService discovery", () => {
  const organizationId = "org-1";
  const userId = "recipient";

  function setup() {
    const prisma = {
      note: { findMany: jest.fn().mockResolvedValue([]) },
      noteFolder: { findFirst: jest.fn().mockResolvedValue({ id: "folder-1", organizationId }) },
      noteViewOrder: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new NotesService(prisma as never, {} as never, {} as never);
    return { service, prisma };
  }

  it("does not apply a home-folder filter to All notes", async () => {
    const { service, prisma } = setup();
    await service.list(organizationId, userId, {});
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId,
          OR: [{ ownerId: userId }, { isPublic: true }, { permissions: { some: { userId } } }],
        },
      }),
    );
  });

  it("keeps both tenant and recipient restrictions when filtering a folder", async () => {
    const { service, prisma } = setup();
    await service.list(organizationId, userId, { folderId: "folder-1" });
    expect(prisma.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId,
          folderId: "folder-1",
          OR: [{ ownerId: userId }, { isPublic: true }, { permissions: { some: { userId } } }],
        },
      }),
    );
  });
});
