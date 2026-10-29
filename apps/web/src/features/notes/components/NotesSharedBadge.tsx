import { Share2 } from "lucide-react";
import type { Note } from "@/services/notes.service";

export function NotesSharedBadge({ note }: { note: Pick<Note, "permissions"> }) {
  if (note.permissions.length === 0) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-muted px-2 py-1 text-xs font-medium text-brand-dark">
      <Share2 size={12} aria-hidden="true" />
      Shared
    </span>
  );
}
