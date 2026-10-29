import { ApiRequestError } from "@/services/http.service";
import type { Note } from "@/services/notes.service";

export function isNoteAccessRejected(error: unknown): boolean {
  return error instanceof ApiRequestError && (error.status === 403 || error.status === 404);
}

export function reorderNotes<T extends Pick<Note, "id">>(notes: T[], sourceId: string, targetId: string): T[] {
  const source = notes.findIndex((note) => note.id === sourceId);
  const target = notes.findIndex((note) => note.id === targetId);
  if (source < 0 || target < 0 || source === target) return notes;
  const ordered = [...notes];
  const [moved] = ordered.splice(source, 1);
  ordered.splice(target, 0, moved);
  return ordered;
}
