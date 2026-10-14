"use client";

import { Popover } from "@mui/material";
import Emoji from "emoji-picker-react";
import type { ConnectUser } from "@/mocks/connect/types";
import { ConnectReactionUsersList } from "@/features/connect/components/ConnectReactionUsersList";
import ConnectUserDetailsCard from "@/features/connect/components/ConnectUserDetailsCard";

export type MentionHoverState = { anchorEl: HTMLElement; userId: string };
export type ReactionHoverState = { anchorEl: HTMLElement; emoji: string; userIds: string[] };

export function MessageOverlays({
  emojiAnchor,
  emojiMessageId,
  onCloseEmoji,
  onReaction,
  reactionHover,
  onCloseReaction,
  onKeepReactionOpen,
  mentionHover,
  onCloseMention,
  usersById,
  reportsToByUserId,
  viewerTimezone,
}: {
  emojiAnchor: HTMLElement | null;
  emojiMessageId: string | null;
  onCloseEmoji: () => void;
  onReaction: (messageId: string, emoji: string) => void;
  reactionHover: ReactionHoverState | null;
  onCloseReaction: () => void;
  onKeepReactionOpen: () => void;
  mentionHover: MentionHoverState | null;
  onCloseMention: () => void;
  usersById: Record<string, ConnectUser>;
  reportsToByUserId: Record<string, string>;
  viewerTimezone?: string;
}) {
  const mentionedUser = mentionHover ? usersById[mentionHover.userId] : undefined;
  const manager = mentionedUser ? usersById[reportsToByUserId[mentionedUser.id]] : undefined;
  const reactionUsers = (reactionHover?.userIds ?? []).map((userId) => usersById[userId]).filter(Boolean);
  return (
    <>
      <Popover open={Boolean(emojiAnchor && emojiMessageId)} anchorEl={emojiAnchor} onClose={onCloseEmoji}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }} transformOrigin={{ vertical: "top", horizontal: "left" }} disableScrollLock>
        <Emoji width={320} height={380} onEmojiClick={(data) => {
          if (emojiMessageId) onReaction(emojiMessageId, data.emoji);
          onCloseEmoji();
        }} />
      </Popover>
      <Popover open={Boolean(reactionHover)} anchorEl={reactionHover?.anchorEl ?? null} onClose={onCloseReaction}
        anchorOrigin={{ vertical: "top", horizontal: "center" }} transformOrigin={{ vertical: "bottom", horizontal: "center" }} disableScrollLock>
        <div onMouseEnter={onKeepReactionOpen} onMouseLeave={onCloseReaction}>
          <ConnectReactionUsersList emoji={reactionHover?.emoji ?? ""} users={reactionUsers} />
        </div>
      </Popover>
      <Popover open={Boolean(mentionHover)} anchorEl={mentionHover?.anchorEl ?? null} onClose={onCloseMention}
        anchorOrigin={{ vertical: "center", horizontal: "right" }} transformOrigin={{ vertical: "center", horizontal: "left" }} disableScrollLock>
        {mentionedUser ? (
          <ConnectUserDetailsCard avatar={mentionedUser.avatar} displayName={mentionedUser.displayName}
            jobTitle={mentionedUser.jobTitle} email={mentionedUser.email} phone={mentionedUser.phone}
            location={mentionedUser.location} timezone={mentionedUser.timezone} viewerTimezone={viewerTimezone}
            reportsTo={manager ? { displayName: manager.displayName, jobTitle: manager.jobTitle } : undefined} />
        ) : <div />}
      </Popover>
    </>
  );
}

export function DeletedMessageToast({ visible, restoring, onUndo }: {
  visible: boolean;
  restoring: boolean;
  onUndo: () => void;
}) {
  if (!visible) return null;
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded bg-text-primary px-4 py-2.5 text-surface shadow-lg">
      <span className="text-sm font-bold">Message deleted</span>
      <button type="button" onClick={onUndo} disabled={restoring} className="text-xs font-extrabold underline disabled:opacity-50">{restoring ? "Restoring..." : "UNDO"}</button>
    </div>
  );
}