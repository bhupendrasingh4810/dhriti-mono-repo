import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectConversations } from "../ConnectConversations";

test("renders an empty conversation greeting", () => {
  render(<ConnectConversations conversation={{ id: "c", name: "Design", type: "channel", participants: [] }} currentUserId="u" usersById={{}} messages={[]} getQuotedMessageById={vi.fn()} onOpenDetails={vi.fn()} onStartCall={vi.fn()} onClearPinnedMessages={vi.fn()} onCreateGroup={vi.fn().mockResolvedValue(true)} onAddReaction={vi.fn()} onOpenMessageEmoji={vi.fn()} onOpenMessageMenu={vi.fn()} onQuoteMessage={vi.fn()} onOpenReactionHover={vi.fn()} onCloseReactionHover={vi.fn()} onOpenUserHover={vi.fn()} onCloseUserHover={vi.fn()} onStartEditMessage={vi.fn()} onChangeEditMessage={vi.fn()} onSaveEditMessage={vi.fn()} onCancelEditMessage={vi.fn()} onSendGreeting={vi.fn()} />);
  expect(screen.getByText(/Welcome to #Design/i)).toBeInTheDocument();
});
