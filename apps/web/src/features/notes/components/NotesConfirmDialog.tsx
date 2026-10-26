import { Dialog } from "@dhriti/ui/dialog";

interface NotesConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function NotesConfirmDialog({
  title,
  description,
  confirmLabel,
  confirming,
  onCancel,
  onConfirm,
}: NotesConfirmDialogProps) {
  return (
    <Dialog open onClose={onCancel} title={title} hideHeader secondaryActionLabel="" maxWidth="sm">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{title}</h2>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-error px-4 py-2 text-sm font-semibold text-text-inverse disabled:opacity-60"
          >
            {confirming ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
