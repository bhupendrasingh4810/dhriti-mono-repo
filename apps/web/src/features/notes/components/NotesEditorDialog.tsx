"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import { DhritiCheckboxField, DhritiSelectMenu, DhritiTextareaField, DhritiTextField } from "@dhriti/ui";
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
  const [titleError, setTitleError] = useState("");
  const [accessOpen, setAccessOpen] = useState(false);

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
      setTitleError("A note title is required.");
      return;
    }
    setTitleError("");
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
          <DhritiTextField
            label="Note title"
            required
            error={titleError || undefined}
            value={title}
            onChange={(value) => {
              setTitle(value);
              setTitleError("");
            }}
            disabled={!canEdit}
            placeholder="Enter note title"
          />
          {note?.isPublic && !canManage ? (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <DhritiSelectMenu
                label="Request access"
                value={requestedRole}
                onChange={(value) => setRequestedRole(value === "OWNER" ? "OWNER" : "EDIT")}
                open={accessOpen}
                onOpenChange={setAccessOpen}
                disabled={requesting || requestPending || checkingRequest}
                options={[
                  ...(!canEditNote(note, user?.id, false) ? [{ value: "EDIT", label: "Edit access" }] : []),
                  { value: "OWNER", label: "Co-owner access" },
                ]}
              />
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
          <div className="mt-4">
            <DhritiTextareaField
              label="Note content"
              showLabel={false}
              value={content}
              onChange={setContent}
              disabled={!canEdit}
              placeholder="Start writing..."
              rows={10}
              resize="none"
            />
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm text-text-primary">
            <DhritiCheckboxField
              id="note-public"
              label="Make note public"
              showLabel={false}
              checked={isPublic}
              onChange={setIsPublic}
              disabled={!canManage || saving}
            />
            <label htmlFor="note-public" className={!canManage || saving ? "cursor-not-allowed" : "cursor-pointer"}>
              <span className="block font-medium">{isPublic ? "Public" : "Private"}</span>
              <span className="block text-xs text-text-secondary">
                {isPublic ? "Anyone in this organization can view." : "Only owners and shared members can view."}
              </span>
            </label>
          </div>
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
