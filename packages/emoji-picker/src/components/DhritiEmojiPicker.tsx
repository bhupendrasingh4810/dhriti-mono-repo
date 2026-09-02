"use client";

import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { DEFAULT_FREQUENTLY_USED_LIMIT, DEFAULT_RECENT_LIMIT } from "../constants/emoji.constants";
import { emojiCategories, getEmojiCategoryLabel } from "../data/emojiCategories";
import { useEmojiPicker } from "../hooks/useEmojiPicker";
import type { DhritiEmojiPickerProps, EmojiCategory, EmojiDefinition } from "../types/emoji.types";
import { EmojiCategoryTabs } from "./EmojiCategoryTabs";
import { EmojiGrid } from "./EmojiGrid";
import { EmojiPickerFooter } from "./EmojiPickerFooter";
import { EmojiSearch } from "./EmojiSearch";
import { EmojiSection } from "./EmojiSection";
import { FrequentlyUsedEmojis } from "./FrequentlyUsedEmojis";

/**
 * Full emoji picker: search, category navigation, recent/frequently-used
 * history, and a responsive emoji grid. Designed to be dropped into a
 * Popover/Menu by the consumer.
 */
export function DhritiEmojiPicker({
  onSelect,
  searchable = true,
  showFrequentlyUsed = true,
  showRecent = true,
  initialCategory,
  recentLimit = DEFAULT_RECENT_LIMIT,
  frequentlyUsedLimit = DEFAULT_FREQUENTLY_USED_LIMIT,
  disabled = false,
  className,
  sx,
  width = 340,
  height = 380,
  animated = true,
}: DhritiEmojiPickerProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<EmojiDefinition | null>(null);

  const resolvedInitialCategory: EmojiCategory = initialCategory ?? (showFrequentlyUsed ? "frequently-used" : "smileys-emotion");

  const {
    activeCategory,
    setActiveCategory,
    query,
    setQuery,
    isSearching,
    searchResults,
    frequentlyUsedEmojis,
    visibleEmojis,
    selectEmoji,
  } = useEmojiPicker({
    initialCategory: resolvedInitialCategory,
    recentLimit,
    frequentlyUsedLimit,
    onSelect,
  });

  const visibleCategories = useMemo(
    () =>
      emojiCategories.filter((category) => {
        if (category.id === "recent") return showRecent;
        if (category.id === "frequently-used") return showFrequentlyUsed;
        return true;
      }),
    [showRecent, showFrequentlyUsed]
  );

  const showFrequentlyUsedStrip = showFrequentlyUsed && !isSearching && activeCategory !== "frequently-used" && frequentlyUsedEmojis.length > 0;

  return (
    <Box
      className={className}
      sx={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        ...sx,
      }}
    >
      {searchable ? (
        <Box sx={{ p: 1 }}>
          <EmojiSearch query={query} onQueryChange={setQuery} disabled={disabled} />
        </Box>
      ) : null}

      {!isSearching ? (
        <EmojiCategoryTabs
          categories={visibleCategories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          disabled={disabled}
        />
      ) : null}

      <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
        {showFrequentlyUsedStrip ? (
          <FrequentlyUsedEmojis
            emojis={frequentlyUsedEmojis}
            onSelect={selectEmoji}
            onHover={setHoveredEmoji}
            disabled={disabled}
            animated={animated}
          />
        ) : null}

        {isSearching ? (
          <EmojiGrid emojis={searchResults} onSelect={selectEmoji} onHover={setHoveredEmoji} disabled={disabled} animated={animated} />
        ) : (
          <EmojiSection
            title={getEmojiCategoryLabel(activeCategory)}
            emojis={visibleEmojis}
            onSelect={selectEmoji}
            onHover={setHoveredEmoji}
            disabled={disabled}
            animated={animated}
          />
        )}
      </Box>

      <EmojiPickerFooter hoveredEmoji={hoveredEmoji} />
    </Box>
  );
}
