import { Icon } from "@/components/shared/icons/icon";
import type {
  ControlEntitlementDefinition,
  ControlPlan,
  ControlPlanEntitlementInput,
} from "@/services/control.service";

import { PlanEntitlementEditor } from "./plan-entitlement-editor";

export type PlanDrawerMode = "view" | "edit" | null;

type PlanDrawerProps = {
  mode: PlanDrawerMode;
  plan: ControlPlan | null;
  definitions: ControlEntitlementDefinition[];
  assignments: ControlPlanEntitlementInput[];
  onClose: () => void;
  onEdit: () => void;
  onSave: () => void;
  onToggle: (definition: ControlEntitlementDefinition) => void;
  onValueChange: (entitlementKey: string, value: number) => void;
};

export function PlanDrawer({
  mode,
  plan,
  definitions,
  assignments,
  onClose,
  onEdit,
  onSave,
  onToggle,
  onValueChange,
}: PlanDrawerProps) {
  if (!plan || !mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onMouseDown={onClose}>
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="plan-drawer-title"
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h2 id="plan-drawer-title" className="text-lg font-semibold text-slate-950">
              {mode === "edit" ? `Edit ${plan.name}` : plan.name}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {mode === "edit"
                ? "Configure the entitlements included with this plan."
                : plan.description || "No description provided."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close plan details"
            className="cursor-pointer text-slate-500 hover:text-slate-950"
            title="Close"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {mode === "edit" ? (
            <PlanEntitlementEditor
              definitions={definitions}
              assignments={assignments}
              onToggle={onToggle}
              onValueChange={onValueChange}
            />
          ) : (
            <div className="space-y-4">
              <code className="inline-block rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                {plan.key}
              </code>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Included entitlements</h3>
                <div className="mt-3 space-y-2">
                  {plan.entitlements.map(({ entitlement, enabled, value }) => (
                    <div key={entitlement.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{entitlement.name}</p>
                          <code className="text-xs text-slate-500">{entitlement.key}</code>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {enabled ? (entitlement.kind === "LIMIT" ? (value ?? 0) : "Enabled") : "Disabled"}
                        </span>
                      </div>
                    </div>
                  ))}
                  {plan.entitlements.length === 0 && (
                    <p className="text-sm text-slate-500">No entitlements are included in this plan.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            onClick={onClose}
          >
            Cancel
          </button>
          {mode === "edit" ? (
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
              onClick={onSave}
            >
              Save access
            </button>
          ) : (
            <button
              type="button"
              className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
              onClick={onEdit}
            >
              Edit
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
