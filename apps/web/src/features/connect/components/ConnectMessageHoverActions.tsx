"use client";

import type { MouseEvent } from "react";
import { MoreHorizontal, Pencil, Quote, SmilePlus } from "lucide-react";

type ConnectMessageHoverActionsProps = {
  open: boolean;
  align: "left" | "right";
  placement?: "above" | "below";
  isOwn: boolean;
  onQuickReaction: (emoji: string) => void;
  onOpenEmoji: (event: MouseEvent<HTMLElement>) => void;
  onEdit?: () => void;
  onQuote: () => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
};

export function ConnectMessageHoverActions({
  open,
  align,
  placement = "above",
  isOwn,
  onQuickReaction,
  onOpenEmoji,
  onEdit,
  onQuote,
  onOpenMenu,
  onHoverStart,
  onHoverEnd,
}: ConnectMessageHoverActionsProps) {
  if (!open) {
    return null;
  }

  const isRight = align === "right";
  const quickReactions = [
    { emoji: "👍", name: "Thumbs up" },
    { emoji: "❤️", name: "Heart" },
    { emoji: "😂", name: "Laugh" },
    { emoji: "😮", name: "Surprised" },
  ];

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
      className={`absolute z-50 flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-lg ${
        isRight ? "right-0 flex-row-reverse" : "left-0"
      } ${placement === "above" ? "top-0 -translate-y-[calc(100%+6px)]" : "top-full translate-y-1.5"}`}
    >
      {quickReactions.map((reaction) => (
        <button key={reaction.emoji} type="button" title={reaction.name} aria-label={`React with ${reaction.name}`} onClick={() => onQuickReaction(reaction.emoji)} className="grid h-8 w-8 place-items-center rounded text-lg leading-none hover:bg-slate-50">
          {reaction.emoji}
        </button>
      ))}
      <button type="button" title="More reactions" aria-label="More reactions" onClick={keepOpenAndRun(onOpenEmoji)} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
        <SmilePlus size={20} aria-hidden="true" />
      </button>
      {isOwn ? (
        <button type="button" title="Edit message" aria-label="Edit message" onClick={onEdit} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
          <Pencil size={20} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" title="Reply with quote" aria-label="Reply with quote" onClick={onQuote} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
          <Quote size={20} aria-hidden="true" />
        </button>
      )}
      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-slate-200" />
      <button type="button" title="More options" aria-label="More options" onClick={keepOpenAndRun(onOpenMenu)} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
        <MoreHorizontal size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
