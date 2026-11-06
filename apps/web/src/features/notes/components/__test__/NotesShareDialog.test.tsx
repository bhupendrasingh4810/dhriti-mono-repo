import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Note } from "@/services/notes.service";
import { NotesShareDialog } from "../NotesShareDialog";

const mocks = vi.hoisted(() => ({ updateNote: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@dhriti/ui/dialog", () => ({ Dialog: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));
vi.mock("@/services/connect.service", () => ({ connectService: { searchUsers: vi.fn() } }));
vi.mock("@/services/notes.service", () => ({ notesService: { updateNote: mocks.updateNote } }));

const note: Note = {
  id: "note-1", title: "Sprint plan", content: "", isPublic: false, ownerId: "owner", folderId: null,
  owner: { id: "owner", name: "Alex", avatarUrl: null },
  permissions: [{ userId: "member", canEdit: false, canDelete: false, user: { id: "member", name: "Sam", avatarUrl: null } }],
  createdAt: "2026-01-01", updatedAt: "2026-01-01",
};

describe("NotesShareDialog", () => {
  it("updates a recipient permission and saves the sharing change", async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    render(<NotesShareDialog note={note} organizationId="org-1" onClose={vi.fn()} onSaved={onSaved} />);

    fireEvent.click(screen.getByLabelText("Allow Sam to edit"));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.updateNote).toHaveBeenCalledWith("org-1", "note-1", {
        permissions: [{ userId: "member", canEdit: true, canDelete: false }],
      }),
    );
    expect(onSaved).toHaveBeenCalledOnce();
  });
});
