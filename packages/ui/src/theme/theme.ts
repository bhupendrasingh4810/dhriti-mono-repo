import { breakpoints } from "./breakpoints";
import { densityScale, type DensityMode } from "./density";
import { getPaletteTokens, type PaletteMode, type SemanticPalette } from "./palette";
import { radius } from "./shape";
import { elevation } from "./shadows";
import { spacing, spacingAliases, spacingScale } from "./spacing";
import { transitions } from "./transitions";
import { typography, typographyTokens } from "./typography";
import { zIndex } from "./zIndex";

export type DesignTokens = {
  color: SemanticPalette;
  spacing: typeof spacingScale & typeof spacingAliases;
  radius: typeof radius;
  elevation: typeof elevation;
  typography: typeof typographyTokens;
  density: ReturnType<typeof getDensityTokens>;
};

export type AppTheme = {
  mode: PaletteMode;
  breakpoints: typeof breakpoints;
  density: ReturnType<typeof getDensityTokens>;
  tokens: DesignTokens;
  transitions: typeof transitions;
  typography: typeof typography;
  zIndex: typeof zIndex;
};

export type CreateThemeOptions = {
  mode?: PaletteMode;
  density?: DensityMode;
};

export function getDensityTokens(density: DensityMode) {
  return {
    mode: density,
    ...densityScale[density],
  };
}

export function createAppTheme({ mode = "light", density = "comfortable" }: CreateThemeOptions = {}): AppTheme {
  const color = getPaletteTokens(mode);
  const densityTokens = getDensityTokens(density);

  return {
    mode,
    breakpoints,
    density: densityTokens,
    tokens: {
      color,
      spacing: {
        ...spacingScale,
        ...spacingAliases,
      },
      radius,
      elevation,
      typography: typographyTokens,
      density: densityTokens,
    },
    transitions,
    typography,
    zIndex,
  };
}

export const theme = createAppTheme();
export const lightTheme = createAppTheme({ mode: "light" });
export const darkTheme = createAppTheme({ mode: "dark" });
export const compactTheme = createAppTheme({ density: "compact" });
export const spaciousTheme = createAppTheme({ density: "spacious" });

export function getSystemPreferredMode(): PaletteMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function createSystemTheme(options: Omit<CreateThemeOptions, "mode"> = {}): AppTheme {
  return createAppTheme({
    ...options,
    mode: getSystemPreferredMode(),
  });
}

export class ThemeBuilder {
  private options: CreateThemeOptions = {};

  mode(mode: PaletteMode): ThemeBuilder {
    this.options.mode = mode;
    return this;
  }

  density(density: DensityMode): ThemeBuilder {
    this.options.density = density;
    return this;
  }

  build(): AppTheme {
    return createAppTheme(this.options);
  }
}

export {
  breakpoints,
  densityScale,
  radius,
  elevation,
  spacing,
  spacingAliases,
  spacingScale,
  transitions,
  typography,
  typographyTokens,
  zIndex,
};

export type { DensityMode, PaletteMode, SemanticPalette };
