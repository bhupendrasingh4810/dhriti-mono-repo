import { createTheme, type PaletteMode } from "@mui/material/styles";

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

export type CreateThemeOptions = {
	mode?: PaletteMode;
	density?: DensityMode;
};

export function createAppTheme(options: CreateThemeOptions = {}) {
	const mode = options.mode ?? "light";
	const density = options.density ?? "comfortable";
	const colorTokens = getPaletteTokens(mode);
	const densityTokens = getDensityTokens(density);

	const base = createTheme({
		breakpoints,
		spacing,
		shape,
		zIndex,
		transitions,
		typography,
		shadows: createMuiShadows(mode),
		palette: {
			...createMuiPalette(mode, colorTokens),
			surfaces: colorTokens.surface,
			borders: colorTokens.border,
			interactive: colorTokens.interactive,
			status: colorTokens.status,
		},
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

	return createTheme(base, {
		components: createComponentOverrides(density),
	});
}

export const theme = createAppTheme({ mode: "light" });
export const lightTheme = createAppTheme({ mode: "light" });
export const darkTheme = createAppTheme({ mode: "dark" });