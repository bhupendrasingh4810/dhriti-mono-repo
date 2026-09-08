import type { PaletteMode, PaletteOptions } from "@mui/material/styles";

export type SurfaceScale = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  surfaceSelected: string;
};

export type TextScale = {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
};

export type BorderScale = {
  border: string;
  borderSubtle: string;
  borderStrong: string;
};

export type InteractiveScale = {
  interactive: string;
  interactiveHover: string;
  interactiveActive: string;
  interactiveFocus: string;
  interactiveDisabled: string;
};

export type StatusScale = {
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: string;
};

export type SemanticPalette = {
  brand: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  surface: SurfaceScale;
  text: TextScale;
  border: BorderScale;
  interactive: InteractiveScale;
  status: StatusScale;
};

export const lightPaletteTokens: SemanticPalette = {
  brand: "#036c5f",
  primary: "#036c5f",
  secondary: "#475569", // Cool slate gray
  success: "#70C748", // Soft emerald
  warning: "#F6B51E", // Soft amber
  error: "#EF4444",   // Soft rose/red
  info: "#539BFF",    // Cool sky blue
  surface: {
    background: "#F4F7F6", // Muted mint-tinted gray
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceHover: "#EBF1F0",     // Cool teal-tinted hover
    surfaceSelected: "#E0F2F1",  // Soft teal selection
  },
  text: {
    primary: "#0F172A",    // Deep slate blue-black
    secondary: "#475569",  // Muted gray-blue
    disabled: "#94A3B8",   // Clear disabled slate
    inverse: "#F8FAFC",
  },
  border: {
    border: "#CFDCDA",       // Soft cool gray border
    borderSubtle: "#E5ECEB", // Very light divider
    borderStrong: "#28a99e", // Accent brand border
  },
  interactive: {
    interactive: "#036c5f",
    interactiveHover: "#037c6e",
    interactiveActive: "#025043",
    interactiveFocus: "#048c7f",
    interactiveDisabled: "#94A3B8",
  },
  status: {
    success: "#15803d",
    warning: "#b45309",
    error: "#be123c",
    info: "#0369a1",
    neutral: "#64748B",
  },
};

export const darkPaletteTokens: SemanticPalette = {
  ...lightPaletteTokens,
  brand: "#05998c",
  primary: "#048c7f",
  secondary: "#94A3B8",
  surface: {
    background: "#0B0F12",       // Rich dark teal-slate
    surface: "#12181B",          // Balanced deep surface
    surfaceElevated: "#1A2326",  // Elevated layer
    surfaceHover: "#1D282C",
    surfaceSelected: "#025043",  // Selected row deep variant
  },
  text: {
    primary: "#E2E8F0",
    secondary: "#94A3B8",
    disabled: "#475569",
    inverse: "#0B0F12",
  },
  border: {
    border: "#202E33",
    borderSubtle: "#172226",
    borderStrong: "#4fb9af",
  },
  interactive: {
    interactive: "#05998c",
    interactiveHover: "#28a99e",
    interactiveActive: "#4fb9af",
    interactiveFocus: "#b3e0dc",
    interactiveDisabled: "#475569",
  },
};

export function getPaletteTokens(mode: PaletteMode): SemanticPalette {
  return mode === "dark" ? darkPaletteTokens : lightPaletteTokens;
}

export function createMuiPalette(mode: PaletteMode, tokens: SemanticPalette): PaletteOptions {
  return {
    mode,
    primary: {
      main: tokens.primary,
      contrastText: tokens.text.inverse,
    },
    secondary: {
      main: tokens.secondary,
      contrastText: tokens.text.inverse,
    },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error: { main: tokens.error },
    info: { main: tokens.info },
    background: {
      default: tokens.surface.background,
      paper: tokens.surface.surface,
    },
    text: {
      primary: tokens.text.primary,
      secondary: tokens.text.secondary,
      disabled: tokens.text.disabled,
    },
    divider: tokens.border.borderSubtle,
  };
}
