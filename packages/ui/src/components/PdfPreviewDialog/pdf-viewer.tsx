"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";
import { DhritiButton } from "../buttons-and-actions/button";
import { loadPdfEngine } from "./pdf-engine";

interface PdfViewerProps {
  src: string;
  title: string;
  loadingLabel: string;
}

/** Canvas rendering keeps browser-owned PDF chrome out of the themed UI. Worker assets are bundled locally. */
export function PdfViewer({ src, title, loadingLabel }: PdfViewerProps) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [width, setWidth] = useState(0);
  const [rendered, setRendered] = useState<{ key: string; error: string; text: string } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const renderKey = `${page}:${zoom}:${width}`;
  const rendering = !!document && rendered?.key !== renderKey;

  useEffect(() => {
    let active = true;
    let task: PDFDocumentLoadingTask | undefined;
    void (async () => {
      try {
        const pdfjs = await loadPdfEngine();
        if (!active) return;
        task = pdfjs.getDocument({ url: src });
        const result = await task.promise;
        if (active) setDocument(result);
      } catch (reason) {
        if (active) setLoadError(reason instanceof Error ? reason.message : "Unable to load PDF preview");
      }
    })();
    return () => {
      active = false;
      void task?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !width) return;
    let active = true;
    let task: RenderTask | undefined;
    const target = sheet.current;
    const canvas = window.document.createElement("canvas");
    canvas.className = "block";
    canvas.setAttribute("aria-hidden", "true");
    void (async () => {
      try {
        const pdfPage = await document.getPage(page);
        if (!active) return;
        const original = pdfPage.getViewport({ scale: 1 });
        const scale = (width / original.width) * (zoom / 100);
        const display = pdfPage.getViewport({ scale });
        // Bound bitmap memory for large pages and high-DPI displays.
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2, 4096 / Math.max(display.width, display.height));
        canvas.width = Math.ceil(display.width * pixelRatio);
        canvas.height = Math.ceil(display.height * pixelRatio);
        canvas.style.width = `${display.width}px`;
        canvas.style.height = `${display.height}px`;
        task = pdfPage.render({
          canvas,
          viewport: display,
          transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
        });
        await task.promise;
        const content = await pdfPage.getTextContent();
        if (!active) return;
        target?.replaceChildren(canvas);
        setRendered({
          key: renderKey,
          error: "",
          text: content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
        });
      } catch (reason) {
        if (active)
          setRendered({
            key: renderKey,
            error: reason instanceof Error ? reason.message : "Unable to render PDF page",
            text: "",
          });
      }
    })();
    return () => {
      active = false;
      task?.cancel();
    };
  }, [document, page, zoom, width, renderKey]);

  const error = loadError || (rendered?.key === renderKey ? rendered.error : "");
  const pending = !error && (!document || rendering);

  return (
    <section aria-label={title} className="overflow-hidden rounded-md border border-border">
      <div
        role="toolbar"
        aria-label="PDF controls"
        className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface p-2 text-sm text-text-primary"
      >
        <div className="flex items-center gap-2">
          <DhritiButton
            size="sm"
            variant="secondary"
            aria-label="Previous page"
            disabled={!document || page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </DhritiButton>
          <span aria-live="polite">
            Page {page} of {document?.numPages ?? "-"}
          </span>
          <DhritiButton
            size="sm"
            variant="secondary"
            aria-label="Next page"
            disabled={!document || page >= document.numPages}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </DhritiButton>
        </div>
        <div className="flex items-center gap-2">
          <DhritiButton
            size="sm"
            variant="secondary"
            aria-label="Zoom out"
            disabled={!document || zoom <= 50}
            onClick={() => setZoom((value) => value - 25)}
          >
            <Minus className="size-4" aria-hidden="true" />
          </DhritiButton>
          <span aria-live="polite">{zoom}%</span>
          <DhritiButton
            size="sm"
            variant="secondary"
            aria-label="Zoom in"
            disabled={!document || zoom >= 200}
            onClick={() => setZoom((value) => value + 25)}
          >
            <Plus className="size-4" aria-hidden="true" />
          </DhritiButton>
          <DhritiButton size="sm" variant="secondary" disabled={!document} onClick={() => setZoom(100)}>
            Fit width
          </DhritiButton>
        </div>
      </div>
      <div className="h-[65dvh] overflow-auto bg-surface-raised p-3" aria-busy={pending}>
        {error && (
          <p role="alert" className="mb-3 rounded-md border border-error bg-surface p-3 text-sm text-error">
            Unable to preview PDF. {error} You can still download the document.
          </p>
        )}
        {pending && (
          <p role="status" className="mb-3 text-sm text-text-secondary">
            {loadingLabel}
          </p>
        )}
        <div ref={viewport}>
          <div ref={sheet} className={error ? "hidden" : "w-fit shadow-sm"} />
        </div>
        <div role="document" aria-label={`${title}, page ${page}`} className="sr-only">
          {rendered?.key === renderKey ? rendered.text : ""}
        </div>
      </div>
    </section>
  );
}
