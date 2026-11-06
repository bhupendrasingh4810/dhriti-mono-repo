import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SettingsChipSelect } from "../SettingsChipSelect";

test("adds available options, preserves unavailable selections, and enforces the limit", () => {
  const onChange = vi.fn();
  render(
    <SettingsChipSelect
      label="Default channels"
      value={["archived"]}
      options={[{ value: "general", label: "General" }]}
      maxItems={2}
      emptyLabel="No channels"
      onChange={onChange}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "General" }));
  expect(onChange).toHaveBeenLastCalledWith(["archived", "general"]);
  expect(screen.getByRole("button", { name: "Unavailable" })).toHaveAttribute("aria-pressed", "true");

  render(
    <SettingsChipSelect
      label="Default channels"
      value={["one"]}
      options={[{ value: "two", label: "Two" }]}
      maxItems={1}
      emptyLabel="No channels"
      onChange={onChange}
    />,
  );
  expect(screen.getByRole("button", { name: "Two" })).toBeDisabled();
});
