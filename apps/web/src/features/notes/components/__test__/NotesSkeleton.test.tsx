import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotesFolderListSkeleton, NotesGridSkeleton } from "../NotesSkeleton";

describe("NotesSkeleton", () => {
  it("renders labelled loading placeholders at the requested counts", () => {
    const { container, rerender } = render(<NotesFolderListSkeleton count={3} />);
    expect(screen.getByRole("status", { name: "Loading folders" })).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll('[aria-hidden="true"] > div')).toHaveLength(3);

    rerender(<NotesGridSkeleton count={2} />);
    expect(screen.getByRole("status", { name: "Loading notes" })).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });
});
