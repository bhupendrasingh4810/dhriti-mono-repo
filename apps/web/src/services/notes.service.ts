import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";

export type NotePermissionInput = { userId: string; canEdit?: boolean; canDelete?: boolean; isOwner?: boolean };
export type NotePermission = NotePermissionInput & { user: { id: string; name: string; avatarUrl: string | null } };
export type Note = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  ownerId: string;
  folderId: string | null;
  owner: { id: string; name: string; avatarUrl: string | null };
  permissions: NotePermission[];
  createdAt: string;
  updatedAt: string;
};
export type NoteFolder = { id: string; name: string; notes?: Note[] };
export type NotesTree = { folders: NoteFolder[]; homeNotes: Note[]; sharedNotes: Note[] };
export type NoteInput = {
  title: string;
  content: string;
  isPublic?: boolean;
  folderId?: string | null;
  permissions?: NotePermissionInput[];
};
export type NoteAccessRole = "EDIT" | "OWNER";
export type NoteAccessRequest = {
  id: string;
  noteId: string;
  userId: string;
  requestedRole: NoteAccessRole;
  grantedRole: NoteAccessRole | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user: { id: string; name: string; avatarUrl: string | null };
  note: { id: string; title: string; ownerId: string; permissions: { userId: string }[] };
};

const base = "/api/organization/notes";

export const notesService = {
  listRequests: (organizationId: string) => tenantRequest<NoteAccessRequest[]>(organizationId, `${base}/requests`),
  requestAccess: (organizationId: string, noteId: string, requestedRole: NoteAccessRole) =>
    tenantJsonRequest<unknown, { requestedRole: NoteAccessRole }>(
      organizationId,
      `${base}/${pathSegment(noteId)}/requests`,
      "POST",
      { requestedRole },
    ),
  reviewRequest: (
    organizationId: string,
    requestId: string,
    status: "APPROVED" | "REJECTED",
    grantedRole?: NoteAccessRole,
  ) =>
    tenantJsonRequest<unknown, { status: "APPROVED" | "REJECTED"; grantedRole?: NoteAccessRole }>(
      organizationId,
      `${base}/requests/${pathSegment(requestId)}`,
      "PATCH",
      { status, grantedRole },
    ),
  getTree: (organizationId: string) => tenantRequest<NotesTree>(organizationId, `${base}/tree`),
  listNotes: (organizationId: string, folderId?: string) =>
    tenantRequest<Note[]>(organizationId, base, { query: folderId ? { folderId } : undefined }),
  saveOrder: (organizationId: string, noteIds: string[], folderId?: string) =>
    tenantJsonRequest<{ noteIds: string[] }, { noteIds: string[]; folderId?: string }>(
      organizationId,
      `${base}/order`,
      "PATCH",
      { noteIds, ...(folderId ? { folderId } : {}) },
    ),
  createFolder: (organizationId: string, name: string) =>
    tenantJsonRequest<NoteFolder, { name: string }>(organizationId, `${base}/folders`, "POST", { name }),
  updateFolder: (organizationId: string, folderId: string, name: string) =>
    tenantJsonRequest<NoteFolder, { name: string }>(
      organizationId,
      `${base}/folders/${pathSegment(folderId)}`,
      "PATCH",
      { name },
    ),
  deleteFolder: (organizationId: string, folderId: string, moveToFolderId?: string, moveToHome = false) =>
    tenantRequest<void>(organizationId, `${base}/folders/${pathSegment(folderId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moveToFolderId, moveToHome }),
    }),
  createNote: (organizationId: string, input: NoteInput) =>
    tenantJsonRequest<Note, NoteInput>(organizationId, base, "POST", input),
  updateNote: (organizationId: string, noteId: string, input: Partial<NoteInput>) =>
    tenantJsonRequest<Note, Partial<NoteInput>>(organizationId, `${base}/${pathSegment(noteId)}`, "PATCH", input),
  deleteNote: (organizationId: string, noteId: string) =>
    tenantRequest<void>(organizationId, `${base}/${pathSegment(noteId)}`, { method: "DELETE" }),
};
