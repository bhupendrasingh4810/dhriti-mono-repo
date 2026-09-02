/**
 * Maps our internal "U+XXXX" unicode label to the Noto animated-emoji CDN
 * asset URL (Google-hosted, public, CORS-enabled, long-lived cache headers).
 *
 * This lets us play smooth vector (Lottie) emoji animations without
 * bundling any animation assets in this package or the consuming app.
 */
const NOTO_ANIMATED_EMOJI_BASE_URL = "https://fonts.gstatic.com/s/e/notoemoji/latest";

export function getAnimatedEmojiUrl(unicode: string): string | null {
  const match = unicode.match(/^U\+([0-9A-F]+)$/i);
  if (!match) return null;

  const codepoint = match[1].toLowerCase();
  return `${NOTO_ANIMATED_EMOJI_BASE_URL}/${codepoint}/lottie.json`;
}
