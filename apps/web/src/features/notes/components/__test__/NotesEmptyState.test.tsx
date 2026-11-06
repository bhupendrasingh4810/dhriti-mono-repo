import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotesEmptyState } from "../NotesEmptyState";

describe("NotesEmptyState", () => {
  it("renders the notes empty-state illustration and message", () => {
    const { container } = render(<NotesEmptyState />);
    expect(screen.getByText("No notes available")).toBeInTheDocument();
    expect(container.querySelector('img[src="/media/empty_notes.png"]')).toBeInTheDocument();
  });
});
