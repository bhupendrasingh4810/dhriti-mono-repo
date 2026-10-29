import type { MouseEvent } from "react";
import { ArrowLeft, ArrowRight, MoreHorizontal, MoreVertical, Pencil, Share2, Trash2, KeyRound } from "lucide-react";
import type { Note, NoteAccessRole } from "@/services/notes.service";
import { NotesSharedBadge } from "./NotesSharedBadge";
import { canDeleteNote, canEditNote, canShareNote } from "../note-access";

interface NotesCardProps {
  note: Note;
  menuOpen: boolean;
  onView: () => void;
  onMenuOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropNote?: () => void;
  reordering?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

interface NotesCardActionsProps {
  note: Pick<Note, "ownerId" | "permissions" | "isPublic">;
  userId: string | undefined;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  onRequestAccess: (role: NoteAccessRole) => void;
}

export function NotesCard({
  note,
  menuOpen,
  onView,
  onMenuOpen,
  onDragStart,
  onDragEnd,
  onDropNote,
  reordering = false,
  onMoveUp,
  onMoveDown,
}: NotesCardProps) {
  return (
    <article
      draggable={!reordering}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", note.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (onDropNote && !reordering) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!reordering) onDropNote?.();
      }}
      className="group relative flex min-h-44 flex-col rounded-lg border border-border bg-background p-4 hover:bg-surface-raised"
    >
      <button type="button" onClick={onView} className="flex min-h-36 cursor-pointer flex-col text-left">
        <h3 className="truncate pr-8 font-bold">{note.title || "Untitled note"}</h3>
        <p className="mt-1 text-xs text-text-secondary">Owned by {note.owner.name}</p>
        <span className="mt-2 text-xs font-medium text-text-secondary">{note.isPublic ? "Public" : "Private"}</span>
        {note.permissions.length > 0 ? (
          <span className="mt-2">
            <NotesSharedBadge note={note} />
          </span>
        ) : null}
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-text-secondary">
          {note.content || "No content yet."}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-brand">
          Show more <MoreHorizontal size={16} />
        </span>
      </button>
      {onMoveUp || onMoveDown ? (
        <div className="mt-auto flex shrink-0 gap-1 pt-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={reordering || !onMoveUp}
            aria-label={`Move ${note.title} earlier`}
            className="rounded-md p-1 text-text-secondary hover:bg-surface disabled:opacity-40"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={reordering || !onMoveDown}
            aria-label={`Move ${note.title} later`}
            className="rounded-md p-1 text-text-secondary hover:bg-surface disabled:opacity-40"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}
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

export function NotesCardActions({ note, userId, onEdit, onShare, onDelete, onRequestAccess }: NotesCardActionsProps) {
  const canEdit = canEditNote(note, userId, false);
  const canShare = canShareNote(note, userId);
  const canDelete = canDeleteNote(note, userId);
  const canRequest = Boolean(userId && note.isPublic && !canShare);
  if (!canEdit && !canShare && !canDelete && !canRequest) {
    return <p className="p-3 text-sm text-text-secondary">You have view-only access.</p>;
  }

  return (
    <div className="p-1">
      {canRequest ? (
        <>
          {!canEdit ? (
            <button
              type="button"
              onClick={() => onRequestAccess("EDIT")}
              className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-raised"
            >
              <KeyRound size={15} aria-hidden="true" /> Request edit access
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onRequestAccess("OWNER")}
            className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-raised"
          >
            <KeyRound size={15} aria-hidden="true" /> Request co-owner access
          </button>
        </>
      ) : null}
      {canEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-raised"
        >
          <Pencil size={15} /> Edit
        </button>
      ) : null}
      {canShare ? (
        <button
          type="button"
          onClick={onShare}
          className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-surface-raised"
        >
          <Share2 size={15} /> Share
        </button>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-sm text-error hover:bg-error/10"
        >
          <Trash2 size={15} /> Delete
        </button>
      ) : null}
    </div>
  );
}
