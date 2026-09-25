"use client";

import { useEffect, useState } from "react";
import { getAnimatedEmojiUrl } from "../utils/getAnimatedEmojiUrl";

export type LottieAnimationData = Record<string, unknown>;

/** Module-level caches shared across all component instances/mounts. */
const animationCache = new Map<string, LottieAnimationData>();
const inflightRequests = new Map<string, Promise<LottieAnimationData>>();

export interface UseAnimatedEmojiResult {
  animationData: LottieAnimationData | null;
  hasError: boolean;
}

/**
 * Lazily fetches (and caches, in-memory + via the browser HTTP cache) the
 * Lottie animation for a given "U+XXXX" unicode value. Does nothing until
 * `enabled` is true, so hover-triggered playback never fetches ahead of time.
 */
export function useAnimatedEmoji(unicode: string | undefined, enabled: boolean): UseAnimatedEmojiResult {
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(
    unicode ? (animationCache.get(unicode) ?? null) : null,
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!enabled || !unicode) return;

    const cached = animationCache.get(unicode);
    if (cached) {
      setAnimationData(cached);
      return;
    }

    const url = getAnimatedEmojiUrl(unicode);
    if (!url) {
      setHasError(true);
      return;
    }

    let cancelled = false;

    const pending =
      inflightRequests.get(unicode) ??
      fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load animated emoji (${response.status})`);
          return response.json() as Promise<LottieAnimationData>;
        })
        .then((data) => {
          animationCache.set(unicode, data);
          return data;
        });

    inflightRequests.set(unicode, pending);

    pending
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        inflightRequests.delete(unicode);
      });

    return () => {
      cancelled = true;
    };
  }, [unicode, enabled]);

  return { animationData, hasError };
}
