import { useCallback, useEffect, useState } from "react";
import { Hash, X } from "lucide-react";
import { connectService } from "@/services/connect.service";

// 📝 Define structural types for managing form inputs cleanly
interface CreateChannelModalProps {
  open: boolean;
  onClose: () => void;
  pushSystemMessage: (msg: string) => void;
  closeSidebarMenus: () => void;
  organizationId: string;
  teams: Array<{ id: string; name: string }>;
  onCreated: () => Promise<void> | void;
}

export function CreateChannelDialog({ open, onClose, pushSystemMessage, closeSidebarMenus, organizationId, teams, onCreated }: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelType, setChannelType] = useState("standard");
  const [channelLayout, setChannelLayout] = useState("threads");
  const [channelNameError, setChannelNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setChannelName("");
    setTeamId("");
    setChannelDescription("");
    setChannelType("standard");
    setChannelLayout("threads");
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
    if (!teamId) {
      setSubmitError("Select a team for this channel.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      await connectService.createChannel(organizationId, {
        name: channelName.trim(),
        slug: channelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        teamId,
        visibility: channelType === "private" ? "PRIVATE" : "PUBLIC",
        topic: channelLayout,
        description: channelDescription.trim() || undefined,
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" onMouseDown={closeDialog}>
      <section aria-modal="true" aria-labelledby="create-channel-title" role="dialog" className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex min-h-[480px] flex-col md:flex-row">
          <aside className="flex basis-[30%] flex-col bg-brand p-6 text-white"><Hash size={32} aria-hidden="true" /><h3 className="mt-5 text-lg font-bold">Make space for work</h3><p className="mt-3 text-sm leading-6 text-white/85">Channels focus conversations around a topic, project, or audience.</p><p className="mt-5 text-sm leading-6 text-white/85">Choose the channel type and layout that best fits how people will contribute.</p></aside>
          <form noValidate onSubmit={(event) => { event.preventDefault(); void handleCreateChannel(); }} className="flex basis-[70%] flex-col p-6">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4"><div><h2 id="create-channel-title" className="font-display text-lg font-bold text-text-primary">Create a channel</h2><p className="mt-1 text-sm text-text-secondary">Choose a clear name and the right conversation format.</p></div><button type="button" aria-label="Close create channel dialog" title="Close" onClick={closeDialog} className="grid h-8 w-8 shrink-0 place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"><X size={18} /></button></div>
              <Field label="Channel name" required error={channelNameError} errorId="channel-name-error"><input autoFocus required value={channelName} placeholder="e.g. Product updates" aria-invalid={Boolean(channelNameError)} aria-describedby={channelNameError ? "channel-name-error" : undefined} onChange={(event) => { setChannelName(event.target.value); setChannelNameError(""); }} className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors ${channelNameError ? "border-error ring-1 ring-error/30 focus:border-error focus:ring-2 focus:ring-error/20" : "border-border focus:border-brand focus:ring-2 focus:ring-brand/20"}`} /></Field>
              <Field label="Team" required><select required value={teamId} onChange={(event) => { setTeamId(event.target.value); setSubmitError(""); }} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"><option value="" disabled>Select a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field>
              <Field label="Description"><textarea value={channelDescription} placeholder="What will this channel be used for?" rows={3} onChange={(event) => setChannelDescription(event.target.value)} className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20" /></Field>
              <Field label="Channel type"><select value={channelType} onChange={(event) => setChannelType(event.target.value)} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"><option value="standard">Standard</option><option value="private">Private</option><option value="announcement">Announcement</option></select></Field>
              <fieldset><legend className="mb-1.5 text-sm font-semibold text-text-primary">Layout</legend><div className="flex gap-5"><label className="flex items-center gap-2 text-sm text-text-secondary"><input type="radio" name="channel-layout" value="threads" checked={channelLayout === "threads"} onChange={(event) => setChannelLayout(event.target.value)} className="accent-brand" />Threads</label><label className="flex items-center gap-2 text-sm text-text-secondary"><input type="radio" name="channel-layout" value="posts" checked={channelLayout === "posts"} onChange={(event) => setChannelLayout(event.target.value)} className="accent-brand" />Posts</label></div></fieldset>
              {submitError ? <p role="alert" className="text-sm text-error">{submitError}</p> : null}
            </div>
            <div className="mt-auto flex items-center justify-end gap-2 pt-6"><button type="button" onClick={closeDialog} className="rounded border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised">Cancel</button><button type="submit" disabled={isSubmitting || teams.length === 0} className="rounded bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Creating..." : "Create channel"}</button></div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ children, error, errorId, label, required = false }: { children: React.ReactNode; error?: string; errorId?: string; label: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-text-primary">{label}{required ? <span className="text-error"> *</span> : null}</span>{children}{error ? <span id={errorId} role="alert" className="mt-1 block text-xs text-error">{error}</span> : null}</label>;
}
