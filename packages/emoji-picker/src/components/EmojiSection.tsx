"use client";

import { Box, Typography } from "@mui/material";
import type { EmojiDefinition } from "../types/emoji.types";
import { EmojiGrid } from "./EmojiGrid";

interface EmojiSectionProps {
  title: string;
  emojis: EmojiDefinition[];
  onSelect: (emoji: EmojiDefinition) => void;
  onHover?: (emoji: EmojiDefinition | null) => void;
  disabled?: boolean;
  animated?: boolean;
}

/** A titled section of the emoji grid, e.g. "Recent" or a category name. */
export function EmojiSection({ title, emojis, onSelect, onHover, disabled, animated }: EmojiSectionProps) {
  if (emojis.length === 0) return null;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        component="h3"
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          mb: 0.5,
        }}
      >
        {title}
      </Typography>
      <EmojiGrid emojis={emojis} onSelect={onSelect} onHover={onHover} disabled={disabled} animated={animated} />
    </Box>
  );
}
