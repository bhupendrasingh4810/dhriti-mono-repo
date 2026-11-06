import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { IncomingCallCard } from "../IncomingCallCard";

test("accepts an incoming audio call", () => {
  const accept = vi.fn();
  render(<IncomingCallCard call={{ id: "c", callerName: "Asha", conversationName: "Asha", participantIds: [] } as any} onAccept={accept} onDecline={vi.fn()} />);
  fireEvent.click(screen.getByLabelText("Accept audio call"));
  expect(accept).toHaveBeenCalledOnce();
  expect(screen.getByRole("alertdialog")).toHaveTextContent("Asha is calling you");
});
