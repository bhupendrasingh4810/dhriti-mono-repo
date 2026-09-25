"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_RECENT_LIMIT, MAX_STORED_HISTORY, RECENT_EMOJIS_STORAGE_KEY } from "../constants/emoji.constants";
import { getEmojiByName } from "../data/emojiRegistry";
import type { EmojiDefinition } from "../types/emoji.types";
import { readStoredList, writeStoredList } from "../utils/storage";

export interface UseRecentEmojisResult {
  recentEmojis: EmojiDefinition[];
  addRecentEmoji: (name: string) => void;
  clearRecentEmojis: () => void;
}

/**
 * Tracks recently used emoji names, most-recent first, persisted to
 * localStorage (SSR-safe: starts empty on the server and hydrates on mount).
 */
export function useRecentEmojis(limit: number = DEFAULT_RECENT_LIMIT): UseRecentEmojisResult {
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => {
    setRecentNames(readStoredList(RECENT_EMOJIS_STORAGE_KEY));
  }, []);

  const addRecentEmoji = useCallback(
    (name: string) => {
      setRecentNames((previous) => {
        const withoutExisting = previous.filter((existing) => existing !== name);
        const next = [name, ...withoutExisting].slice(0, Math.min(limit, MAX_STORED_HISTORY));
        writeStoredList(RECENT_EMOJIS_STORAGE_KEY, next);
        return next;
      });
    },
    [limit],
  );

  const clearRecentEmojis = useCallback(() => {
    setRecentNames([]);
    writeStoredList(RECENT_EMOJIS_STORAGE_KEY, []);
  }, []);

  const recentEmojis = recentNames
    .map((name) => getEmojiByName(name))
    .filter((definition): definition is EmojiDefinition => Boolean(definition))
    .slice(0, limit);

  return { recentEmojis, addRecentEmoji, clearRecentEmojis };
}
