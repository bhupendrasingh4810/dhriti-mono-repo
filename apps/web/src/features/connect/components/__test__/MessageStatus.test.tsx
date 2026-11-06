import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ConversationTypingIndicator, MessageDeliveryStatus } from "../MessageStatus";

test("shows delivered status and typing users", () => {
  render(<><MessageDeliveryStatus status="read" /><ConversationTypingIndicator userIds={["u"]} currentUserId="current-user" usersById={{ u: { id: "u", displayName: "Asha", avatar: "", jobTitle: "Designer" } }} /></>);
  expect(screen.getByText("Asha is typing")).toBeInTheDocument();
});
