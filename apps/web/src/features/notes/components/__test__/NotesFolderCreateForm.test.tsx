import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesFolderCreateForm } from "../NotesFolderCreateForm";

describe("NotesFolderCreateForm", () => {
  it("passes the changed name to its parent and submits valid folders", () => {
    const onNameChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <NotesFolderCreateForm name="" creating={false} onNameChange={onNameChange} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("Folder name"), { target: { value: "Planning" } });
    expect(onNameChange).toHaveBeenCalledWith("Planning");
    expect(screen.getByRole("button", { name: "Create folder" })).toBeDisabled();

    rerender(<NotesFolderCreateForm name="Planning" creating={false} onNameChange={onNameChange} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Create folder" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
