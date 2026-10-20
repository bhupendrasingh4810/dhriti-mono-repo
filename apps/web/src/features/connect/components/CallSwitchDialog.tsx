"use client";

interface CallSwitchDialogProps {
    open: boolean;
    onCancel: () => void;
    onDisconnectCurrent: () => void;
    onKeepOnHold: () => void;
}

export function CallSwitchDialog({ open, onCancel, onDisconnectCurrent, onKeepOnHold }: CallSwitchDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/40 p-4" role="presentation">
            <section role="alertdialog" aria-modal="true" aria-labelledby="switch-call-title" className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-text-primary shadow-2xl">
                <h2 id="switch-call-title" className="text-lg font-semibold">You’re already in a call</h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">Keep your current call on hold, or disconnect it before starting the new call?</p>
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised">Cancel</button>
                    <button type="button" onClick={onDisconnectCurrent} className="rounded-md border border-error px-3 py-2 text-sm font-semibold text-error hover:bg-error/10">Disconnect current</button>
                    <button type="button" onClick={onKeepOnHold} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Keep on hold</button>
                </div>
            </section>
        </div>
    );
}