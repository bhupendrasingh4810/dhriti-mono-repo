"use client";

type ConnectMessageHoverActionsProps = {
  open: boolean;
  align: "left" | "right";
  placement?: "above" | "below";
  isOwn: boolean;
  onQuickReaction: (emoji: string) => void;
  onOpenEmoji: (event: React.MouseEvent<HTMLElement>) => void;
  onEdit?: () => void;
  onQuote: () => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
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
        <AddReactionIcon />
      </button>
      {isOwn ? (
        <button type="button" title="Edit message" aria-label="Edit message" onClick={onEdit} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
          <EditIcon />
        </button>
      ) : (
        <button type="button" title="Reply with quote" aria-label="Reply with quote" onClick={onQuote} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
          <QuoteIcon />
        </button>
      )}
      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-slate-200" />
      <button type="button" title="More options" aria-label="More options" onClick={keepOpenAndRun(onOpenMenu)} className="grid h-8 w-8 place-items-center rounded text-slate-600 hover:bg-slate-50">
        <MoreIcon />
      </button>
    </div>
  );
}

function AddReactionIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 10h.01M16 10h.01M12 14v4M10 16h4" /></svg>;
}

function EditIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
}

function QuoteIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 11H6a3 3 0 0 0 0 6h1l2-3v-3ZM20 11h-4a3 3 0 0 0 0 6h1l2-3v-3Z" /></svg>;
}

function MoreIcon() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>;
}
