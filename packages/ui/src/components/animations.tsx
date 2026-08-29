"use client";

import { Box, keyframes, styled } from "@mui/material";

const fadeUp = keyframes({
  "0%": {
    opacity: 0,
    transform: "translateY(24px) scale(0.985)",
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0) scale(1)",
  },
});

const float = keyframes({
  "0%, 100%": {
    transform: "translateY(0px)",
  },
  "50%": {
    transform: "translateY(-8px)",
  },
});

const pulseGlow = keyframes({
  "0%, 100%": {
    boxShadow: "0 0 0 rgba(253, 216, 53, 0)",
  },
  "50%": {
    boxShadow: "0 0 30px rgba(253, 216, 53, 0.28)",
  },
});

const shimmer = keyframes({
  "0%": {
    backgroundPosition: "-200% 0",
  },
  "100%": {
    backgroundPosition: "200% 0",
  },
});

export type RevealProps = {
  delay?: number;
  duration?: number;
};

export const Reveal = styled(Box, {
  shouldForwardProp: (prop) => prop !== "delay" && prop !== "duration",
})<RevealProps>(({ delay = 0, duration = 0.55 }) => ({
  opacity: 0,
  animation: `${fadeUp} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
  animationDelay: `${delay}s`,
}));

export const FloatCard = styled(Box)(() => ({
  animation: `${float} 6s ease-in-out infinite`,
  transformOrigin: "center",
}));

export const GlowButtonWrap = styled(Box)(() => ({
  animation: `${pulseGlow} 2.4s ease-in-out infinite`,
}));

export const ShimmerPanel = styled(Box)(() => ({
  background: "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(253,216,53,0.25) 45%, rgba(255,255,255,0.1) 100%)",
  backgroundSize: "200% 100%",
  animation: `${shimmer} 2.2s linear infinite`,
}));
