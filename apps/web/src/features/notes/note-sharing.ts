import type { Note, NotePermissionInput } from "@/services/notes.service";

export type NoteSharingRecipient = {
  user: { id: string; name: string };
  canEdit: boolean;
  canDelete: boolean;
  isOwner?: boolean;
};

export function sharingRecipients(note: Pick<Note, "permissions">): NoteSharingRecipient[] {
  return note.permissions.map((permission) => ({
    user: permission.user,
    canEdit: permission.canEdit === true,
    canDelete: permission.canDelete === true,
    ...(permission.isOwner ? { isOwner: true } : {}),
  }));
}

export function sharingPermissions(recipients: NoteSharingRecipient[]): NotePermissionInput[] {
  return recipients.map(({ user, canEdit, canDelete, isOwner }) => ({
    userId: user.id,
    canEdit,
    canDelete,
    ...(isOwner ? { isOwner: true } : {}),
  }));
}

export function sharingChanged(note: Pick<Note, "permissions">, recipients: NoteSharingRecipient[]): boolean {
  const saved = new Map(note.permissions.map((permission) => [permission.userId, permission]));
  return (
    saved.size !== recipients.length ||
    recipients.some(({ user, canEdit, canDelete, isOwner }) => {
      const previous = saved.get(user.id);
      return (
        !previous ||
        (previous.canEdit === true) !== canEdit ||
        (previous.canDelete === true) !== canDelete ||
        (previous.isOwner === true) !== (isOwner === true)
      );
    })
  );
}
