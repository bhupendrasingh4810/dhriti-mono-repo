/**
 * Chip Component for Dhriti UI
 * 
 * Enterprise-grade chip component with:
 * - Filled and outlined variants
 * - Custom icons
 * - Disabled state
 * - Multiple sizes
 * - Clickable chips
 * - Deletable chips
 * - Full theme integration
 * - Accessibility compliance
 */

"use client";

import { forwardRef, type ReactNode, type HTMLAttributes } from "react";
import MuiChip, { type ChipProps as MuiChipProps } from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";

export type ChipVariant = "filled" | "outlined";
export type ChipSize = "small" | "medium" | "large";
export type ChipColor = "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";

export interface ChipProps extends Omit<MuiChipProps, "variant" | "size" | "color"> {
  /**
   * Chip label.
   */
  label?: ReactNode;

  /**
   * Chip variant.
   * @default "filled"
   */
  variant?: ChipVariant;

  /**
   * Chip size.
   * @default "medium"
   */
  size?: ChipSize;

  /**
   * Chip color.
   * @default "default"
   */
  color?: ChipColor;

  /**
   * Custom icon at the start.
   */
  startIcon?: ReactNode;

  /**
   * Custom icon at the end.
   */
  endIcon?: ReactNode;

  /**
   * Show check icon (for selected state).
   * @default false
   */
  checked?: boolean;

  /**
   * Custom delete icon.
   */
  deleteIcon?: ReactNode;

  /**
   * Delete icon position.
   * @default "end"
   */
  deleteIconPosition?: "start" | "end";

  /**
   * Disabled state.
   * @default false
   */
  disabled?: boolean;

  /**
   * Full width chip.
   * @default false
   */
  fullWidth?: boolean;
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const chipSizes: Record<ChipSize, { height: number; fontSize: string; padding: string }> = {
  small: { height: 24, fontSize: "0.75rem", padding: "2px 8px" },
  medium: { height: 32, fontSize: "0.875rem", padding: "4px 12px" },
  large: { height: 40, fontSize: "1rem", padding: "6px 16px" },
};

// ============================================================================
// STYLED COMPONENT
// ============================================================================

interface StyledChipProps {
  chipvariant: ChipVariant;
  chipsize: ChipSize;
  chipcolor: ChipColor;
  chipdisabled: boolean;
  chipfullwidth: boolean;
}

const StyledChip = styled(MuiChip, {
  shouldForwardProp: (prop) =>
    prop !== "chipvariant" &&
    prop !== "chipsize" &&
    prop !== "chipcolor" &&
    prop !== "chipdisabled" &&
    prop !== "chipfullwidth",
})<StyledChipProps>(({ theme, chipvariant, chipsize, chipcolor, chipdisabled, chipfullwidth }) => {
  const sizeConfig = chipSizes[chipsize];

  // Get color based on variant
  const getColorStyles = () => {
    const colorMap: Record<ChipColor, any> = {
      default: {
        filled: {
          backgroundColor: theme.palette.grey[100],
          color: theme.palette.text.primary,
          borderColor: theme.palette.grey[200],
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.text.primary,
          borderColor: theme.palette.grey[300],
        },
      },
      primary: {
        filled: {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderColor: theme.palette.primary.main,
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
        },
      },
      secondary: {
        filled: {
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          borderColor: theme.palette.secondary.main,
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.secondary.main,
          borderColor: theme.palette.secondary.main,
        },
      },
      error: {
        filled: {
          backgroundColor: theme.palette.error.main,
          color: theme.palette.error.contrastText,
          borderColor: theme.palette.error.main,
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
        },
      },
      info: {
        filled: {
          backgroundColor: theme.palette.info.main,
          color: theme.palette.info.contrastText,
          borderColor: theme.palette.info.main,
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.info.main,
          borderColor: theme.palette.info.main,
        },
      },
      success: {
        filled: {
          backgroundColor: theme.palette.success.main,
          color: theme.palette.success.contrastText,
          borderColor: theme.palette.success.main,
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.success.main,
          borderColor: theme.palette.success.main,
        },
      },
      warning: {
        filled: {
          backgroundColor: theme.palette.warning.main,
          color: theme.palette.warning.contrastText,
          borderColor: theme.palette.warning.main,
        },
        outlined: {
          backgroundColor: "transparent",
          color: theme.palette.warning.main,
          borderColor: theme.palette.warning.main,
        },
      },
    };

    return colorMap[chipcolor][chipvariant];
  };

  const colorStyles = getColorStyles();

  return {
    height: sizeConfig.height,
    fontSize: sizeConfig.fontSize,
    padding: sizeConfig.padding,
    fontWeight: 500,
    borderRadius: theme.tokens.radius.pill,
    borderWidth: chipvariant === "outlined" ? 1.5 : 0,
    borderStyle: "solid",
    borderColor: colorStyles.borderColor,
    backgroundColor: colorStyles.backgroundColor,
    color: colorStyles.color,
    width: chipfullwidth ? "100%" : "auto",
    opacity: chipdisabled ? 0.5 : 1,
    cursor: chipdisabled ? "not-allowed" : "pointer",
    transition: theme.transitions.create(["all"], {
      duration: theme.transitions.duration.fast,
    }),

    // Icon styles
    "& .MuiChip-icon": {
      color: "inherit",
      fontSize: chipsize === "small" ? 16 : chipsize === "large" ? 20 : 18,
    },

    // Avatar styles
    "& .MuiChip-avatar": {
      width: chipsize === "small" ? 20 : chipsize === "large" ? 28 : 24,
      height: chipsize === "small" ? 20 : chipsize === "large" ? 28 : 24,
      fontSize: chipsize === "small" ? "0.625rem" : chipsize === "large" ? "0.875rem" : "0.75rem",
    },

    // Delete icon styles
    "& .MuiChip-deleteIcon": {
      color: "inherit",
      opacity: 0.7,
      "&:hover": {
        opacity: 1,
      },
    },

    // Clickable chip hover
    ...(chipvariant === "outlined" && !chipdisabled && {
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
        borderColor: colorStyles.borderColor,
      },
    }),

    // Disabled state
    ...(chipdisabled && {
      pointerEvents: "none",
    }),
  };
});

// ============================================================================
// COMPONENT
// ============================================================================

export const Chip = forwardRef<HTMLDivElement, ChipProps>(function Chip(
  {
    label,
    variant = "filled",
    size = "medium",
    color = "default",
    startIcon,
    endIcon,
    checked = false,
    deleteIcon: customDeleteIcon,
    deleteIconPosition = "end",
    disabled = false,
    fullWidth = false,
    onDelete,
    onClick,
    icon,
    avatar,
    sx,
    ...props
  },
  ref,
) {
  // Determine icons
  const iconToShow = checked ? <CheckIcon /> : startIcon || icon;
  const endIconToShow = endIcon;

  // Delete icon
  const deleteIcon = customDeleteIcon || <CloseIcon fontSize="small" />;

  return (
    <StyledChip
      ref={ref}
      label={label}
      variant="outlined" // Use outlined as base, we handle styling ourselves
      size={size}
      chipvariant={variant}
      chipsize={size}
      chipcolor={color}
      chipdisabled={disabled}
      chipfullwidth={fullWidth}
      icon={iconToShow}
      avatar={avatar}
      deleteIcon={onDelete ? deleteIcon : undefined}
      onDelete={onDelete}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      sx={sx}
      {...props}
    />
  );
});

Chip.displayName = "Chip";
