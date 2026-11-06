import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SettingsNumberInput } from "../SettingsNumberInput";

test("switches between a numeric value and the no-limit value", () => {
  const onChange = vi.fn();
  render(
    <SettingsNumberInput
      id="limit"
      value={10}
      min={1}
      max={100}
      unit="minutes"
      noLimitLabel="Any time"
      onChange={onChange}
    />,
  );

  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "25" } });
  expect(onChange).toHaveBeenLastCalledWith(25);
  fireEvent.click(screen.getByRole("checkbox", { name: "Any time" }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});
