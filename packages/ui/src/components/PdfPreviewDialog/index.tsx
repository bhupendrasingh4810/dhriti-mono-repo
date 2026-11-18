"use client";

import { Dialog, type DialogProps } from "../Dialog";
import { DhritiButton } from "../buttons-and-actions/button";
import { PdfViewer } from "./pdf-viewer";

export interface PdfPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  /** Caller-owned PDF URL; the caller handles generation, authorization and object URL cleanup. */
  src: string | null;
  /** Download the same document shown by src; the caller handles errors and notifications. */
  onDownload: () => void;
  title?: string;
  documentTitle?: string;
  description?: string;
  downloadLabel?: string;
  closeLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  downloading?: boolean;
  downloadDisabled?: boolean;
  error?: string;
  emptyLabel?: string;
  maxWidth?: DialogProps["maxWidth"];
  fullScreenOnMobile?: boolean;
}

/** The local renderer reads src only while open. Generation, downloads and URL ownership stay with the caller. */
export function PdfPreviewDialog({
  open,
  onClose,
  src,
  onDownload,
  title = "PDF Preview",
  documentTitle = "PDF document",
  description = "Preview the document below. Use the controls to change pages or zoom.",
  downloadLabel = "Download PDF",
  closeLabel = "Close",
  loading = false,
  loadingLabel = "Loading PDF preview",
  downloading = false,
  downloadDisabled = false,
  error,
  emptyLabel = "No PDF available to preview.",
  maxWidth = "lg",
  fullScreenOnMobile = true,
}: PdfPreviewDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth={maxWidth}
      fullScreenOnMobile={fullScreenOnMobile}
      secondaryActionLabel=""
    >
      {description && <p className="text-sm text-text-secondary">{description}</p>}
      <div aria-busy={loading}>
        {loading ? (
          <div
            role="status"
            className="flex h-[65dvh] items-center justify-center rounded-md border border-border bg-surface-raised text-sm text-text-secondary motion-safe:animate-pulse"
          >
            {loadingLabel}
          </div>
        ) : error ? (
          <p role="alert" className="rounded-md border border-error p-3 text-sm text-error">
            {error}
          </p>
        ) : src ? (
          <PdfViewer key={src} src={src} title={documentTitle} loadingLabel={loadingLabel} />
        ) : (
          <p className="p-3 text-sm text-text-secondary">{emptyLabel}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <DhritiButton variant="secondary" onClick={onClose}>
          {closeLabel}
        </DhritiButton>
        <DhritiButton
          disabled={downloadDisabled || loading || !!error || !src}
          loading={downloading}
          onClick={onDownload}
        >
          {downloadLabel}
        </DhritiButton>
      </div>
    </Dialog>
  );
}
