"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_FREQUENTLY_USED_LIMIT, FREQUENTLY_USED_EMOJIS_STORAGE_KEY, MAX_STORED_HISTORY } from "../constants/emoji.constants";
import { getEmojiByName } from "../data/emojiRegistry";
import type { EmojiDefinition } from "../types/emoji.types";
import { readStoredUsageCounts, writeStoredUsageCounts } from "../utils/storage";

export interface UseFrequentlyUsedEmojisResult {
  frequentlyUsedEmojis: EmojiDefinition[];
  recordEmojiUsage: (name: string) => void;
}

/**
 * Tracks per-emoji usage counts, persisted to localStorage (SSR-safe), and
 * exposes the most-used emojis sorted descending by usage count.
 */
export function useFrequentlyUsedEmojis(limit: number = DEFAULT_FREQUENTLY_USED_LIMIT): UseFrequentlyUsedEmojisResult {
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setUsageCounts(readStoredUsageCounts(FREQUENTLY_USED_EMOJIS_STORAGE_KEY));
  }, []);

  const recordEmojiUsage = useCallback((name: string) => {
    setUsageCounts((previous) => {
      const nextCount = (previous[name] ?? 0) + 1;
      const next = { ...previous, [name]: nextCount };

      const entries = Object.entries(next);
      if (entries.length > MAX_STORED_HISTORY) {
        entries.sort((a, b) => b[1] - a[1]);
        const trimmed = Object.fromEntries(entries.slice(0, MAX_STORED_HISTORY));
        writeStoredUsageCounts(FREQUENTLY_USED_EMOJIS_STORAGE_KEY, trimmed);
        return trimmed;
      }

      writeStoredUsageCounts(FREQUENTLY_USED_EMOJIS_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const frequentlyUsedEmojis = Object.entries(usageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => getEmojiByName(name))
    .filter((definition): definition is EmojiDefinition => Boolean(definition));

  return { frequentlyUsedEmojis, recordEmojiUsage };
}
