"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DhritiDateField, DhritiEmailField, DhritiTextareaField, DhritiTextField } from "@dhriti/ui";
import { hrmsEmployeeProfileSchema, validateHrmsOrganizationFields } from "@dhriti/validation";
import type { HrmsEmployeeProfile, HrmsEmployeeProfileResponse } from "@dhriti/types";
import { hrmsService } from "@/services/hrms.service";
import { Button } from "../components/ui-primitives";
import { OrganizationProfileFields } from "./organization-profile-fields";

const personalFields = [
  ["preferredName", "Preferred name"],
  ["personalEmail", "Personal email"],
  ["phone", "Phone number"],
  ["emergencyContactName", "Emergency contact name"],
  ["emergencyContactPhone", "Emergency contact phone"],
  ["emergencyContactRelation", "Emergency contact relationship"],
] as const;

/** Edits only tenant-local data; identity/job changes continue through the workforce employee form. */
export function EmployeePersonalProfile({
  organizationId,
  employeeId,
  onDirtyChange,
}: {
  organizationId: string;
  employeeId: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [saved, setSaved] = useState<HrmsEmployeeProfileResponse | null>(null);
  const [draft, setDraft] = useState<HrmsEmployeeProfile>(() => hrmsEmployeeProfileSchema.parse({}));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retry, setRetry] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState("");
  useEffect(() => {
    onDirtyChange?.(editing && saved !== null && JSON.stringify(draft) !== JSON.stringify(saved.profile));
  }, [draft, editing, saved, onDirtyChange]);

  useEffect(() => {
    let active = true;
    void hrmsService.employees
      .profile(organizationId, employeeId)
      .then((result) => {
        if (!active) return;
        setSaved(result);
        setDraft(result.profile);
        setError("");
        setErrors({});
        setEditing(false);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load employee profile.");
      });
    return () => {
      active = false;
    };
  }, [organizationId, employeeId, retry]);

  function update<K extends keyof HrmsEmployeeProfile>(key: K, value: HrmsEmployeeProfile[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors({});
    setStatus("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!saved || busy) return;
    // Normalize only active numeric drafts; archived values remain byte-for-byte historical.
    const organizationFields = draft.organizationFields && { ...draft.organizationFields };
    for (const field of saved.catalog.definitions) {
      const value = organizationFields?.[field.id];
      if (!field.archived && field.type === "number" && typeof value === "string" && organizationFields) {
        organizationFields[field.id] =
          value.trim() === "" ? null : Number.isFinite(Number(value)) ? Number(value) : value;
      }
    }
    const parsed = hrmsEmployeeProfileSchema.safeParse({ ...draft, organizationFields });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      setError("Review the highlighted profile fields.");
      return;
    }
    const fieldErrors = validateHrmsOrganizationFields(saved.catalog.definitions, parsed.data.organizationFields ?? {});
    if (Object.keys(fieldErrors).length) {
      setErrors(
        Object.fromEntries(Object.entries(fieldErrors).map(([id, message]) => [`organizationFields.${id}`, message])),
      );
      setError("Review the highlighted organization fields.");
      return;
    }
    setBusy(true);
    setDateOpen(false);
    setError("");
    try {
      const result = await hrmsService.employees.updateProfile(organizationId, employeeId, {
        profile: parsed.data,
        version: saved.version,
        catalogVersion: saved.catalog.version,
      });
      setSaved(result);
      setDraft(result.profile);
      setEditing(false);
      setStatus("Employee profile saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save employee profile.");
    } finally {
      setBusy(false);
    }
  }
  if (!saved)
    return (
      <div className="space-y-3">
        {error ? (
          <>
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
            <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
              Retry profile
            </Button>
          </>
        ) : (
          <p role="status" className="text-sm text-text-secondary">
            Loading employee profile…
          </p>
        )}
      </div>
    );

  return (
    <form noValidate onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Personal profile</h3>
          <p className="text-xs text-text-secondary">Private to this organization. Account identity is unchanged.</p>
        </div>
        {!editing && (
          <Button
            variant="secondary"
            onClick={() => {
              setEditing(true);
              setStatus("");
            }}
          >
            Edit personal profile
          </Button>
        )}
      </div>
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setSaved(null);
              setRetry((value) => value + 1);
            }}
          >
            Reload saved profile
          </Button>
          <p className="text-xs text-text-secondary">Reload discards unsaved changes.</p>
        </div>
      )}
      {status && (
        <p role="status" className="text-sm text-success">
          {status}
        </p>
      )}
      <fieldset disabled={busy} className="space-y-4">
        <legend className="mb-3 text-sm font-semibold text-text-primary">Personal and emergency contact details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {personalFields.map(([key, label]) => {
            const Field = key === "personalEmail" ? DhritiEmailField : DhritiTextField;
            return (
              <Field
                key={key}
                label={label}
                value={draft[key]}
                onChange={(value) => update(key, value)}
                readOnly={!editing}
                disabled={busy}
                error={errors[key]}
              />
            );
          })}
          <DhritiDateField
            label="Date of birth"
            value={draft.dateOfBirth}
            onChange={(value) => update("dateOfBirth", value)}
            month={month}
            onMonthChange={setMonth}
            open={dateOpen}
            onOpenChange={setDateOpen}
            clearable
            max={new Date().toISOString().slice(0, 10)}
            readOnly={!editing}
            disabled={busy}
            error={errors.dateOfBirth}
          />
          <DhritiTextareaField
            label="Address"
            value={draft.address}
            onChange={(value) => update("address", value)}
            readOnly={!editing}
            disabled={busy}
            error={errors.address}
            rows={3}
          />
        </div>
      </fieldset>
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-text-primary">Skills</legend>
        {!draft.skills.length && <p className="text-sm text-text-muted">No skills added.</p>}
        {draft.skills.map((skill, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <DhritiTextField
                label={`Skill ${index + 1}`}
                required
                value={skill}
                onChange={(value) =>
                  update(
                    "skills",
                    draft.skills.map((item, position) => (position === index ? value : item)),
                  )
                }
                readOnly={!editing}
                disabled={busy}
                error={errors[`skills.${index}`]}
              />
            </div>
            {editing && (
              <button
                type="button"
                aria-label={`Remove skill ${index + 1}`}
                disabled={busy}
                onClick={() =>
                  update(
                    "skills",
                    draft.skills.filter((_, position) => position !== index),
                  )
                }
                className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised disabled:cursor-not-allowed"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {editing && (
          <Button
            variant="secondary"
            disabled={busy || draft.skills.length >= 50}
            onClick={() => update("skills", [...draft.skills, ""])}
          >
            <Plus size={16} aria-hidden="true" /> Add skill
          </Button>
        )}
      </fieldset>
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-text-primary">Additional employee fields</legend>
        <p className="text-xs text-text-secondary">
          Optional employee-specific text fields, up to 50. Organization policies are managed separately below.
        </p>
        {!draft.customFields.length && <p className="text-sm text-text-muted">No custom fields added.</p>}
        {draft.customFields.map((field, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <DhritiTextField
                label={`Field ${index + 1} name`}
                required
                value={field.name}
                readOnly={!editing}
                disabled={busy}
                error={errors[`customFields.${index}.name`]}
                onChange={(name) =>
                  update(
                    "customFields",
                    draft.customFields.map((item, position) => (position === index ? { ...item, name } : item)),
                  )
                }
              />
              <DhritiTextareaField
                label={`Field ${index + 1} value`}
                value={field.value}
                readOnly={!editing}
                disabled={busy}
                rows={2}
                error={errors[`customFields.${index}.value`]}
                onChange={(value) =>
                  update(
                    "customFields",
                    draft.customFields.map((item, position) => (position === index ? { ...item, value } : item)),
                  )
                }
              />
            </div>
            {editing && (
              <button
                type="button"
                aria-label={`Remove custom field ${index + 1}`}
                disabled={busy}
                onClick={() =>
                  update(
                    "customFields",
                    draft.customFields.filter((_, position) => position !== index),
                  )
                }
                className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised disabled:cursor-not-allowed"
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
        {editing && (
          <Button
            variant="secondary"
            disabled={busy || draft.customFields.length >= 50}
            onClick={() => update("customFields", [...draft.customFields, { name: "", value: "" }])}
          >
            <Plus size={16} aria-hidden="true" /> Add custom field
          </Button>
        )}
      </fieldset>
      <OrganizationProfileFields
        definitions={saved.catalog.definitions}
        values={draft.organizationFields ?? {}}
        onChange={(values) => update("organizationFields", values)}
        readOnly={!editing}
        disabled={busy}
        errors={Object.fromEntries(
          Object.entries(errors)
            .filter(([key]) => key.startsWith("organizationFields."))
            .map(([key, value]) => [key.slice("organizationFields.".length), value]),
        )}
      />
      {editing && (
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setDraft(saved.profile);
              setEditing(false);
              setErrors({});
              setError("");
              setDateOpen(false);
            }}
          >
            Cancel changes
          </Button>
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save personal profile"}
          </button>
        </div>
      )}
    </form>
  );
}
