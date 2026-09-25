"use client";

import { Suspense, lazy, useState } from "react";
import { Box } from "@mui/material";
import { getEmojiByName } from "../data/emojiRegistry";
import { useAnimatedEmoji } from "../hooks/useAnimatedEmoji";
import type { DhritiEmojiProps } from "../types/emoji.types";

// Code-split: lottie-react is only downloaded when an emoji is actually animated.
const AnimatedEmojiPlayer = lazy(() => import("./AnimatedEmojiPlayer"));

function humanizeEmojiName(name: string): string {
  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Renders a single emoji by its canonical name (or alias), resolved through
 * the internal emoji registry. Renders a real unicode character by default;
 * pass `animated` to render a smooth vector (Lottie) animation instead,
 * fetched lazily and cached, with an automatic static-glyph fallback.
 */
export function DhritiEmoji({
  name,
  size = 24,
  title,
  className,
  sx,
  fallback = null,
  animated = false,
  playOnHover = false,
}: DhritiEmojiProps) {
  const definition = getEmojiByName(name);
  const [hoverKey, setHoverKey] = useState(0);

  const shouldLoadAnimation = animated && Boolean(definition) && (!playOnHover || hoverKey > 0);
  const { animationData, hasError } = useAnimatedEmoji(definition?.unicode, shouldLoadAnimation);

  if (!definition) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[@dhriti/emoji-picker] Unknown emoji name: "${name}"`);
    }
    return <>{fallback}</>;
  }

  const showAnimation = shouldLoadAnimation && Boolean(animationData) && !hasError;

  return (
    <Box
      component="span"
      role="img"
      aria-label={title ?? humanizeEmojiName(definition.name)}
      className={className}
      onMouseEnter={playOnHover ? () => setHoverKey((previous) => previous + 1) : undefined}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        fontSize: size,
        lineHeight: 1,
        ...sx,
      }}
    >
      {showAnimation && animationData ? (
        <Suspense fallback={definition.emoji}>
          <AnimatedEmojiPlayer
            key={playOnHover ? hoverKey : "autoplay"}
            animationData={animationData}
            size={size}
            autoplay
          />
        </Suspense>
      ) : (
        definition.emoji
      )}
    </Box>
  );
}
