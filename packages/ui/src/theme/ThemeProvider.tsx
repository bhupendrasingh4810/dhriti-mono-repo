"use client";

import * as React from "react";

import type { DensityMode } from "./density";

type ThemeMode = "light" | "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
  mode?: ThemeMode | "system";
  density?: DensityMode;
}

export function ThemeProvider({ children, mode = "system", density = "comfortable" }: ThemeProviderProps) {
  React.useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolvedMode = mode === "system" ? (media.matches ? "dark" : "light") : mode;
      root.dataset.theme = resolvedMode;
      root.dataset.density = density;
    };

    apply();
    if (mode === "system") {
      media.addEventListener("change", apply);
    }

    return () => media.removeEventListener("change", apply);
  }, [density, mode]);

  return children;
}
