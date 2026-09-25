"use client";

import Lottie from "lottie-react";
import type { LottieAnimationData } from "../hooks/useAnimatedEmoji";

interface AnimatedEmojiPlayerProps {
  animationData: LottieAnimationData;
  size: number | string;
  autoplay: boolean;
}

/**
 * Thin wrapper around `lottie-react`, isolated into its own module so it is
 * only downloaded (code-split) when an emoji is actually animated.
 */
export default function AnimatedEmojiPlayer({ animationData, size, autoplay }: AnimatedEmojiPlayerProps) {
  return (
    <Lottie animationData={animationData} loop={false} autoplay={autoplay} style={{ width: size, height: size }} />
  );
}
