"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => Promise<void> | void;
  primaryButtonVariant?: "contained" | "outlined" | "text";
  primaryButtonColor?: "primary" | "secondary" | "error" | "success";
  secondaryActionLabel?: string;
  isSubmitting?: boolean;
  primaryActionDisabled?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  fullWidth?: boolean;
  hideHeader?: boolean;
  fullScreenOnMobile?: boolean;
}

const widthClasses: Record<Exclude<DialogProps["maxWidth"], false | undefined>, string> = {
  xs: "max-w-sm",
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

const primaryColorClasses: Record<NonNullable<DialogProps["primaryButtonColor"]>, string> = {
  primary: "bg-brand text-text-inverse hover:bg-brand-dark",
  secondary: "bg-text-secondary text-text-inverse hover:bg-text-primary",
  error: "bg-error text-text-inverse hover:opacity-90",
  success: "bg-success text-text-inverse hover:opacity-90",
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  primaryButtonVariant = "contained",
  primaryButtonColor = "primary",
  secondaryActionLabel = "Cancel",
  isSubmitting = false,
  primaryActionDisabled = false,
  maxWidth = "sm",
  fullWidth = true,
  hideHeader = false,
  fullScreenOnMobile = false,
}: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open || isSubmitting) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open) {
    return null;
  }

  const primaryClassName =
    primaryButtonVariant === "outlined"
      ? "border border-brand text-brand hover:bg-brand-muted"
      : primaryButtonVariant === "text"
        ? "text-brand hover:bg-brand-muted"
        : primaryColorClasses[primaryButtonColor];

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center bg-text-primary/40 ${fullScreenOnMobile ? "p-0 sm:p-4" : "p-4"}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !isSubmitting) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={hideHeader ? undefined : titleId}
        aria-label={hideHeader ? title : undefined}
        aria-modal="true"
        role="dialog"
        className={`rounded-lg border border-border bg-surface shadow-2xl ${fullWidth ? "w-full" : "w-auto"} ${
          maxWidth === false ? "" : widthClasses[maxWidth]
        } ${fullScreenOnMobile ? "max-sm:flex max-sm:h-dvh max-sm:w-full max-sm:max-w-none max-sm:flex-col max-sm:rounded-none max-sm:border-0" : ""}`}
      >
        {!hideHeader ? (
          <header className="flex items-center justify-between p-4">
            <h2 id={titleId} className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
            {!isSubmitting ? (
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="grid size-8 place-items-center rounded-md text-text-secondary hover:bg-surface-raised"
              >
                <X size={18} aria-hidden="true" />
              </button>
            ) : null}
          </header>
        ) : null}
        <div
          className={`${hideHeader ? "" : "border-t border-border "}p-6 ${fullScreenOnMobile ? "max-sm:flex max-sm:min-h-0 max-sm:flex-1 max-sm:flex-col" : ""}`}
        >
          <div
            className={`flex flex-col gap-2 ${fullScreenOnMobile ? "max-sm:min-h-0 max-sm:flex-1 max-sm:overflow-y-auto" : ""}`}
          >
            {children}
          </div>
        </div>
        {(primaryActionLabel || secondaryActionLabel) && (
          <footer className="flex justify-end gap-2 p-4">
            {secondaryActionLabel && !isSubmitting ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
              >
                {secondaryActionLabel}
              </button>
            ) : null}
            {primaryActionLabel ? (
              <button
                type="button"
                disabled={isSubmitting || primaryActionDisabled}
                onClick={onPrimaryAction}
                className={`inline-flex min-w-25 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${primaryClassName}`}
              >
                {isSubmitting ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                <span className={isSubmitting ? "ml-2" : ""}>{primaryActionLabel}</span>
              </button>
            ) : null}
          </footer>
        )}
      </section>
    </div>
  );
}
