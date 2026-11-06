import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectChannelDetailsPanel } from "../ConnectChannelDetailsPanel";

test("shows channel metadata and closes", () => {
  const close = vi.fn();
  render(<ConnectChannelDetailsPanel open title="Launch" teamLabel="Product" description="Planning" memberCount={4} pinnedCount={1} linkCount={2} files={[{ id: "f", originalName: "plan.pdf", size: 1024 }]} meetings={[{ id: "m", title: "Kickoff" }]} onClose={close} />);
  fireEvent.click(screen.getByLabelText("Close channel details"));
  expect(close).toHaveBeenCalledOnce();
  expect(screen.getByLabelText("Channel details")).toHaveTextContent("Kickoff");
});
