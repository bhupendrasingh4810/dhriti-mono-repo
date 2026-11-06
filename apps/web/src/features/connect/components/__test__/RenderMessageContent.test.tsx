import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { RenderMessageContent } from "../RenderMessageContent";

test("renders markdown and opens a known mention", () => {
  const hover = vi.fn();
  render(<RenderMessageContent message={{ content: "**Hello** @[Asha]" } as any} connectUsers={[{ id: "u", displayName: "Asha" } as any]} openMentionHover={hover} />);
  fireEvent.mouseEnter(screen.getByText("Asha"));
  expect(screen.getByText("Hello").tagName).toBe("STRONG");
  expect(hover).toHaveBeenCalledWith(expect.anything(), "u");
});
