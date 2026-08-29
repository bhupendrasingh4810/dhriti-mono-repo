import type { Components, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

import type { DensityMode } from "./density";
import { densityScale } from "./density";

type ThemeWithTokens = Theme;

export function createComponentOverrides(density: DensityMode): Components<ThemeWithTokens> {
  const scale = densityScale[density];

  return {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        "*, *::before, *::after": { boxSizing: "border-box" },
        body: {
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "::selection": {
          backgroundColor: alpha(theme.palette.primary.main, 0.3),
          color: theme.palette.text.primary,
        },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true, variant: "contained" },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.tokens.radius.medium,
          minHeight: scale.controlHeight,
          paddingInline: theme.spacing(1.75),
          "&.MuiButton-containedPrimary": {
            color: "#111827",
            "&:hover": {
              backgroundColor: theme.palette.primary.main,
              filter: "brightness(0.96)",
            },
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.tokens.color.border.border,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.tokens.color.border.borderSubtle}`,
          borderRadius: theme.tokens.radius.large,
          boxShadow: "none",
        }),
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: theme.tokens.radius.xl,
          border: `1px solid ${theme.tokens.color.border.border}`,
          boxShadow: theme.tokens.elevation.overlay,
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.tokens.color.border.borderSubtle}`,
          paddingTop: scale.tableCellPaddingY,
          paddingBottom: scale.tableCellPaddingY,
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: ({ theme }) => ({
          backgroundColor: theme.palette.primary.main,
          height: 3,
          borderRadius: 999,
        }),
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.mode === "dark" ? "#0B1220" : "#111827",
          color: "#F9FAFB",
        }),
      },
    },
  };
}
