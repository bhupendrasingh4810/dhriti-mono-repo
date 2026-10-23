"use client";

import type { RefObject } from "react";
import {
  ChevronDown,
  Grid2X2,
  Mic,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  ScreenShare,
  ShieldCheck,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { connectUsersById, connectSidebarState } from "@/mocks/connect";
import type { ActiveCall } from "@/types/connect.types";

type OutgoingCallSurfaceProps = {
  call: ActiveCall;
  viewerId: string;
  muted: boolean;
  cameraOn: boolean;
  hasVideoPreview: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onShare: () => void;
  onLeave: () => void;
};

export function OutgoingCallSurface({
  call,
  viewerId,
  muted,
  cameraOn,
  hasVideoPreview,
  videoRef,
  onToggleMicrophone,
  onToggleCamera,
  onShare,
  onLeave,
}: OutgoingCallSurfaceProps) {
  const currentUser = connectUsersById[connectSidebarState.currentUser];
  const recipientId = call.participantIds.find((participantId) => participantId !== viewerId);
  const recipient = recipientId ? connectUsersById[recipientId] : undefined;
  const recipientName = recipient?.displayName ?? call.conversationName;
  const initials = currentUser ? `${currentUser.firstName.slice(0, 1)}${currentUser.lastName.slice(0, 1)}` : "Y";
  const controlClassName =
    "flex min-w-[52px] flex-col items-center justify-center rounded-md px-2 py-1 text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
  const outcomeMessage =
    call.status === "unavailable"
      ? `${recipientName} is not available to receive your call. Try again later.`
      : call.status === "unanswered"
        ? `${recipientName} is not available to receive your call. Try again later.`
        : call.status === "declined"
          ? `${recipientName} declined your call.`
          : null;

  if (outcomeMessage) {
    return (
      <div
        className="fixed inset-0 z-[140] flex items-center justify-center bg-text-primary/35 p-4"
        role="presentation"
      >
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`outgoing-call-status-${call.id}`}
          className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 text-center text-text-primary shadow-2xl"
        >
          {recipient?.avatar ? (
            <img src={recipient.avatar} alt="" className="mx-auto h-24 w-24 rounded-full object-cover" />
          ) : (
            <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-brand-muted text-3xl font-semibold text-brand">
              {recipientName.slice(0, 1)}
            </span>
          )}
          <h2 id={`outgoing-call-status-${call.id}`} className="mt-5 text-lg font-semibold">
            Call ended
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{outcomeMessage}</p>
          <button
            type="button"
            onClick={onLeave}
            className="mt-6 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
        </section>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[140] flex flex-col bg-background text-text-primary"
      role="dialog"
      aria-modal="true"
      aria-label={`Calling ${call.conversationName}`}
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 shadow-sm">
        <div
          className="grid h-9 w-9 place-items-center rounded-md text-brand"
          aria-label="Call security enabled"
          title="Call security enabled"
        >
          <ShieldCheck size={18} />
        </div>
        <div className="flex h-full items-center gap-1">
          <button type="button" className={controlClassName} aria-label="People" title="People">
            <Users size={16} />
            <span className="mt-0.5 text-[11px] font-medium">People</span>
          </button>
          <button type="button" className={controlClassName} aria-label="Change view" title="Change view">
            <Grid2X2 size={16} />
            <span className="mt-0.5 text-[11px] font-medium">View</span>
          </button>
          <button type="button" className={controlClassName} aria-label="More call options" title="More call options">
            <MoreHorizontal size={16} />
            <span className="mt-0.5 text-[11px] font-medium">More</span>
          </button>
          <span className="mx-1 h-7 w-px bg-border" aria-hidden="true" />
          <div className="flex items-stretch rounded-md">
            <button
              type="button"
              onClick={onToggleCamera}
              className={controlClassName}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
              title={cameraOn ? "Turn camera off" : "Turn camera on"}
            >
              {cameraOn ? <Video className="text-brand" size={16} /> : <VideoOff size={16} />}
              <span className="mt-0.5 text-[11px] font-medium">Camera</span>
            </button>
            <span className="grid w-6 place-items-center border-l border-border text-text-secondary">
              <ChevronDown size={16} />
            </span>
          </div>
          <div className="flex items-stretch rounded-md border border-brand bg-surface shadow-sm">
            <button
              type="button"
              onClick={onToggleMicrophone}
              className={controlClassName}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              title={muted ? "Unmute microphone" : "Mute microphone"}
            >
              {muted ? <MicOff className="text-error" size={16} /> : <Mic className="text-text-primary" size={16} />}
              <span className="mt-0.5 text-[11px] font-semibold">Mic</span>
            </button>
            <span className="grid w-6 place-items-center border-l border-border text-text-secondary">
              <ChevronDown size={16} />
            </span>
          </div>
          <span className="mx-1 h-7 w-px bg-border" aria-hidden="true" />
          <div className="flex items-stretch rounded-md">
            <button
              type="button"
              onClick={onShare}
              className={controlClassName}
              aria-label="Share screen"
              title="Share screen"
            >
              <ScreenShare size={16} />
              <span className="mt-0.5 text-[11px] font-medium">Share</span>
            </button>
            <span className="grid w-6 place-items-center border-l border-border text-text-secondary">
              <ChevronDown size={16} />
            </span>
          </div>
          <button
            type="button"
            onClick={onLeave}
            className="ml-2 flex min-w-[54px] flex-col items-center justify-center rounded-md px-3 py-1 text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            aria-label="Cancel call"
            title="Cancel call"
          >
            <PhoneOff size={16} />
            <span className="mt-0.5 text-[11px] font-semibold">Leave</span>
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center bg-surface-raised p-6">
        {call.type === "video" && cameraOn && hasVideoPreview ? (
          <div className="relative h-full w-full overflow-hidden rounded-lg bg-text-primary">
            <div className="h-full w-full -scale-x-100">
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            </div>
            <span className="absolute bottom-4 left-4 rounded-md bg-text-primary/75 px-3 py-1 text-sm font-medium text-white">
              You{muted ? " · Muted" : ""}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="grid h-40 w-40 place-items-center rounded-full bg-brand-muted text-5xl font-semibold text-brand shadow-sm sm:h-48 sm:w-48 sm:text-6xl">
              {initials}
            </div>
            <p className="mt-6 text-base font-semibold">Calling {call.conversationName}</p>
            <p className="mt-1 text-sm text-text-secondary">Waiting for them to answer...</p>
          </div>
        )}
      </main>
    </div>
  );
}
