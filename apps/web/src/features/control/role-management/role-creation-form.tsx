"use client";

import { DhritiButton, DhritiTextField } from "@dhriti/ui";

import { type FormEvent, useState } from "react";
import { X } from "lucide-react";

export function RoleCreationForm({
  noun,
  includeKey,
  isOpen,
  onClose,
  onCreate,
}: {
  noun: string;
  includeKey: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; key?: string; description?: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; key?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      ...(name.trim() ? {} : { name: "Name is required." }),
      ...(includeKey && !key.trim() ? { key: "Key is required." } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSaving(true);
    try {
      const created = await onCreate({
        name: name.trim(),
        key: key.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (!created) return;
      setName("");
      setKey("");
      setDescription("");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/35" onMouseDown={onClose}>
      <section
        aria-modal="true"
        aria-labelledby="create-role-title"
        role="dialog"
        className="flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 id="create-role-title" className="text-lg font-semibold text-text-primary">
              Create {noun.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">Define the role details before configuring its access.</p>
          </div>
          <DhritiButton
            variant="secondary"
            type="button"
            onClick={onClose}
            className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !p-2 !text-text-secondary hover:!bg-surface-raised"
            aria-label={`Close create ${noun.toLowerCase()} drawer`}
            title="Close"
          >
            <X aria-hidden="true" size={18} />
          </DhritiButton>
        </div>
        <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void submit(event)}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 md:grid-cols-2">
            <DhritiTextField label="Name" required value={name} onChange={setName} error={errors.name} />
            {includeKey ? (
              <DhritiTextField label="Key" required value={key} onChange={setKey} error={errors.key} />
            ) : null}
            <div className={includeKey ? "md:col-span-2" : ""}>
              <DhritiTextField label="Description" value={description} onChange={setDescription} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border p-6">
            <DhritiButton
              variant="secondary"
              type="button"
              onClick={onClose}
              className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !px-3 !py-2 !text-sm !text-text-secondary hover:!bg-surface-raised"
            >
              Cancel
            </DhritiButton>
            <DhritiButton
              variant="primary"
              type="submit"
              disabled={isSaving}
              className="!min-h-0 !shadow-none !border-0 !gap-0 cursor-pointer !rounded-md !bg-brand !px-3 !py-2 !text-sm !font-semibold !text-text-inverse disabled:cursor-not-allowed disabled:opacity-60 hover:!bg-brand"
            >
              {isSaving ? "Creating…" : `Create ${noun}`}
            </DhritiButton>
          </div>
        </form>
      </section>
    </div>
  );
}
