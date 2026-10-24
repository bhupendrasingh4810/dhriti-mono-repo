import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BellOff, Copy, Ellipsis, ExternalLink, Info, MessagesSquare, Phone, Star, Trash2, Users, Video } from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import type { CallType, ConversationUser } from "@/types/connect.types";

type ConversationHeaderProps = {
  conversation: {
    id: string;
    name: string;
    type: "channel" | "direct" | "group";
    avatar?: string;
    isFavorite?: boolean;
    participants: string[];
  };
  teamLabel: string;
  usersById: Record<string, ConversationUser>;
  onOpenDetails: () => void;
  onStartCall: (type: CallType) => void;
  isChannelAdmin?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onDeleteChannel?: () => void;
  onOpenInNewTab?: () => void;
  actions?: ReactNode;
};

export function ConversationHeader({
  conversation,
  teamLabel,
  usersById,
  onOpenDetails,
  onStartCall,
  isChannelAdmin = false,
  isMuted = false,
  onToggleMute,
  onDeleteChannel,
  onOpenInNewTab,
  actions,
}: ConversationHeaderProps) {
  const [participantsAnchor, setParticipantsAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const participantsPopoverRef = useRef<HTMLDivElement>(null);

  const participants = useMemo(
    () =>
      conversation.participants.map((id) => usersById[id]).filter((user): user is ConversationUser => Boolean(user)),
    [conversation.participants, usersById],
  );

  useEffect(() => {
    if (!participantsAnchor) return;

    const closePopover = () => {
      setParticipantsAnchor(null);
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!participantsAnchor.contains(target) && !participantsPopoverRef.current?.contains(target)) {
        closePopover();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePopover();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [participantsAnchor]);

  const participantsAnchorRect = participantsAnchor?.getBoundingClientRect();

  function copyChannelLink() {
    void navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?conversation=${conversation.id}`);
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex min-w-0 items-center gap-3">
          {conversation.type === "channel" ? (
            conversation.avatar ? (
              <img src={conversation.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full border border-brand object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-raised text-brand">
                <MessagesSquare size={18} aria-hidden="true" />
              </span>
            )
          ) : (
            <span className="text-xl font-bold text-slate-400">@</span>
          )}
          <button
            type="button"
            onClick={onOpenDetails}
            className="truncate text-lg font-bold text-brand hover:text-brand-dark"
          >
            {conversation.name}
          </button>
          {conversation.isFavorite ? <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" /> : null}
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-2 text-xs text-slate-400">
            <span>{teamLabel}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{conversation.participants.length} members</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {actions}
          <button
            type="button"
            onClick={(event) => setParticipantsAnchor(event.currentTarget)}
            className="flex h-9 items-center gap-1 rounded-md px-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            aria-label="Show participants"
            title="Show participants"
          >
            <Users className="h-[18px] w-[18px]" />
            {conversation.participants.length}
          </button>
          <button
            type="button"
            onClick={() => onStartCall("video")}
            aria-label="Start video call"
            title="Start video call"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Video className="h-[22px] w-[22px]" />
          </button>
          <button
            type="button"
            onClick={() => onStartCall("audio")}
            aria-label="Start audio call"
            title="Start audio call"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Phone className="h-[22px] w-[22px]" />
          </button>
          {conversation.type === "channel" ? <button
            type="button"
            onClick={(event) => setMoreAnchor(event.currentTarget)}
            aria-label="More channel actions"
            title="More channel actions"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Ellipsis className="h-[22px] w-[22px]" />
          </button> : null}
        </div>
      </header>

      {conversation.type === "channel" ? <ConnectCascadingMenu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor)}
        onClose={() => setMoreAnchor(null)}
        minWidth={220}
        items={[
          { id: "channel-info", label: "Channel info", icon: <Info size={16} />, onClick: onOpenDetails },
          { id: "mute-channel", label: isMuted ? "Unmute channel" : "Mute channel", icon: <BellOff size={16} />, onClick: onToggleMute },
          { id: "copy-link", label: "Copy link", icon: <Copy size={16} />, onClick: copyChannelLink },
          { id: "open-new-tab", label: "Open in new tab", icon: <ExternalLink size={16} />, onClick: onOpenInNewTab },
          ...(isChannelAdmin && onDeleteChannel ? [{ id: "delete-channel", label: "Delete channel", icon: <Trash2 size={16} />, danger: true, dividerAbove: true, onClick: onDeleteChannel }] : []),
        ]}
      /> : null}

      {participantsAnchor && participantsAnchorRect ? (
        <div
          ref={participantsPopoverRef}
          className="fixed z-50 w-[340px] rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
          style={{
            left: Math.min(participantsAnchorRect.left, window.innerWidth - 356),
            top: participantsAnchorRect.bottom + 4,
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Channel members</p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {participants.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded px-1 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar avatar={user.avatar} name={user.displayName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.displayName}</p>
                    <p className="truncate text-xs text-slate-500">{user.jobTitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserAvatar({ avatar, name }: { avatar?: string; name: string }) {
  return avatar ? (
    <img src={avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
      {name.slice(0, 1)}
    </span>
  );
}
