import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotesSharedBadge } from "../NotesSharedBadge";

describe("NotesSharedBadge", () => {
  it("renders only when a note has sharing permissions", () => {
    const { rerender } = render(<NotesSharedBadge note={{ permissions: [] }} />);
    expect(screen.queryByText("Shared")).not.toBeInTheDocument();

    rerender(<NotesSharedBadge note={{ permissions: [{ userId: "member", canEdit: false, user: { id: "member", name: "Sam", avatarUrl: null } }] }} />);
    expect(screen.getByText("Shared")).toBeInTheDocument();
  });
});
