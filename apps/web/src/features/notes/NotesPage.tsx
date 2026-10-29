"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, FolderPlus, Inbox, Plus } from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { useAuth } from "@/hooks/use-auth";
import {
  notesService,
  type Note,
  type NoteFolder,
  type NotesTree,
  type NoteAccessRequest,
  type NoteAccessRole,
} from "@/services/notes.service";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import { NotesEmptyState } from "./components/NotesEmptyState";
import { NotesEditorDialog } from "./components/NotesEditorDialog";
import { NotesFolderCreateForm } from "./components/NotesFolderCreateForm";
import { NotesConfirmDialog } from "./components/NotesConfirmDialog";
import { NotesShareDialog } from "./components/NotesShareDialog";
import { NotesFolderItem } from "./components/NotesFolderItem";
import { NotesCard, NotesCardActions } from "./components/NotesCard";
import { NotesFolderListSkeleton, NotesGridSkeleton } from "./components/NotesSkeleton";
import { canDeleteNote } from "./note-access";
import { reorderNotes } from "./note-order";
import { countIncomingRequests, NotesRequestsPanel } from "./components/NotesRequestsPanel";

type Selection = { folder: NoteFolder | null; label: string; requests?: boolean };

export default function NotesPage() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [tree, setTree] = useState<NotesTree | null>(null);
  const [selection, setSelection] = useState<Selection>({ folder: null, label: "All notes" });
  const [notes, setNotes] = useState<Note[]>([]);
  const [loadedNotesKey, setLoadedNotesKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editorNote, setEditorNote] = useState<Note | null>(null);
  const [editorMode, setEditorMode] = useState<"view" | "edit">("view");
  const [requestedRole, setRequestedRole] = useState<NoteAccessRole | undefined>();
  const [creatingNote, setCreatingNote] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [folderMenuAnchor, setFolderMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [noteMenuAnchor, setNoteMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const [menuNote, setMenuNote] = useState<Note | null>(null);
  const [shareNote, setShareNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [requestCount, setRequestCount] = useState<{ key: string; count: number } | null>(null);
  const [requestCountError, setRequestCountError] = useState("");
  const requestUserId = user?.id;
  const requestCountKey = `${organizationId ?? ""}:${requestUserId ?? ""}`;
  const onRequestsLoaded = useCallback(
    (requests: NoteAccessRequest[]) => {
      if (!requestUserId) return;
      setRequestCount({ key: requestCountKey, count: countIncomingRequests(requests, requestUserId) });
      setRequestCountError("");
    },
    [requestCountKey, requestUserId],
  );
  useEffect(() => {
    if (!organizationId || selection.requests) return;
    let active = true;
    void notesService
      .listRequests(organizationId)
      .then((requests) => {
        if (active) onRequestsLoaded(requests);
      })
      .catch((reason) => {
        if (active)
          setRequestCountError(reason instanceof Error ? reason.message : "Unable to load incoming request count.");
      });
    return () => {
      active = false;
    };
  }, [organizationId, selection.requests, onRequestsLoaded]);
  const orderSaving = useRef(false);
  const activeView = useRef("");

  const loadTree = useCallback(async () => {
    if (!organizationId) return;
    try {
      const nextTree = await notesService.getTree(organizationId);
      setTree(nextTree);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load Notes.");
    }
  }, [organizationId]);

  useEffect(() => {
    void Promise.resolve().then(loadTree);
  }, [loadTree]);

  const notesKey = `${organizationId ?? ""}:${selection.requests ? "requests" : (selection.folder?.id ?? "all")}`;
  useEffect(() => {
    activeView.current = notesKey;
  }, [notesKey]);

  async function reorderNote(sourceId: string, targetId: string) {
    if (!organizationId || orderSaving.current || notesLoading) return;
    const ordered = reorderNotes(notes, sourceId, targetId);
    if (ordered === notes) return;
    const previous = notes;
    const view = notesKey;
    orderSaving.current = true;
    setReordering(true);
    setError("");
    setNotes(ordered);
    setDraggedNoteId(null);
    try {
      await notesService.saveOrder(
        organizationId,
        ordered.map((note) => note.id),
        selection.folder?.id,
      );
    } catch (reason) {
      if (activeView.current === view) {
        const previousPositions = new Map(previous.map((note, index) => [note.id, index]));
        setNotes((current) =>
          [...current].sort(
            (left, right) =>
              (previousPositions.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
              (previousPositions.get(right.id) ?? Number.MAX_SAFE_INTEGER),
          ),
        );
        setError(reason instanceof Error ? reason.message : "Unable to save note order.");
      }
    } finally {
      orderSaving.current = false;
      setReordering(false);
    }
  }

  function removeInaccessibleNote(noteId: string) {
    setEditorNote(null);
    setCreatingNote(false);
    setNotes((current) => current.filter((note) => note.id !== noteId));
    setTree((current) =>
      current
        ? {
            ...current,
            homeNotes: current.homeNotes.filter((note) => note.id !== noteId),
            sharedNotes: current.sharedNotes.filter((note) => note.id !== noteId),
            folders: current.folders.map((folder) => ({
              ...folder,
              notes: folder.notes?.filter((note) => note.id !== noteId),
            })),
          }
        : null,
    );
    setMenuNote(null);
    setNoteMenuAnchor(null);
    setError(
      "This note is no longer available for editing. Your changes were not saved, and the note was removed from this list.",
    );
  }

  useEffect(() => {
    if (!organizationId || selection.requests) return;
    let active = true;
    const key = notesKey;
    void notesService
      .listNotes(organizationId, selection.folder?.id)
      .then((nextNotes) => {
        if (active) setNotes(nextNotes);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load notes.");
      })
      .finally(() => {
        if (active) setLoadedNotesKey(key);
      });
    return () => {
      active = false;
    };
  }, [organizationId, selection.folder?.id, selection.requests, notesKey]);

  const notesLoading = loadedNotesKey !== notesKey;
  const treeLoading = tree === null && !error;
  const showEmptyState = notes.length === 0 && !error && !notesLoading;
  const canCreateNote = !selection.requests && Boolean(selection.folder || selection.label === "All notes");
  async function createFolder() {
    if (!folderName.trim() || !organizationId) return;
    setCreatingFolder(true);
    try {
      await notesService.createFolder(organizationId, folderName.trim());
      setFolderName("");
      setFolderMenuAnchor(null);
      setError("");
      await loadTree();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create folder.");
    } finally {
      setCreatingFolder(false);
    }
  }

  async function deleteFolder(folderId: string) {
    if (!organizationId || !window.confirm("Delete this folder and all notes inside it?")) return;
    await notesService.deleteFolder(organizationId, folderId);
    setSelection({ folder: null, label: "All notes" });
    await loadTree();
  }

  async function moveNote(noteId: string, folderId: string | null) {
    if (!organizationId) return;
    try {
      await notesService.updateNote(organizationId, noteId, { folderId });
      setNotes(await notesService.listNotes(organizationId, selection.folder?.id));
      await loadTree();
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to move note.");
    } finally {
      setDraggedNoteId(null);
    }
  }

  async function deleteNote() {
    if (!organizationId || !noteToDelete) return;
    if (!canDeleteNote(noteToDelete, user?.id)) {
      setError("You do not have permission to delete this note.");
      return;
    }
    setDeletingNote(true);
    try {
      await notesService.deleteNote(organizationId, noteToDelete.id);
      setNotes(await notesService.listNotes(organizationId, selection.folder?.id));
      setNoteToDelete(null);
      setError("");
      await loadTree();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete note.");
    } finally {
      setDeletingNote(false);
    }
  }

  return (
    <main className="flex h-full min-h-0 overflow-hidden bg-background p-4 text-text-primary">
      <aside className="flex w-[312px] shrink-0 flex-col rounded-xl border border-brand-dark bg-brand text-text-inverse">
        <div className="border-b border-brand-dark p-4">
          <h1 className="font-bold">Notes</h1>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => setSelection({ folder: null, label: "All notes" })}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (draggedNoteId) void moveNote(draggedNoteId, null);
            }}
            className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ${selection.folder === null && !selection.requests ? "bg-surface text-brand" : "hover:bg-brand-dark"}`}
          >
            <FileText size={16} /> All notes
          </button>
          <button
            type="button"
            onClick={() => setSelection({ folder: null, label: "Requests", requests: true })}
            className={`mt-2 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ${selection.requests ? "bg-surface text-brand" : "hover:bg-brand-dark"}`}
          >
            <Inbox size={16} /> Requests
            {requestCount?.key === requestCountKey ? (
              <span
                className="ml-auto rounded-full bg-brand-muted px-2 py-0.5 text-xs font-semibold text-brand"
                aria-label={`${requestCount.count} pending incoming requests`}
              >
                {requestCount.count}
              </span>
            ) : null}
          </button>
          {requestCountError ? (
            <p role="alert" className="px-3 py-2 text-xs text-text-inverse">
              {requestCountError}
            </p>
          ) : null}
          <div className="mt-4 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wide text-text-inverse">
            <span>Folders</span>
            <button
              type="button"
              onClick={(event) => setFolderMenuAnchor(event.currentTarget)}
              className="cursor-pointer hover:text-text-on-brand-muted"
              aria-label="Create home folder"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {treeLoading ? <NotesFolderListSkeleton /> : null}
            {tree?.folders.map((folder) => (
              <NotesFolderItem
                key={folder.id}
                folder={folder}
                selected={selection.folder?.id === folder.id}
                onSelect={() => setSelection({ folder, label: folder.name })}
                onDelete={() => void deleteFolder(folder.id)}
                onDropNote={moveNote}
                draggedNoteId={draggedNoteId}
              />
            ))}
          </div>
        </nav>
      </aside>
      <section className="ml-4 flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-5 py-2">
          <div>
            <p className="text-sm text-text-secondary">Notes</p>
            <h2 className="text-xl font-bold">{selection.label}</h2>
            {!selection.requests ? (
              <p className="text-xs text-text-secondary" role="status">
                {reordering ? "Saving your note order..." : "Drag notes to reorder, or use the arrow buttons."}
              </p>
            ) : null}
          </div>
          {canCreateNote ? (
            <button
              type="button"
              onClick={() => setCreatingNote(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark"
            >
              <Plus size={16} /> Add note
            </button>
          ) : null}
        </header>
        {error ? (
          <p role="alert" className="m-5 rounded-md border border-error bg-error/10 p-3 text-sm text-error">
            {error}
          </p>
        ) : null}
        {selection.requests && organizationId && user ? (
          <NotesRequestsPanel
            key={organizationId}
            organizationId={organizationId}
            userId={user.id}
            onChanged={loadTree}
            onRequestsLoaded={onRequestsLoaded}
          />
        ) : (
          <div
            className={
              showEmptyState
                ? "flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5"
                : "grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 overflow-y-auto p-5"
            }
          >
            {notesLoading && !error ? <NotesGridSkeleton /> : null}
            {!notesLoading &&
              notes.map((note, index) => (
                <NotesCard
                  key={note.id}
                  note={note}
                  onView={() => {
                    setRequestedRole(undefined);
                    setEditorMode("view");
                    setEditorNote(note);
                  }}
                  onMenuOpen={(event) => {
                    setMenuNote(note);
                    setNoteMenuAnchor(event.currentTarget);
                  }}
                  onDragStart={() => setDraggedNoteId(note.id)}
                  onDragEnd={() => setDraggedNoteId(null)}
                  reordering={reordering}
                  onDropNote={() => {
                    if (draggedNoteId) void reorderNote(draggedNoteId, note.id);
                  }}
                  onMoveUp={index > 0 ? () => void reorderNote(note.id, notes[index - 1].id) : undefined}
                  onMoveDown={
                    index < notes.length - 1 ? () => void reorderNote(note.id, notes[index + 1].id) : undefined
                  }
                  menuOpen={menuNote?.id === note.id}
                />
              ))}
            {showEmptyState ? <NotesEmptyState /> : null}
          </div>
        )}
      </section>
      <ConnectCascadingMenu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={() => {
          setFolderMenuAnchor(null);
          setFolderName("");
        }}
        items={
          [
            {
              id: "create-folder-form",
              label: "Create folder",
              content: (
                <NotesFolderCreateForm
                  name={folderName}
                  creating={creatingFolder}
                  onNameChange={setFolderName}
                  onSubmit={() => void createFolder()}
                />
              ),
            },
          ] satisfies ConnectCascadingMenuItem[]
        }
        minWidth={280}
        anchorAlignment="start"
      />
      <ConnectCascadingMenu
        anchorEl={noteMenuAnchor}
        open={Boolean(noteMenuAnchor)}
        onClose={() => {
          setNoteMenuAnchor(null);
          setMenuNote(null);
        }}
        items={
          menuNote
            ? ([
                {
                  id: "note-actions",
                  label: "Note actions",
                  content: (
                    <NotesCardActions
                      note={menuNote}
                      userId={user?.id}
                      onEdit={() => {
                        setRequestedRole(undefined);
                        setEditorMode("edit");
                        setEditorNote(menuNote);
                        setNoteMenuAnchor(null);
                      }}
                      onShare={() => {
                        setShareNote(menuNote);
                        setNoteMenuAnchor(null);
                      }}
                      onDelete={() => {
                        setNoteToDelete(menuNote);
                        setNoteMenuAnchor(null);
                      }}
                      onRequestAccess={(role) => {
                        setRequestedRole(role);
                        setEditorMode("view");
                        setEditorNote(menuNote);
                        setNoteMenuAnchor(null);
                        setMenuNote(null);
                      }}
                    />
                  ),
                },
              ] satisfies ConnectCascadingMenuItem[])
            : []
        }
        minWidth={160}
      />
      {editorNote || creatingNote ? (
        <NotesEditorDialog
          note={editorNote}
          initialRequestedRole={requestedRole}
          folderId={selection.folder?.id ?? null}
          viewOnly={Boolean(editorNote && editorMode === "view")}
          onAccessLost={removeInaccessibleNote}
          onClose={() => {
            setEditorNote(null);
            setCreatingNote(false);
          }}
          onSaved={async () => {
            setEditorNote(null);
            setCreatingNote(false);
            if (organizationId) setNotes(await notesService.listNotes(organizationId, selection.folder?.id));
            await loadTree();
          }}
        />
      ) : null}
      {shareNote ? (
        <NotesShareDialog
          key={shareNote.id}
          note={shareNote}
          organizationId={organizationId ?? ""}
          onClose={() => setShareNote(null)}
          onSaved={async () => {
            setShareNote(null);
            if (organizationId) setNotes(await notesService.listNotes(organizationId, selection.folder?.id));
          }}
        />
      ) : null}
      {noteToDelete ? (
        <NotesConfirmDialog
          title={`Delete “${noteToDelete.title}”?`}
          description="This action cannot be undone."
          confirmLabel="Delete note"
          confirming={deletingNote}
          onCancel={() => setNoteToDelete(null)}
          onConfirm={() => void deleteNote()}
        />
      ) : null}
    </main>
  );
}
