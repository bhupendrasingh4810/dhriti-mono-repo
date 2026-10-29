import { HttpStatus, Injectable } from "@nestjs/common";
import type { Note, NoteFolder, NotePermission, NotesOrganizationSettings, Prisma } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import type {
  CreateNoteDto,
  CreateNoteFolderDto,
  DeleteNoteFolderDto,
  ListNotesQueryDto,
  NotePermissionDto,
  UpdateNoteDto,
  UpdateNoteFolderDto,
  UpdateNoteOrderDto,
  CreateNoteAccessRequestDto,
  ReviewNoteAccessRequestDto,
} from "./dto/notes.dto";
import { AppSettingsService } from "../settings/app-settings.service";
import { resolveAppSettings, settingsPolicyError } from "../settings/settings.defaults";

type NoteWithPermissions = Note & {
  permissions: NotePermission[];
  owner: { id: string; name: string; avatarUrl: string | null };
};
type NotePolicy = Omit<NotesOrganizationSettings, "id" | "organizationId" | "createdAt" | "updatedAt">;

@Injectable()
export class NotesService {
  private readonly noteInclude = {
    owner: { select: { id: true, name: true, avatarUrl: true } },
    permissions: {
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    },
  } satisfies Prisma.NoteInclude;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly settings: AppSettingsService,
  ) {}

  private async assertNotePolicy(
    organizationId: string,
    dto: { content?: string; permissions?: unknown[]; isPublic?: boolean },
  ) {
    const policy = await resolveAppSettings(this.settings, "notes", organizationId);
    return this.validateNotePolicy(policy, dto);
  }

  private validateNotePolicy(
    policy: NotePolicy,
    dto: { content?: string; permissions?: unknown[]; isPublic?: boolean },
  ) {
    if (dto.content && dto.content.length > policy.maxNoteContentLength) {
      throw settingsPolicyError(
        `Notes are limited to ${policy.maxNoteContentLength} characters`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const shareCount = dto.permissions?.length ?? 0;
    if ((shareCount > 0 || dto.isPublic === true) && !policy.sharingEnabled) {
      throw settingsPolicyError("Note sharing is turned off for this organization");
    }
    if (policy.maxSharedUsersPerNote !== null && shareCount > policy.maxSharedUsersPerNote) {
      throw settingsPolicyError(
        `Notes can be shared with at most ${policy.maxSharedUsersPerNote} people`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return policy;
  }

  private isOwner(note: NoteWithPermissions, userId: string): boolean {
    return (
      note.ownerId === userId ||
      note.permissions.some((permission) => permission.userId === userId && permission.isOwner)
    );
  }

  private readableBy(userId: string): Prisma.NoteWhereInput[] {
    return [{ ownerId: userId }, { isPublic: true }, { permissions: { some: { userId } } }];
  }

  private async withNoteLock<T>(noteId: string, action: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`note:${noteId}`}))`;
      return action(tx);
    });
  }

  async tree(organizationId: string, userId: string) {
    const [folders, homeNotes, sharedNotes] = await this.prisma.$transaction([
      this.prisma.noteFolder.findMany({
        where: { organizationId, ownerId: userId },
        orderBy: { createdAt: "asc" },
        include: { notes: { where: { ownerId: userId }, orderBy: { updatedAt: "desc" }, include: this.noteInclude } },
      }),
      this.prisma.note.findMany({
        where: { organizationId, ownerId: userId, folderId: null },
        orderBy: { updatedAt: "desc" },
        include: this.noteInclude,
      }),
      this.prisma.note.findMany({
        where: { organizationId, ownerId: { not: userId }, permissions: { some: { userId } } },
        orderBy: { updatedAt: "desc" },
        include: {
          ...this.noteInclude,
          folder: true,
          permissions: { ...this.noteInclude.permissions, where: { userId } },
        },
      }),
    ]);

    return { folders, homeNotes, sharedNotes };
  }

  async list(organizationId: string, userId: string, query: ListNotesQueryDto): Promise<NoteWithPermissions[]> {
    if (query.folderId) {
      await this.findFolder(organizationId, query.folderId);
    }

    const notes = await this.prisma.note.findMany({
      where: {
        organizationId,
        ...(query.folderId ? { folderId: query.folderId } : {}),
        OR: this.readableBy(userId),
      },
      orderBy: { updatedAt: "desc" },
      include: this.noteInclude,
    });
    const order = await this.prisma.noteViewOrder.findUnique({
      where: { organizationId_userId_scope: { organizationId, userId, scope: query.folderId ?? "all" } },
      select: { noteIds: true },
    });
    if (!order) {
      return notes;
    }
    const positions = new Map(order.noteIds.map((id, index) => [id, index]));
    return notes.sort(
      (a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  async saveOrder(organizationId: string, userId: string, dto: UpdateNoteOrderDto): Promise<{ noteIds: string[] }> {
    if (dto.folderId) {
      await this.findFolder(organizationId, dto.folderId);
    }
    const accessible = await this.prisma.note.count({
      where: {
        organizationId,
        id: { in: dto.noteIds },
        ...(dto.folderId ? { folderId: dto.folderId } : {}),
        OR: this.readableBy(userId),
      },
    });
    if (accessible !== dto.noteIds.length) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Only accessible notes in this view can be reordered",
        HttpStatus.FORBIDDEN,
      );
    }
    const order = await this.prisma.noteViewOrder.upsert({
      where: { organizationId_userId_scope: { organizationId, userId, scope: dto.folderId ?? "all" } },
      create: { organizationId, userId, scope: dto.folderId ?? "all", noteIds: dto.noteIds },
      update: { noteIds: dto.noteIds },
      select: { noteIds: true },
    });
    return order;
  }

  async createFolder(organizationId: string, userId: string, dto: CreateNoteFolderDto): Promise<NoteFolder> {
    return this.prisma.noteFolder.create({
      data: {
        organizationId,
        ownerId: userId,
        name: dto.name.trim(),
      },
    });
  }

  async getFolder(organizationId: string, userId: string, folderId: string): Promise<NoteFolder> {
    return this.getOwnedFolder(organizationId, userId, folderId);
  }

  async updateFolder(
    organizationId: string,
    userId: string,
    folderId: string,
    dto: UpdateNoteFolderDto,
  ): Promise<NoteFolder> {
    await this.getOwnedFolder(organizationId, userId, folderId);
    return this.prisma.noteFolder.update({
      where: { id: folderId },
      data: {
        ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
      },
    });
  }

  async deleteFolder(
    organizationId: string,
    userId: string,
    folderId: string,
    dto: DeleteNoteFolderDto = {},
  ): Promise<void> {
    await this.getOwnedFolder(organizationId, userId, folderId);
    if (dto.moveToFolderId) {
      if (dto.moveToFolderId === folderId) {
        throw this.validationError("A folder cannot be its own move target");
      }
      await this.getOwnedFolder(organizationId, userId, dto.moveToFolderId);
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.moveToFolderId) {
        await tx.note.updateMany({
          where: { organizationId, ownerId: userId, folderId },
          data: { folderId: dto.moveToFolderId },
        });
      } else if (dto.moveToHome) {
        await tx.note.updateMany({
          where: { organizationId, ownerId: userId, folderId },
          data: { folderId: null },
        });
      }
      await tx.noteFolder.delete({ where: { id: folderId } });
    });
  }

  async createNote(organizationId: string, userId: string, dto: CreateNoteDto): Promise<NoteWithPermissions> {
    if (dto.folderId) {
      await this.getOwnedFolder(organizationId, userId, dto.folderId);
    }
    await this.assertPermissionMembers(organizationId, userId, dto.permissions);
    const policy = await this.assertNotePolicy(organizationId, dto);

    const note = await this.prisma.note.create({
      data: {
        organizationId,
        ownerId: userId,
        folderId: dto.folderId ?? null,
        title: dto.title.trim(),
        content: dto.content ?? "",
        isPublic: dto.isPublic ?? false,
        permissions: dto.permissions
          ? {
              create: dto.permissions.map((permission) => ({
                userId: permission.userId,
                canEdit: permission.canEdit ?? policy.defaultShareCanEdit,
                canDelete: permission.canDelete ?? policy.defaultShareCanDelete,
                isOwner: permission.isOwner ?? false,
              })),
            }
          : undefined,
      },
      include: this.noteInclude,
    });
    await this.record("notes.note.created", organizationId, userId, note.id);
    return note;
  }

  async getNote(organizationId: string, userId: string, noteId: string): Promise<NoteWithPermissions> {
    const note = await this.getNoteWithPermissions(organizationId, noteId);
    this.assertReadable(note, userId);
    return note;
  }

  async updateNote(
    organizationId: string,
    userId: string,
    noteId: string,
    dto: UpdateNoteDto,
  ): Promise<NoteWithPermissions> {
    const policy = await resolveAppSettings(this.settings, "notes", organizationId);
    const result = await this.withNoteLock(noteId, async (tx) => {
      const note = await this.getNoteWithPermissions(organizationId, noteId, tx);
      this.assertEditable(note, userId);
      if ((dto.permissions !== undefined || dto.isPublic !== undefined) && !this.isOwner(note, userId)) {
        throw new AppError(
          ErrorCode.FORBIDDEN,
          "Only note owners can change permissions or visibility",
          HttpStatus.FORBIDDEN,
        );
      }
      if (dto.folderId) {
        await this.getOwnedFolder(organizationId, note.ownerId, dto.folderId, tx);
      }
      await this.assertPermissionMembers(organizationId, note.ownerId, dto.permissions, tx);
      this.validateNotePolicy(policy, dto);

      const updated = await tx.note.update({
        where: { id: noteId },
        data: {
          ...(dto.title === undefined ? {} : { title: dto.title.trim() }),
          ...(dto.content === undefined ? {} : { content: dto.content }),
          ...(dto.folderId === undefined ? {} : { folderId: dto.folderId }),
          ...(dto.isPublic === undefined ? {} : { isPublic: dto.isPublic }),
          ...(dto.permissions === undefined
            ? {}
            : {
                permissions: {
                  deleteMany: {},
                  create: dto.permissions.map((permission) => ({
                    userId: permission.userId,
                    canEdit: permission.canEdit ?? policy.defaultShareCanEdit,
                    canDelete: permission.canDelete ?? policy.defaultShareCanDelete,
                    isOwner: permission.isOwner ?? false,
                  })),
                },
              }),
        },
        include: this.noteInclude,
      });
      if (dto.isPublic === false) {
        await tx.noteAccessRequest.updateMany({
          where: { noteId, status: "PENDING" },
          data: { status: "REJECTED", reviewedById: userId, grantedRole: null },
        });
      }
      return updated;
    });
    await this.record("notes.note.updated", organizationId, userId, noteId);
    return result;
  }

  async deleteNote(organizationId: string, userId: string, noteId: string): Promise<void> {
    await this.withNoteLock(noteId, async (tx) => {
      const note = await this.getNoteWithPermissions(organizationId, noteId, tx);
      this.assertDeletable(note, userId);
      await tx.note.delete({ where: { id: noteId } });
    });
    await this.record("notes.note.deleted", organizationId, userId, noteId);
  }

  async listRequests(organizationId: string, userId: string) {
    return this.prisma.noteAccessRequest.findMany({
      where: {
        note: { organizationId, OR: this.readableBy(userId) },
        OR: [{ userId }, { note: { ownerId: userId } }, { note: { permissions: { some: { userId, isOwner: true } } } }],
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        note: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            permissions: { where: { isOwner: true }, select: { userId: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async requestAccess(organizationId: string, userId: string, noteId: string, dto: CreateNoteAccessRequestDto) {
    const result = await this.withNoteLock(noteId, async (tx) => {
      const note = await this.getNoteWithPermissions(organizationId, noteId, tx);
      if (!note.isPublic) {
        throw new AppError(ErrorCode.FORBIDDEN, "Access can only be requested for public notes", HttpStatus.FORBIDDEN);
      }
      const permission = note.permissions.find((entry) => entry.userId === userId);
      if (this.isOwner(note, userId) || (dto.requestedRole === "EDIT" && permission?.canEdit)) {
        throw this.validationError("You already have the requested access");
      }
      await this.assertPermissionMembers(organizationId, note.ownerId, [{ userId }], tx);
      const existing = await tx.noteAccessRequest.findUnique({ where: { noteId_userId: { noteId, userId } } });
      if (existing?.status === "PENDING") {
        throw this.validationError("You already have a pending request for this note");
      }
      return tx.noteAccessRequest.upsert({
        where: { noteId_userId: { noteId, userId } },
        create: { noteId, userId, requestedRole: dto.requestedRole },
        update: { requestedRole: dto.requestedRole, status: "PENDING", grantedRole: null, reviewedById: null },
      });
    });
    await this.record("notes.request.created", organizationId, userId, noteId);
    return result;
  }

  async reviewRequest(organizationId: string, userId: string, requestId: string, dto: ReviewNoteAccessRequestDto) {
    const request = await this.prisma.noteAccessRequest.findFirst({
      where: { id: requestId, note: { organizationId } },
    });
    if (!request) {
      throw new AppError(ErrorCode.NOTE_NOT_FOUND, "Note request not found", HttpStatus.NOT_FOUND);
    }
    const policy = await resolveAppSettings(this.settings, "notes", organizationId);
    const result = await this.withNoteLock(request.noteId, async (tx) => {
      const note = await this.getNoteWithPermissions(organizationId, request.noteId, tx);
      if (!this.isOwner(note, userId)) {
        throw new AppError(ErrorCode.FORBIDDEN, "Only note owners can review requests", HttpStatus.FORBIDDEN);
      }
      const current = await tx.noteAccessRequest.findUniqueOrThrow({ where: { id: requestId } });
      if (current.status !== "PENDING") {
        throw this.validationError("This request has already been reviewed");
      }
      const grantedRole = dto.grantedRole ?? current.requestedRole;
      if (dto.status === "APPROVED") {
        if (!note.isPublic) {
          throw this.validationError("This note is no longer public");
        }
        await this.assertPermissionMembers(organizationId, note.ownerId, [{ userId: current.userId }], tx);
        const existing = note.permissions.find((permission) => permission.userId === current.userId);
        const permissions = note.permissions.map((permission) => ({ userId: permission.userId }));
        if (!existing) {
          permissions.push({ userId: current.userId });
        }
        this.validateNotePolicy(policy, { permissions });
        await tx.notePermission.upsert({
          where: { noteId_userId: { noteId: note.id, userId: current.userId } },
          create: {
            noteId: note.id,
            userId: current.userId,
            canEdit: true,
            canDelete: grantedRole === "OWNER",
            isOwner: grantedRole === "OWNER",
          },
          update: { canEdit: true, ...(grantedRole === "OWNER" ? { canDelete: true, isOwner: true } : {}) },
        });
      }
      const updated = await tx.noteAccessRequest.update({
        where: { id: requestId },
        data: { status: dto.status, grantedRole: dto.status === "APPROVED" ? grantedRole : null, reviewedById: userId },
      });
      return updated;
    });
    await this.record(`notes.request.${dto.status.toLowerCase()}`, organizationId, userId, request.noteId);
    return result;
  }

  private async findFolder(
    organizationId: string,
    folderId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<NoteFolder> {
    const folder = await client.noteFolder.findFirst({ where: { id: folderId, organizationId } });
    if (!folder) {
      throw new AppError(ErrorCode.NOTE_FOLDER_NOT_FOUND, "Note folder not found", HttpStatus.NOT_FOUND);
    }
    return folder;
  }

  private async getOwnedFolder(
    organizationId: string,
    userId: string,
    folderId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<NoteFolder> {
    const folder = await this.findFolder(organizationId, folderId, client);
    if (folder.ownerId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the folder owner can modify it", HttpStatus.FORBIDDEN);
    }
    return folder;
  }

  private async getNoteWithPermissions(
    organizationId: string,
    noteId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<NoteWithPermissions> {
    const note = await client.note.findFirst({
      where: { id: noteId, organizationId },
      include: this.noteInclude,
    });
    if (!note) {
      throw new AppError(ErrorCode.NOTE_NOT_FOUND, "Note not found", HttpStatus.NOT_FOUND);
    }
    return note;
  }

  private async assertPermissionMembers(
    organizationId: string,
    ownerId: string,
    permissions: NotePermissionDto[] | undefined,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    if (!permissions?.length) {
      return;
    }
    if (permissions.some((permission) => permission.userId === ownerId)) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "The note owner cannot be a note permission recipient",
        HttpStatus.BAD_REQUEST,
      );
    }
    const memberships = await client.organizationMember.count({
      where: {
        organizationId,
        userId: { in: permissions.map((permission) => permission.userId) },
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    if (memberships !== permissions.length) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Note permissions must be assigned to active organization members",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private assertReadable(note: NoteWithPermissions, userId: string): void {
    if (
      note.isPublic ||
      note.ownerId === userId ||
      note.permissions.some((permission) => permission.userId === userId)
    ) {
      return;
    }
    throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this note", HttpStatus.FORBIDDEN);
  }

  private assertEditable(note: NoteWithPermissions, userId: string): void {
    if (
      this.isOwner(note, userId) ||
      note.permissions.some((permission) => permission.userId === userId && permission.canEdit)
    ) {
      return;
    }
    throw new AppError(ErrorCode.FORBIDDEN, "You cannot edit this note", HttpStatus.FORBIDDEN);
  }

  private assertDeletable(note: NoteWithPermissions, userId: string): void {
    if (
      this.isOwner(note, userId) ||
      note.permissions.some((permission) => permission.userId === userId && permission.canDelete)
    ) {
      return;
    }
    throw new AppError(ErrorCode.FORBIDDEN, "You cannot delete this note", HttpStatus.FORBIDDEN);
  }

  private validationError(message: string): AppError {
    return new AppError(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST);
  }

  private async record(action: string, organizationId: string, userId: string, noteId: string): Promise<void> {
    await this.audit.record({ action, organizationId, actorUserId: userId, resourceType: "Note", resourceId: noteId });
  }
}
