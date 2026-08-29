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
  brand: "#FDD835",
  primary: "#FDD835",
  secondary: "#1E293B",
  success: "#2E7D32",
  warning: "#ED6C02",
  error: "#D32F2F",
  info: "#0288D1",
  surface: {
    background: "#F6F7FB",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceHover: "#F4F6FA",
    surfaceSelected: "#FFF8D1",
  },
  text: {
    primary: "#111827",
    secondary: "#4B5563",
    disabled: "#9CA3AF",
    inverse: "#F9FAFB",
  },
  border: {
    border: "#D0D7E2",
    borderSubtle: "#E5EAF1",
    borderStrong: "#8A96AA",
  },
  interactive: {
    interactive: "#1F2937",
    interactiveHover: "#111827",
    interactiveActive: "#0B1220",
    interactiveFocus: "#FDD835",
    interactiveDisabled: "#CBD5E1",
  },
  status: {
    success: "#2E7D32",
    warning: "#ED6C02",
    error: "#D32F2F",
    info: "#0288D1",
    neutral: "#64748B",
  },
};

export const darkPaletteTokens: SemanticPalette = {
  ...lightPaletteTokens,
  secondary: "#CBD5E1",
  surface: {
    background: "#0F1217",
    surface: "#151A21",
    surfaceElevated: "#1A2230",
    surfaceHover: "#202938",
    surfaceSelected: "#3A3215",
  },
  text: {
    primary: "#E5E7EB",
    secondary: "#B4BFCD",
    disabled: "#7A8699",
    inverse: "#090D14",
  },
  border: {
    border: "#2D3748",
    borderSubtle: "#243042",
    borderStrong: "#536078",
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
      contrastText: "#111827",
    },
    secondary: {
      main: tokens.secondary,
      contrastText: mode === "dark" ? "#0F1217" : "#F8FAFC",
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
    divider: tokens.border.border,
  };
}
