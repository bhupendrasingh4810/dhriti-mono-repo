import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SettingsToggle } from "../SettingsToggle";

test("reports its switch state and toggles it when clicked", () => {
  const onChange = vi.fn();
  render(<SettingsToggle label="Typing indicators" checked={false} onChange={onChange} />);

  const toggle = screen.getByRole("switch", { name: "Typing indicators" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  fireEvent.click(toggle);
  expect(onChange).toHaveBeenCalledWith(true);
});
