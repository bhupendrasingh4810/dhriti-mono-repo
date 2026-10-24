"use client";

import { useState } from "react";
import { Dialog } from "@dhriti/ui/dialog";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "secondary" | "error" | "success";
  requireDeleteConfirmation?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmColor = "primary",
  requireDeleteConfirmation = false,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const [confirmationValue, setConfirmationValue] = useState("");
  const canConfirm = !requireDeleteConfirmation || confirmationValue === "DELETE";

  function handleCancel() {
    setConfirmationValue("");
    onCancel();
  }

  function handleConfirm() {
    if (!canConfirm) return;
    setConfirmationValue("");
    onConfirm();
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={title}
      secondaryActionLabel={cancelLabel}
      primaryActionLabel={confirmLabel}
      primaryButtonColor={confirmColor}
      onPrimaryAction={handleConfirm}
      primaryActionDisabled={!canConfirm}
      maxWidth="sm"
    >
      <p className="text-text-secondary">{description}</p>
      {requireDeleteConfirmation ? (
        <label className="mt-2 block text-sm text-text-secondary">
          Type <span className="font-semibold text-text-primary">DELETE</span> to confirm.
          <input
            autoComplete="off"
            value={confirmationValue}
            onChange={(event) => setConfirmationValue(event.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </label>
      ) : null}
    </Dialog>
  );
}
