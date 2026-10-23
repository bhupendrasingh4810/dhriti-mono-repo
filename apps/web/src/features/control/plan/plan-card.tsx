import { Icon } from "@/components/shared/icons/icon";
import type { ControlPlan } from "@/services/control.service";

type PlanCardProps = {
  plan: ControlPlan;
  onOpen: (plan: ControlPlan) => void;
  onEdit: (plan: ControlPlan) => void;
  onDelete: (plan: ControlPlan) => void;
  onStatusChange: (plan: ControlPlan, isActive: boolean) => void;
};

export function PlanCard({ plan, onOpen, onEdit, onDelete, onStatusChange }: PlanCardProps) {
  return (
    <article className="group relative min-h-48 rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-brand hover:shadow-md">
      <button type="button" className="flex min-h-48 w-full flex-col p-5 pr-24 text-left" onClick={() => onOpen(plan)}>
        <strong className="text-base text-slate-950">{plan.name}</strong>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {plan.description || "No description provided."}
        </p>
        <span className="mt-auto pt-5 text-xs font-semibold text-slate-500">
          {plan.entitlements.length} {plan.entitlements.length === 1 ? "entitlement" : "entitlements"}
        </span>
        <code className="mt-2 font-mono text-[11px] text-slate-500">{plan.key}</code>
      </button>
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label={`Edit ${plan.name}`}
          className="cursor-pointer rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-brand"
          title="Edit plan access"
          onClick={() => onEdit(plan)}
        >
          <Icon name="edit" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${plan.name}`}
          className="cursor-pointer rounded p-1.5 text-red-700 hover:bg-red-50"
          title="Delete plan"
          onClick={() => onDelete(plan)}
        >
          <Icon name="delete" />
        </button>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={plan.isActive}
        aria-label={`${plan.isActive ? "Disable" : "Enable"} ${plan.name}`}
        className={`absolute bottom-4 right-5 flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors ${plan.isActive ? "bg-brand" : "bg-slate-300"}`}
        title={plan.isActive ? "Disable plan" : "Enable plan"}
        onClick={() => onStatusChange(plan, !plan.isActive)}
      >
        <span
          aria-hidden="true"
          className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${plan.isActive ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
    </article>
  );
}
