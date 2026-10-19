"use client";

import { useEffect } from "react";
import {
    Headset,
    MoreHorizontal,
    Phone,
    PhoneOff,
    Video,
    X,
} from "lucide-react";
import type { ActiveCall } from "./WorkspaceCallProvider";
import { connectUsersById } from "@/mocks/connect";

type IncomingCallCardProps = {
    call: ActiveCall;
    onAccept: () => void;
    onDecline: () => void;
    onAcceptVideo?: () => void;
    onMoreOptions?: () => void;
};

export function useRingtone(ringing: boolean, volume = 0.99) {
    useEffect(() => {
        if (!ringing || typeof window === "undefined") return;

        const audio = new Audio("/media/caller_tune.mp3");
        audio.loop = true;
        audio.volume = Math.max(0, Math.min(1, volume));
        void audio.play().catch(() => {
            // Browsers can block audio until a user interacts with the page.
        });

        return () => {
            audio.pause();
            audio.currentTime = 0;
        };
    }, [ringing, volume]);
}

export function IncomingCallCard({
    call,
    onAccept,
    onDecline,
    onAcceptVideo,
    onMoreOptions,
}: IncomingCallCardProps) {
    const caller = connectUsersById[call.participantIds[0]];
    const callerName = call.peerName ?? caller?.displayName ?? call.conversationName;
    const titleId = `incoming-call-${call.id}`;
    const descriptionId = `incoming-call-description-${call.id}`;

    useRingtone(true, 1);

    const actionClassName =
        "flex h-10 min-w-0 items-center justify-center rounded-md " +
        "text-white transition-colors focus-visible:outline-none " +
        "focus-visible:ring-2 focus-visible:ring-brand " +
        "focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark";

    return (
        <section
            role="alertdialog"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="fixed bottom-5 right-5 z-[170] isolate w-[min(24rem,calc(100vw-2.5rem))] overflow-hidden rounded-lg border border-brand bg-brand-dark text-white shadow-2xl"
        >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark to-brand" />
                <Headset className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[46%] text-white/15 blur-[11px]" size={270} />
            </div>

            <header className="flex h-12 items-center gap-2 px-4">
                <span className="grid h-5 w-5 place-items-center text-white">
                    <Headset size={19} />
                </span>
                <span className="flex-1 text-xs font-semibold text-white/85">Dhriti Connect</span>
                {onMoreOptions ? (
                    <button type="button" onClick={onMoreOptions} aria-label="More call options" title="More call options" className="grid h-7 w-7 place-items-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                        <MoreHorizontal size={19} />
                    </button>
                ) : null}
                <button type="button" onClick={onDecline} aria-label="Decline and close incoming call" title="Decline and close" className="grid h-7 w-7 place-items-center rounded text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <X size={18} />
                </button>
            </header>

            <div className="flex flex-col items-center px-5 pb-5 pt-1">
                <div aria-hidden="true" className="grid h-[88px] w-[88px] place-items-center rounded-full border border-white/20 bg-brand shadow-lg">
                    <Headset size={59} className="text-white" />
                </div>
                <h2 id={titleId} title={callerName} className="mt-3 w-full truncate text-center text-[15px] font-semibold leading-5">{callerName}</h2>
                <p id={descriptionId} className="text-center text-sm leading-5 text-white/85">is calling you</p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
                <button type="button" onClick={onAcceptVideo ?? onAccept} aria-label="Accept with video" title="Accept with video" className={`${actionClassName} bg-brand-light hover:bg-brand active:bg-brand`}>
                    <Video size={23} />
                </button>
                <button type="button" onClick={onAccept} aria-label="Accept audio call" title="Accept audio call" className={`${actionClassName} bg-brand-light hover:bg-brand active:bg-brand`}>
                    <Phone size={22} />
                </button>
                <button type="button" onClick={onDecline} aria-label="Decline call" title="Decline call" className={`${actionClassName} bg-error hover:bg-error/90 active:bg-error`}>
                    <PhoneOff size={23} />
                </button>
            </div>
        </section>
    );
}