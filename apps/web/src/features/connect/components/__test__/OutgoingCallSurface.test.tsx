import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { OutgoingCallSurface } from "../OutgoingCallSurface";

test("dismisses an unavailable outgoing call", () => {
  const leave = vi.fn();
  render(<OutgoingCallSurface call={{ id: "c", status: "unavailable", participantIds: [], conversationName: "Asha" } as any} viewerId="me" muted={false} cameraOn={false} hasVideoPreview={false} videoRef={createRef()} onToggleMicrophone={vi.fn()} onToggleCamera={vi.fn()} onShare={vi.fn()} onLeave={leave} />);
  fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
  expect(leave).toHaveBeenCalledOnce();
  expect(screen.getByRole("alertdialog")).toHaveTextContent("Call ended");
});
