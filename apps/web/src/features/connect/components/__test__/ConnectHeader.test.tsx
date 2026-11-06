import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ConnectHeader } from "../ConnectHeader";

test("filters header search results", () => {
  render(<ConnectHeader users={[{ id: "u", title: "Asha Patel", description: "Engineer" }]} />);
  const input = screen.getByPlaceholderText("Search (⌘ + K)");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "asha" } });
  expect(screen.getByText("Asha Patel")).toBeInTheDocument();
});
