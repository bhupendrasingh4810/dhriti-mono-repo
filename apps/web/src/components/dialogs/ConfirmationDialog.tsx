"use client";

import { Dialog } from "@dhriti/ui/dialog";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "secondary" | "error" | "success";
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
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      secondaryActionLabel={cancelLabel}
      primaryActionLabel={confirmLabel}
      primaryButtonColor={confirmColor}
      onPrimaryAction={onConfirm}
      maxWidth="xs"
    >
      <p className="text-text-secondary">{description}</p>
    </Dialog>
  );
}
