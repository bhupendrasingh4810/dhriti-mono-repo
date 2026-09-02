import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Canonical emoji category ids. "recent" and "frequently-used" are virtual
 * categories backed by local usage history rather than the static dataset.
 */
export type EmojiCategory =
  | "recent"
  | "frequently-used"
  | "smileys-emotion"
  | "people-body"
  | "animals-nature"
  | "food-drink"
  | "activities"
  | "travel-places"
  | "objects"
  | "symbols";

/** Categories backed by the static, generated emoji dataset. */
export type StaticEmojiCategory = Exclude<EmojiCategory, "recent" | "frequently-used">;

export interface EmojiDefinition {
  /** Stable unique id, e.g. "smileys-emotion:grinning-face" */
  id: string;
  /** Canonical kebab-case name, e.g. "grinning-face" */
  name: string;
  /** Actual unicode emoji character(s), e.g. "😀" */
  emoji: string;
  category: StaticEmojiCategory;
  /** Alternate short names an emoji can be looked up / searched by. */
  aliases: string[];
  /** Additional search terms (mood, synonyms, etc). */
  keywords: string[];
  /** Unicode code point label, e.g. "U+1F600" */
  unicode: string;
}

export interface EmojiCategoryDefinition {
  id: EmojiCategory;
  label: string;
}

export interface DhritiEmojiPickerProps {
  /** Called when the user picks an emoji from the grid. */
  onSelect?: (emoji: EmojiDefinition) => void;
  /** Currently selected emoji name, for controlled highlighting. */
  value?: string | null;
  /** Show the search input. Defaults to true. */
  searchable?: boolean;
  /** Show the "Frequently Used" section. Defaults to true. */
  showFrequentlyUsed?: boolean;
  /** Show the "Recent" section. Defaults to true. */
  showRecent?: boolean;
  /** Category selected/scrolled to on mount. */
  initialCategory?: EmojiCategory;
  /** Max number of recent emojis to track and display. Defaults to 24. */
  recentLimit?: number;
  /** Max number of frequently used emojis to display. Defaults to 24. */
  frequentlyUsedLimit?: number;
  disabled?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
  /** Width of the picker surface in pixels. Defaults to 340. */
  width?: number;
  /** Height of the picker surface in pixels. Defaults to 380. */
  height?: number;
  /**
   * Play a smooth vector (Lottie) animation for each emoji on hover, instead
   * of a static glyph. Animations are fetched lazily (only on hover) and
   * cached, so this has no upfront cost. Defaults to true.
   */
  animated?: boolean;
}

export interface DhritiEmojiProps {
  /** Canonical emoji name or alias, e.g. "grinning-face" or "+1" */
  name: string;
  size?: number | string;
  title?: string;
  className?: string;
  sx?: SxProps<Theme>;
  /** Rendered when the emoji name cannot be resolved. */
  fallback?: ReactNode;
  /**
   * Render a smooth vector (Lottie) animation instead of the static unicode
   * glyph. The animation is fetched lazily and cached; if it fails to load,
   * this falls back to the static glyph automatically. Defaults to false.
   */
  animated?: boolean;
  /**
   * When `animated` is true, only fetch/play the animation on hover (and
   * replay it on each subsequent hover) instead of autoplaying once on
   * mount. Defaults to false.
   */
  playOnHover?: boolean;
}
