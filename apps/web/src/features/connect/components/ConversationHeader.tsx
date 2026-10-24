import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BellOff, Copy, Ellipsis, ExternalLink, Info, LogOut, MessagesSquare, Phone, Plus, Trash2, UserPlus, Users, Video, X } from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import type { CallType, ConversationUser } from "@/types/connect.types";
import { getUserInitials } from "@/features/connect/utils/user-initials";

type ConversationHeaderProps = {
  conversation: {
    id: string;
    name: string;
    type: "channel" | "direct" | "group";
    avatar?: string;
    isFavorite?: boolean;
    participants: string[];
  };
  currentUserId?: string;
  usersById: Record<string, ConversationUser>;
  onOpenDetails: () => void;
  onStartCall: (type: CallType) => void;
  isChannelAdmin?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onDeleteChannel?: () => void;
  onOpenInNewTab?: () => void;
  onOpenUserHover?: (event: React.MouseEvent<HTMLElement>, userId: string) => void;
  onCloseUserHover?: () => void;
  onCreateGroup?: (userIds: string[]) => Promise<boolean>;
  isGroupAdmin?: boolean;
  onAddGroupMember?: (userId: string) => Promise<boolean>;
  onRemoveGroupMember?: (userId: string) => Promise<boolean>;
  onLeaveGroup?: () => Promise<boolean>;
  actions?: ReactNode;
};

