"use client";

import { AddReactionRounded, EditRounded, FormatQuoteRounded, MoreHorizRounded } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip } from "@dhriti/ui";

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
    <Stack
      direction={isRight ? "row-reverse" : "row"}
      spacing={0.5}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      sx={{
        position: "absolute",
        alignItems: "center",
        top: placement === "above" ? 0 : "100%",
        transform: placement === "above" ? "translateY(calc(-100% - 6px))" : "translateY(6px)",
        right: isRight ? 0 : "auto",
        left: isRight ? "auto" : 0,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "borders.border",
        borderRadius: (theme) => theme.tokens.radius.md,
        px: 0.5,
        py: 0.35,
        boxShadow: (theme) => theme.tokens.elevation.medium,
        zIndex: "tooltip",
        "& .MuiIconButton-root": {
          width: 32,
          height: 32,
          minWidth: 32,
          p: 0,
          display: "inline-grid",
          placeItems: "center",
          lineHeight: 1,
        },
      }}
    >
      {quickReactions.map((reaction) => (
        <Tooltip key={reaction.emoji} title={reaction.name}>
          <IconButton
            size="small"
            aria-label={`React with ${reaction.name}`}
            onClick={() => onQuickReaction(reaction.emoji)}
            sx={{ fontSize: 18 }}
          >
            {reaction.emoji}
          </IconButton>
        </Tooltip>
      ))}
      <Tooltip title="More reactions">
        <IconButton size="small" onClick={keepOpenAndRun(onOpenEmoji)}>
          <AddReactionRounded sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      {isOwn ? (
        <Tooltip title="Edit message">
          <IconButton size="small" onClick={onEdit}>
            <EditRounded sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Reply with quote">
          <IconButton size="small" onClick={onQuote}>
            <FormatQuoteRounded sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ width: 1, height: 20, mx: 0.25, bgcolor: "divider" }} />
      <Tooltip title="More Options">
        <IconButton size="small" onClick={keepOpenAndRun(onOpenMenu)}>
          <MoreHorizRounded sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
