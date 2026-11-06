import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CallAvailableCard } from "../CallAvailableCard";

test("describes an available call and joins it", () => {
  const join = vi.fn();
  render(<CallAvailableCard call={{ peerName: "Asha", type: "video", conversationName: "Design" } as any} onJoin={join} onDismiss={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Join" }));
  expect(join).toHaveBeenCalledOnce();
  expect(screen.getByRole("status")).toHaveTextContent("Asha started a video call");
});
