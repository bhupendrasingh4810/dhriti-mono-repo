import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ConnectPresenceIndicator } from "../ConnectPresenceIndicator";

test("labels sharing presence", () => {
  render(<ConnectPresenceIndicator presence="sharing" />);
  expect(screen.getByTitle("Sharing")).toBeInTheDocument();
});
