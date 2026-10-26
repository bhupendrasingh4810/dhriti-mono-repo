"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@dhriti/ui/dialog";
import { connectService, type ConnectOrganizationUser } from "@/services/connect.service";
import { notesService, type Note } from "@/services/notes.service";

interface SharedUser {
  user: ConnectOrganizationUser;
  permission: "VIEW" | "EDIT" | "OWNER";
}

interface NotesShareDialogProps {
  note: Note;
  organizationId: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function NotesShareDialog({ note, organizationId, onClose, onSaved }: NotesShareDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConnectOrganizationUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SharedUser[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!query.trim() || !organizationId) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void connectService
        .searchUsers(organizationId, query.trim())
        .then((users) => {
          if (!cancelled)
            setResults(
              users.filter(
                (user) => user.id !== note.ownerId && !selectedUsers.some((selected) => selected.user.id === user.id),
              ),
            );
        })
        .catch((reason) => {
          if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to search organization members.");
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [note.ownerId, organizationId, query, selectedUsers]);

  async function saveSharing() {
    if (!selectedUsers.length) {
      setError("Select at least one organization member.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await notesService.updateNote(organizationId, note.id, {
        permissions: [
          ...note.permissions.map((permission) => ({
            userId: permission.userId,
            canEdit: permission.canEdit,
            canDelete: permission.canDelete,
          })),
          ...selectedUsers.map(({ user, permission }) => ({
            userId: user.id,
            canEdit: permission !== "VIEW",
            canDelete: permission === "OWNER",
          })),
        ],
      });
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to share note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Share note" hideHeader secondaryActionLabel="" maxWidth="md">
      <div className="flex max-h-[min(80vh,680px)] flex-col">
        <header className="border-b border-border pb-4">
          <h2 className="text-lg font-bold text-text-primary">Share &ldquo;{note.title}&rdquo;</h2>
          <p className="mt-1 text-sm text-text-secondary">Choose organization members and their access level.</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto py-5">
          <div className="relative">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
              Search members
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name or email"
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text-muted focus:border-brand"
              />
            </label>
            {results.length ? (
              <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-52 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
                {results.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUsers((current) => [...current, { user, permission: "VIEW" }]);
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
            {selectedUsers.map(({ user, permission }) => (
              <div key={user.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                <span className="grid size-8 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                  {user.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{user.name}</span>
                  <span className="block truncate text-xs text-text-secondary">{user.email}</span>
                </span>
                <select
                  value={permission}
                  onChange={(event) =>
                    setSelectedUsers((current) =>
                      current.map((selected) =>
                        selected.user.id === user.id
                          ? { ...selected, permission: event.target.value as SharedUser["permission"] }
                          : selected,
                      ),
                    )
                  }
                  className="cursor-pointer rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
                >
                  <option value="VIEW">View</option>
                  <option value="EDIT">Edit</option>
                  <option value="OWNER">Owner</option>
                </select>
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
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSharing()}
            className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:opacity-60"
          >
            {saving ? "Sharing..." : "Share note"}
          </button>
        </footer>
      </div>
    </Dialog>
  );
}
