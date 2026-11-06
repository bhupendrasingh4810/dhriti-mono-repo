import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SettingsWeekdayPicker } from "../SettingsWeekdayPicker";

test("adds days in weekday order and removes selected days", () => {
  const onChange = vi.fn();
  render(<SettingsWeekdayPicker label="Active days" value={[3]} onChange={onChange} />);

  fireEvent.click(screen.getByRole("button", { name: "Mon" }));
  expect(onChange).toHaveBeenLastCalledWith([1, 3]);
  fireEvent.click(screen.getByRole("button", { name: "Wed" }));
  expect(onChange).toHaveBeenLastCalledWith([]);
});
