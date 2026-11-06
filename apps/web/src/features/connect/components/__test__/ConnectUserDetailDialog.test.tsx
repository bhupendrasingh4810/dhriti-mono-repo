import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectUserDetailDialog } from "../ConnectUserDetailDialog";

test("opens organization information for a user", () => {
  const user = { id: "u", displayName: "Asha", department: "Design", status: "online" };
  const message = vi.fn();
  render(<ConnectUserDetailDialog user={user as any} usersById={{ u: user } as any} reportsToByUserId={{}} onClose={vi.fn()} onMessage={message} onStartCall={vi.fn()} onSelectUser={vi.fn()} />);
  fireEvent.click(screen.getByLabelText("Message"));
  fireEvent.click(screen.getByRole("button", { name: "Organization" }));
  expect(message).toHaveBeenCalledWith("u");
  expect(screen.getByText("Asha works with")).toBeInTheDocument();
});
