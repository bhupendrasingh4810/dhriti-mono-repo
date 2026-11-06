import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AttachmentsMessage } from "../AttachmentsMessage";

test("shows an attachment and opens its actions", () => {
  const open = vi.fn();
  render(<AttachmentsMessage message={{ content: "", attachments: [{ id: "a", name: "brief.pdf", type: "application/pdf", url: "/brief.pdf" }] } as any} openAttachmentMenu={open} />);
  fireEvent.click(screen.getByLabelText("More options for brief.pdf"));
  expect(open).toHaveBeenCalled();
  expect(screen.getByText("PDF")).toBeInTheDocument();
});
