export const RECENT_EMOJIS_STORAGE_KEY = "dhriti:emoji-picker:recent";
export const FREQUENTLY_USED_EMOJIS_STORAGE_KEY = "dhriti:emoji-picker:usage";

export const DEFAULT_RECENT_LIMIT = 24;
export const DEFAULT_FREQUENTLY_USED_LIMIT = 24;

/** Safety cap on how much usage/recent history we persist, regardless of configured limit. */
export const MAX_STORED_HISTORY = 100;
