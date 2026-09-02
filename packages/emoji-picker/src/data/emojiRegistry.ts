import { emojiData } from "./emojiData";
import type { EmojiDefinition } from "../types/emoji.types";
import { normalizeEmojiName } from "../utils/normalizeEmojiName";

/**
 * Lookup-by-name/alias registry, built once at module load. This keeps
 * `getEmojiByName` (and therefore `DhritiEmoji`) an O(1) Map lookup instead of
 * an O(n) scan over the dataset on every render.
 */
const registryByLookupKey = new Map<string, EmojiDefinition>();
const registryById = new Map<string, EmojiDefinition>();

for (const definition of emojiData) {
  registryById.set(definition.id, definition);

  const lookupKeys = [definition.name, ...definition.aliases];
  for (const key of lookupKeys) {
    registryByLookupKey.set(normalizeEmojiName(key), definition);
  }
}

/** Resolves an emoji by canonical name or alias. O(1) lookup. */
export function getEmojiByName(name: string): EmojiDefinition | undefined {
  return registryByLookupKey.get(normalizeEmojiName(name));
}

/** Resolves an emoji by its stable registry id (e.g. "smileys-emotion:grinning-face"). */
export function getEmojiById(id: string): EmojiDefinition | undefined {
  return registryById.get(id);
}
