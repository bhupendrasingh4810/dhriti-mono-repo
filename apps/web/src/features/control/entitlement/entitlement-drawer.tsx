import { type FormEvent, useState } from "react";

import { Icon } from "@/components/shared/icons/icon";
import type { ControlEntitlementDefinition } from "@/services/control.service";

import type { EntitlementDraft, EntitlementFieldErrors } from "./entitlement-form.types";
import { toEntitlementDraft } from "./entitlement-form.types";

type EntitlementDrawerMode = "create" | "edit" | "view" | null;

type EntitlementDrawerProps = {
  mode: EntitlementDrawerMode;
  selected: ControlEntitlementDefinition | null;
  draft: EntitlementDraft | null;
  fieldErrors: EntitlementFieldErrors;
  onClose: () => void;
  onDraftChange: (draft: EntitlementDraft, field?: "key" | "name") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, draft: EntitlementDraft) => void;
};

export function EntitlementDrawer({
  mode,
  selected,
  draft,
  fieldErrors,
  onClose,
  onDraftChange,
  onSubmit,
}: EntitlementDrawerProps) {
  const [isEditing, setIsEditing] = useState(mode === "edit");
  const [localDraft, setLocalDraft] = useState(draft);
  if (!mode) return null;
  const isForm = mode === "create" || isEditing;
  const formDraft = localDraft ?? draft;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <section aria-modal="true" role="dialog" className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-950">
              {mode === "create" ? "Create entitlement" : isEditing ? "Edit entitlement" : selected?.name}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Definition, usage, and governance details.</p>
          </div>
          <button
            type="button"
            aria-label="Close entitlement panel"
            className="cursor-pointer text-slate-500 hover:text-slate-950"
            title="Close"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isForm && formDraft ? (
            <EntitlementForm
              draft={formDraft}
              isEditing={mode === "edit" || isEditing}
              fieldErrors={fieldErrors}
              onDraftChange={(nextDraft, field) => {
                setLocalDraft(nextDraft);
                onDraftChange(nextDraft, field);
              }}
              onSubmit={(event) => onSubmit(event, formDraft)}
            />
          ) : (
            selected && <EntitlementDetails item={selected} />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 p-4">
          {isForm ? (
            <>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                form="entitlement-form"
                type="submit"
                className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
              >
                Save entitlement
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!selected) return;
                  setLocalDraft(toEntitlementDraft(selected));
                  setIsEditing(true);
                }}
              >
                Edit entitlement
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EntitlementForm({
  draft,
  isEditing,
  fieldErrors,
  onDraftChange,
  onSubmit,
}: Pick<EntitlementDrawerProps, "fieldErrors" | "onDraftChange" | "onSubmit"> & {
  draft: EntitlementDraft;
  isEditing: boolean;
}) {
  return (
    <form id="entitlement-form" onSubmit={(event) => onSubmit(event, draft)} className="space-y-4">
      <FieldError error={fieldErrors.key} id="entitlement-key-error">
        <input
          disabled={isEditing}
          aria-describedby={fieldErrors.key ? "entitlement-key-error" : undefined}
          aria-invalid={Boolean(fieldErrors.key)}
          className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.key ? "border-red-600" : "border-slate-200"}`}
          placeholder="Immutable key"
          value={draft.key}
          onChange={(event) => onDraftChange({ ...draft, key: event.target.value }, "key")}
        />
      </FieldError>
      <FieldError error={fieldErrors.name} id="entitlement-name-error">
        <input
          aria-describedby={fieldErrors.name ? "entitlement-name-error" : undefined}
          aria-invalid={Boolean(fieldErrors.name)}
          className={`w-full rounded-lg border px-3 py-2 ${fieldErrors.name ? "border-red-600" : "border-slate-200"}`}
          placeholder="Display name"
          value={draft.name}
          onChange={(event) => onDraftChange({ ...draft, name: event.target.value }, "name")}
        />
      </FieldError>
      <div className="grid grid-cols-2 gap-4">
        <input
          className="rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Product key"
          value={draft.productKey}
          onChange={(event) => onDraftChange({ ...draft, productKey: event.target.value })}
        />
        <select
          className="rounded-lg border border-slate-200 px-3 py-2"
          value={draft.kind}
          onChange={(event) => onDraftChange({ ...draft, kind: event.target.value as EntitlementDraft["kind"] })}
        >
          <option value="FEATURE">Feature flag</option>
          <option value="LIMIT">Numeric limit</option>
        </select>
      </div>
      <textarea
        className="w-full rounded-lg border border-slate-200 px-3 py-2"
        placeholder="Description"
        value={draft.description}
        onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
      />
      <input
        className="w-full rounded-lg border border-slate-200 px-3 py-2"
        placeholder="Unit and validation rules"
        value={draft.unit}
        onChange={(event) => onDraftChange({ ...draft, unit: event.target.value })}
      />
    </form>
  );
}

function FieldError({ children, error, id }: { children: React.ReactNode; error?: string; id: string }) {
  return (
    <div>
      {children}
      {error && (
        <p id={id} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function EntitlementDetails({ item }: { item: ControlEntitlementDefinition }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 p-4">
        <code className="font-mono text-sm font-semibold text-brand">{item.key}</code>
        <p className="mt-3 text-sm leading-6 text-slate-600">{item.description || "No description provided."}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs">
        {[
          ["Plans", item._count.planEntitlements],
          ["Active organizations", "-"],
          ["Overrides", item._count.overrides],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 p-3">
            <div className="text-xl font-bold text-slate-900">{value}</div>
            <div className="mt-1 text-[11px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
