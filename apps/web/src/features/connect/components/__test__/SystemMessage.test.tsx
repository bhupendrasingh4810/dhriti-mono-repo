import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SystemMessage } from "../SystemMessage";

test("renders system message content", () => {
  render(<SystemMessage message={{ content: "Asha joined the channel" } as any} />);
  expect(screen.getByText("Asha joined the channel")).toBeInTheDocument();
});
