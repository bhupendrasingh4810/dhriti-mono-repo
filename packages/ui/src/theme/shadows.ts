import type { PaletteMode, Shadows } from "@mui/material/styles";

export const elevation = {
  none: "none",
  subtle: "0 1px 2px rgba(16, 24, 40, 0.06)",
  low: "0 4px 10px rgba(16, 24, 40, 0.08)",
  medium: "0 8px 24px rgba(16, 24, 40, 0.12)",
  high: "0 16px 36px rgba(16, 24, 40, 0.16)",
  overlay: "0 24px 48px rgba(16, 24, 40, 0.22)",
} as const;

export function createMuiShadows(mode: PaletteMode): Shadows {
  const shadowColor = mode === "dark" ? "rgba(0, 0, 0, 0.5)" : "rgba(16, 24, 40, 0.12)";

  return Array.from({ length: 25 }).map((_, i) => {
    if (i === 0) return "none";
    return `0 ${i}px ${i * 2}px -${Math.floor(i / 3)}px ${shadowColor}`;
  }) as Shadows;
}
