import type { ControlPlan } from "@/services/control.service";

type DeletePlanDialogProps = {
  plan: ControlPlan | null;
  onCancel: () => void;
  onConfirm: (plan: ControlPlan) => void;
};

export function DeletePlanDialog({ plan, onCancel, onConfirm }: DeletePlanDialogProps) {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={onCancel}>
      <section
        aria-labelledby="delete-plan-title"
        aria-modal="true"
        role="alertdialog"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="delete-plan-title" className="text-lg font-semibold text-slate-950">
          Delete plan?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This will permanently delete <strong>{plan.name}</strong>. Plans assigned to an organization cannot be
          deleted.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white"
            onClick={() => onConfirm(plan)}
          >
            Delete plan
          </button>
        </div>
      </section>
    </div>
  );
}
