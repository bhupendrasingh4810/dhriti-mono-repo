import { HttpStatus, Injectable } from "@nestjs/common";
import type { Note, NoteFolder, NotePermission, Prisma } from "@prisma/client";

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
} from "./dto/notes.dto";

type NoteWithPermissions = Note & {
  permissions: NotePermission[];
  owner: { id: string; name: string; avatarUrl: string | null };
};

@Injectable()
export class NotesService {
  private readonly noteInclude = {
    owner: { select: { id: true, name: true, avatarUrl: true } },
    permissions: { orderBy: { createdAt: "asc" } },
  } satisfies Prisma.NoteInclude;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
          folder: true,
          permissions: { where: { userId } },
        },
      }),
    ]);

    return { folders, homeNotes, sharedNotes };
  }

  async list(organizationId: string, userId: string, query: ListNotesQueryDto): Promise<NoteWithPermissions[]> {
    if (query.folderId) {
      await this.findFolder(organizationId, query.folderId);
    }

    return this.prisma.note.findMany({
      where: {
        organizationId,
        folderId: query.folderId ?? null,
        OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
      },
      orderBy: { updatedAt: "desc" },
      include: this.noteInclude,
    });
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
        throw this.invalidMoveTarget("A folder cannot be its own move target");
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

    const note = await this.prisma.note.create({
      data: {
        organizationId,
        ownerId: userId,
        folderId: dto.folderId ?? null,
        title: dto.title.trim(),
        content: dto.content ?? "",
        permissions: dto.permissions
          ? {
              create: dto.permissions.map((permission) => ({
                userId: permission.userId,
                canEdit: permission.canEdit ?? false,
                canDelete: permission.canDelete ?? false,
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
    const note = await this.getNoteWithPermissions(organizationId, noteId);
    this.assertEditable(note, userId);
    if (dto.permissions !== undefined && note.ownerId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the note owner can change permissions", HttpStatus.FORBIDDEN);
    }
    if (dto.folderId) {
      await this.getOwnedFolder(organizationId, note.ownerId, dto.folderId);
    }
    await this.assertPermissionMembers(organizationId, note.ownerId, dto.permissions);

    const updated = await this.prisma.note.update({
      where: { id: noteId },
      data: {
        ...(dto.title === undefined ? {} : { title: dto.title.trim() }),
        ...(dto.content === undefined ? {} : { content: dto.content }),
        ...(dto.folderId === undefined ? {} : { folderId: dto.folderId }),
        ...(dto.permissions === undefined
          ? {}
          : {
              permissions: {
                deleteMany: {},
                create: dto.permissions.map((permission) => ({
                  userId: permission.userId,
                  canEdit: permission.canEdit ?? false,
                  canDelete: permission.canDelete ?? false,
                })),
              },
            }),
      },
      include: this.noteInclude,
    });
    await this.record("notes.note.updated", organizationId, userId, noteId);
    return updated;
  }

  async deleteNote(organizationId: string, userId: string, noteId: string): Promise<void> {
    const note = await this.getNoteWithPermissions(organizationId, noteId);
    this.assertDeletable(note, userId);
    await this.prisma.note.delete({ where: { id: noteId } });
    await this.record("notes.note.deleted", organizationId, userId, noteId);
  }

  private async findFolder(organizationId: string, folderId: string): Promise<NoteFolder> {
    const folder = await this.prisma.noteFolder.findFirst({ where: { id: folderId, organizationId } });
    if (!folder) {
      throw new AppError(ErrorCode.NOTE_FOLDER_NOT_FOUND, "Note folder not found", HttpStatus.NOT_FOUND);
    }
    return folder;
  }

  private async getOwnedFolder(organizationId: string, userId: string, folderId: string): Promise<NoteFolder> {
    const folder = await this.findFolder(organizationId, folderId);
    if (folder.ownerId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the folder owner can modify it", HttpStatus.FORBIDDEN);
    }
    return folder;
  }

  private async getNoteWithPermissions(organizationId: string, noteId: string): Promise<NoteWithPermissions> {
    const note = await this.prisma.note.findFirst({
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
    const memberships = await this.prisma.organizationMember.count({
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
    if (note.ownerId === userId || note.permissions.some((permission) => permission.userId === userId)) {
      return;
    }
    throw new AppError(ErrorCode.FORBIDDEN, "You do not have access to this note", HttpStatus.FORBIDDEN);
  }

  private assertEditable(note: NoteWithPermissions, userId: string): void {
    if (
      note.ownerId === userId ||
      note.permissions.some((permission) => permission.userId === userId && permission.canEdit)
    ) {
      return;
    }
    throw new AppError(ErrorCode.FORBIDDEN, "You cannot edit this note", HttpStatus.FORBIDDEN);
  }

  private assertDeletable(note: NoteWithPermissions, userId: string): void {
    if (
      note.ownerId === userId ||
      note.permissions.some((permission) => permission.userId === userId && permission.canDelete)
    ) {
      return;
    }
    throw new AppError(ErrorCode.FORBIDDEN, "You cannot delete this note", HttpStatus.FORBIDDEN);
  }

  private invalidMoveTarget(message: string): AppError {
    return new AppError(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST);
  }

  private async record(action: string, organizationId: string, userId: string, noteId: string): Promise<void> {
    await this.audit.record({ action, organizationId, actorUserId: userId, resourceType: "Note", resourceId: noteId });
  }
}
