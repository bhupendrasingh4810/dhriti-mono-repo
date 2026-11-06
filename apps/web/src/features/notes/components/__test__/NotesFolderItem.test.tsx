import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesFolderItem } from "../NotesFolderItem";

describe("NotesFolderItem", () => {
  it("selects, deletes, and accepts a dragged note", () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const onDropNote = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <NotesFolderItem
        folder={{ id: "folder-1", name: "Planning" }}
        selected
        draggedNoteId="note-1"
        onSelect={onSelect}
        onDelete={onDelete}
        onDropNote={onDropNote}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Planning" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Planning" }));
    fireEvent.drop(container.firstElementChild!);
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDropNote).toHaveBeenCalledWith("note-1", "folder-1");
  });
});
