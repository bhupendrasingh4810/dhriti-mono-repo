import { useCallback, useEffect, useState } from "react";
import { UsersRound, X } from "lucide-react";
import { connectService } from "@/services/connect.service";

type RequiredField = "teamName" | "firstChannelName";

export function CreateTeamDialog({
  createTeamOpen,
  setCreateTeamOpen,
  pushSystemMessage,
  closeSidebarMenus,
  organizationId,
  onCreated,
}: {
  createTeamOpen: boolean;
  setCreateTeamOpen: (open: boolean) => void;
  pushSystemMessage: (message: string) => void;
  closeSidebarMenus: () => void;
  organizationId: string;
  onCreated: () => Promise<void> | void;
}) {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamVisibility, setTeamVisibility] = useState("public");
  const [teamFirstChannelName, setTeamFirstChannelName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const teamNameError = fieldErrors.teamName;
  const firstChannelNameError = fieldErrors.firstChannelName;
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTeamName("");
    setTeamDescription("");
    setTeamVisibility("public");
    setTeamFirstChannelName("");
    setFieldErrors({});
    setSubmitError("");
  }, []);

  const closeDialog = useCallback(() => {
    setCreateTeamOpen(false);
    resetForm();
  }, [resetForm, setCreateTeamOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }

    if (createTeamOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createTeamOpen, closeDialog]);

  function clearFieldError(field: RequiredField) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleSubmit() {
    const errors: Partial<Record<RequiredField, string>> = {};
    if (!teamName.trim()) errors.teamName = "Enter a team name.";
    if (!teamFirstChannelName.trim()) errors.firstChannelName = "Enter a first channel name.";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const team = await connectService.createTeam(organizationId, {
        name: teamName.trim(),
        slug: toSlug(teamName),
        description: teamDescription.trim() || undefined,
        visibility: teamVisibility === "private" ? "PRIVATE" : "PUBLIC",
      });
      await connectService.createChannel(organizationId, {
        name: teamFirstChannelName.trim(),
        slug: toSlug(teamFirstChannelName),
        teamId: team.id,
        visibility: teamVisibility === "private" ? "PRIVATE" : "PUBLIC",
        description: teamDescription.trim() || undefined,
      });
      pushSystemMessage(
        `Created ${teamVisibility} team ${teamName.trim()} with first channel ${teamFirstChannelName.trim()}.`,
      );
      await onCreated();
      closeDialog();
      closeSidebarMenus();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create the team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!createTeamOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={closeDialog}>
      <section
        aria-modal="true"
        aria-labelledby="create-team-title"
        role="dialog"
        className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex min-h-[480px] flex-col md:flex-row">
          <aside className="flex basis-[30%] flex-col bg-brand p-6 text-white">
            <UsersRound size={32} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-bold">Bring people together</h3>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Teams give your people a shared home for conversations, channels, files, and decisions.
            </p>
            <p className="mt-5 text-sm leading-6 text-white/85">
              Start with a clear name and one channel for the work your team will do first.
            </p>
          </aside>

          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
            className="flex basis-[70%] flex-col p-6"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="create-team-title" className="font-display text-lg font-bold text-text-primary">
                    Create a team
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Set up the essentials now. You can refine them later.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close create team dialog"
                  title="Close"
                  onClick={closeDialog}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <Field label="Team name" required error={teamNameError} errorId="team-name-error">
                <input
                  autoFocus
                  required
                  value={teamName}
                  placeholder="e.g. Product design"
                  aria-invalid={Boolean(teamNameError)}
                  aria-describedby={teamNameError ? "team-name-error" : undefined}
                  onChange={(event) => {
                    setTeamName(event.target.value);
                    clearFieldError("teamName");
                  }}
                  className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors ${teamNameError ? "border-error ring-1 ring-error/30 focus:border-error focus:ring-2 focus:ring-error/20" : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"}`}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={teamDescription}
                  placeholder="What is this team working on?"
                  onChange={(event) => setTeamDescription(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </Field>
              <Field label="Team type">
                <select
                  value={teamVisibility}
                  onChange={(event) => setTeamVisibility(event.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </Field>
              <Field
                label="First channel name"
                required
                error={firstChannelNameError}
                errorId="first-channel-name-error"
              >
                <input
                  required
                  value={teamFirstChannelName}
                  placeholder="e.g. General"
                  aria-invalid={Boolean(firstChannelNameError)}
                  aria-describedby={firstChannelNameError ? "first-channel-name-error" : undefined}
                  onChange={(event) => {
                    setTeamFirstChannelName(event.target.value);
                    clearFieldError("firstChannelName");
                  }}
                  className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors ${firstChannelNameError ? "border-error ring-1 ring-error/30 focus:border-error focus:ring-2 focus:ring-error/20" : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"}`}
                />
              </Field>
              {submitError ? (
                <p role="alert" className="text-sm text-error">
                  {submitError}
                </p>
              ) : null}
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
                disabled={isSubmitting}
                className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create team"}
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
