import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectMessageHoverActions } from "../ConnectMessageHoverActions";

test("adds a quick reaction", () => {
  const react = vi.fn();
  render(<ConnectMessageHoverActions open align="left" isOwn={false} onQuickReaction={react} onOpenEmoji={vi.fn()} onQuote={vi.fn()} onOpenMenu={vi.fn()} />);
  fireEvent.click(screen.getByLabelText("React with Thumbs up"));
  expect(react).toHaveBeenCalledWith("👍");
  expect(screen.getByLabelText("Reply with quote")).toBeInTheDocument();
});
