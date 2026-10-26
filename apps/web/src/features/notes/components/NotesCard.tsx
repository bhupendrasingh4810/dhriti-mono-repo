import type { MouseEvent } from "react";
import { MoreHorizontal, MoreVertical, Pencil, Share2, Trash2 } from "lucide-react";
import type { Note } from "@/services/notes.service";

interface NotesCardProps {
  note: Note;
  menuOpen: boolean;
  onView: () => void;
  onMenuOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

interface NotesCardActionsProps {
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function NotesCard({ note, menuOpen, onView, onMenuOpen, onDragStart, onDragEnd }: NotesCardProps) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative flex min-h-44 flex-col rounded-lg border border-border bg-background p-4 hover:bg-surface-raised"
    >
      <button type="button" onClick={onView} className="flex min-h-36 cursor-pointer flex-col text-left">
        <h3 className="truncate pr-8 font-bold">{note.title || "Untitled note"}</h3>
        <p className="mt-1 text-xs text-text-secondary">Owned by {note.owner.name}</p>
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-text-secondary">
          {note.content || "No content yet."}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-brand">
          Show more <MoreHorizontal size={16} />
        </span>
      </button>
      <button
        type="button"
        onClick={onMenuOpen}
        className={`absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-md text-text-secondary transition-opacity hover:bg-surface hover:text-text-primary focus-visible:opacity-100 ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        aria-label={`Actions for ${note.title}`}
      >
        <MoreVertical size={18} />
      </button>
    </article>
  );
}

export function NotesCardActions({ onEdit, onShare, onDelete }: NotesCardActionsProps) {
  return (
    <div className="p-1">
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-raised"
      >
        <Pencil size={15} /> Edit
      </button>
      <button
        type="button"
        onClick={onShare}
        className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-raised"
      >
        <Share2 size={15} /> Share
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm text-error hover:bg-error/10"
      >
        <Trash2 size={15} /> Delete
      </button>
    </div>
  );
}
