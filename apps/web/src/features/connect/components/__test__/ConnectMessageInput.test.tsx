import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ConnectMessageInput from "../ConnectMessageInput";

test("renders a composer for the conversation", () => {
  render(<ConnectMessageInput conversationLabel="Design" value="" users={[]} currentUserId="u" onChange={vi.fn()} onSend={vi.fn()} onClearQuotedMessage={vi.fn()} onAttachFiles={vi.fn()} />);
  expect(screen.getByText(/Message #Design/i)).toBeInTheDocument();
});
