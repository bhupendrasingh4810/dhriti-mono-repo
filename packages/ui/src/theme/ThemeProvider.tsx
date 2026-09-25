"use client";

import * as React from "react";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import type { PaletteMode } from "@mui/material/styles";

import type { DensityMode } from "./density";
import { createAppTheme } from "./theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  mode?: PaletteMode | "system";
  density?: DensityMode;
}

export function ThemeProvider({ children, mode = "system", density = "comfortable" }: ThemeProviderProps) {
  const [resolvedMode, setResolvedMode] = React.useState<PaletteMode>("light");

  React.useEffect(() => {
    if (mode === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = () => setResolvedMode(media.matches ? "dark" : "light");

      apply();
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }

    setResolvedMode(mode);
    return undefined;
  }, [mode]);

  const theme = React.useMemo(() => createAppTheme({ mode: resolvedMode, density }), [resolvedMode, density]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
}
