import { pdfRenderer, resetPdfRenderer } from "@/test/pdf-preview-mock";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PdfPreviewDialog, type PdfPreviewDialogProps } from "@dhriti/ui";

beforeEach(() => {
  vi.resetAllMocks();
  resetPdfRenderer();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function props(overrides: Partial<PdfPreviewDialogProps> = {}): PdfPreviewDialogProps {
  return {
    open: true,
    src: "blob:atlas-plan",
    title: "Atlas planning report",
    documentTitle: "Atlas plan PDF",
    onClose: vi.fn(),
    onDownload: vi.fn(),
    ...overrides,
  };
}

describe("reusable PdfPreviewDialog", () => {
  it("only requests explicit downloads and reads the supplied URL in the local renderer", async () => {
    const callbacks = props();
    const view = render(<PdfPreviewDialog {...callbacks} />);
    expect(screen.getByRole("dialog", { name: callbacks.title })).toHaveAttribute("aria-modal", "true");
    await screen.findByText("Page 1 of 3");
    await waitFor(() => expect(document.querySelector("canvas")).toHaveAttribute("width", "600"));
    expect(document.querySelector("canvas")).toHaveAttribute("height", "800");
    expect(screen.getByRole("region", { name: "Atlas plan PDF" })).toBeInTheDocument();
    expect(pdfRenderer.getDocument).toHaveBeenCalledWith({ url: callbacks.src });
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
    expect(callbacks.onDownload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Download PDF" }));
    expect(callbacks.onDownload).toHaveBeenCalledTimes(1);
    view.rerender(<PdfPreviewDialog {...callbacks} src="blob:pulse-report" />);
    await waitFor(() => expect(pdfRenderer.getDocument).toHaveBeenLastCalledWith({ url: "blob:pulse-report" }));
    expect(pdfRenderer.destroy).toHaveBeenCalledTimes(1);
  });

  it("supports controlled closure by action, Escape and backdrop", () => {
    const callbacks = props();
    const view = render(<PdfPreviewDialog {...callbacks} />);
    fireEvent.click(screen.getByRole("button", { name: /^Close$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement!);
    expect(callbacks.onClose).toHaveBeenCalledTimes(4);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    view.rerender(<PdfPreviewDialog {...callbacks} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Atlas plan PDF" })).not.toBeInTheDocument();
  });

  it.each([
    { loading: true },
    { error: "PDF unavailable" },
    { src: null },
    { downloadDisabled: true },
    { downloading: true },
  ])("prevents downloads for unavailable or busy states: %j", (state) => {
    const callbacks = props(state);
    render(<PdfPreviewDialog {...callbacks} />);
    const button = screen.getByRole("button", { name: "Download PDF" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(callbacks.onDownload).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^Close$/ })).toBeEnabled();
    if ("loading" in state) {
      expect(screen.getByRole("status")).toHaveTextContent("Loading PDF preview");
      expect(screen.queryByRole("region", { name: "Atlas plan PDF" })).not.toBeInTheDocument();
    }
    if ("error" in state) expect(screen.getByRole("alert")).toHaveTextContent("PDF unavailable");
    if ("src" in state) expect(screen.getByText("No PDF available to preview.")).toBeInTheDocument();
    if ("downloading" in state) expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("supports custom labels and restores a ready preview after loading or error", async () => {
    const configuration = props({
      downloadLabel: "Save report",
      closeLabel: "Done",
      loadingLabel: "Preparing Atlas report",
      emptyLabel: "Select an Atlas report",
      description: "",
      loading: true,
    });
    const view = render(<PdfPreviewDialog {...configuration} />);
    expect(screen.getByRole("status")).toHaveTextContent("Preparing Atlas report");
    view.rerender(<PdfPreviewDialog {...configuration} loading={false} error="Please retry" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Please retry");
    view.rerender(<PdfPreviewDialog {...configuration} loading={false} src={null} />);
    expect(screen.getByText("Select an Atlas report")).toBeInTheDocument();
    view.rerender(<PdfPreviewDialog {...configuration} loading={false} />);
    await screen.findByText("Page 1 of 3");
    expect(screen.getByRole("region", { name: "Atlas plan PDF" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save report" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(configuration.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders themed page and bounded zoom controls, resetting on source changes", async () => {
    const view = render(<PdfPreviewDialog {...props()} />);
    await screen.findByText("Page 1 of 3");
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(pdfRenderer.getPage).toHaveBeenLastCalledWith(2));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await screen.findByText("Page 3 of 3");
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    await screen.findByText("Page 2 of 3");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(document.querySelector("canvas")).toHaveAttribute("width", "750"));
    expect(document.querySelector("canvas")).toHaveAttribute("height", "1000");
    fireEvent.click(screen.getByRole("button", { name: "Fit width" }));
    for (let count = 0; count < 4; count++) fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByText("200%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Fit width" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    view.rerender(<PdfPreviewDialog {...props({ src: "blob:another-report" })} />);
    await screen.findByText("Page 1 of 3");
    expect(screen.getByText("100%")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("document")).toHaveTextContent("Atlas quarterly roadmap"));
    expect(pdfRenderer.cancel).toHaveBeenCalled();
  });

  it("reports PDF loading failures but retains the original download action", async () => {
    pdfRenderer.getDocument.mockImplementationOnce(() => ({
      promise: Promise.reject(new Error("Invalid PDF structure")),
      destroy: pdfRenderer.destroy,
    }));
    render(<PdfPreviewDialog {...props()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid PDF structure");
    expect(screen.getByRole("button", { name: "Download PDF" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("reports rendering failures explicitly and cancels work when closed", async () => {
    pdfRenderer.render.mockImplementationOnce(() => ({
      promise: Promise.reject(new Error("Page rendering failed")),
      cancel: pdfRenderer.cancel,
    }));
    const view = render(<PdfPreviewDialog {...props()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Page rendering failed");
    view.unmount();
    expect(pdfRenderer.cancel).toHaveBeenCalled();
    expect(pdfRenderer.destroy).toHaveBeenCalledTimes(1);
  });

  it("ignores document results arriving after closure", async () => {
    let finish!: (value: { numPages: number; getPage: typeof pdfRenderer.getPage }) => void;
    pdfRenderer.getDocument.mockImplementationOnce(() => ({
      promise: new Promise((resolve) => {
        finish = resolve;
      }),
      destroy: pdfRenderer.destroy,
    }));
    const view = render(<PdfPreviewDialog {...props()} />);
    await waitFor(() => expect(pdfRenderer.getDocument).toHaveBeenCalledTimes(1));
    view.rerender(<PdfPreviewDialog {...props({ open: false })} />);
    await act(async () => finish({ numPages: 3, getPage: pdfRenderer.getPage }));
    expect(pdfRenderer.destroy).toHaveBeenCalledTimes(1);
    expect(pdfRenderer.getPage).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
