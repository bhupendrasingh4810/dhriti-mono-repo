import { vi } from "vitest";

const pdfRenderer = vi.hoisted(() => ({
  getDocument: vi.fn(),
  getPage: vi.fn(),
  render: vi.fn(),
  cancel: vi.fn(),
  destroy: vi.fn(),
}));

export { pdfRenderer };

vi.mock("../../../../packages/ui/src/components/PdfPreviewDialog/pdf-engine", () => ({
  loadPdfEngine: async () => ({ getDocument: pdfRenderer.getDocument }),
}));

/** Canvas/worker execution is covered by the browser story; unit tests exercise the renderer lifecycle. */
export function resetPdfRenderer() {
  pdfRenderer.render.mockImplementation(() => ({ promise: Promise.resolve(), cancel: pdfRenderer.cancel }));
  pdfRenderer.getPage.mockImplementation(async () => ({
    getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
    render: pdfRenderer.render,
    getTextContent: async () => ({ items: [{ str: "Atlas quarterly roadmap" }] }),
  }));
  pdfRenderer.getDocument.mockImplementation(() => ({
    promise: Promise.resolve({ numPages: 3, getPage: pdfRenderer.getPage }),
    destroy: pdfRenderer.destroy,
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private callback: (entries: { contentRect: { width: number } }[]) => void) {}
      observe() {
        this.callback([{ contentRect: { width: 600 } }]);
      }
      disconnect() {}
    },
  );
}
