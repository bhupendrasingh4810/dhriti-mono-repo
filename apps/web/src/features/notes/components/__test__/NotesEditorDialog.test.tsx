import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesEditorDialog } from "../NotesEditorDialog";

const mocks = vi.hoisted(() => ({ createNote: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@dhriti/ui/dialog", () => ({ Dialog: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));
vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "owner", organization: { id: "org-1" } } }),
}));
vi.mock("@/services/notes.service", () => ({
  notesService: { createNote: mocks.createNote, updateNote: vi.fn(), listRequests: vi.fn(), requestAccess: vi.fn() },
}));

describe("NotesEditorDialog", () => {
  it("creates a note with entered content and public visibility", async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    render(
      <NotesEditorDialog
        note={null}
        folderId="folder-1"
        viewOnly={false}
        onClose={vi.fn()}
        onSaved={onSaved}
        onAccessLost={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Release checklist" } });
    fireEvent.change(screen.getByLabelText("Note content"), { target: { value: "Verify migrations" } });
    fireEvent.click(screen.getByRole("switch", { name: "Make note public" }));
    fireEvent.click(screen.getByRole("button", { name: "Save note" }));

    await waitFor(() =>
      expect(mocks.createNote).toHaveBeenCalledWith("org-1", {
        title: "Release checklist",
        content: "Verify migrations",
        folderId: "folder-1",
        isPublic: true,
      }),
    );
    expect(onSaved).toHaveBeenCalledOnce();
  });
});
