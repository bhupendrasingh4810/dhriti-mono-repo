import { Folder, Trash2 } from "lucide-react";
import type { NoteFolder } from "@/services/notes.service";

interface NotesFolderItemProps {
  folder: NoteFolder;
  selected: boolean;
  draggedNoteId: string | null;
  onSelect: () => void;
  onDelete: () => void;
  onDropNote: (noteId: string, folderId: string) => Promise<void>;
}

export function NotesFolderItem({
  folder,
  selected,
  draggedNoteId,
  onSelect,
  onDelete,
  onDropNote,
}: NotesFolderItemProps) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (draggedNoteId) void onDropNote(draggedNoteId, folder.id);
      }}
      className={`flex items-center rounded-md ${selected ? "bg-surface text-brand" : "hover:bg-brand-dark"}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm"
      >
        <Folder size={16} />
        <span className="truncate">{folder.name}</span>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="cursor-pointer p-2 hover:text-error"
        aria-label={`Delete ${folder.name}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
