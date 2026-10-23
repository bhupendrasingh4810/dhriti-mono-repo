import { Icon } from "@/components/shared/icons/icon";
import type { ControlEntitlementDefinition } from "@/services/control.service";

type DeleteEntitlementDialogProps = {
  item: ControlEntitlementDefinition | null;
  onCancel: () => void;
  onConfirm: (item: ControlEntitlementDefinition) => void;
};

export function DeleteEntitlementDialog({ item, onCancel, onConfirm }: DeleteEntitlementDialogProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={onCancel}>
      <section
        aria-labelledby="delete-entitlement-title"
        aria-modal="true"
        role="alertdialog"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="delete-entitlement-title" className="text-lg font-semibold text-slate-950">
            Delete entitlement?
          </h2>
          <button
            aria-label="Close delete confirmation"
            className="cursor-pointer text-slate-500 hover:text-slate-950"
            onClick={onCancel}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This will permanently delete <strong>{item.name}</strong> and remove it from associated plans.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="cursor-pointer rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => onConfirm(item)}
          >
            Delete entitlement
          </button>
        </div>
      </section>
    </div>
  );
}
