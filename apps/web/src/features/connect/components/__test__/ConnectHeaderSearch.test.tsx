import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ConnectHeaderSearch } from "../ConnectHeaderSearch";

test("selects a recent user from the search", () => {
  const select = vi.fn();
  render(<ConnectHeaderSearch organizationId="org" recentUsers={[{ id: "u", name: "Asha", description: "Engineer" }]} recentUsersError="" onSelectUser={select} />);
  fireEvent.focus(screen.getByPlaceholderText("Search (Ctrl + K)"));
  fireEvent.click(screen.getByText("Asha"));
  expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: "u" }));
});
