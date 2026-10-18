import type { ControlEntitlementDefinition, ControlPlanEntitlementInput } from "@/services/control.service";

import { PlanEntitlementEditor } from "./plan-entitlement-editor";

type CreatePlanDrawerProps = {
  isOpen: boolean;
  name: string;
  planKey: string;
  description: string;
  definitions: ControlEntitlementDefinition[];
  assignments: ControlPlanEntitlementInput[];
  onClose: () => void;
  onNameChange: (value: string) => void;
  onKeyChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onToggle: (definition: ControlEntitlementDefinition) => void;
  onValueChange: (entitlementKey: string, value: number) => void;
  onCreate: () => void;
};

export function CreatePlanDrawer({
  isOpen,
  name,
  planKey,
  description,
  definitions,
  assignments,
  onClose,
  onNameChange,
  onKeyChange,
  onDescriptionChange,
  onToggle,
  onValueChange,
  onCreate,
}: CreatePlanDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onMouseDown={onClose}>
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="create-plan-title"
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h2 id="create-plan-title" className="text-lg font-semibold text-slate-950">Create plan</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Define the plan details and included entitlements.</p>
          </div>
          <button className="text-xs font-semibold text-slate-600" onClick={onClose}>Close</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded border border-slate-300 p-2" placeholder="Plan name" value={name} onChange={(event) => onNameChange(event.target.value)} />
            <input className="rounded border border-slate-300 p-2" placeholder="Immutable key" value={planKey} onChange={(event) => onKeyChange(event.target.value)} />
            <input className="rounded border border-slate-300 p-2 md:col-span-2" placeholder="Description" value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
          </div>
          <PlanEntitlementEditor
            definitions={definitions}
            assignments={assignments}
            onToggle={onToggle}
            onValueChange={onValueChange}
          />
        </div>
        <div className="border-t border-slate-200 p-6">
          <button className="rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" disabled={!name || !planKey} onClick={onCreate}>
            Create plan
          </button>
        </div>
      </section>
    </div>
  );
}