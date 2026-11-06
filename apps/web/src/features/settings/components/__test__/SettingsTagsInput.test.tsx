import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SettingsTagsInput } from "../SettingsTagsInput";

test("validates tags, adds valid values, and removes existing values", () => {
  const onChange = vi.fn();
  render(
    <SettingsTagsInput
      id="prefixes"
      label="Prefixes"
      value={["team-"]}
      maxItems={3}
      maxLength={20}
      placeholder="Add prefix"
      pattern={/^[a-z-]+$/}
      patternHint="Lowercase letters only"
      onChange={onChange}
    />,
  );
  const input = screen.getByRole("textbox");

  fireEvent.change(input, { target: { value: "Invalid" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(screen.getByText("Lowercase letters only")).toBeVisible();

  fireEvent.change(input, { target: { value: "project-" } });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(onChange).toHaveBeenLastCalledWith(["team-", "project-"]);
  fireEvent.click(screen.getByRole("button", { name: "Remove team-" }));
  expect(onChange).toHaveBeenLastCalledWith([]);
});
