import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesRequestsPanel } from "../NotesRequestsPanel";

const mocks = vi.hoisted(() => ({
  listRequests: vi.fn(),
  reviewRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/notes.service", () => ({ notesService: mocks }));
vi.mock("@/lib/refresh-feedback", () => ({ withRefreshFeedback: <T,>(promise: Promise<T>) => promise }));

describe("NotesRequestsPanel", () => {
  it("renders incoming requests and submits the selected approval role", async () => {
    mocks.listRequests.mockResolvedValue([
      {
        id: "request-1",
        noteId: "note-1",
        userId: "member",
        requestedRole: "EDIT",
        grantedRole: null,
        status: "PENDING",
        user: { id: "member", name: "Sam", avatarUrl: null },
        note: { id: "note-1", title: "Sprint plan", ownerId: "owner", permissions: [] },
      },
    ]);
    const onChanged = vi.fn().mockResolvedValue(undefined);
    render(<NotesRequestsPanel organizationId="org-1" userId="owner" onChanged={onChanged} onRequestsLoaded={vi.fn()} />);

    expect(await screen.findByText("Sprint plan")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Permission to grant"), { target: { value: "OWNER" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(mocks.reviewRequest).toHaveBeenCalledWith("org-1", "request-1", "APPROVED", "OWNER"));
    expect(onChanged).toHaveBeenCalledOnce();
  });
});
