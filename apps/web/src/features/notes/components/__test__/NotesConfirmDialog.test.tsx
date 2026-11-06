import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesConfirmDialog } from "../NotesConfirmDialog";

vi.mock("@dhriti/ui/dialog", () => ({ Dialog: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div> }));

describe("NotesConfirmDialog", () => {
  it("shows its confirmation details and invokes both actions", () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <NotesConfirmDialog
        title="Delete note"
        description="This cannot be undone."
        confirmLabel="Delete"
        confirming={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveTextContent("This cannot be undone.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
