// src/theme/components.ts
import { alpha, type Components, type Theme } from "@mui/material/styles";
import { type DensityMode } from "./density";

export function createComponentOverrides(density: DensityMode): Components<Omit<Theme, "components">> {
	const isCompact = density === "compact";
	const isSpacious = density === "spacious";
	const controlPadding = isCompact ? "4px 10px" : isSpacious ? "8px 16px" : "6px 14px";
	const inputPadding = isCompact ? "7px 10px" : isSpacious ? "12px 14px" : "10px 12px";
	const menuItemPadding = isCompact ? "4px 8px" : isSpacious ? "10px 14px" : "8px 12px";
	const iconButtonSize = isCompact ? 32 : isSpacious ? 44 : 38;
	const avatarSize = isCompact ? 24 : isSpacious ? 40 : 32;
	const baseRadius = (theme: Omit<Theme, "components">) => theme.tokens.radius.md;
	const smallRadius = (theme: Omit<Theme, "components">) => theme.tokens.radius.sm;
	const largeRadius = (theme: Omit<Theme, "components">) => theme.tokens.radius.lg;
	const pillRadius = (theme: Omit<Theme, "components">) => theme.tokens.radius.pill;

	return {
		MuiCssBaseline: {
			styleOverrides: (theme) => ({
				":root": {
					colorScheme: theme.palette.mode,
				},
				"*, *::before, *::after": {
					boxSizing: "border-box",
				},
				html: {
					WebkitFontSmoothing: "antialiased",
					MozOsxFontSmoothing: "grayscale",
				},
				body: {
					backgroundColor: theme.palette.background.default,
					color: theme.palette.text.primary,
					fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
					textRendering: "optimizeLegibility",
					scrollbarWidth: "thin",
					scrollbarColor: `${theme.palette.borders.border} transparent`,
				},
				"::selection": {
					backgroundColor: alpha(theme.palette.interactive.interactive, 0.22),
					color: theme.palette.text.primary,
				},
				"a, button, input, textarea, select": {
					font: "inherit",
				},
				"::-webkit-scrollbar": {
					width: isCompact ? "6px" : "8px",
					height: isCompact ? "6px" : "8px",
				},
				"::-webkit-scrollbar-thumb": {
					backgroundColor: theme.palette.borders.border,
					borderRadius: pillRadius(theme),
					"&:hover": {
						backgroundColor: theme.palette.borders.borderStrong,
					},
				},
			}),
		},

		MuiPaper: {
			defaultProps: {
				elevation: 0,
			},
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surface,
					borderColor: theme.palette.borders.borderSubtle,
					backgroundImage: "none", // Removes forced linear gradients in dark mode
				}),
			},
		},

		MuiAppBar: {
			defaultProps: {
				elevation: 0,
				color: "default",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: alpha(theme.palette.surfaces.surfaceElevated, 0.92),
					backgroundImage: "none",
					backdropFilter: "blur(12px)",
					borderBottom: `1px solid ${theme.palette.borders.borderSubtle}`,
					color: theme.palette.text.primary,
				}),
			},
		},

		MuiDrawer: {
			styleOverrides: {
				paper: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surface,
					backgroundImage: "none",
					borderColor: theme.palette.borders.borderSubtle,
				}),
			},
		},

		MuiCard: {
			defaultProps: {
				variant: "outlined",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surface,
					borderColor: theme.palette.borders.border,
					borderRadius: baseRadius(theme),
					padding: theme.spacing(theme.density.cardPadding / 4),
					transition: theme.transitions.create(["box-shadow", "border-color"], { duration: 150 }),
					"&:hover": {
						borderColor: theme.palette.borders.borderStrong,
					},
				}),
			},
		},

		MuiCardContent: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: theme.spacing(theme.density.cardPadding / 4),
					"&:last-child": {
						paddingBottom: theme.spacing(theme.density.cardPadding / 4),
					},
				}),
			},
		},

		MuiAccordion: {
			defaultProps: {
				disableGutters: true,
				elevation: 0,
			},
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surface,
					backgroundImage: "none",
					border: `1px solid ${theme.palette.borders.borderSubtle}`,
					borderRadius: baseRadius(theme),
					"&::before": {
						display: "none",
					},
					"&.Mui-expanded": {
						margin: 0,
					},
				}),
			},
		},
		MuiAccordionSummary: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.controlHeight,
					paddingInline: theme.spacing(1.5),
					"&.Mui-expanded": {
						minHeight: theme.density.controlHeight,
					},
				}),
				content: {
					marginBlock: 0,
					"&.Mui-expanded": {
						marginBlock: 0,
					},
				},
			},
		},
		MuiAccordionDetails: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: theme.spacing(1.5),
					borderTop: `1px solid ${theme.palette.borders.borderSubtle}`,
				}),
			},
		},

		MuiButton: {
			defaultProps: {
				disableElevation: true,
				size: isCompact ? "small" : "medium",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.controlHeight,
					textTransform: "none",
					fontWeight: theme.typography.fontWeightMedium,
					borderRadius: baseRadius(theme),
					padding: controlPadding,
					lineHeight: 1.4,
					transition: theme.transitions.create(["background-color", "border-color", "box-shadow", "color"], { duration: 120 }),
					"&.Mui-focusVisible": {
						boxShadow: `0 0 0 3px ${alpha(theme.palette.interactive.interactiveFocus, 0.22)}`,
					},
				}),
				contained: ({ theme }) => ({
					backgroundColor: theme.palette.interactive.interactive,
					color: theme.tokens.color.text.inverse,
					"&:hover": {
						backgroundColor: theme.palette.interactive.interactiveHover,
					},
					"&:active": {
						backgroundColor: theme.palette.interactive.interactiveActive,
					},
				}),
				outlined: ({ theme }) => ({
					borderColor: theme.palette.borders.border,
					color: theme.palette.text.primary,
					backgroundColor: theme.palette.surfaces.surface,
					"&:hover": {
						borderColor: theme.palette.borders.borderStrong,
						backgroundColor: theme.palette.surfaces.surfaceHover,
					},
				}),
				text: ({ theme }) => ({
					color: theme.palette.interactive.interactive,
					"&:hover": {
						backgroundColor: alpha(theme.palette.interactive.interactive, 0.08),
					},
				}),
			},
		},

		MuiIconButton: {
			defaultProps: {
				size: isCompact ? "small" : "medium",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					width: iconButtonSize,
					height: iconButtonSize,
					borderRadius: baseRadius(theme),
					color: theme.palette.text.secondary,
					transition: theme.transitions.create(["background-color", "color", "box-shadow"], { duration: 120 }),
					"&:hover": {
						backgroundColor: theme.palette.surfaces.surfaceHover,
						color: theme.palette.text.primary,
					},
					"&.Mui-focusVisible": {
						boxShadow: `0 0 0 3px ${alpha(theme.palette.interactive.interactiveFocus, 0.22)}`,
					},
				}),
			},
		},

		MuiFab: {
			defaultProps: {
				color: "primary",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					boxShadow: theme.shadows[8],
					"&:hover": {
						boxShadow: theme.shadows[10],
					},
				}),
			},
		},

		MuiInputBase: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.controlHeight,
					borderRadius: baseRadius(theme),
					fontSize: isCompact ? theme.typography.body2.fontSize : theme.typography.body1.fontSize,
					backgroundColor: theme.palette.surfaces.surface,
					transition: theme.transitions.create(["border-color", "box-shadow"], { duration: 120 }),
				}),
			},
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: ({ theme }) => ({
					"& .MuiOutlinedInput-notchedOutline": {
						borderColor: theme.palette.borders.border,
						transition: theme.transitions.create("border-color", { duration: 120 }),
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: theme.palette.borders.borderStrong,
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: theme.palette.interactive.interactive,
						borderWidth: "1.5px",
					},
					"&.Mui-focused": {
						boxShadow: `0 0 0 3px ${alpha(theme.palette.interactive.interactiveFocus, 0.18)}`,
					},
				}),
				input: {
					padding: inputPadding,
				},
			},
		},
		MuiTextField: {
			defaultProps: {
				size: isCompact ? "small" : "medium",
			},
		},
		MuiFormLabel: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.text.secondary,
					fontWeight: theme.typography.fontWeightMedium,
					"&.Mui-focused": {
						color: theme.palette.interactive.interactive,
					},
				}),
			},
		},
		MuiFormHelperText: {
			styleOverrides: {
				root: ({ theme }) => ({
					marginInline: 0,
					color: theme.palette.text.secondary,
				}),
			},
		},
		MuiCheckbox: {
			defaultProps: {
				size: isCompact ? "small" : "medium",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.text.secondary,
					"&.Mui-checked, &.MuiCheckbox-indeterminate": {
						color: theme.palette.interactive.interactive,
					},
				}),
			},
		},
		MuiRadio: {
			defaultProps: {
				size: isCompact ? "small" : "medium",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.text.secondary,
					"&.Mui-checked": {
						color: theme.palette.interactive.interactive,
					},
				}),
			},
		},
		MuiSwitch: {
			styleOverrides: {
				switchBase: ({ theme }) => ({
					"&.Mui-checked": {
						color: theme.palette.interactive.interactive,
						"& + .MuiSwitch-track": {
							backgroundColor: theme.palette.interactive.interactive,
							opacity: 0.45,
						},
					},
				}),
				thumb: {
					boxShadow: "none",
				},
				track: ({ theme }) => ({
					backgroundColor: theme.palette.borders.borderStrong,
					opacity: 0.35,
				}),
			},
		},
		MuiSlider: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.interactive.interactive,
				}),
				thumb: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surface,
					border: `2px solid ${theme.palette.interactive.interactive}`,
					boxShadow: theme.shadows[1],
				}),
				rail: ({ theme }) => ({
					backgroundColor: theme.palette.borders.border,
					opacity: 1,
				}),
			},
		},
		MuiRating: {
			styleOverrides: {
				iconFilled: ({ theme }) => ({
					color: theme.palette.warning.main,
				}),
				iconHover: ({ theme }) => ({
					color: theme.palette.warning.dark,
				}),
			},
		},
		MuiToggleButtonGroup: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: 2,
					border: `1px solid ${theme.palette.borders.borderSubtle}`,
					borderRadius: baseRadius(theme),
					backgroundColor: theme.palette.surfaces.surfaceHover,
				}),
			},
		},
		MuiToggleButton: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.controlHeight - 4,
					border: 0,
					borderRadius: smallRadius(theme),
					padding: controlPadding,
					color: theme.palette.text.secondary,
					textTransform: "none",
					"&.Mui-selected": {
						backgroundColor: theme.palette.surfaces.surface,
						color: theme.palette.interactive.interactive,
						boxShadow: theme.shadows[1],
					},
				}),
			},
		},

		MuiTable: {
			styleOverrides: {
				root: {
					borderCollapse: "separate",
				},
			},
		},
		MuiTableCell: {
			styleOverrides: {
				root: ({ theme }) => ({
					paddingBlock: theme.spacing(theme.density.tableCellPaddingY / 4),
					paddingInline: theme.spacing(isCompact ? 2 : 3),
					fontSize: isCompact ? "0.8125rem" : "0.875rem",
					borderBottom: `1px solid ${theme.palette.borders.borderSubtle}`,
					color: theme.palette.text.primary,
				}),
				head: ({ theme }) => ({
					fontWeight: theme.typography.fontWeightBold,
					backgroundColor: theme.palette.surfaces.surfaceHover,
					color: theme.palette.text.secondary,
					textTransform: "uppercase",
					fontSize: "0.75rem",
					letterSpacing: "0.05em",
				}),
			},
		},
		MuiTableContainer: {
			styleOverrides: {
				root: ({ theme }) => ({
					border: `1px solid ${theme.palette.borders.borderSubtle}`,
					borderRadius: baseRadius(theme),
					backgroundColor: theme.palette.surfaces.surface,
				}),
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: ({ theme }) => ({
					transition: theme.transitions.create(["background-color"], { duration: 100 }),
					"&:hover": {
						backgroundColor: theme.palette.surfaces.surfaceHover,
					},
					"&.Mui-selected": {
						backgroundColor: theme.palette.surfaces.surfaceSelected,
						"&:hover": {
							backgroundColor: theme.palette.surfaces.surfaceSelected,
						},
					},
				}),
			},
		},
		MuiList: {
			styleOverrides: {
				root: ({ theme }) => ({
					paddingBlock: theme.spacing(0.5),
				}),
			},
		},
		MuiListItemButton: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.listItemMinHeight,
					borderRadius: baseRadius(theme),
					color: theme.palette.text.primary,
					"&:hover": {
						backgroundColor: theme.palette.surfaces.surfaceHover,
					},
					"&.Mui-selected": {
						backgroundColor: theme.palette.surfaces.surfaceSelected,
						color: theme.palette.interactive.interactive,
						"&:hover": {
							backgroundColor: theme.palette.surfaces.surfaceSelected,
						},
					},
				}),
			},
		},
		MuiListItemText: {
			styleOverrides: {
				primary: ({ theme }) => ({
					fontSize: isCompact ? theme.typography.body2.fontSize : theme.typography.body1.fontSize,
					fontWeight: theme.typography.fontWeightMedium,
				}),
				secondary: ({ theme }) => ({
					fontSize: theme.typography.caption.fontSize,
					color: theme.palette.text.secondary,
				}),
			},
		},

		MuiPopover: {
			defaultProps: {
				elevation: 4,
			},
			styleOverrides: {
				paper: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surfaceElevated,
					border: `1px solid ${theme.palette.borders.border}`,
					boxShadow: theme.shadows[4],
					borderRadius: baseRadius(theme),
					padding: theme.spacing(0.5),
				}),
			},
		},
		MuiMenu: {
			defaultProps: {
				elevation: 4,
			},
			styleOverrides: {
				paper: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surfaceElevated,
					border: `1px solid ${theme.palette.borders.border}`,
					boxShadow: theme.shadows[4],
					borderRadius: baseRadius(theme),
					padding: theme.spacing(0.5),
				}),
			},
		},
		MuiMenuList: {
			styleOverrides: {
				root: {
					paddingBlock: 0,
				},
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.menuItemMinHeight,
					borderRadius: smallRadius(theme),
					padding: menuItemPadding,
					fontSize: isCompact ? "0.8125rem" : "0.875rem",
					gap: theme.spacing(1),
					color: theme.palette.text.primary,
					"&:hover": {
						backgroundColor: theme.palette.surfaces.surfaceHover,
					},
					"&.Mui-selected": {
						backgroundColor: theme.palette.surfaces.surfaceSelected,
						color: theme.palette.interactive.interactive,
						fontWeight: 500,
						"&:hover": {
							backgroundColor: theme.palette.surfaces.surfaceSelected,
						},
					},
				}),
			},
		},
		MuiTabs: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.controlHeight,
					borderBottom: `1px solid ${theme.palette.borders.borderSubtle}`,
				}),
				indicator: ({ theme }) => ({
					height: 2,
					borderRadius: pillRadius(theme),
					backgroundColor: theme.palette.interactive.interactive,
				}),
			},
		},
		MuiTab: {
			styleOverrides: {
				root: ({ theme }) => ({
					minHeight: theme.density.controlHeight,
					padding: controlPadding,
					color: theme.palette.text.secondary,
					fontWeight: theme.typography.fontWeightMedium,
					textTransform: "none",
					"&.Mui-selected": {
						color: theme.palette.interactive.interactive,
					},
				}),
			},
		},
		MuiPaginationItem: {
			styleOverrides: {
				root: ({ theme }) => ({
					borderRadius: baseRadius(theme),
					"&.Mui-selected": {
						backgroundColor: theme.palette.interactive.interactive,
						color: theme.tokens.color.text.inverse,
						"&:hover": {
							backgroundColor: theme.palette.interactive.interactiveHover,
						},
					},
				}),
			},
		},
		MuiBreadcrumbs: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.text.secondary,
				}),
				separator: ({ theme }) => ({
					color: theme.palette.text.disabled,
				}),
			},
		},
		MuiLink: {
			defaultProps: {
				underline: "hover",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.interactive.interactive,
					fontWeight: theme.typography.fontWeightMedium,
					textDecorationColor: alpha(theme.palette.interactive.interactive, 0.45),
				}),
			},
		},

		MuiAlert: {
			defaultProps: {
				variant: "outlined",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					borderRadius: baseRadius(theme),
					alignItems: "center",
					"&.MuiAlert-outlinedSuccess": {
						backgroundColor: alpha(theme.palette.success.main, 0.08),
					},
					"&.MuiAlert-outlinedWarning": {
						backgroundColor: alpha(theme.palette.warning.main, 0.08),
					},
					"&.MuiAlert-outlinedError": {
						backgroundColor: alpha(theme.palette.error.main, 0.08),
					},
					"&.MuiAlert-outlinedInfo": {
						backgroundColor: alpha(theme.palette.info.main, 0.08),
					},
				}),
			},
		},
		MuiChip: {
			defaultProps: {
				size: "small",
			},
			styleOverrides: {
				root: ({ theme }) => ({
					borderRadius: smallRadius(theme),
					fontWeight: 600,
					fontSize: "0.75rem",
				}),
				filled: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surfaceHover,
					color: theme.palette.text.secondary,
					border: `1px solid ${theme.palette.borders.borderSubtle}`,
				}),
			},
		},
		MuiBadge: {
			styleOverrides: {
				badge: ({ theme }) => ({
					fontWeight: theme.typography.fontWeightBold,
					backgroundColor: theme.palette.interactive.interactive,
					color: theme.tokens.color.text.inverse,
				}),
			},
		},
		MuiAvatar: {
			styleOverrides: {
				root: ({ theme }) => ({
					width: avatarSize,
					height: avatarSize,
					fontSize: "0.875rem",
					fontWeight: theme.typography.fontWeightBold,
					backgroundColor: theme.palette.interactive.interactive,
					color: theme.tokens.color.text.inverse,
					border: `2px solid ${theme.palette.surfaces.surface}`,
				}),
			},
		},
		MuiTooltip: {
			defaultProps: {
				arrow: true,
			},
			styleOverrides: {
				tooltip: ({ theme }) => ({
					backgroundColor: theme.palette.text.primary,
					borderRadius: smallRadius(theme),
					color: theme.tokens.color.text.inverse,
					fontSize: theme.typography.caption.fontSize,
					fontWeight: theme.typography.fontWeightMedium,
				}),
				arrow: ({ theme }) => ({
					color: theme.palette.text.primary,
				}),
			},
		},
		MuiDialog: {
			defaultProps: {
				fullWidth: true,
				maxWidth: "sm",
			},
			styleOverrides: {
				paper: ({ theme }) => ({
					backgroundColor: theme.palette.surfaces.surfaceElevated,
					backgroundImage: "none",
					border: `1px solid ${theme.palette.borders.border}`,
					borderRadius: largeRadius(theme),
					boxShadow: theme.shadows[16],
				}),
			},
		},
		MuiDialogTitle: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: theme.spacing(2, 2.5, 1),
					fontWeight: theme.typography.fontWeightBold,
				}),
			},
		},
		MuiDialogContent: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: theme.spacing(1, 2.5, 2),
				}),
			},
		},
		MuiDialogActions: {
			styleOverrides: {
				root: ({ theme }) => ({
					padding: theme.spacing(1.5, 2.5, 2),
					gap: theme.spacing(1),
				}),
			},
		},
		MuiSnackbar: {
			defaultProps: {
				autoHideDuration: 5000,
			},
		},
		MuiSkeleton: {
			styleOverrides: {
				root: ({ theme }) => ({
					backgroundColor: alpha(theme.palette.interactive.interactive, 0.08),
					borderRadius: baseRadius(theme),
				}),
			},
		},
		MuiLinearProgress: {
			styleOverrides: {
				root: ({ theme }) => ({
					height: isCompact ? 6 : 8,
					borderRadius: pillRadius(theme),
					backgroundColor: theme.palette.surfaces.surfaceHover,
				}),
				bar: ({ theme }) => ({
					borderRadius: pillRadius(theme),
					backgroundColor: theme.palette.interactive.interactive,
				}),
			},
		},
		MuiCircularProgress: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.interactive.interactive,
				}),
			},
		},
		MuiStepper: {
			styleOverrides: {
				root: ({ theme }) => ({
					color: theme.palette.text.secondary,
				}),
			},
		},
		MuiStepLabel: {
			styleOverrides: {
				label: ({ theme }) => ({
					color: theme.palette.text.secondary,
					fontWeight: theme.typography.fontWeightMedium,
					"&.Mui-active, &.Mui-completed": {
						color: theme.palette.text.primary,
					},
				}),
			},
		},
	};
}
