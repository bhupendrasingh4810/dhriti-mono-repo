"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import { connectService, type ConnectOrganizationUser } from "@/services/connect.service";
import { notesService, type Note } from "@/services/notes.service";
import { sharingChanged, sharingPermissions, sharingRecipients } from "../note-sharing";

interface NotesShareDialogProps {
  note: Note;
  organizationId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function NotesShareDialog({ note, organizationId, onClose, onSaved }: NotesShareDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConnectOrganizationUser[]>([]);
  const [recipients, setRecipients] = useState(() => sharingRecipients(note));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dirty = sharingChanged(note, recipients);

  useEffect(() => {
    if (!query.trim() || !organizationId) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void connectService
        .searchUsers(organizationId, query.trim())
        .then((users) => {
          if (!cancelled) {
            setResults(
              users.filter(
                (user) => user.id !== note.ownerId && !recipients.some((recipient) => recipient.user.id === user.id),
              ),
            );
          }
        })
        .catch((reason) => {
          if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to search organization members.");
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [note.ownerId, organizationId, query, recipients]);

  async function saveSharing() {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    try {
      await notesService.updateNote(organizationId, note.id, {
        permissions: sharingPermissions(recipients),
      });
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to share note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Share note"
      hideHeader
      secondaryActionLabel=""
      maxWidth="md"
      isSubmitting={saving}
    >
      <div className="flex max-h-[min(80vh,680px)] flex-col">
        <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-text-primary">Share &ldquo;{note.title}&rdquo;</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Manage who can access this note. Changes apply when you save.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-surface-raised hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto py-5">
          <div className="relative">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
              Search members
              <input
                autoFocus
                value={query}
                disabled={saving}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setResults([]);
                }}
                placeholder="Search by name or email"
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text-muted focus:border-brand"
              />
            </label>
            {query.trim() && results.length ? (
              <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-52 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
                {results.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setRecipients((current) =>
                        current.some((recipient) => recipient.user.id === user.id)
                          ? current
                          : [...current, { user, canEdit: false, canDelete: false }],
                      );
                      setQuery("");
                      setResults([]);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-2 text-left hover:bg-surface-raised"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                      {user.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{user.name}</span>
                      <span className="block truncate text-xs text-text-secondary">{user.email}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-5 space-y-2">
            <h3 className="text-sm font-semibold">People with access</h3>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <span className="min-w-0 truncate text-sm font-semibold">{note.owner.name}</span>
              <span className="text-xs text-text-secondary">Owner · Full access</span>
            </div>
            {recipients.map(({ user, canEdit, canDelete, isOwner }) => (
              <div key={user.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                <span className="grid size-8 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                  {user.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{user.name}</span>
                  <span className="block text-xs text-text-secondary">
                    {isOwner ? "Co-owner · Full access" : "Can view"}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={isOwner || canEdit}
                      disabled={saving || isOwner}
                      aria-label={`Allow ${user.name} to edit`}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setRecipients((current) =>
                          current.map((recipient) =>
                            recipient.user.id === user.id ? { ...recipient, canEdit: checked } : recipient,
                          ),
                        );
                      }}
                      className="size-4 accent-brand"
                    />
                    Edit
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={isOwner || canDelete}
                      disabled={saving || isOwner}
                      aria-label={`Allow ${user.name} to delete`}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setRecipients((current) =>
                          current.map((recipient) =>
                            recipient.user.id === user.id ? { ...recipient, canDelete: checked } : recipient,
                          ),
                        );
                      }}
                      className="size-4 accent-brand"
                    />
                    Delete
                  </label>
                  <button
                    type="button"
                    disabled={saving}
                    aria-label={`Revoke access for ${user.name}`}
                    onClick={() =>
                      setRecipients((current) => current.filter((recipient) => recipient.user.id !== user.id))
                    }
                    className="rounded-md px-2 py-1 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-60"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-error">
              {error}
            </p>
          ) : null}
        </div>
        <footer className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !dirty}
            onClick={() => void saveSharing()}
            className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </footer>
      </div>
    </Dialog>
  );
}
