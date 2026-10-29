import type { Note } from "@/services/notes.service";

export function canShareNote(note: Pick<Note, "ownerId" | "permissions">, userId: string | undefined): boolean {
  return Boolean(
    userId &&
    (note.ownerId === userId ||
      note.permissions.some((permission) => permission.userId === userId && permission.isOwner === true)),
  );
}

export function canDeleteNote(note: Pick<Note, "ownerId" | "permissions">, userId: string | undefined): boolean {
  if (!userId) return false;
  return (
    canShareNote(note, userId) ||
    note.permissions.some((permission) => permission.userId === userId && permission.canDelete === true)
  );
}

export function canEditNote(
  note: Pick<Note, "ownerId" | "permissions"> | null,
  userId: string | undefined,
  viewOnly: boolean,
): boolean {
  if (!userId) return false;
  if (note && canShareNote(note, userId)) return true;
  if (viewOnly) return false;
  return !note || note.permissions.some((permission) => permission.userId === userId && permission.canEdit === true);
}
