import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SettingsRow, SettingsSection } from "../SettingsSection";

test("associates section and row labels with their content and validation error", () => {
  render(
    <SettingsSection id="messages" title="Messages" description="Message defaults">
      <SettingsRow label="Edit window" description="Minutes available" htmlFor="window" error="Must be at least one">
        <input id="window" />
      </SettingsRow>
    </SettingsSection>,
  );

  expect(screen.getByRole("region", { name: "Messages" })).toHaveTextContent("Message defaults");
  expect(screen.getByLabelText("Edit window")).toHaveAttribute("id", "window");
  expect(screen.getByRole("alert")).toHaveTextContent("Must be at least one");
});
