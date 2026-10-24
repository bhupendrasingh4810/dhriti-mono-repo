import { useCallback, useEffect, useState } from "react";
import { Hash, ImagePlus, X } from "lucide-react";
import { connectService } from "@/services/connect.service";

// 📝 Define structural types for managing form inputs cleanly
interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  pushSystemMessage: (msg: string) => void;
  closeSidebarMenus: () => void;
  organizationId: string;
  teamId: string;
  onCreated: () => Promise<void> | void;
}

export function CreateChannelDialog({
  open,
  onClose,
  pushSystemMessage,
  closeSidebarMenus,
  organizationId,
  teamId,
  onCreated,
}: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelType, setChannelType] = useState("standard");
  const [channelLayout, setChannelLayout] = useState("threads");
  const [channelImageUrl, setChannelImageUrl] = useState("");
  const [channelNameError, setChannelNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setChannelName("");
    setChannelDescription("");
    setChannelType("standard");
    setChannelLayout("threads");
    setChannelImageUrl("");
    setChannelNameError("");
    setSubmitError("");
  }, []);

  const closeDialog = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }

    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, closeDialog]);

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      setChannelNameError("Enter a channel name.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      await connectService.createChannel(organizationId, {
        name: channelName.trim(),
        slug: channelName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
        teamId,
        visibility: channelType === "private" ? "PRIVATE" : "PUBLIC",
        layout: channelLayout.toUpperCase() as "THREADS" | "POSTS",
        description: channelDescription.trim() || undefined,
        imageUrl: channelImageUrl || undefined,
      });
      pushSystemMessage(`Created channel ${channelName.trim()} with ${channelLayout} layout.`);
      await onCreated();
      resetForm();
      closeSidebarMenus();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create the channel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  async function handleChannelImageChange(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setSubmitError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSubmitError("Channel images must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setSubmitError("Unable to read the selected channel image.");
        return;
      }
      setChannelImageUrl(reader.result);
      setSubmitError("");
    };
    reader.onerror = () => setSubmitError("Unable to read the selected channel image.");
    reader.readAsDataURL(file);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={closeDialog}>
      <section
        aria-modal="true"
        aria-labelledby="create-channel-title"
        role="dialog"
        className="h-[min(640px,calc(100vh-2rem))] w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-full flex-col md:flex-row">
          <aside className="flex shrink-0 basis-[30%] flex-col bg-brand p-6 text-white">
            <Hash size={32} aria-hidden="true" />
            <h3 className="mt-5 text-lg font-bold">Make space for work</h3>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Channels focus conversations around a topic, project, or audience.
            </p>
            <p className="mt-5 text-sm leading-6 text-white/85">
              Choose the channel type and layout that best fits how people will contribute.
            </p>
          </aside>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateChannel();
            }}
            className="flex min-h-0 basis-[70%] flex-col"
          >
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6">
              <div>
                <h2 id="create-channel-title" className="font-display text-lg font-bold text-text-primary">
                  Create a channel
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Choose a clear name and the right conversation format.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close create channel dialog"
                title="Close"
                onClick={closeDialog}
                className="grid h-8 w-8 shrink-0 place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-5">
              <Field label="Channel name" required error={channelNameError} errorId="channel-name-error">
                <input
                  autoFocus
                  required
                  value={channelName}
                  placeholder="e.g. Product updates"
                  aria-invalid={Boolean(channelNameError)}
                  aria-describedby={channelNameError ? "channel-name-error" : undefined}
                  onChange={(event) => {
                    setChannelName(event.target.value);
                    setChannelNameError("");
                  }}
                  className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors ${channelNameError ? "border-error ring-1 ring-error/30 focus:border-error focus:ring-2 focus:ring-error/20" : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"}`}
                />
              </Field>
              <Field label="Channel image">
                <div className="flex items-center gap-3">
                  {channelImageUrl ? (
                    <img src={channelImageUrl} alt="Selected channel" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-surface-raised text-brand">
                      <ImagePlus size={20} aria-hidden="true" />
                    </span>
                  )}
                  <label className="cursor-pointer rounded border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised">
                    {channelImageUrl ? "Replace image" : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      onChange={(event) => void handleChannelImageChange(event.target.files?.[0])}
                    />
                  </label>
                  {channelImageUrl ? (
                    <button
                      type="button"
                      onClick={() => setChannelImageUrl("")}
                      className="text-sm font-semibold text-text-secondary hover:text-text-primary"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-text-secondary">JPEG, PNG, WebP, or GIF up to 2 MB.</p>
              </Field>
              <Field label="Description">
                <textarea
                  value={channelDescription}
                  placeholder="What will this channel be used for?"
                  rows={3}
                  onChange={(event) => setChannelDescription(event.target.value)}
                  className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </Field>
              <Field label="Channel type">
                <select
                  value={channelType}
                  onChange={(event) => setChannelType(event.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="standard">Standard</option>
                  <option value="private">Private</option>
                  <option value="announcement">Announcement</option>
                </select>
              </Field>
              <fieldset>
                <legend className="text-sm font-semibold text-text-primary">Layout</legend>
                <p className="mt-1 text-sm text-text-secondary">Channel owners can change this at any time.</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="channel-layout"
                      value="threads"
                      checked={channelLayout === "threads"}
                      onChange={(event) => setChannelLayout(event.target.value)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-lg border border-border bg-surface p-2.5 shadow-sm transition-colors hover:border-brand/50 peer-checked:border-brand peer-checked:bg-brand/5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2">
                      <ChannelLayoutPreview layout="threads" />
                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary">Threads</span>
                        <ChannelLayoutRadio checked={channelLayout === "threads"} />
                      </span>
                      <span className="mt-0.5 block text-xs leading-4 text-text-secondary">
                        Chat with side replies for back-and-forth discussions.
                      </span>
                    </span>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="channel-layout"
                      value="posts"
                      checked={channelLayout === "posts"}
                      onChange={(event) => setChannelLayout(event.target.value)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-lg border border-border bg-surface p-2.5 shadow-sm transition-colors hover:border-brand/50 peer-checked:border-brand peer-checked:bg-brand/5 peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2">
                      <ChannelLayoutPreview layout="posts" />
                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary">Posts</span>
                        <ChannelLayoutRadio checked={channelLayout === "posts"} />
                      </span>
                      <span className="mt-0.5 block text-xs leading-4 text-text-secondary">
                        Posts reorder by most recent reply. Good for forums and announcements.
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>
              {submitError ? (
                <p role="alert" className="text-sm text-error">
                  {submitError}
                </p>
              ) : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !teamId}
                className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create channel"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function ChannelLayoutRadio({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${checked ? "border-brand" : "border-border-strong"}`}
    >
      {checked ? <span className="h-3 w-3 rounded-full bg-brand" /> : null}
    </span>
  );
}

function ChannelLayoutPreview({ layout }: { layout: "threads" | "posts" }) {
  return (
    <span
      aria-hidden="true"
      className="relative block aspect-[2.2] overflow-hidden rounded border-2 border-border-strong bg-surface"
    >
      {layout === "threads" ? (
        <>
          <span className="absolute inset-y-0 right-0 w-1/4 border-l border-border bg-surface-raised" />
          <span className="absolute left-[8%] top-[18%] h-[13%] w-[36%] rounded-sm bg-surface-raised" />
          <span className="absolute left-[8%] top-[37%] h-[12%] w-[26%] rounded-sm bg-surface-raised" />
          <span className="absolute left-[42%] top-[56%] h-[13%] w-[34%] rounded-sm bg-brand" />
          <span className="absolute left-[8%] top-[74%] h-[12%] w-[30%] rounded-sm bg-surface-raised" />
          <span className="absolute right-[8%] top-[18%] h-[17%] w-[16%] rounded-sm bg-brand" />
          <span className="absolute right-[8%] top-[45%] h-[17%] w-[16%] rounded-sm bg-border-strong" />
          <span className="absolute left-[4%] top-[18%] h-1.5 w-1.5 rounded-full bg-border-strong" />
          <span className="absolute left-[4%] top-[74%] h-1.5 w-1.5 rounded-full bg-border-strong" />
        </>
      ) : (
        <span className="absolute inset-x-[22%] inset-y-[10%] flex flex-col gap-[7%]">
          <span className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm bg-surface-raised">
            <span className="flex h-1/4 items-center gap-1 bg-brand px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-surface" />
            </span>
            <span className="ml-3 mt-1 h-1 w-2/3 rounded-full bg-border-strong" />
            <span className="ml-3 mt-1 h-1 w-1/2 rounded-full bg-border-strong" />
          </span>
          <span className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm bg-surface-raised">
            <span className="flex h-1/4 items-center gap-1 bg-brand px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-surface" />
            </span>
          </span>
        </span>
      )}
    </span>
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
