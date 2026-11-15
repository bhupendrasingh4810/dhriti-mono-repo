"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { DhritiCheckboxField, DhritiSelectMenu, DhritiTextareaField, DhritiTextField } from "@dhriti/ui";
import type { HrmsProfileFieldCatalog, HrmsProfileFieldDefinition } from "@dhriti/types";
import { updateHrmsProfileFieldCatalogSchema } from "@dhriti/validation";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { hrmsService } from "@/services/hrms.service";
import { Button } from "./components/ui-primitives";

/** Catalog edits affect future profile saves; existing values are preserved, not backfilled. */
export function HrmsProfileFields() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const { can } = usePermissions();
  const allowed = can("hrms.workforce.manage");
  const [saved, setSaved] = useState<HrmsProfileFieldCatalog | null>(null);
  const [definitions, setDefinitions] = useState<HrmsProfileFieldDefinition[]>([]);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    if (!organizationId || !allowed) return;
    let active = true;
    void hrmsService.employees
      .profileFields(organizationId)
      .then((catalog) => {
        if (active) {
          setSaved(catalog);
          setDefinitions(catalog.definitions);
          setError("");
          setErrors({});
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load profile fields.");
      });
    return () => {
      active = false;
    };
  }, [organizationId, allowed, retry]);
  const edit = (id: string, patch: Partial<HrmsProfileFieldDefinition>) => {
    setDefinitions((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));
    setErrors({});
    setStatus("");
  };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!saved || !organizationId || !allowed || busy) return;
    const parsed = updateHrmsProfileFieldCatalogSchema.safeParse({ definitions, version: saved.version });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      setError("Review the highlighted field definitions.");
      return;
    }
    setBusy(true);
    setOpen(null);
    setError("");
    setStatus("");
    try {
      const catalog = await hrmsService.employees.updateProfileFields(organizationId, parsed.data);
      setSaved(catalog);
      setDefinitions(catalog.definitions);
      setStatus("Organization profile fields saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save profile fields.");
    } finally {
      setBusy(false);
    }
  }
  if (!allowed)
    return (
      <p role="alert" className="text-sm text-error">
        Workforce management permission is required.
      </p>
    );
  if (!organizationId)
    return (
      <p role="alert" className="text-sm text-error">
        Select an organization to manage profile fields.
      </p>
    );
  const dirty = saved && JSON.stringify(definitions) !== JSON.stringify(saved.definitions);
  return (
    <form noValidate onSubmit={save} className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Employee profile fields</h1>
        <p className="mt-2 text-sm text-text-secondary">
          HR-only organization fields. Required policies apply on the next profile save; they do not overwrite existing
          records.
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Saved field types are immutable. Archive fields to hide them without deleting their stored values. Required
          checkboxes must be checked.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="text-sm text-success">
          {status}
        </p>
      )}
      {(!saved || error) && (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            if (!dirty || window.confirm("Discard unsaved field definitions and reload?")) {
              setSaved(null);
              setRetry((value) => value + 1);
            }
          }}
        >
          Reload profile fields
        </Button>
      )}
      {!saved && !error && (
        <p role="status" className="text-sm text-text-muted">
          Loading field definitions…
        </p>
      )}
      {saved && (
        <>
          {!definitions.length && <p className="text-sm text-text-muted">No organization fields defined.</p>}
          {definitions.map((field, index) => {
            const existing = saved.definitions.some((item) => item.id === field.id);
            return (
              <fieldset
                key={field.id}
                disabled={busy}
                className="space-y-3 rounded-lg border border-border bg-surface p-4"
              >
                <legend className="px-2 text-sm font-semibold text-text-primary">
                  Field {index + 1}
                  {field.archived ? " (archived)" : ""}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DhritiTextField
                    label={`Field ${index + 1} label`}
                    required
                    value={field.label}
                    onChange={(label) => edit(field.id, { label })}
                    error={errors[`definitions.${index}.label`]}
                  />
                  <DhritiSelectMenu
                    label={`Field ${index + 1} type`}
                    required
                    value={field.type}
                    disabled={busy || existing}
                    options={["text", "number", "date", "select", "checkbox"].map((type) => ({
                      value: type,
                      label: type.charAt(0).toUpperCase() + type.slice(1),
                    }))}
                    open={open === field.id}
                    onOpenChange={(shown) => setOpen(shown ? field.id : null)}
                    onChange={(type) => {
                      if (
                        type === "text" ||
                        type === "number" ||
                        type === "date" ||
                        type === "select" ||
                        type === "checkbox"
                      )
                        edit(field.id, { type, options: [] });
                    }}
                  />
                  {field.type === "select" && (
                    <DhritiTextareaField
                      label={`Field ${index + 1} options`}
                      required
                      helperText="One option per line. Removing options may require updating existing employee values."
                      value={field.options.join("\n")}
                      onChange={(value) => edit(field.id, { options: value.split("\n") })}
                      error={
                        errors[`definitions.${index}.options`] ??
                        Object.entries(errors).find(([key]) => key.startsWith(`definitions.${index}.options.`))?.[1]
                      }
                      rows={3}
                    />
                  )}
                  <DhritiCheckboxField
                    label={`Field ${index + 1} required`}
                    checked={field.required}
                    onChange={(required) => edit(field.id, { required })}
                  />
                  {existing ? (
                    <DhritiCheckboxField
                      label={`Field ${index + 1} archived`}
                      checked={field.archived}
                      onChange={(archived) => edit(field.id, { archived })}
                    />
                  ) : (
                    <button
                      type="button"
                      aria-label={`Remove field ${index + 1}`}
                      onClick={() => {
                        setDefinitions((current) => current.filter((item) => item.id !== field.id));
                        setErrors({});
                      }}
                      className="w-fit cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </fieldset>
            );
          })}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              disabled={busy || definitions.length >= 50}
              onClick={() => {
                setDefinitions((current) => [
                  ...current,
                  { id: crypto.randomUUID(), label: "", type: "text", required: false, archived: false, options: [] },
                ]);
                setStatus("");
              }}
            >
              Add organization field
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !dirty}
              onClick={() => {
                setDefinitions(saved.definitions);
                setErrors({});
                setError("");
                setStatus("");
              }}
            >
              Cancel changes
            </Button>
            <button
              type="submit"
              disabled={busy || !dirty}
              className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save field definitions"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
