import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";

export type NotePermissionInput = { userId: string; canEdit?: boolean; canDelete?: boolean };
export type NotePermission = NotePermissionInput & { user: { id: string; name: string; avatarUrl: string | null } };
export type Note = {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  folderId: string | null;
  owner: { id: string; name: string; avatarUrl: string | null };
  permissions: NotePermission[];
  createdAt: string;
  updatedAt: string;
};
export type NoteFolder = { id: string; name: string; notes?: Note[] };
export type NotesTree = { folders: NoteFolder[]; homeNotes: Note[] };
export type NoteInput = { title: string; content: string; folderId?: string | null; permissions?: NotePermissionInput[] };

const base = "/api/organization/notes";

export const notesService = {
  getTree: (organizationId: string) => tenantRequest<NotesTree>(organizationId, `${base}/tree`),
  listNotes: (organizationId: string, folderId?: string) =>
    tenantRequest<Note[]>(organizationId, base, { query: folderId ? { folderId } : undefined }),
  createFolder: (organizationId: string, name: string) =>
    tenantJsonRequest<NoteFolder, { name: string }>(organizationId, `${base}/folders`, "POST", { name }),
  updateFolder: (organizationId: string, folderId: string, name: string) =>
    tenantJsonRequest<NoteFolder, { name: string }>(organizationId, `${base}/folders/${pathSegment(folderId)}`, "PATCH", { name }),
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
