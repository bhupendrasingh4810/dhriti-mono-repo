import { randomUUID } from "node:crypto";
import { isolatedPrisma } from "../../database/isolated-prisma.test-helper";
import { AppSettingsService } from "../settings/app-settings.service";
import { NotesService } from "./notes.service";

const databaseTests = process.env.NOTES_DATABASE_TESTS === "true" ? describe : describe.skip;

databaseTests("Notes sharing discovery", () => {
  const database = isolatedPrisma();
  const { prisma } = database;
  const organizationId = randomUUID();
  const otherOrganizationId = randomUUID();
  const ownerId = randomUUID();
  const recipientId = randomUUID();
  const unrelatedId = randomUUID();
  const folderId = randomUUID();
  const sharedNoteId = randomUUID();
  const privateNoteId = randomUUID();
  const ownNoteId = randomUUID();
  const otherTenantNoteId = randomUUID();
  const service = new NotesService(
    prisma as never,
    { record: jest.fn().mockResolvedValue(undefined) } as never,
    new AppSettingsService(prisma as never),
  );

  beforeAll(async () => {
    await database.setup();
    await prisma.organization.createMany({
      data: [organizationId, otherOrganizationId].map((id) => ({
        id,
        name: "Notes regression fixture",
        slug: `notes-test-${id}`,
      })),
    });
    await prisma.user.createMany({
      data: [ownerId, recipientId, unrelatedId].map((id) => ({
        id,
        name: "Notes test user",
        email: `${id}@example.test`,
      })),
    });
    await prisma.organizationMember.createMany({
      data: [ownerId, recipientId, unrelatedId].map((userId) => ({ organizationId, userId })),
    });
    await prisma.noteFolder.create({ data: { id: folderId, organizationId, ownerId, name: "Owner folder" } });
    await prisma.note.createMany({
      data: [
        { id: sharedNoteId, organizationId, ownerId, folderId, title: "Shared folder note" },
        { id: privateNoteId, organizationId, ownerId, folderId, title: "Private folder sibling" },
        { id: ownNoteId, organizationId, ownerId: recipientId, title: "Recipient's own note" },
        { id: otherTenantNoteId, organizationId: otherOrganizationId, ownerId, title: "Other tenant note" },
      ],
    });
    // Even an existing permission in another tenant must not leak its note.
    await prisma.notePermission.create({ data: { noteId: otherTenantNoteId, userId: recipientId } });
    await service.updateNote(organizationId, ownerId, sharedNoteId, {
      permissions: [{ userId: recipientId, canEdit: false, canDelete: false }],
    });
  }, 60000);

  afterAll(async () => {
    try {
      await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, recipientId, unrelatedId] } } });
    } finally {
      await database.cleanup();
    }
  });

  it("shows a note shared from the owner's folder on every fresh All notes load", async () => {
    for (let refresh = 0; refresh < 2; refresh += 1) {
      const notes = await service.list(organizationId, recipientId, {});
      expect(notes.map((note) => note.id).sort()).toEqual([sharedNoteId, ownNoteId].sort());
      expect(notes.find((note) => note.id === sharedNoteId)).toMatchObject({
        folderId,
        ownerId,
        owner: { id: ownerId },
        permissions: [expect.objectContaining({ userId: recipientId, canEdit: false })],
      });
    }
  });

  it("filters a folder without exposing private sibling notes", async () => {
    expect((await service.list(organizationId, recipientId, { folderId })).map((note) => note.id)).toEqual([
      sharedNoteId,
    ]);
  });

  it("does not expose shared notes to an unrelated organization member", async () => {
    expect(await service.list(organizationId, unrelatedId, {})).toEqual([]);
  });

  it("keeps all owned folder notes accessible to the owner", async () => {
    expect((await service.list(organizationId, ownerId, {})).map((note) => note.id).sort()).toEqual(
      [sharedNoteId, privateNoteId].sort(),
    );
  });

  it("returns owner details and the recipient's permission in the shared tree", async () => {
    const tree = await service.tree(organizationId, recipientId);
    expect(tree.sharedNotes).toEqual([
      expect.objectContaining({
        id: sharedNoteId,
        owner: expect.objectContaining({ id: ownerId }),
        permissions: [expect.objectContaining({ userId: recipientId })],
      }),
    ]);
  });

  it("persists personal All notes order across fresh service reads, including view-only shared notes", async () => {
    await service.saveOrder(organizationId, recipientId, { noteIds: [ownNoteId, sharedNoteId] });
    for (let refresh = 0; refresh < 2; refresh += 1) {
      expect((await service.list(organizationId, recipientId, {})).map((note) => note.id)).toEqual([
        ownNoteId,
        sharedNoteId,
      ]);
    }
    expect(
      await prisma.noteViewOrder.findUnique({
        where: { organizationId_userId_scope: { organizationId, userId: ownerId, scope: "all" } },
      }),
    ).toBeNull();
  });

  it("keeps folder order independent from All notes order", async () => {
    await service.saveOrder(organizationId, ownerId, { noteIds: [sharedNoteId, privateNoteId] });
    await service.saveOrder(organizationId, ownerId, { folderId, noteIds: [privateNoteId, sharedNoteId] });
    expect((await service.list(organizationId, ownerId, {})).map((note) => note.id)).toEqual([
      sharedNoteId,
      privateNoteId,
    ]);
    expect((await service.list(organizationId, ownerId, { folderId })).map((note) => note.id)).toEqual([
      privateNoteId,
      sharedNoteId,
    ]);
  });

  it("never permits ordering inaccessible, wrong-folder or other-tenant notes", async () => {
    await expect(service.saveOrder(organizationId, recipientId, { noteIds: [privateNoteId] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      service.saveOrder(organizationId, recipientId, { folderId, noteIds: [ownNoteId] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.saveOrder(organizationId, recipientId, { noteIds: [otherTenantNoteId] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("appends accessible notes missing from a saved order and supports resetting the order", async () => {
    await service.saveOrder(organizationId, recipientId, { noteIds: [ownNoteId] });
    expect((await service.list(organizationId, recipientId, {})).map((note) => note.id)).toEqual([
      ownNoteId,
      sharedNoteId,
    ]);
    await service.saveOrder(organizationId, recipientId, { noteIds: [] });
    expect((await service.list(organizationId, recipientId, {})).map((note) => note.id).sort()).toEqual(
      [ownNoteId, sharedNoteId].sort(),
    );
  });

  it("returns recipient identities so the owner can manage existing shares", async () => {
    const note = await service.getNote(organizationId, ownerId, sharedNoteId);
    expect(note.permissions).toEqual([
      expect.objectContaining({
        userId: recipientId,
        user: { id: recipientId, name: "Notes test user", avatarUrl: null },
        canEdit: false,
        canDelete: false,
      }),
    ]);
  });

  it("persists permission upgrades and downgrades without changing ownership", async () => {
    await service.updateNote(organizationId, ownerId, sharedNoteId, {
      permissions: [{ userId: recipientId, canEdit: true, canDelete: true }],
    });
    const changed = await service.updateNote(organizationId, recipientId, sharedNoteId, { content: "Recipient edit" });
    expect(changed.ownerId).toBe(ownerId);
    await service.updateNote(organizationId, ownerId, sharedNoteId, {
      permissions: [{ userId: recipientId, canEdit: false, canDelete: false }],
    });
    await expect(
      service.updateNote(organizationId, recipientId, sharedNoteId, { content: "Forbidden edit" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.deleteNote(organizationId, recipientId, sharedNoteId)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await service.getNote(organizationId, recipientId, sharedNoteId)).content).toBe("Recipient edit");
  });

  it("does not allow recipients to manage permissions even if they can edit and delete", async () => {
    await service.updateNote(organizationId, ownerId, sharedNoteId, {
      permissions: [{ userId: recipientId, canEdit: true, canDelete: true }],
    });
    await expect(
      service.updateNote(organizationId, recipientId, sharedNoteId, { permissions: [] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("removes discovery access after sharing is revoked", async () => {
    await service.updateNote(organizationId, ownerId, sharedNoteId, { permissions: [] });
    expect((await service.list(organizationId, recipientId, {})).map((note) => note.id)).toEqual([ownNoteId]);
    expect((await service.tree(organizationId, recipientId)).sharedNotes).toEqual([]);
  });
});
