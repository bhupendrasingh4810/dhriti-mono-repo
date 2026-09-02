"use client";

import { useCallback, useMemo, useState } from "react";
import { DEFAULT_FREQUENTLY_USED_LIMIT, DEFAULT_RECENT_LIMIT } from "../constants/emoji.constants";
import { emojiDataByCategory } from "../data/emojiData";
import type { EmojiCategory, EmojiDefinition, StaticEmojiCategory } from "../types/emoji.types";
import { useEmojiSearch } from "./useEmojiSearch";
import { useFrequentlyUsedEmojis } from "./useFrequentlyUsedEmojis";
import { useRecentEmojis } from "./useRecentEmojis";

export interface UseEmojiPickerOptions {
  initialCategory?: EmojiCategory;
  recentLimit?: number;
  frequentlyUsedLimit?: number;
  onSelect?: (emoji: EmojiDefinition) => void;
}

export interface UseEmojiPickerResult {
  activeCategory: EmojiCategory;
  setActiveCategory: (category: EmojiCategory) => void;
  query: string;
  setQuery: (query: string) => void;
  isSearching: boolean;
  searchResults: EmojiDefinition[];
  recentEmojis: EmojiDefinition[];
  frequentlyUsedEmojis: EmojiDefinition[];
  visibleEmojis: EmojiDefinition[];
  selectEmoji: (emoji: EmojiDefinition) => void;
}

/**
 * Headless emoji picker logic: category selection, search, recent/frequently
 * used tracking, and the resulting list of emojis to render for the current
 * view. Kept separate from presentation so it can be reused or tested
 * independently of `DhritiEmojiPicker`.
 */
export function useEmojiPicker(options: UseEmojiPickerOptions = {}): UseEmojiPickerResult {
  const { initialCategory = "smileys-emotion", recentLimit = DEFAULT_RECENT_LIMIT, frequentlyUsedLimit = DEFAULT_FREQUENTLY_USED_LIMIT, onSelect } = options;

  const [activeCategory, setActiveCategory] = useState<EmojiCategory>(initialCategory);
  const { query, setQuery, results: searchResults, isSearching } = useEmojiSearch();
  const { recentEmojis, addRecentEmoji } = useRecentEmojis(recentLimit);
  const { frequentlyUsedEmojis, recordEmojiUsage } = useFrequentlyUsedEmojis(frequentlyUsedLimit);

  const selectEmoji = useCallback(
    (emoji: EmojiDefinition) => {
      addRecentEmoji(emoji.name);
      recordEmojiUsage(emoji.name);
      onSelect?.(emoji);
    },
    [addRecentEmoji, recordEmojiUsage, onSelect]
  );

  const visibleEmojis = useMemo(() => {
    if (isSearching) return searchResults;
    if (activeCategory === "recent") return recentEmojis;
    if (activeCategory === "frequently-used") return frequentlyUsedEmojis;
    return emojiDataByCategory[activeCategory as StaticEmojiCategory] ?? [];
  }, [isSearching, searchResults, activeCategory, recentEmojis, frequentlyUsedEmojis]);

  return {
    activeCategory,
    setActiveCategory,
    query,
    setQuery,
    isSearching,
    searchResults,
    recentEmojis,
    frequentlyUsedEmojis,
    visibleEmojis,
    selectEmoji,
  };
}
