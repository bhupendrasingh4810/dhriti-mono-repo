/**
 * Tooltip Component for Dhriti UI
 *
 * Enterprise-grade Tooltip component with:
 * - Light (white) and Dark (black) variants + semantic color themes
 * - 3 responsive width sizes (small, medium, large) + custom maxWidth
 * - Standard and multi-directional placements with custom offsets
 * - Rich enterprise content (title, description, keyboard shortcuts, icons, actions)
 * - Modern typography, elevation shadows, crisp arrows, and accessibility compliance
 */

"use client";

import {
  forwardRef,
  type ReactNode,
  type ReactElement,
  type CSSProperties,
} from "react";
import MuiTooltip, {
  type TooltipProps as MuiTooltipProps,
  tooltipClasses,
} from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { alpha, styled, useTheme } from "@mui/material/styles";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TooltipVariant =
  | "dark"
  | "light"
  | "white"
  | "black"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "error";

export type TooltipSize = "small" | "medium" | "large" | "sm" | "md" | "lg";

export type TooltipPlacement = MuiTooltipProps["placement"];

export interface TooltipProps
  extends Omit<MuiTooltipProps, "title" | "size"> {
  /**
   * Tooltip main title or content
   */
  title: ReactNode;

  /**
   * Optional secondary descriptive text below the title
   */
  description?: ReactNode;

  /**
   * Visual theme variant (light/white vs dark/black or semantic color)
   * @default "dark"
   */
  variant?: TooltipVariant;

  /**
   * Color alias for variant
   */
  color?: TooltipVariant;

  /**
   * Width size preset
   * - small: 180px maxWidth (compact badges, single words)
   * - medium: 280px maxWidth (standard help text)
   * - large: 420px maxWidth (multi-line descriptions, rich cards)
   * @default "medium"
   */
  size?: TooltipSize;

  /**
   * Custom maximum width in pixels or CSS unit
   */
  maxWidth?: number | string;

  /**
   * Keyboard shortcut hint (e.g. "⌘K", "Ctrl+S", "Del")
   */
  shortcut?: string | string[];

  /**
   * Leading icon inside the tooltip
   */
  icon?: ReactNode;

  /**
   * Optional action button or link inside the tooltip (automatically enables interactive mode)
   */
  action?: ReactNode;

  /**
   * Whether tooltip allows user mouse interaction (hovering over content, clicking action/link)
   * @default true if action is provided, otherwise false
   */
  interactive?: boolean;

  /**
   * Whether to show an arrow pointer
   * @default true
   */
  arrow?: boolean;

  /**
   * Target element
   */
  children: ReactElement<any, any>;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const sizeTokens: Record<
  "small" | "medium" | "large",
  {
    maxWidth: number;
    fontSize: string;
    descriptionFontSize: string;
    padding: string;
    borderRadius: number;
    gap: number;
  }
> = {
  small: {
    maxWidth: 180,
    fontSize: "0.75rem",
    descriptionFontSize: "0.6875rem",
    padding: "5px 9px",
    borderRadius: 6,
    gap: 0.5,
  },
  medium: {
    maxWidth: 280,
    fontSize: "0.8125rem",
    descriptionFontSize: "0.75rem",
    padding: "8px 12px",
    borderRadius: 8,
    gap: 0.75,
  },
  large: {
    maxWidth: 420,
    fontSize: "0.875rem",
    descriptionFontSize: "0.8125rem",
    padding: "12px 16px",
    borderRadius: 10,
    gap: 1,
  },
};

function normalizeSize(size?: TooltipSize): "small" | "medium" | "large" {
  if (size === "small" || size === "sm") return "small";
  if (size === "large" || size === "lg") return "large";
  return "medium";
}

// ============================================================================
// STYLED TOOLTIP COMPONENT
// ============================================================================

interface StyledTooltipOwnerProps {
  customvariant: TooltipVariant;
  customsize: "small" | "medium" | "large";
  custommaxwidth?: number | string;
}

const StyledMuiTooltip = styled(
  ({
    className,
    ownerState,
    ...props
  }: MuiTooltipProps & { ownerState: StyledTooltipOwnerProps }) => (
    <MuiTooltip
      {...props}
      classes={{
        ...props.classes,
        popper: [props.classes?.popper, className].filter(Boolean).join(" "),
      }}
    />
  ),
  {
    shouldForwardProp: (prop) => prop !== "ownerState",
  },
)<{ ownerState: StyledTooltipOwnerProps }>(({ theme, ownerState }) => {
  const { customvariant, customsize, custommaxwidth } = ownerState;
  const token = sizeTokens[customsize];
  const isLight = customvariant === "light" || customvariant === "white";
  const isDark =
    customvariant === "dark" ||
    customvariant === "black" ||
    (!isLight && !["primary", "info", "success", "warning", "error"].includes(customvariant));

  // Determine Palette Colors
  let bg = "#18181b"; // Deep modern zinc-900 for dark
  let fg = "#ffffff";
  let border = "rgba(255, 255, 255, 0.12)";
  let arrowBorder = "rgba(255, 255, 255, 0.12)";
  let shadow = "0 8px 24px rgba(0, 0, 0, 0.28)";

  if (isLight) {
    bg = theme.palette.background.paper;
    fg = theme.palette.text.primary;
    border = alpha(theme.palette.divider, 0.9);
    arrowBorder = alpha(theme.palette.divider, 0.9);
    shadow = "0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)";
  } else if (customvariant === "primary") {
    bg = theme.palette.primary.main;
    fg = theme.palette.primary.contrastText;
    border = alpha(theme.palette.primary.dark, 0.3);
    arrowBorder = alpha(theme.palette.primary.dark, 0.3);
    shadow = `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`;
  } else if (customvariant === "info") {
    bg = theme.palette.info.main;
    fg = theme.palette.info.contrastText;
    border = alpha(theme.palette.info.dark, 0.3);
    arrowBorder = alpha(theme.palette.info.dark, 0.3);
    shadow = `0 8px 24px ${alpha(theme.palette.info.main, 0.35)}`;
  } else if (customvariant === "success") {
    bg = theme.palette.success.main;
    fg = theme.palette.success.contrastText;
    border = alpha(theme.palette.success.dark, 0.3);
    arrowBorder = alpha(theme.palette.success.dark, 0.3);
    shadow = `0 8px 24px ${alpha(theme.palette.success.main, 0.35)}`;
  } else if (customvariant === "warning") {
    bg = theme.palette.warning.main;
    fg = theme.palette.warning.contrastText;
    border = alpha(theme.palette.warning.dark, 0.3);
    arrowBorder = alpha(theme.palette.warning.dark, 0.3);
    shadow = `0 8px 24px ${alpha(theme.palette.warning.main, 0.35)}`;
  } else if (customvariant === "error") {
    bg = theme.palette.error.main;
    fg = theme.palette.error.contrastText;
    border = alpha(theme.palette.error.dark, 0.3);
    arrowBorder = alpha(theme.palette.error.dark, 0.3);
    shadow = `0 8px 24px ${alpha(theme.palette.error.main, 0.35)}`;
  }

  return {
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: bg,
      color: fg,
      boxShadow: shadow,
      border: `1px solid ${border}`,
      fontSize: token.fontSize,
      fontWeight: 500,
      padding: token.padding,
      borderRadius: token.borderRadius,
      maxWidth: custommaxwidth ?? token.maxWidth,
      lineHeight: 1.45,
      letterSpacing: "0.01em",
      boxSizing: "border-box",
    },
    [`& .${tooltipClasses.arrow}`]: {
      color: bg,
      "&:before": {
        border: `1px solid ${arrowBorder}`,
        boxSizing: "border-box",
      },
    },
  };
});

