"use client";

import { useMemo, useState } from "react";
import { searchEmojis } from "../data/emojiSearchIndex";
import type { EmojiDefinition } from "../types/emoji.types";

export interface UseEmojiSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: EmojiDefinition[];
  isSearching: boolean;
}

/** Debounce-free, memoized emoji search bound to a query string. */
export function useEmojiSearch(): UseEmojiSearchResult {
  const [query, setQuery] = useState("");

  const results = useMemo(() => (query.trim() ? searchEmojis(query) : []), [query]);

  return { query, setQuery, results, isSearching: query.trim().length > 0 };
}
