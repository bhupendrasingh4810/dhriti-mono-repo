import { EMOJI_CATEGORY_DEFINITIONS } from "../generated/emojiCategories.generated";
import type { EmojiCategoryDefinition } from "../types/emoji.types";

/** Static (dataset-backed) category definitions, in display order. */
export const staticEmojiCategories: EmojiCategoryDefinition[] =
  EMOJI_CATEGORY_DEFINITIONS as unknown as EmojiCategoryDefinition[];

/** Full category list including the virtual "recent" / "frequently-used" sections, in display order. */
export const emojiCategories: EmojiCategoryDefinition[] = [
  { id: "frequently-used", label: "Frequently Used" },
  { id: "recent", label: "Recent" },
  ...staticEmojiCategories,
];

const categoryLabelById = new Map(emojiCategories.map((category) => [category.id, category.label]));

export function getEmojiCategoryLabel(categoryId: string): string {
  return categoryLabelById.get(categoryId) ?? categoryId;
}
