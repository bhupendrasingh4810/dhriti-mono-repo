import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Note } from "@/services/notes.service";
import { NotesCard, NotesCardActions } from "../NotesCard";

const note: Note = {
  id: "note-1",
  title: "Sprint plan",
  content: "Plan the next sprint.",
  isPublic: false,
  ownerId: "owner",
  folderId: null,
  owner: { id: "owner", name: "Alex", avatarUrl: null },
  permissions: [],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

describe("NotesCard", () => {
  it("displays note details and invokes its view, menu, and reorder actions", () => {
    const onView = vi.fn();
    const onMenuOpen = vi.fn();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(
      <NotesCard
        note={{ ...note, permissions: [{ userId: "member", canEdit: true, user: { id: "member", name: "Sam", avatarUrl: null } }] }}
        menuOpen
        onView={onView}
        onMenuOpen={onMenuOpen}
        onDragStart={vi.fn()}
        onDragEnd={vi.fn()}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );

    expect(screen.getByText("Sprint plan")).toBeInTheDocument();
    expect(screen.getByText("Owned by Alex")).toBeInTheDocument();
    expect(screen.getByText("Shared")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Show more"));
    fireEvent.click(screen.getByLabelText("Actions for Sprint plan"));
    fireEvent.click(screen.getByLabelText("Move Sprint plan earlier"));
    fireEvent.click(screen.getByLabelText("Move Sprint plan later"));

    expect(onView).toHaveBeenCalledOnce();
    expect(onMenuOpen).toHaveBeenCalledOnce();
    expect(onMoveUp).toHaveBeenCalledOnce();
    expect(onMoveDown).toHaveBeenCalledOnce();
  });

  it("offers owners their available card actions", () => {
    const onEdit = vi.fn();
    const onShare = vi.fn();
    const onDelete = vi.fn();
    render(
      <NotesCardActions
        note={note}
        userId="owner"
        onEdit={onEdit}
        onShare={onShare}
        onDelete={onDelete}
        onRequestAccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onShare).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
