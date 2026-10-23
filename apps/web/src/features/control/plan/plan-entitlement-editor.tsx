import type { ControlEntitlementDefinition, ControlPlanEntitlementInput } from "@/services/control.service";

type PlanEntitlementEditorProps = {
  definitions: ControlEntitlementDefinition[];
  assignments: ControlPlanEntitlementInput[];
  onToggle: (definition: ControlEntitlementDefinition) => void;
  onValueChange: (entitlementKey: string, value: number) => void;
};

export function PlanEntitlementEditor({
  definitions,
  assignments,
  onToggle,
  onValueChange,
}: PlanEntitlementEditorProps) {
  return (
    <div className="mt-4 space-y-2">
      {definitions.map((definition) => {
        const assignment = assignments.find((item) => item.entitlementKey === definition.key);
        return (
          <div key={definition.id} className="flex items-center gap-3 rounded border border-slate-200 p-3">
            <input type="checkbox" checked={assignment?.enabled ?? false} onChange={() => onToggle(definition)} />
            <code className="min-w-48 text-xs">{definition.key}</code>
            <span className="text-sm text-slate-600">{definition.name}</span>
            {definition.kind === "LIMIT" && (
              <input
                className="ml-auto w-24 rounded border border-slate-300 p-1"
                type="number"
                min="0"
                disabled={!assignment?.enabled}
                value={assignment?.value ?? 0}
                onChange={(event) => onValueChange(definition.key, Number(event.target.value))}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
