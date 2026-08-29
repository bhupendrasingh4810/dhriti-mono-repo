import type { ThemeOptions } from "@mui/material/styles";

export const typographyTokens = {
  fontFamily:
    '"Inter", "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
  monoFontFamily:
    '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const typography: ThemeOptions["typography"] = {
  fontFamily: typographyTokens.fontFamily,
  h1: { fontSize: "2rem", lineHeight: 1.25, fontWeight: 700 },
  h2: { fontSize: "1.75rem", lineHeight: 1.3, fontWeight: 700 },
  h3: { fontSize: "1.5rem", lineHeight: 1.35, fontWeight: 600 },
  h4: { fontSize: "1.25rem", lineHeight: 1.4, fontWeight: 600 },
  h5: { fontSize: "1.125rem", lineHeight: 1.45, fontWeight: 600 },
  h6: { fontSize: "1rem", lineHeight: 1.45, fontWeight: 600 },
  subtitle1: { fontSize: "1rem", lineHeight: 1.5, fontWeight: 500 },
  subtitle2: { fontSize: "0.875rem", lineHeight: 1.45, fontWeight: 500 },
  body1: { fontSize: "0.95rem", lineHeight: 1.55, fontWeight: 400 },
  body2: { fontSize: "0.875rem", lineHeight: 1.5, fontWeight: 400 },
  caption: { fontSize: "0.75rem", lineHeight: 1.45, fontWeight: 400 },
  overline: {
    fontSize: "0.7rem",
    lineHeight: 1.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontWeight: 600,
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
    letterSpacing: "0.01em",
    fontSize: "0.875rem",
    lineHeight: 1.35,
  },
};
