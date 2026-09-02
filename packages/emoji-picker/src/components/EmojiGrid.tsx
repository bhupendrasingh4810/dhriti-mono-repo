"use client";

import { Box } from "@mui/material";
import type { EmojiDefinition } from "../types/emoji.types";
import { DhritiEmoji } from "./DhritiEmoji";

interface EmojiGridProps {
  emojis: EmojiDefinition[];
  onSelect: (emoji: EmojiDefinition) => void;
  onHover?: (emoji: EmojiDefinition | null) => void;
  disabled?: boolean;
  /** Play a Lottie animation on hover for each cell instead of a static glyph. */
  animated?: boolean;
}

/**
 * Responsive CSS-grid layout of emoji buttons. Kept intentionally simple
 * (no manual positioning) since the curated dataset size does not warrant
 * virtualization.
 */
export function EmojiGrid({ emojis, onSelect, onHover, disabled, animated = false }: EmojiGridProps) {
  if (emojis.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: "center", fontSize: 12, color: "text.secondary" }}>No emojis found</Box>
    );
  }

  return (
    <Box
      role="listbox"
      aria-label="Emoji results"
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))",
        gap: 0.25,
      }}
    >
      {emojis.map((emoji) => (
        <Box
          key={emoji.id}
          component="button"
          type="button"
          role="option"
          aria-label={emoji.name.replace(/-/g, " ")}
          disabled={disabled}
          onClick={() => onSelect(emoji)}
          onMouseEnter={() => onHover?.(emoji)}
          onMouseLeave={() => onHover?.(null)}
          onFocus={() => onHover?.(emoji)}
          sx={{
            appearance: "none",
            border: "none",
            background: "none",
            cursor: disabled ? "default" : "pointer",
            width: 32,
            height: 32,
            fontSize: 20,
            lineHeight: 1,
            borderRadius: 1,
            display: "grid",
            placeItems: "center",
            "&:hover": disabled ? undefined : { bgcolor: "action.hover" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 1,
            },
          }}
        >
          {animated ? <DhritiEmoji name={emoji.name} size={20} animated playOnHover /> : emoji.emoji}
        </Box>
      ))}
    </Box>
  );
}
