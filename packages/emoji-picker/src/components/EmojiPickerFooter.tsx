"use client";

import { Box, Typography } from "@mui/material";
import type { EmojiDefinition } from "../types/emoji.types";

interface EmojiPickerFooterProps {
  hoveredEmoji: EmojiDefinition | null;
}

/** Shows a preview of the currently hovered/focused emoji, Slack/Discord-style. */
export function EmojiPickerFooter({ hoveredEmoji }: EmojiPickerFooterProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.75,
        borderTop: 1,
        borderColor: "divider",
        minHeight: 32,
      }}
    >
      {hoveredEmoji ? (
        <>
          <Typography component="span" sx={{ fontSize: 20, lineHeight: 1 }}>
            {hoveredEmoji.emoji}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>
            {hoveredEmoji.name.replace(/-/g, " ")}
          </Typography>
        </>
      ) : (
        <Typography sx={{ fontSize: 12, color: "text.disabled" }}>Pick an emoji</Typography>
      )}
    </Box>
  );
}