export function ConversationHeader({
  conversation,
  currentUserId,
  usersById,
  onOpenDetails,
  onStartCall,
  isChannelAdmin = false,
  isMuted = false,
  onToggleMute,
  onDeleteChannel,
  onOpenInNewTab,
  onOpenUserHover,
  onCloseUserHover,
  onCreateGroup,
  isGroupAdmin = false,
  onAddGroupMember,
  onRemoveGroupMember,
  onLeaveGroup,
  actions,
}: ConversationHeaderProps) {
  const [participantsAnchor, setParticipantsAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [groupCreatorOpen, setGroupCreatorOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const participantsPopoverRef = useRef<HTMLDivElement>(null);

  const participants = useMemo(
    () =>
      conversation.participants.map((id) => usersById[id]).filter((user): user is ConversationUser => Boolean(user)),
    [conversation.participants, usersById],
  );
  const headerParticipants = useMemo(() => {
    const otherParticipants = participants.filter((user) => user.id !== currentUserId);
    return (otherParticipants.length ? otherParticipants : participants).slice(0, 2);
  }, [currentUserId, participants]);
  const groupParticipantNames = participants.map((user) => user.displayName);
  const groupHeaderLabel =
    groupParticipantNames.length > 2
      ? `${groupParticipantNames.slice(0, 2).join(", ")}...`
      : groupParticipantNames.join(", ") || conversation.name;
  const groupCandidates = useMemo(
    () =>
      Object.values(usersById).filter(
        (user) =>
          !conversation.participants.includes(user.id) &&
          !groupMemberIds.includes(user.id) &&
          user.displayName.toLocaleLowerCase().includes(groupSearch.toLocaleLowerCase()),
      ),
    [conversation.participants, groupMemberIds, groupSearch, usersById],
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

  function openGroupCreator() {
    setGroupCreatorOpen(true);
    setGroupSearch("");
    setGroupMemberIds([]);
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
            <div className="-space-x-2 flex shrink-0">
              {headerParticipants.length ? (
                headerParticipants.map((user) => (
                  <span
                    key={user.id}
                    onMouseEnter={(event) => onOpenUserHover?.(event, user.id)}
                    onMouseLeave={onCloseUserHover}
                  >
                    <UserAvatar
                      avatar={user.avatar}
                      name={user.displayName}
                      className="h-12 w-12 border-2 border-surface"
                      textClassName="text-lg"
                    />
                  </span>
                ))
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-raised text-base font-bold text-brand">@</span>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onOpenDetails}
            className="truncate text-lg font-bold text-brand hover:text-brand-dark"
            title={conversation.type === "group" ? groupParticipantNames.join(", ") : conversation.name}
          >
            {conversation.type === "group" ? groupHeaderLabel : conversation.name}
          </button>
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
          {conversation.type === "group" ? (
            <button
              type="button"
              onClick={() => { void onLeaveGroup?.(); }}
              aria-label="Exit group"
              title="Exit group"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-error hover:bg-error/10"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          ) : null}
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {conversation.type === "channel" ? "Channel members" : conversation.type === "group" ? "Group members" : "Conversation members"}
          </p>
          {conversation.type === "group" && isGroupAdmin ? (
            <div className="mb-3">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 focus-within:border-brand">
                <UserPlus size={16} className="text-brand" aria-hidden="true" />
                <input
                  type="search"
                  value={groupSearch}
                  onChange={(event) => setGroupSearch(event.target.value)}
                  placeholder="Search users to add"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                />
              </div>
              {groupSearch.trim() ? (
                <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-border">
                  {groupCandidates.length ? groupCandidates.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        void onAddGroupMember?.(user.id).then((added) => {
                          if (added) setGroupSearch("");
                        });
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left hover:bg-surface-raised"
                    >
                      <UserAvatar avatar={user.avatar} name={user.displayName} />
                      <span className="min-w-0"><span className="block truncate text-sm font-medium text-text-primary">{user.displayName}</span><span className="block truncate text-xs text-text-secondary">{user.jobTitle}</span></span>
                    </button>
                  )) : <p className="px-3 py-2 text-sm text-text-secondary">No matching users.</p>}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {participants.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded px-1 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <UserAvatar avatar={user.avatar} name={user.displayName} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {user.displayName}{user.id === currentUserId ? " (You)" : ""}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.jobTitle}</p>
                  </div>
                  {conversation.type === "group" && isGroupAdmin && user.id !== currentUserId ? (
                    <button
                      type="button"
                      aria-label={`Remove ${user.displayName}`}
                      title={`Remove ${user.displayName}`}
                      onClick={() => { void onRemoveGroupMember?.(user.id); }}
                      className="grid cursor-pointer place-items-center rounded p-1 text-text-secondary hover:bg-surface-raised hover:text-danger"
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {conversation.type === "direct" ? (
            <div className="mt-3 border-t border-border pt-2">
              <button
                type="button"
                onClick={openGroupCreator}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-brand hover:bg-brand/5"
              >
                <Plus size={16} aria-hidden="true" />
                Create a group
              </button>
            </div>
          ) : null}
          {groupCreatorOpen ? (
            <div
              className="absolute top-0 w-[340px] rounded-lg border border-border bg-surface p-4 shadow-lg"
              style={
                participantsAnchorRect.left + 684 > window.innerWidth
                  ? { right: "calc(100% + 4px)" }
                  : { left: "calc(100% + 4px)" }
              }
            >
              <p className="text-sm font-semibold text-text-primary">Create a group</p>
              <p className="mt-1 text-xs text-text-secondary">Add people from your organization to this conversation.</p>
              <div className="mt-3 flex min-h-11 flex-wrap items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 focus-within:border-brand">
                {groupMemberIds.map((userId) => {
                  const user = usersById[userId];
                  if (!user) return null;
                  return (
                    <span key={user.id} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
                      {user.displayName}
                      <button
                        type="button"
                        aria-label={`Remove ${user.displayName}`}
                        onClick={() => setGroupMemberIds((previous) => previous.filter((id) => id !== user.id))}
                        className="grid cursor-pointer place-items-center"
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}
                <input
                  type="search"
                  value={groupSearch}
                  onChange={(event) => setGroupSearch(event.target.value)}
                  placeholder="Search people"
                  className="min-w-24 flex-1 bg-transparent py-1 text-sm text-text-primary outline-none placeholder:text-text-secondary"
                />
              </div>
              {groupSearch.trim() ? (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border">
                  {groupCandidates.length ? groupCandidates.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setGroupMemberIds((previous) => [...previous, user.id]);
                        setGroupSearch("");
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left hover:bg-surface-raised"
                    >
                      <UserAvatar avatar={user.avatar} name={user.displayName} />
                      <span className="min-w-0"><span className="block truncate text-sm font-medium text-text-primary">{user.displayName}</span><span className="block truncate text-xs text-text-secondary">{user.jobTitle}</span></span>
                    </button>
                  )) : <p className="px-3 py-2 text-sm text-text-secondary">No matching users.</p>}
                </div>
              ) : null}
              {conversation.type === "group" ? (
                <div className="mt-3 border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={() => { void onLeaveGroup?.(); }}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    Leave group
                  </button>
                </div>
              ) : null}
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
                <button type="button" onClick={() => setGroupCreatorOpen(false)} className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised">Cancel</button>
                <button
                  type="button"
                  disabled={groupMemberIds.length === 0 || creatingGroup || !onCreateGroup}
                  onClick={() => {
                    if (!onCreateGroup) return;
                    setCreatingGroup(true);
                    void onCreateGroup([...conversation.participants, ...groupMemberIds]).then((created) => {
                      if (created) setGroupCreatorOpen(false);
                      setCreatingGroup(false);
                    });
                  }}
                  className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingGroup ? "Creating..." : "Create group"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function UserAvatar({
  avatar,
  name,
  className = "h-6 w-6",
  textClassName = "text-[10px]",
}: {
  avatar?: string;
  name: string;
  className?: string;
  textClassName?: string;
}) {
  return avatar ? (
    <img src={avatar} alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${className} ${textClassName} grid shrink-0 place-items-center rounded-full bg-slate-200 font-bold text-slate-600`}>
      {getUserInitials(name)}
    </span>
  );
}
