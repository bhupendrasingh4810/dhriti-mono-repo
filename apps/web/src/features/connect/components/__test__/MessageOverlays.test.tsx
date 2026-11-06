import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DeletedMessageToast, MessageOverlays } from "../MessageOverlays";

test("renders reaction hover users and undo toast", () => {
  const anchor = document.createElement("button");
  document.body.append(anchor);
  const undo = vi.fn();
  render(<><MessageOverlays emojiAnchor={null} emojiMessageId={null} onCloseEmoji={vi.fn()} onReaction={vi.fn()} reactionHover={{ anchorEl: anchor, emoji: "👍", userIds: ["u"] } as any} onCloseReaction={vi.fn()} onKeepReactionOpen={vi.fn()} mentionHover={null} onCloseMention={vi.fn()} usersById={{ u: { id: "u", displayName: "Asha", jobTitle: "Designer" } } as any} reportsToByUserId={{}} onMessageUser={vi.fn()} onStartUserCall={vi.fn()} onOpenUserDetails={vi.fn()} /><DeletedMessageToast visible restoring={false} onUndo={undo} /></>);
  fireEvent.click(screen.getByRole("button", { name: "UNDO" }));
  expect(screen.getByText("Asha")).toBeInTheDocument();
  expect(undo).toHaveBeenCalledOnce();
});
