"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { notesService, type Note, type NoteAccessRole } from "@/services/notes.service";
import { canEditNote, canShareNote } from "../note-access";
import { NotesSharedBadge } from "./NotesSharedBadge";
import { isNoteAccessRejected } from "../note-order";

interface NotesEditorDialogProps {
  note: Note | null;
  folderId: string | null;
  viewOnly: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onAccessLost: (noteId: string) => void;
  initialRequestedRole?: NoteAccessRole;
}

export function NotesEditorDialog({
  note,
  folderId,
  viewOnly,
  onClose,
  onSaved,
  onAccessLost,
  initialRequestedRole,
}: NotesEditorDialogProps) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const canEdit = canEditNote(note, user?.id, viewOnly);
  const canManage = !note || canShareNote(note, user?.id);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [isPublic, setIsPublic] = useState(note?.isPublic ?? false);
  const [requestedRole, setRequestedRole] = useState<NoteAccessRole>(
    initialRequestedRole ?? (note && canEditNote(note, user?.id, false) ? "OWNER" : "EDIT"),
  );
  const [requestPending, setRequestPending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [checkingRequest, setCheckingRequest] = useState(Boolean(note?.isPublic && !canManage));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organizationId || !note?.isPublic || canManage) return;
    let active = true;
    void notesService
      .listRequests(organizationId)
      .then((requests) => {
        if (active) {
          const pending = requests.find(
            (request) => request.noteId === note.id && request.userId === user?.id && request.status === "PENDING",
          );
          setRequestPending(Boolean(pending));
          if (pending) setRequestedRole(pending.requestedRole);
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to check access requests.");
      })
      .finally(() => {
        if (active) setCheckingRequest(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, note?.id, note?.isPublic, canManage, user?.id]);

  async function save() {
    if (!canEdit) {
      setError("You do not have permission to edit this note.");
      return;
    }
    if (!organizationId || !title.trim()) {
      setError("A note title is required.");
      return;
    }
    setSaving(true);
    try {
      if (note) {
        try {
          await notesService.updateNote(organizationId, note.id, {
            title: title.trim(),
            content,
            ...(canManage ? { isPublic } : {}),
          });
        } catch (reason) {
          if (isNoteAccessRejected(reason)) {
            onAccessLost(note.id);
            return;
          }
          throw reason;
        }
      } else {
        await notesService.createNote(organizationId, { title: title.trim(), content, folderId, isPublic });
      }

      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save note.");
    } finally {
      setSaving(false);
    }
  }

  async function requestAccess() {
    if (!organizationId || !note || requesting || requestPending || checkingRequest) return;
    setRequesting(true);
    setError("");
    try {
      await notesService.requestAccess(organizationId, note.id, requestedRole);
      setRequestPending(true);
      setRequestMessage("Request sent. Track its status in Requests.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to request access.");
    } finally {
      setRequesting(false);
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
      fullScreenOnMobile
    >
      <div className="flex min-h-0 flex-1 flex-col sm:max-h-[min(80vh,760px)] sm:flex-auto">
        <header className="flex shrink-0 items-center justify-between border-b border-border pb-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="font-semibold">{note ? `Owned by ${note.owner.name}` : "Create note"}</p>
            {note ? <NotesSharedBadge note={note} /> : null}
          </div>
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
          <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
            Note title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!canEdit}
              placeholder="Enter note title"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand disabled:cursor-not-allowed"
            />
          </label>
          {note?.isPublic && !canManage ? (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Request access
                <select
                  value={requestedRole}
                  onChange={(event) => setRequestedRole(event.target.value === "OWNER" ? "OWNER" : "EDIT")}
                  disabled={requesting || requestPending || checkingRequest}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
                >
                  {!canEditNote(note, user?.id, false) ? <option value="EDIT">Edit access</option> : null}
                  <option value="OWNER">Co-owner access</option>
                </select>
              </label>
              <button
                type="button"
                disabled={requesting || requestPending || checkingRequest}
                onClick={() => void requestAccess()}
                className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:opacity-60"
              >
                {checkingRequest
                  ? "Checking requests..."
                  : requestPending
                    ? "Request pending"
                    : requesting
                      ? "Sending..."
                      : "Send request"}
              </button>
              {requestMessage ? (
                <p role="status" className="text-sm text-text-secondary">
                  {requestMessage}
                </p>
              ) : null}
            </div>
          ) : null}
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={!canEdit}
            aria-label="Note content"
            placeholder="Start writing..."
            className="mt-4 h-56 w-full resize-none rounded-md border border-border bg-surface p-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand disabled:cursor-not-allowed"
          />
          <label className="mt-4 flex items-center gap-3 text-sm text-text-primary">
            <input
              type="checkbox"
              role="switch"
              aria-label="Make note public"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              disabled={!canManage || saving}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-border-strong p-0.5 transition-colors after:size-5 after:rounded-full after:bg-surface after:shadow-sm after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            />
            <span>
              <span className="block font-medium">{isPublic ? "Public" : "Private"}</span>
              <span className="block text-xs text-text-secondary">
                {isPublic ? "Anyone in this organization can view." : "Only owners and shared members can view."}
              </span>
            </span>
          </label>
        </div>
        <footer className="flex shrink-0 items-center justify-between border-t border-border pt-4">
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
