import { EMOJI_SEARCH_INDEX } from "../generated/emojiSearchIndex.generated";
import { getEmojiById } from "./emojiRegistry";
import type { EmojiDefinition } from "../types/emoji.types";
import { normalizeEmojiName } from "../utils/normalizeEmojiName";

const searchIndex: Readonly<Record<string, readonly string[]>> = EMOJI_SEARCH_INDEX;

/**
 * Returns emoji definitions whose name, aliases, or keywords contain the
 * given (already-normalized) token, using the precomputed inverted index.
 */
function lookupToken(token: string): EmojiDefinition[] {
  const ids = searchIndex[token];
  if (!ids) return [];

  const results: EmojiDefinition[] = [];
  for (const id of ids) {
    const definition = getEmojiById(id);
    if (definition) results.push(definition);
  }
  return results;
}

/** All indexed tokens, used to support partial/prefix matching efficiently. */
const allTokens = Object.keys(searchIndex);

/**
 * Searches the emoji dataset by name, alias, or keyword. Case-insensitive,
 * whitespace-trimmed, and supports partial (substring) matches.
 */
export function searchEmojis(query: string): EmojiDefinition[] {
  const normalized = normalizeEmojiName(query);
  if (!normalized) return [];

  const matchedIds = new Set<string>();
  const results: EmojiDefinition[] = [];

  function addAll(definitions: EmojiDefinition[]) {
    for (const definition of definitions) {
      if (!matchedIds.has(definition.id)) {
        matchedIds.add(definition.id);
        results.push(definition);
      }
    }
  }

  // Exact token match first (most relevant), then partial/prefix matches.
  addAll(lookupToken(normalized));

  for (const token of allTokens) {
    if (token !== normalized && token.includes(normalized)) {
      addAll(lookupToken(token));
    }
  }

  return results;
}
