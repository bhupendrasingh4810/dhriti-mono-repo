import { useEffect, useState } from "react";
import { FolderPlus, X } from "lucide-react";

export function CreateSectionDialog({
  createSectionOpen,
  setCreateSectionOpen,
  pushSystemMessage,
  closeSidebarMenus,
}: {
  createSectionOpen: boolean;
  setCreateSectionOpen: (open: boolean) => void;
  pushSystemMessage: (message: string) => void;
  closeSidebarMenus: () => void;
}) {
  const [sectionEmoji, setSectionEmoji] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionNameError, setSectionNameError] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }

    if (createSectionOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createSectionOpen]);

  function closeDialog() {
    setCreateSectionOpen(false);
    setSectionEmoji("");
    setSectionName("");
    setSectionNameError("");
  }

  function handleSubmit() {
    if (!sectionName.trim()) {
      setSectionNameError("Enter a section name.");
      return;
    }

    pushSystemMessage(`Created section ${sectionEmoji ? `${sectionEmoji} ` : ""}${sectionName.trim()}.`);
    closeDialog();
    closeSidebarMenus();
  }

  if (!createSectionOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={closeDialog}>
      <section
        aria-modal="true"
        aria-labelledby="create-section-title"
        role="dialog"
        className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex min-h-[400px] flex-col md:flex-row">
          <aside className="flex basis-[30%] flex-col bg-brand p-6 text-white">
            <FolderPlus size={32} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-bold">Keep work organized</h3>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Sections group related channels so your team can find the right conversations quickly.
            </p>
            <p className="mt-5 text-sm leading-6 text-white/85">
              Use a concise name that makes the purpose of this group clear.
            </p>
          </aside>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
            className="flex basis-[70%] flex-col p-6"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="create-section-title" className="font-display text-lg font-bold text-text-primary">
                    Create a section
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">Group channels around a shared area of work.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close create section dialog"
                  title="Close"
                  onClick={closeDialog}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>
              <Field label="Emoji">
                <input
                  value={sectionEmoji}
                  placeholder="e.g. Projects"
                  onChange={(event) => setSectionEmoji(event.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </Field>
              <Field label="Section name" required error={sectionNameError} errorId="section-name-error">
                <input
                  autoFocus
                  required
                  value={sectionName}
                  placeholder="e.g. Product launch"
                  aria-invalid={Boolean(sectionNameError)}
                  aria-describedby={sectionNameError ? "section-name-error" : undefined}
                  onChange={(event) => {
                    setSectionName(event.target.value);
                    setSectionNameError("");
                  }}
                  className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors ${sectionNameError ? "border-error ring-1 ring-error/30 focus:border-error focus:ring-2 focus:ring-error/20" : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"}`}
                />
              </Field>
            </div>
            <div className="mt-auto flex items-center justify-end gap-2 pt-6">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Create section
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({
  children,
  error,
  errorId,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  errorId?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-text-primary">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span id={errorId} role="alert" className="mt-1 block text-xs text-error">
          {error}
        </span>
      ) : null}
    </label>
  );
}
