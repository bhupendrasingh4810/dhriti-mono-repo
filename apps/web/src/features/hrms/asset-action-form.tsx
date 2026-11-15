"use client";
import { useState } from "react";
import { DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { Dialog } from "@dhriti/ui/dialog";
import { z } from "@dhriti/validation";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

type Field = {
  key: string;
  label: string;
  required?: boolean;
  initial?: string;
  options?: { value: string; label: string }[];
};
/** Feature-local composition: shared fields supply consistent inline validation, not a workflow engine. */
export function AssetActionForm({
  title,
  fields,
  onSubmit,
  onClose,
  primaryLabel = "Save",
}: {
  title: string;
  fields: Field[];
  primaryLabel?: string;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, field.initial ?? ""])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const close = () => {
    if (busy) return;
    if (fields.some((field) => values[field.key] !== (field.initial ?? ""))) setDiscard(true);
    else onClose();
  };
  const save = async () => {
    const invalid = Object.fromEntries(
      fields
        .filter((field) => field.required && !values[field.key]?.trim())
        .map((field) => [field.key, `${field.label} is required.`]),
    );
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setBusy(true);
    setError("");
    setOpen(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (reason) {
      if (reason instanceof z.ZodError)
        setErrors(Object.fromEntries(reason.issues.map((issue) => [issue.path.join("."), issue.message])));
      else setError(reason instanceof Error ? reason.message : "Unable to save asset operation.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Dialog
        open
        title={title}
        onClose={close}
        onPrimaryAction={save}
        primaryActionLabel={primaryLabel}
        isSubmitting={busy}
      >
        <fieldset disabled={busy} className="space-y-4">
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          {fields.map((field) =>
            field.options ? (
              <DhritiSelectMenu
                key={field.key}
                label={field.label}
                required={field.required}
                value={values[field.key]}
                options={field.options}
                open={open === field.key}
                onOpenChange={(shown) => setOpen(shown ? field.key : null)}
                onChange={(value) => setValues((old) => ({ ...old, [field.key]: value ?? "" }))}
                error={errors[field.key]}
              />
            ) : (
              <DhritiTextField
                key={field.key}
                label={field.label}
                required={field.required}
                value={values[field.key] ?? ""}
                onChange={(value) => setValues((old) => ({ ...old, [field.key]: value }))}
                error={errors[field.key]}
                maxLength={5000}
              />
            ),
          )}
        </fieldset>
      </Dialog>
      <ConfirmationDialog
        open={discard}
        title="Discard unsaved changes?"
        description="Your unsaved asset operation will be lost."
        confirmLabel="Discard"
        onCancel={() => setDiscard(false)}
        onConfirm={onClose}
      />
    </>
  );
}
