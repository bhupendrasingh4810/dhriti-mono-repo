import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { validate } from "class-validator";
import { AppSettingsService } from "../settings/app-settings.service";
import { CreateNoteAccessRequestDto, ReviewNoteAccessRequestDto, UpdateNoteDto } from "./dto/notes.dto";
import { NotesService } from "./notes.service";

const databaseTests = process.env.NOTES_DATABASE_TESTS === "true" ? describe : describe.skip;

databaseTests("Public notes and access requests", () => {
  const prisma = new PrismaClient();
  const organizationId = randomUUID();
  const otherOrganizationId = randomUUID();
  const ownerId = randomUUID();
  const requesterId = randomUUID();
  const viewerId = randomUUID();
  const service = new NotesService(
    prisma as never,
    { record: jest.fn().mockResolvedValue(undefined) } as never,
    new AppSettingsService(prisma as never),
  );
  const createPublic = () =>
    service.createNote(organizationId, ownerId, { title: "Organization guide", isPublic: true });

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.organization.createMany({
      data: [organizationId, otherOrganizationId].map((id) => ({
        id,
        name: "Public notes fixture",
        slug: `notes-public-${id}`,
      })),
    });
    await prisma.user.createMany({
      data: [ownerId, requesterId, viewerId].map((id) => ({ id, name: "Notes member", email: `${id}@example.test` })),
    });
    await prisma.organizationMember.createMany({
      data: [ownerId, requesterId, viewerId].map((userId) => ({ organizationId, userId })),
    });
  });

  afterAll(async () => {
    try {
      await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [ownerId, requesterId, viewerId] } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it("defaults existing-style creation to private and exposes public notes only within the organization", async () => {
    const privateNote = await service.createNote(organizationId, ownerId, { title: "Private" });
    expect(privateNote.isPublic).toBe(false);
    await expect(service.getNote(organizationId, viewerId, privateNote.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const publicNote = await createPublic();
    expect((await service.getNote(organizationId, viewerId, publicNote.id)).id).toBe(publicNote.id);
    expect((await service.list(organizationId, viewerId, {})).map(({ id }) => id)).toContain(publicNote.id);
    expect((await service.list(organizationId, viewerId, {})).map(({ id }) => id)).not.toContain(privateNote.id);
    expect(await service.list(otherOrganizationId, viewerId, {})).toEqual([]);
    await expect(service.getNote(otherOrganizationId, viewerId, publicNote.id)).rejects.toMatchObject({
      code: "NOTE_NOT_FOUND",
    });
    await expect(service.updateNote(organizationId, viewerId, publicNote.id, { content: "No" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(service.deleteNote(organizationId, viewerId, publicNote.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await service.saveOrder(organizationId, viewerId, { noteIds: [publicNote.id] });
  });

  it("lists incoming and outgoing requests without exposing them to unrelated members or tenants", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" });
    expect((await service.listRequests(organizationId, ownerId)).map(({ id }) => id)).toContain(request.id);
    expect((await service.listRequests(organizationId, requesterId)).map(({ id }) => id)).toContain(request.id);
    expect(await service.listRequests(organizationId, viewerId)).toEqual([]);
    expect(await service.listRequests(otherOrganizationId, ownerId)).toEqual([]);
    await expect(
      service.reviewRequest(organizationId, viewerId, request.id, { status: "APPROVED" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.reviewRequest(otherOrganizationId, ownerId, request.id, { status: "APPROVED" }),
    ).rejects.toMatchObject({ code: "NOTE_NOT_FOUND" });
    await expect(
      service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "OWNER" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("defaults approval to the requested role and grants edit without delete or ownership", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" });
    expect(await service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" })).toMatchObject({
      status: "APPROVED",
      grantedRole: "EDIT",
      reviewedById: ownerId,
    });
    await service.updateNote(organizationId, requesterId, note.id, { content: "Approved edit" });
    await expect(service.deleteNote(organizationId, requesterId, note.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.updateNote(organizationId, requesterId, note.id, { isPublic: false })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(service.updateNote(organizationId, requesterId, note.id, { permissions: [] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("allows the owner to change a co-owner request into edit access before approval", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "OWNER" });
    await service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED", grantedRole: "EDIT" });
    expect((await service.getNote(organizationId, requesterId, note.id)).permissions).toEqual([
      expect.objectContaining({ userId: requesterId, canEdit: true, canDelete: false, isOwner: false }),
    ]);
  });

  it("adds a full-access co-owner without transferring the original owner's access", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" });
    await service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED", grantedRole: "OWNER" });
    const anotherRequest = await service.requestAccess(organizationId, viewerId, note.id, { requestedRole: "EDIT" });
    expect((await service.listRequests(organizationId, requesterId)).map(({ id }) => id)).toContain(anotherRequest.id);
    await service.reviewRequest(organizationId, requesterId, anotherRequest.id, { status: "APPROVED" });
    const changed = await service.updateNote(organizationId, requesterId, note.id, {
      content: "Co-owner edit",
      isPublic: false,
    });
    expect(changed.ownerId).toBe(ownerId);
    expect(changed.isPublic).toBe(false);
    await service.updateNote(organizationId, ownerId, note.id, { content: "Original owner edit" });
    // Co-ownership itself grants full access, regardless of redundant Edit/Delete flags.
    await service.updateNote(organizationId, requesterId, note.id, {
      permissions: [{ userId: requesterId, isOwner: true, canEdit: false, canDelete: false }],
    });
    await service.deleteNote(organizationId, requesterId, note.id);
  });

  it("rejects without granting access, supports resubmission and reviews each pending request once", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "OWNER" });
    await service.reviewRequest(organizationId, ownerId, request.id, { status: "REJECTED" });
    expect((await service.getNote(organizationId, requesterId, note.id)).permissions).toEqual([]);
    const resubmitted = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" });
    expect(resubmitted).toMatchObject({ id: request.id, status: "PENDING", grantedRole: null });
    const results = await Promise.allSettled([
      service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" }),
      service.reviewRequest(organizationId, ownerId, request.id, { status: "REJECTED" }),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
  });

  it("rejects pending requests when a note becomes private and disallows new requests", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "OWNER" });
    await service.updateNote(organizationId, ownerId, note.id, { isPublic: false });
    expect(await prisma.noteAccessRequest.findUnique({ where: { id: request.id } })).toMatchObject({
      status: "REJECTED",
    });
    await expect(
      service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect((await service.listRequests(organizationId, requesterId)).map(({ id }) => id)).not.toContain(request.id);
  });

  it("preserves independently granted delete permission when approving edit access", async () => {
    const note = await createPublic();
    await service.updateNote(organizationId, ownerId, note.id, {
      permissions: [{ userId: requesterId, canEdit: false, canDelete: true }],
    });
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" });
    await service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" });
    expect((await service.getNote(organizationId, requesterId, note.id)).permissions).toEqual([
      expect.objectContaining({ userId: requesterId, canEdit: true, canDelete: true, isOwner: false }),
    ]);
  });

  it("does not allow a revoked co-owner to review pending requests", async () => {
    const note = await createPublic();
    await service.updateNote(organizationId, ownerId, note.id, {
      permissions: [{ userId: requesterId, isOwner: true }],
    });
    const request = await service.requestAccess(organizationId, viewerId, note.id, { requestedRole: "OWNER" });
    await service.updateNote(organizationId, ownerId, note.id, { permissions: [] });
    await expect(
      service.reviewRequest(organizationId, requesterId, request.id, { status: "APPROVED" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await prisma.noteAccessRequest.findUnique({ where: { id: request.id } })).toMatchObject({
      status: "PENDING",
    });
  });

  it("enforces organization sharing policy without partially approving a request", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "OWNER" });
    await prisma.notesOrganizationSettings.update({ where: { organizationId }, data: { sharingEnabled: false } });
    try {
      await expect(createPublic()).rejects.toThrow("Note sharing is turned off");
      await expect(service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" })).rejects.toThrow(
        "Note sharing is turned off",
      );
      await prisma.notesOrganizationSettings.update({
        where: { organizationId },
        data: { sharingEnabled: true, maxSharedUsersPerNote: 0 },
      });
      await expect(service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" })).rejects.toThrow(
        "at most 0 people",
      );
      expect(await prisma.noteAccessRequest.findUnique({ where: { id: request.id } })).toMatchObject({
        status: "PENDING",
        grantedRole: null,
      });
      expect((await service.getNote(organizationId, ownerId, note.id)).permissions).toEqual([]);
    } finally {
      await prisma.notesOrganizationSettings.delete({ where: { organizationId } });
    }
  });

  it("checks active organization membership again before granting access", async () => {
    const note = await createPublic();
    const request = await service.requestAccess(organizationId, requesterId, note.id, { requestedRole: "EDIT" });
    await prisma.organizationMember.deleteMany({ where: { organizationId, userId: requesterId } });
    try {
      await expect(
        service.reviewRequest(organizationId, ownerId, request.id, { status: "APPROVED" }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      expect((await service.getNote(organizationId, ownerId, note.id)).permissions).toEqual([]);
    } finally {
      await prisma.organizationMember.create({ data: { organizationId, userId: requesterId } });
    }
  });
});

describe("Note access request validation", () => {
  it("allows omitted visibility but rejects null or non-boolean visibility", async () => {
    expect(await validate(new UpdateNoteDto())).toHaveLength(0);
    for (const isPublic of [null, "public", 1]) {
      expect(await validate(Object.assign(new UpdateNoteDto(), { isPublic }))).not.toHaveLength(0);
    }
    expect(await validate(Object.assign(new UpdateNoteDto(), { isPublic: false }))).toHaveLength(0);
  });

  it("rejects unsupported requested and granted roles or decisions", async () => {
    expect(
      await validate(Object.assign(new CreateNoteAccessRequestDto(), { requestedRole: "ADMIN" })),
    ).not.toHaveLength(0);
    expect(
      await validate(Object.assign(new ReviewNoteAccessRequestDto(), { status: "PENDING", grantedRole: "ADMIN" })),
    ).not.toHaveLength(0);
    expect(await validate(Object.assign(new ReviewNoteAccessRequestDto(), { status: "APPROVED" }))).toHaveLength(0);
  });
});
