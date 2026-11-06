import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { CallSwitchDialog } from "../CallSwitchDialog";

test("offers to keep the current call on hold", () => {
  const hold = vi.fn();
  render(<CallSwitchDialog open onCancel={vi.fn()} onDisconnectCurrent={vi.fn()} onKeepOnHold={hold} />);
  fireEvent.click(screen.getByRole("button", { name: "Keep on hold" }));
  expect(hold).toHaveBeenCalledOnce();
  expect(screen.getByRole("alertdialog")).toHaveTextContent("already in a call");
});
