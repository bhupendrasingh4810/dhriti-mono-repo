"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DhritiButton, PdfPreviewDialog } from "@dhriti/ui";
import { controlPlatformService } from "@/services/control.service";

interface Props {
  disabled: boolean;
  notify: (message: string, type: "success" | "error") => void;
}

export function HealthReportExport({ disabled, notify }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);
  const previewUrl = useRef<string | null>(null);
  const downloadUrls = useRef<string[]>([]);
  const menuId = useId();

  useEffect(() => {
    const urls = downloadUrls.current;
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && container.current?.querySelector('[role="group"]')) {
        setOpen(false);
        container.current?.querySelector("button")?.focus();
      }
    };
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", escape);
      request.current?.abort();
      request.current = null;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const closePreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
    container.current?.querySelector("button")?.focus();
  };
  const download = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
    }
    notify("Health report downloaded", "success");
  };
  const exportReport = async (format: "pdf" | "json") => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setOpen(false);
    const timeout = setTimeout(() => controller.abort(new Error("Health report request timed out")), 15000);
    try {
      const report = await controlPlatformService.systemHealthReport(controller.signal);
      if (controller.signal.aborted) {
        if (request.current === controller) throw controller.signal.reason;
        return;
      }
      const filename = `dhriti-system-health-${report.timestamp.replace(/[:.]/g, "-")}.${format}`;
      const blob =
        format === "pdf"
          ? await (await import("./health-report-pdf")).createHealthReportPdf(report)
          : new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      if (controller.signal.aborted) {
        if (request.current === controller) throw controller.signal.reason;
        return;
      }
      const url = URL.createObjectURL(blob);
      if (format === "pdf") {
        // Download uses this same URL: preview and download always contain identical bytes.
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = url;
        setPreview({ url, filename });
      } else {
        // Retain URLs until unmount so browsers can consume the asynchronous download.
        downloadUrls.current.push(url);
        download(url, filename);
      }
    } catch (reason) {
      if (request.current === controller)
        notify(reason instanceof Error ? reason.message : "Unable to export health report", "error");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  };

  return (
    <>
      <div ref={container} className="relative mt-4">
        <DhritiButton
          variant="secondary"
          className="w-full cursor-pointer"
          disabled={disabled || busy}
          aria-busy={busy}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          Download Health Report <ChevronDown className="ml-2 size-4" aria-hidden="true" />
        </DhritiButton>
        {open && (
          <div
            id={menuId}
            role="group"
            aria-label="Health report format"
            className="absolute right-0 z-10 mt-2 flex w-full flex-col gap-1 rounded-md border border-border bg-surface p-2 shadow-lg"
          >
            <DhritiButton autoFocus variant="secondary" onClick={() => void exportReport("pdf")}>
              PDF
            </DhritiButton>
            <DhritiButton variant="secondary" onClick={() => void exportReport("json")}>
              JSON
            </DhritiButton>
          </div>
        )}
      </div>
      <PdfPreviewDialog
        open={!!preview}
        onClose={closePreview}
        title="Health Report PDF Preview"
        documentTitle="Health Report PDF"
        description="Preview the generated report below. Use the controls to change pages or zoom."
        src={preview?.url ?? null}
        onDownload={() => {
          if (!preview) return;
          try {
            download(preview.url, preview.filename);
          } catch (reason) {
            notify(reason instanceof Error ? reason.message : "Unable to download PDF", "error");
          }
        }}
      />
    </>
  );
}
