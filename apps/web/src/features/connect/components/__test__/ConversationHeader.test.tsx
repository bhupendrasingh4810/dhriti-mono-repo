import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConversationHeader } from "../ConversationHeader";

test("starts an audio call from the header", () => {
  const start = vi.fn();
  render(<ConversationHeader conversation={{ id: "c", name: "Design", type: "channel", participants: [] }} usersById={{}} onOpenDetails={vi.fn()} onStartCall={start} />);
  fireEvent.click(screen.getByLabelText("Start audio call"));
  expect(start).toHaveBeenCalledWith("audio");
  expect(screen.getByText("Design")).toBeInTheDocument();
});
