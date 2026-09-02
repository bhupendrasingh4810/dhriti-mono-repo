import { EMOJI_DEFINITIONS } from "../generated/emojiRegistry.generated";
import type { EmojiDefinition, StaticEmojiCategory } from "../types/emoji.types";

/**
 * The full, generated emoji dataset. Treat as read-only; it is produced by
 * `pnpm generate` from the seed JSON files in ../../emojis.
 */
export const emojiData: EmojiDefinition[] = EMOJI_DEFINITIONS as unknown as EmojiDefinition[];

/** Emoji definitions grouped by their static category, in dataset order. */
export const emojiDataByCategory: Record<StaticEmojiCategory, EmojiDefinition[]> = emojiData.reduce(
  (acc, definition) => {
    (acc[definition.category] ??= []).push(definition);
    return acc;
  },
  {} as Record<StaticEmojiCategory, EmojiDefinition[]>
);
