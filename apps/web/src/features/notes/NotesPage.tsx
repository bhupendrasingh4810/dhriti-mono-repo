"use client";

import { useEffect, useState } from "react";
import { FileText, FolderPlus, Plus } from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { useAuth } from "@/hooks/use-auth";
import { notesService, type Note, type NoteFolder, type NotesTree } from "@/services/notes.service";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import { NotesEmptyState } from "./components/NotesEmptyState";
import { NotesEditorDialog } from "./components/NotesEditorDialog";
import { NotesFolderCreateForm } from "./components/NotesFolderCreateForm";
import { NotesConfirmDialog } from "./components/NotesConfirmDialog";
import { NotesShareDialog } from "./components/NotesShareDialog";
import { NotesFolderItem } from "./components/NotesFolderItem";
import { NotesCard, NotesCardActions } from "./components/NotesCard";

type Selection = { folder: NoteFolder | null; label: string };

export default function NotesPage() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [tree, setTree] = useState<NotesTree | null>(null);
  const [selection, setSelection] = useState<Selection>({ folder: null, label: "All notes" });
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");
  const [editorNote, setEditorNote] = useState<Note | null>(null);
  const [editorMode, setEditorMode] = useState<"view" | "edit">("view");
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

  const loadTree = async () => {
    if (!organizationId) return;
    try {
      const nextTree = await notesService.getTree(organizationId);
      setTree(nextTree);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load Notes.");
    }
  };

  useEffect(() => {
    void loadTree();
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    void notesService
      .listNotes(organizationId, selection.folder?.id)
      .then(setNotes)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Unable to load notes."));
  }, [organizationId, selection.folder?.id]);

  const canCreateNote = Boolean(selection.folder || selection.label === "All notes");
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
            className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ${selection.folder === null ? "bg-surface text-brand" : "hover:bg-brand-dark"}`}
          >
            <FileText size={16} /> All notes
          </button>
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
        <div
          className={
            notes.length === 0 && !error
              ? "flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5"
              : "grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 overflow-y-auto p-5"
          }
        >
          {notes.map((note) => (
            <NotesCard
              key={note.id}
              note={note}
              onView={() => {
                setEditorMode("view");
                setEditorNote(note);
              }}
              onMenuOpen={(event) => {
                setMenuNote(note);
                setNoteMenuAnchor(event.currentTarget);
              }}
              onDragStart={() => setDraggedNoteId(note.id)}
              onDragEnd={() => setDraggedNoteId(null)}
              menuOpen={menuNote?.id === note.id}
            />
          ))}
          {notes.length === 0 && !error ? <NotesEmptyState /> : null}
        </div>
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
                      onEdit={() => {
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
          folderId={selection.folder?.id ?? null}
          viewOnly={Boolean(editorNote && editorMode === "view")}
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
