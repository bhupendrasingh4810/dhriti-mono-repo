"use client";

import { AddReactionRounded, FormatQuoteRounded, MoreHorizRounded } from "@mui/icons-material";
import { Box, Button, IconButton, Stack } from "@mui/material";

type ConnectMessageHoverActionsProps = {
  open: boolean;
  align: "left" | "right";
  placement?: "above" | "below";
  onQuickReaction: (emoji: string) => void;
  onOpenEmoji: (event: React.MouseEvent<HTMLElement>) => void;
  onQuote: () => void;
  onOpenMenu: (event: React.MouseEvent<HTMLElement>) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
};

export function ConnectMessageHoverActions({
  open,
  align,
  placement = "above",
  onQuickReaction,
  onOpenEmoji,
  onQuote,
  onOpenMenu,
  onHoverStart,
  onHoverEnd,
}: ConnectMessageHoverActionsProps) {
  if (!open) {
    return null;
  }

  const isRight = align === "right";

  return (
    <Stack
      direction={isRight ? "row-reverse" : "row"}
      spacing={0.5}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      sx={{
        position: "absolute",
        top: placement === "above" ? 0 : "100%",
        transform: placement === "above" ? "translateY(calc(-100% - 6px))" : "translateY(6px)",
        right: isRight ? 0 : "auto",
        left: isRight ? "auto" : 0,
        bgcolor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 0.5,
        px: 3,
        py: 1.5,
        boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
        zIndex: 6,
      }}
    >
      {["👍", "❤️", "😂", "😮"].map((emoji) => (
        <Button
          key={emoji}
          size="small"
          variant="outlined"
          onClick={() => onQuickReaction(emoji)}
          sx={{ minWidth: 34, px: 0.8, border: "none", fontSize: 20 }}
        >
          {emoji}
        </Button>
      ))}
      <IconButton size="small" onClick={onOpenEmoji}>
        <AddReactionRounded sx={{ fontSize: 20 }} />
      </IconButton>
      <IconButton size="small" onClick={onQuote}>
        <FormatQuoteRounded sx={{ fontSize: 20 }} />
      </IconButton>
      <Box sx={{ display: "flex", alignItems: "center", fontSize: 20, color: "#9ca3af" }}>|</Box>
      <IconButton size="small" onClick={onOpenMenu}>
        <MoreHorizRounded sx={{ fontSize: 20 }} />
      </IconButton>
    </Stack>
  );
}
