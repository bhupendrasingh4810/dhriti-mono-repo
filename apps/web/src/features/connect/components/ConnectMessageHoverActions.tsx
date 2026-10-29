"use client";

import type { MouseEvent } from "react";
import { MoreHorizontal, Pencil, Quote, SmilePlus } from "lucide-react";
import { useAppSettings } from "@/features/settings/use-app-settings";
import { allowedQuickReactions, canEditOwnMessage } from "@/features/connect/utils/message-policy";

type ConnectMessageHoverActionsProps = {
  open: boolean;
  align: "left" | "right";
  placement?: "above" | "below";
  isOwn: boolean;
  onQuickReaction: (emoji: string) => void;
  onOpenEmoji: (event: MouseEvent<HTMLElement>) => void;
  onEdit?: () => void;
  onQuote: () => void;
  createdAt?: string;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
};

const DEFAULT_QUICK_REACTIONS = [
  { emoji: "👍", name: "Thumbs up" },
  { emoji: "❤️", name: "Heart" },
  { emoji: "😂", name: "Laugh" },
  { emoji: "😮", name: "Surprised" },
];

export function ConnectMessageHoverActions({
  open,
  align,
  placement = "above",
  isOwn,
  onQuickReaction,
  onOpenEmoji,
  onEdit,
  onQuote,
  createdAt,
  onOpenMenu,
  onHoverStart,
  onHoverEnd,
}: ConnectMessageHoverActionsProps) {
  const connectPolicy = useAppSettings("connect");

  if (!open) {
    return null;
  }

  const isRight = align === "right";
  const quickReactions = allowedQuickReactions(connectPolicy, DEFAULT_QUICK_REACTIONS, (emoji) => ({ emoji, name: emoji }));
  const reactionsRestricted = (connectPolicy?.allowedReactions.length ?? 0) > 0;
  const canEdit = Boolean(onEdit) && canEditOwnMessage(connectPolicy, createdAt ?? "");

  function keepOpenAndRun(handler: (event: React.MouseEvent<HTMLElement>) => void) {
    return (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      onHoverStart?.();
      handler(event);
    };
  }

  return (
    <div
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={`absolute z-50 flex items-center gap-0.5 rounded-md border border-border bg-surface-raised px-2 py-1 shadow-lg ${
        isRight ? "right-0 flex-row-reverse" : "left-0"
      } ${placement === "above" ? "bottom-[90%]" : "top-[105%]"}`}
    >
      {quickReactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          title={reaction.name}
          aria-label={`React with ${reaction.name}`}
          onClick={() => onQuickReaction(reaction.emoji)}
          className="grid h-8 w-8 place-items-center rounded text-lg leading-none hover:bg-surface"
        >
          {reaction.emoji}
        </button>
      ))}
      {reactionsRestricted ? null : <button
        type="button"
        title="More reactions"
        aria-label="More reactions"
        onClick={keepOpenAndRun(onOpenEmoji)}
        className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface"
      >
        <SmilePlus size={20} aria-hidden="true" />
      </button>}
      {isOwn && canEdit ? (
        <button
          type="button"
          title="Edit message"
          aria-label="Edit message"
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface"
        >
          <Pencil size={20} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          title="Reply with quote"
          aria-label="Reply with quote"
          onClick={onQuote}
          className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface"
        >
          <Quote size={20} aria-hidden="true" />
        </button>
      )}
      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />
      <button
        type="button"
        title="More options"
        aria-label="More options"
        onClick={keepOpenAndRun(onOpenMenu)}
        className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface"
      >
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
