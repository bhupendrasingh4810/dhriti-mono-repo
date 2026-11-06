import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { SettingsSkeleton } from "../SettingsSkeleton";

test("exposes a busy loading status while rendering requested placeholder sections", () => {
  const { container } = render(<SettingsSkeleton sections={[1, 2]} />);

  expect(screen.getByRole("status", { name: "Loading settings" })).toHaveAttribute("aria-busy", "true");
  expect(container.querySelectorAll(".rounded-xl.border")).toHaveLength(2);
});
