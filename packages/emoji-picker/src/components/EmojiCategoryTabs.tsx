"use client";

import { Box, Tab, Tabs, Tooltip } from "@mui/material";
import type { EmojiCategory, EmojiCategoryDefinition } from "../types/emoji.types";

interface EmojiCategoryTabsProps {
  categories: EmojiCategoryDefinition[];
  activeCategory: EmojiCategory;
  onCategoryChange: (category: EmojiCategory) => void;
  disabled?: boolean;
}

export function EmojiCategoryTabs({ categories, activeCategory, onCategoryChange, disabled }: EmojiCategoryTabsProps) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={activeCategory}
        onChange={(_event, value: EmojiCategory) => onCategoryChange(value)}
        variant="scrollable"
        scrollButtons={false}
        aria-label="Emoji categories"
        sx={{
          minHeight: 36,
          "& .MuiTab-root": { minHeight: 36, minWidth: 36, px: 1 },
          "& .Mui-selected": { color: "primary.main" },
          "& .MuiTabs-indicator": { backgroundColor: "primary.main" },
        }}
      >
        {categories.map((category) => (
          <Tab
            key={category.id}
            value={category.id}
            disabled={disabled}
            label={
              <Tooltip title={category.label}>
                <span aria-hidden="true">{getCategoryGlyph(category.id)}</span>
              </Tooltip>
            }
            aria-label={category.label}
          />
        ))}
      </Tabs>
    </Box>
  );
}

function getCategoryGlyph(categoryId: EmojiCategory): string {
  switch (categoryId) {
    case "recent":
      return "\u{1F551}";
    case "frequently-used":
      return "\u2B50";
    case "smileys-emotion":
      return "\u{1F600}";
    case "people-body":
      return "\u{1F44B}";
    case "animals-nature":
      return "\u{1F436}";
    case "food-drink":
      return "\u{1F34E}";
    case "activities":
      return "\u26BD";
    case "travel-places":
      return "\u2708\uFE0F";
    case "objects":
      return "\u{1F4A1}";
    case "symbols":
      return "\u2764\uFE0F";
    default:
      return "\u2022";
  }
}
