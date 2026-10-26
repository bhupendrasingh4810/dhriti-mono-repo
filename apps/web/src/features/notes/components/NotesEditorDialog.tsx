"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { notesService, type Note } from "@/services/notes.service";

interface NotesEditorDialogProps {
  note: Note | null;
  folderId: string | null;
  viewOnly: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function NotesEditorDialog({ note, folderId, viewOnly, onClose, onSaved }: NotesEditorDialogProps) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const canEdit =
    !viewOnly &&
    (!note ||
      note.ownerId === user?.id ||
      note.permissions.some((permission) => permission.userId === user?.id && permission.canEdit));
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!organizationId || !title.trim()) {
      setError("A note title is required.");
      return;
    }
    setSaving(true);
    try {
      if (note) await notesService.updateNote(organizationId, note.id, { title: title.trim(), content });
      else await notesService.createNote(organizationId, { title: title.trim(), content, folderId });
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={note ? note.title : "New note"}
      hideHeader
      secondaryActionLabel=""
      maxWidth="xl"
    >
      <div className="flex h-[min(80vh,760px)] flex-col">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <p className="font-semibold">{note ? `Owned by ${note.owner.name}` : "Create note"}</p>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-surface-raised hover:text-text-primary"
            aria-label="Close dialog"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto py-5">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!canEdit}
            placeholder="Note title"
            className="w-full border-b border-border bg-transparent pb-3 text-xl font-bold outline-none placeholder:text-text-muted focus:border-brand disabled:cursor-not-allowed"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={!canEdit}
            placeholder="Start writing..."
            className="mt-4 min-h-[420px] w-full resize-none rounded-md border border-border bg-surface p-4 text-sm outline-none placeholder:text-text-muted focus:border-brand disabled:cursor-not-allowed"
          />
        </div>
        <footer className="flex items-center justify-between border-t border-border pt-4">
          {error ? (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          ) : (
            <span />
          )}
          {canEdit ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save note"}
            </button>
          ) : (
            <span className="text-sm text-text-secondary">You have view-only access.</span>
          )}
        </footer>
      </div>
    </Dialog>
  );
}
