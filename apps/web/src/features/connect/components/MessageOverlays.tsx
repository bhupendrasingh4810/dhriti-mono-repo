"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Emoji from "emoji-picker-react";
import type { ConnectUser } from "@/mocks/connect/types";
import type { MentionHoverState, ReactionHoverState } from "@/types/connect.types";
import { ConnectReactionUsersList } from "@/features/connect/components/ConnectReactionUsersList";
import ConnectUserDetailsCard from "@/features/connect/components/ConnectUserDetailsCard";

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
      <AnchoredOverlay
        anchor={emojiAnchor}
        align="bottom-left"
        onClose={onCloseEmoji}
        open={Boolean(emojiAnchor && emojiMessageId)}
        role="dialog"
      >
        <Emoji
          width={320}
          height={380}
          onEmojiClick={(data) => {
            if (emojiMessageId) onReaction(emojiMessageId, data.emoji);
            onCloseEmoji();
          }}
        />
      </AnchoredOverlay>
      <AnchoredOverlay
        anchor={reactionHover?.anchorEl ?? null}
        align="top-center"
        onClose={onCloseReaction}
        onMouseEnter={onKeepReactionOpen}
        onMouseLeave={onCloseReaction}
        open={Boolean(reactionHover)}
      >
        <ConnectReactionUsersList emoji={reactionHover?.emoji ?? ""} users={reactionUsers} />
      </AnchoredOverlay>
      <AnchoredOverlay
        anchor={mentionHover?.anchorEl ?? null}
        align="center-right"
        onClose={onCloseMention}
        open={Boolean(mentionHover)}
      >
        {mentionedUser ? (
          <ConnectUserDetailsCard
            avatar={mentionedUser.avatar}
            displayName={mentionedUser.displayName}
            jobTitle={mentionedUser.jobTitle}
            email={mentionedUser.email}
            phone={mentionedUser.phone}
            location={mentionedUser.location}
            timezone={mentionedUser.timezone}
            viewerTimezone={viewerTimezone}
            reportsTo={manager ? { displayName: manager.displayName, jobTitle: manager.jobTitle } : undefined}
          />
        ) : (
          <div />
        )}
      </AnchoredOverlay>
    </>
  );
}

type OverlayAlignment = "bottom-left" | "top-center" | "center-right";

function AnchoredOverlay({
  anchor,
  align,
  children,
  onClose,
  onMouseEnter,
  onMouseLeave,
  open,
  role,
}: {
  anchor: HTMLElement | null;
  align: OverlayAlignment;
  children: ReactNode;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  open: boolean;
  role?: "dialog";
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useEffect(() => {
    if (!open || !anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const overlay = overlayRef.current;
      const width = overlay?.offsetWidth ?? 0;
      const height = overlay?.offsetHeight ?? 0;
      const viewportPadding = 8;
      let left = rect.left;
      let top = rect.bottom + viewportPadding;

      if (align === "top-center") {
        left = rect.left + rect.width / 2 - width / 2;
        top = rect.top - height - viewportPadding;
      }
      if (align === "center-right") {
        left = rect.right + viewportPadding;
        top = rect.top + rect.height / 2 - height / 2;
      }

      setStyle({
        left: Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding)),
        top: Math.max(viewportPadding, Math.min(top, window.innerHeight - height - viewportPadding)),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [align, anchor, onClose, open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!overlayRef.current?.contains(event.target as Node) && !anchor?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [anchor, onClose, open]);

  if (!open || !anchor) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed z-50 rounded-md border border-border bg-surface shadow-lg"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role={role}
      style={style}
    >
      {children}
    </div>
  );
}

export function DeletedMessageToast({
  visible,
  restoring,
  onUndo,
}: {
  visible: boolean;
  restoring: boolean;
  onUndo: () => void;
}) {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded bg-text-primary px-4 py-2.5 text-surface shadow-lg"
    >
      <span className="text-sm font-bold">Message deleted</span>
      <button
        type="button"
        onClick={onUndo}
        disabled={restoring}
        className="text-xs font-extrabold underline disabled:opacity-50"
      >
        {restoring ? "Restoring..." : "UNDO"}
      </button>
    </div>
  );
}
