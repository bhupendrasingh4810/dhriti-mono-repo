"use client";

import type { ActiveCall } from "@/types/connect.types";

interface CallAvailableCardProps {
    call: ActiveCall;
    onJoin: () => void;
    onDismiss: () => void;
}

export function CallAvailableCard({ call, onJoin, onDismiss }: CallAvailableCardProps) {
    return (
        <aside className="fixed bottom-4 right-4 z-[140] w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-4 text-text-primary shadow-xl" role="status">
            <p className="text-sm font-semibold">{call.peerName ?? "Someone"} started a {call.type} call</p>
            <p className="mt-1 text-sm text-text-secondary">{call.conversationName}</p>
            <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={onDismiss} className="rounded-md px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-raised">Dismiss</button>
                <button type="button" onClick={onJoin} className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Join</button>
            </div>
        </aside>
    );
}