// ============================================================================
// MAIN ENTERPRISE TOOLTIP COMPONENT
// ============================================================================

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    title,
    description,
    variant = "light",
    color,
    size = "medium",
    maxWidth,
    shortcut,
    icon,
    action,
    arrow = true,
    placement = "top",
    interactive,
    children,
    ...props
  },
  ref,
) {
  const theme = useTheme();
  const resolvedVariant = color ?? variant;
  const resolvedSize = normalizeSize(size);
  const isLight = resolvedVariant === "light" || resolvedVariant === "white";

  // Shortcut pills formatting
  const shortcuts = Array.isArray(shortcut)
    ? shortcut
    : shortcut
    ? [shortcut]
    : [];

  const hasRichContent = Boolean(description || shortcuts.length > 0 || icon || action);

  const token = sizeTokens[resolvedSize];

  // Render Tooltip Body Content
  const tooltipContent = hasRichContent ? (
    <Box sx={{ display: "flex", flexDirection: "column", gap: token.gap }}>
      {/* Header Line (Icon + Title + Shortcut Badges) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.25,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                fontSize: "1rem",
                color: "inherit",
                opacity: 0.9,
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            component="span"
            sx={{
              fontWeight: 700,
              fontSize: token.fontSize,
              lineHeight: 1.3,
              color: "inherit",
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Shortcuts */}
        {shortcuts.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0, ml: 1 }}>
            {shortcuts.map((sc, scIdx) => (
              <Box
                key={scIdx}
                component="kbd"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  px: 0.6,
                  py: 0.15,
                  borderRadius: "4px",
                  border: isLight
                    ? `1px solid ${alpha(theme.palette.divider, 0.9)}`
                    : "1px solid rgba(255, 255, 255, 0.2)",
                  bgcolor: isLight
                    ? alpha(theme.palette.action.hover, 0.08)
                    : "rgba(255, 255, 255, 0.12)",
                  color: "inherit",
                  lineHeight: 1.2,
                }}
              >
                {sc}
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Description Text */}
      {description && (
        <Typography
          variant="body2"
          sx={{
            fontSize: token.descriptionFontSize,
            opacity: isLight ? 0.8 : 0.85,
            color: isLight ? "text.secondary" : "inherit",
            lineHeight: 1.4,
          }}
        >
          {description}
        </Typography>
      )}

      {/* Action Slot */}
      {action && (
        <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          {action}
        </Box>
      )}
    </Box>
  ) : (
    title
  );

  const ownerState: StyledTooltipOwnerProps = {
    customvariant: resolvedVariant,
    customsize: resolvedSize,
    custommaxwidth: maxWidth,
  };

  const isInteractive = interactive ?? Boolean(action);

  return (
    <StyledMuiTooltip
      ref={ref}
      title={tooltipContent}
      arrow={arrow}
      placement={placement}
      disableInteractive={!isInteractive}
      ownerState={ownerState}
      {...props}
    >
      {children}
    </StyledMuiTooltip>
  );
});

Tooltip.displayName = "Tooltip";

/**
 * Convenience helper for light/white styled tooltips
 */
export const LightTooltip = forwardRef<HTMLDivElement, TooltipProps>(
  function LightTooltip(props, ref) {
    return <Tooltip ref={ref} variant="light" {...props} />;
  },
);

LightTooltip.displayName = "LightTooltip";

export const WhiteTooltip = LightTooltip;

