import { useEffect, useMemo, useRef, useState } from "react";
import { connectUsers } from "@/mocks/connect/users";
import { connectUsersById } from "@/mocks/connect";
import type { CallKind } from "@/features/connect/components/WorkspaceCallProvider";

interface ConversationHeaderProps {
  conversation: {
    id: string;
    name: string;
    type: "channel" | "direct" | "group";
    isFavorite?: boolean;
    participants: string[];
  };
  teamLabel: string;
  onOpenDetails: () => void;
  onStartCall: (kind: CallKind) => void;
}

export function ConversationHeader({ conversation, teamLabel, onOpenDetails, onStartCall }: ConversationHeaderProps) {
  const currentUser = connectUsers[0]; // Assuming the first user is the current user for this example
  const [participantsAnchor, setParticipantsAnchor] = useState<HTMLElement | null>(null);
  const [participantSearch, setParticipantSearch] = useState("");
  const participantsPopoverRef = useRef<HTMLDivElement>(null);

  const participants = useMemo(
    () => conversation.participants.map((id) => connectUsersById[id]).filter(Boolean),
    [conversation],
  );

  const addableUsers = useMemo(() => {
    const set = new Set(conversation.participants);
    return connectUsers
      .filter((user) => !set.has(user.id))
      .filter((user) => user.displayName.toLowerCase().includes(participantSearch.toLowerCase()))
      .slice(0, 8);
  }, [conversation, participantSearch]);

  function handleAddParticipant(userId: string) {
    const user = connectUsersById[userId];

    // setConversationsById((previous) => {
    //     const conversation = previous[conversation.id];
    //     if (!conversation || conversation.participants.includes(userId)) return previous;

    //     return {
    //         ...previous,
    //         [conversation.id]: {
    //             ...conversation,
    //             participants: [...conversation.participants, userId],
    //         },
    //     };
    // });

    // if (user) {
    //     pushSystemMessage(`${user.displayName} was added to this conversation.`);
    // }
  }

  function handleRemoveParticipant(userId: string) {
    const user = connectUsersById[userId];

    // setConversationsById((previous) => {
    //     const conversation = previous[conversation.id];
    //     if (!conversation || !conversation.participants.includes(userId) || userId === currentUser.id) return previous;

    //     return {
    //         ...previous,
    //         [conversation.id]: {
    //             ...conversation,
    //             participants: conversation.participants.filter((id) => id !== userId),
    //         },
    //     };
    // });

    // if (user) {
    //     pushSystemMessage(`${user.displayName} was removed from this conversation.`);
    // }
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
          <span className="text-xl font-bold text-slate-400">
            {conversation.type === "channel" ? "#" : "@"}
          </span>
          <button type="button" onClick={onOpenDetails} className="truncate text-lg font-bold text-slate-900 hover:text-emerald-700">
            {conversation.name}
          </button>
          {conversation.isFavorite ? <StarIcon className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" /> : null}
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-2 text-xs text-slate-400">
            <span>{teamLabel}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{conversation.participants.length} members</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {conversation.type !== "direct" && (
            <button type="button" onClick={(event) => setParticipantsAnchor(event.currentTarget)} className="flex h-9 items-center gap-1 rounded-md px-2 text-sm font-medium text-slate-500 hover:bg-slate-100" aria-label="Manage participants">
              <PeopleIcon className="h-[18px] w-[18px]" />
              {conversation.participants.length}
            </button>
          )}
          <button type="button" onClick={() => onStartCall("video")} aria-label="Start video call" title="Start video call" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <VideoIcon className="h-[22px] w-[22px]" />
          </button>
          <button type="button" onClick={() => onStartCall("audio")} aria-label="Start audio call" title="Start audio call" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <CallIcon className="h-[22px] w-[22px]" />
          </button>
          <button type="button" aria-label="More conversation actions" title="More conversation actions" className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100">
            <MoreIcon className="h-[22px] w-[22px]" />
          </button>
        </div>
      </header>

      {participantsAnchor && participantsAnchorRect ? (
        <div ref={participantsPopoverRef} className="fixed z-50 w-[340px] rounded-lg border border-slate-200 bg-white p-4 shadow-lg" style={{ left: Math.min(participantsAnchorRect.left, window.innerWidth - 356), top: participantsAnchorRect.bottom + 4 }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Participants</p>
          <input type="search" placeholder="Search user to add" value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-600" />

          <p className="mb-1.5 mt-4 text-xs font-bold text-slate-400">In this conversation</p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {participants.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded px-1 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar avatar={user.avatar} name={user.displayName} />
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user.displayName}</p><p className="truncate text-xs text-slate-500">{user.jobTitle}</p></div>
                </div>
                {user.id !== currentUser.id ? (
                  <button type="button" aria-label={`Remove ${user.displayName}`} title={`Remove ${user.displayName}`} onClick={() => handleRemoveParticipant(user.id)} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-red-600"><RemoveUserIcon className="h-4 w-4" /></button>
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
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user.displayName}</p><p className="truncate text-xs text-slate-500">{user.jobTitle}</p></div>
                </div>
                <button type="button" aria-label={`Add ${user.displayName}`} title={`Add ${user.displayName}`} onClick={(event) => { event.stopPropagation(); handleAddParticipant(user.id); }} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-emerald-700"><AddIcon className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function UserAvatar({ avatar, name }: { avatar?: string; name: string }) {
  return avatar ? <img src={avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" /> : <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">{name.slice(0, 1)}</span>;
}

function Icon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

function PeopleIcon({ className }: { className?: string }) { return <Icon className={className}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2" /><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 16c2.5 0 4 1.3 4 4" /></Icon>; }
function VideoIcon({ className }: { className?: string }) { return <Icon className={className}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></Icon>; }
function CallIcon({ className }: { className?: string }) { return <Icon className={className}><path d="M5 4h3l1.5 4-2 1.5a15 15 0 0 0 7 7l1.5-2L20 16v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></Icon>; }
function MoreIcon({ className }: { className?: string }) { return <Icon className={className}><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></Icon>; }
function StarIcon({ className }: { className?: string }) { return <Icon className={className}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" /></Icon>; }
function RemoveUserIcon({ className }: { className?: string }) { return <Icon className={className}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-4 2.5-6 6-6 1.2 0 2.3.2 3.2.7M16 16h5M18.5 13.5v5" /></Icon>; }
function AddIcon({ className }: { className?: string }) { return <Icon className={className}><path d="M12 5v14M5 12h14" /></Icon>; }
