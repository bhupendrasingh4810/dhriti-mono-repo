import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Ellipsis, MessagesSquare, Phone, Star, UserMinus, UserPlus, Users, Video } from "lucide-react";
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
  currentUserId: string;
  usersById: Record<string, ConversationUser>;
  onOpenDetails: () => void;
  onStartCall: (type: CallType) => void;
  onAddParticipant: (userId: string) => void;
  onRemoveParticipant: (userId: string) => void;
  actions?: ReactNode;
};

export function ConversationHeader({
  conversation,
  teamLabel,
  currentUserId,
  usersById,
  onOpenDetails,
  onStartCall,
  onAddParticipant,
  onRemoveParticipant,
  actions,
}: ConversationHeaderProps) {
  const [participantsAnchor, setParticipantsAnchor] = useState<HTMLElement | null>(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const participantsPopoverRef = useRef<HTMLDivElement>(null);

  const participants = useMemo(
    () =>
      conversation.participants.map((id) => usersById[id]).filter((user): user is ConversationUser => Boolean(user)),
    [conversation.participants, usersById],
  );

  const addableUsers = useMemo(() => {
    const set = new Set(conversation.participants);
    return Object.values(usersById)
      .filter((user) => !set.has(user.id))
      .filter((user) => user.displayName.toLowerCase().includes(participantSearch.toLowerCase()))
      .slice(0, 8);
  }, [conversation.participants, participantSearch, usersById]);

  function handleAddParticipant(userId: string) {
    onAddParticipant(userId);
  }

  function handleRemoveParticipant(userId: string) {
    onRemoveParticipant(userId);
  }

  useEffect(() => {
    if (!participantsAnchor) return;

    const closePopover = () => {
      setParticipantsAnchor(null);
      setParticipantSearch("");
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

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex min-w-0 items-center gap-3">
          {conversation.type === "channel" ? (
            conversation.avatar ? (
              <img src={conversation.avatar} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-raised text-brand">
                <MessagesSquare size={16} aria-hidden="true" />
              </span>
            )
          ) : (
            <span className="text-xl font-bold text-slate-400">@</span>
          )}
          <button
            type="button"
            onClick={onOpenDetails}
            className="truncate text-lg font-bold text-slate-900 hover:text-emerald-700"
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
          {conversation.type !== "channel" && (
            <button
              type="button"
              onClick={(event) => setParticipantsAnchor(event.currentTarget)}
              className="flex h-9 items-center gap-1 rounded-md px-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              aria-label="Manage participants"
            >
              <Users className="h-[18px] w-[18px]" />
              {conversation.participants.length}
            </button>
          )}
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
          <button
            type="button"
            aria-label="More conversation actions"
            title="More conversation actions"
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <Ellipsis className="h-[22px] w-[22px]" />
          </button>
        </div>
      </header>

      {participantsAnchor && participantsAnchorRect ? (
        <div
          ref={participantsPopoverRef}
          className="fixed z-50 w-[340px] rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
          style={{
            left: Math.min(participantsAnchorRect.left, window.innerWidth - 356),
            top: participantsAnchorRect.bottom + 4,
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Participants</p>
          <input
            type="search"
            placeholder="Search user to add"
            value={participantSearch}
            onChange={(event) => setParticipantSearch(event.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600"
          />

          <p className="mb-1.5 mt-4 text-xs font-bold text-slate-400">In this conversation</p>
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
                {user.id !== currentUserId ? (
                  <button
                    type="button"
                    aria-label={`Remove ${user.displayName}`}
                    title={`Remove ${user.displayName}`}
                    onClick={() => handleRemoveParticipant(user.id)}
                    className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <p className="mb-1.5 mt-4 text-xs font-bold text-slate-400">Add more users</p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {addableUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleAddParticipant(user.id)}
                className="flex cursor-pointer items-center justify-between rounded px-1 py-1.5 hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar avatar={user.avatar} name={user.displayName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.displayName}</p>
                    <p className="truncate text-xs text-slate-500">{user.jobTitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Add ${user.displayName}`}
                  title={`Add ${user.displayName}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleAddParticipant(user.id);
                  }}
                  className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
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
