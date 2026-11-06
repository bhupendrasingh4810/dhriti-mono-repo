import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CallSurface } from "../CallSurface";

test("renders an unavailable call outcome", () => {
  render(<CallSurface call={{ id: "c", status: "unavailable", direction: "outgoing", type: "audio", participantIds: [], conversationName: "Asha", onHold: false } as any} viewerId="me" onMinimize={vi.fn()} onRestore={vi.fn()} onEnd={vi.fn()} onJoin={vi.fn()} onHoldChange={vi.fn()} />);
  expect(screen.getByText("Call ended")).toBeInTheDocument();
});
