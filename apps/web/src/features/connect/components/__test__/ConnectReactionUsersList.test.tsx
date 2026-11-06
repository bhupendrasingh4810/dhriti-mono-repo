import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ConnectReactionUsersList } from "../ConnectReactionUsersList";

test("lists the users for a reaction", () => {
  render(<ConnectReactionUsersList emoji="🎉" users={[{ id: "u", displayName: "Asha", jobTitle: "Designer", avatar: "" }]} />);
  expect(screen.getByText("Reacted with 🎉")).toBeInTheDocument();
  expect(screen.getByText("Asha")).toBeInTheDocument();
});
