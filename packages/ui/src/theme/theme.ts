/**
 * Dhriti Theme
 * 
 * Enhanced version with critical fixes and enterprise features.
 * Based on your original architecture with improvements.
 */

import {
  createTheme,
  type PaletteMode,
  type ThemeOptions,
  type Theme as MuiTheme,
} from "@mui/material/styles";

import { breakpoints } from "./breakpoints";
import { createComponentOverrides } from "./components";
import { densityScale, type DensityMode } from "./density";
import { createMuiPalette, getPaletteTokens, type SemanticPalette } from "./palette";
import { radius, shape } from "./shape";
import { createMuiShadows, elevation } from "./shadows";
import { spacing, spacingAliases, spacingScale } from "./spacing";
import { transitions } from "./transitions";
import { typography, typographyTokens } from "./typography";
import { zIndex } from "./zIndex";

// ============================================================================
// TYPES
// ============================================================================

export type DesignTokens = {
  color: SemanticPalette;
  spacing: typeof spacingScale & typeof spacingAliases;
  radius: typeof radius;
  elevation: typeof elevation;
  typography: typeof typographyTokens;
  density: ReturnType<typeof getDensityTokens>;
};

export function getDensityTokens(density: DensityMode) {
  return {
    mode: density,
    ...densityScale[density],
  };
}

// ============================================================================
// MUI EXTENSIONS
// ============================================================================

declare module "@mui/material/styles" {
  interface Palette {
    surfaces: SemanticPalette["surface"];
    borders: SemanticPalette["border"];
    interactive: SemanticPalette["interactive"];
    status: SemanticPalette["status"];
  }

  interface PaletteOptions {
    surfaces?: SemanticPalette["surface"];
    borders?: SemanticPalette["border"];
    interactive?: SemanticPalette["interactive"];
    status?: SemanticPalette["status"];
  }

  interface Theme {
    tokens: DesignTokens;
    density: ReturnType<typeof getDensityTokens>;
  }

  interface ThemeOptions {
    tokens?: DesignTokens;
    density?: ReturnType<typeof getDensityTokens>;
  }

  interface BreakpointOverrides {
    xxl: true;
  }
}

// ============================================================================
// THEME OPTIONS
// ============================================================================

export type CreateThemeOptions = {
  mode?: PaletteMode;
  density?: DensityMode;
  /**
   * Custom theme overrides (merged with defaults)
   */
  overrides?: ThemeOptions;
  /**
   * Enable accessibility enhancements
   * @default true
   */
  accessibility?: boolean;
  /**
   * Custom component overrides (merged with component defaults)
   */
  componentOverrides?: ThemeOptions["components"];
};

// ============================================================================
// THEME FACTORY
// ============================================================================

export function createAppTheme(options: CreateThemeOptions = {}): MuiTheme {
  // Destructure with defaults
  const {
    mode = "light",
    density = "comfortable",
    overrides = {},
    accessibility = true,
    componentOverrides,
  } = options;

  // Validate inputs
  if (!["light", "dark"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be "light" or "dark".`);
  }

  if (!["compact", "comfortable", "spacious"].includes(density)) {
    throw new Error(
      `Invalid density: ${density}. Must be "compact", "comfortable", or "spacious".`
    );
  }

  // Get design tokens
  const colorTokens = getPaletteTokens(mode);
  const densityTokens = getDensityTokens(density);

  // Accessibility enhancements
  const accessibilityOptions: ThemeOptions = accessibility
    ? {
        palette: {
          contrastThreshold: 4.5, // WCAG AA
          tonalOffset: 0.05,
        },
        typography: {
          body1: {
            ...typography.body1,
            fontSize: "1rem", // Minimum 16px
          },
          body2: {
            ...typography.body2,
            fontSize: "0.875rem", // Minimum 14px
          },
          caption: {
            ...typography.caption,
            fontSize: "0.75rem", // Minimum 12px
          },
        },
      }
    : {};

  // Create base theme
  const baseTheme = createTheme({
    // Layout & structure
    breakpoints,
    spacing,
    shape: {
      ...shape,
      borderRadius: radius.md,
    },
    zIndex,

    // Visual design
    transitions: {
      ...transitions,
      duration: {
        ...transitions.duration,
        // Enterprise-standard durations
        fastest: 50,
        faster: 100,
        fast: 150,
        normal: 200,
        slow: 300,
        slower: 400,
        slowest: 500,
      },
    },

    // Typography (with accessibility if enabled)
    typography: {
      ...typography,
      ...accessibilityOptions.typography,
    },

    // Shadows
    shadows: createMuiShadows(mode),

    // Palette
    palette: {
      ...createMuiPalette(mode, colorTokens),
      ...accessibilityOptions.palette,
      // Extended namespaces
      surfaces: colorTokens.surface,
      borders: colorTokens.border,
      interactive: colorTokens.interactive,
      status: colorTokens.status,
    },

    // Design tokens
    density: densityTokens,
    tokens: {
      color: colorTokens,
      spacing: {
        ...spacingScale,
        ...spacingAliases,
      },
      radius,
      elevation,
      typography: typographyTokens,
      density: densityTokens,
    },
  });

  // Merge custom overrides
  const mergedOverrides: ThemeOptions = {
    ...overrides,
    components: {
      ...overrides.components,
      ...componentOverrides,
    },
  };

  // Apply component overrides and finalize
  const finalTheme = createTheme(baseTheme, {
    ...mergedOverrides,
    components: createComponentOverrides(density, mergedOverrides.components),
  });

  return finalTheme;
}

// ============================================================================
// PRE-BUILT THEMES
// ============================================================================

export const theme = createAppTheme({ mode: "light" });
export const lightTheme = createAppTheme({ mode: "light" });
export const darkTheme = createAppTheme({ mode: "dark" });

export const compactTheme = createAppTheme({
  mode: "light",
  density: "compact",
});

export const spaciousTheme = createAppTheme({
  mode: "light",
  density: "spacious",
});

export const highContrastTheme = createAppTheme({
  mode: "light",
  accessibility: true,
  overrides: {
    palette: {
      contrastThreshold: 7, // WCAG AAA
    },
  },
});

// ============================================================================
// UTILITIES
// ============================================================================

export function getSystemPreferredMode(): PaletteMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function createSystemTheme(
  options: Omit<CreateThemeOptions, "mode"> = {}
) {
  return createAppTheme({
    ...options,
    mode: getSystemPreferredMode(),
  });
}

// Theme builder pattern
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

  withOverrides(overrides: ThemeOptions): ThemeBuilder {
    this.options.overrides = overrides;
    return this;
  }

  withAccessibility(enabled: boolean): ThemeBuilder {
    this.options.accessibility = enabled;
    return this;
  }

  withComponentOverrides(
    components: ThemeOptions["components"]
  ): ThemeBuilder {
    this.options.componentOverrides = components;
    return this;
  }

  build(): MuiTheme {
    return createAppTheme(this.options);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

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

export type { DensityMode, SemanticPalette };