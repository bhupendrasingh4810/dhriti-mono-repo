/**
 * Button Component for Dhriti UI
 * 
 * A comprehensive wrapper around MUI Button with enhanced features
 * for loading states, icon-only buttons, and FAB variants.
 */

"use client";

import { forwardRef, type ReactNode } from "react";
import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { styled, useTheme } from "@mui/material/styles";

export type ButtonLoadingPosition = "start" | "end" | "center";
export type ButtonVariant = "contained" | "outlined" | "text" | "fab";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps
  extends Omit<
    MuiButtonProps,
    "variant" | "size" | "loading" | "loadingPosition" | "loadingIndicator"
  > {
  /**
   * Button variant.
   * @default "contained"
   */
  variant?: ButtonVariant;

  /**
   * Button size.
   * @default "medium"
   */
  size?: ButtonSize;

  /**
   * Shows a loading indicator and disables the button.
   */
  loading?: boolean;

  /**
   * Optional text/content displayed while loading.
   */
  loadingText?: ReactNode;

  /**
   * Custom loading indicator.
   */
  loader?: ReactNode;

  /**
   * Position of the loading indicator.
   * @default "start"
   */
  loadingPosition?: ButtonLoadingPosition;

  /**
   * Renders the button as an icon-only button.
   */
  iconOnly?: boolean;

  /**
   * Icon used when `iconOnly` is true or for standalone icon display.
   */
  icon?: ReactNode;

  /**
   * FAB variant (circular floating action button).
   */
  fab?: boolean;
}

// Styled FAB Button
const FabButton = styled(MuiButton, {
  shouldForwardProp: (prop) => prop !== "fab",
})<Pick<ButtonProps, "size">>(
  ({ theme, size = "medium" }) => {
    const dimension = theme.density.buttonHeight[size];

    return {
      minWidth: dimension,
      width: dimension,
      height: dimension,
      borderRadius: theme.tokens.radius.pill,
      padding: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: theme.tokens.elevation.low,
      transition: theme.transitions.create(["box-shadow", "transform"], {
        duration: theme.transitions.duration.short,
      }),
      "&:hover": {
        boxShadow: theme.tokens.elevation.medium,
        transform: "translateY(-2px)",
      },
      "&:active": {
        transform: "translateY(0)",
      },
    };
  }
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "contained",
    size = "medium",
    color = "primary",
    loading = false,
    loadingText,
    loader,
    loadingPosition = "start",
    iconOnly = false,
    icon,
    fab = false,
    startIcon,
    endIcon,
    disabled,
    sx,
    ...props
  },
  ref,
) {
  const theme = useTheme();

  // Determine if this is a FAB button
  const isFab = fab || variant === "fab";

  // Loading indicator
  const loadingIndicator =
    loader ?? (
      <CircularProgress
        size={theme.density.buttonLoaderSize[size]}
        color="inherit"
      />
    );

  // Content to display
  const content = loading && loadingText !== undefined ? loadingText : children;

  // Resolve icons based on loading state and icon-only mode
  const resolvedStartIcon =
    loading && loadingPosition === "start"
      ? loadingIndicator
      : iconOnly || isFab
        ? undefined
        : startIcon;

  const resolvedEndIcon =
    loading && loadingPosition === "end"
      ? loadingIndicator
      : iconOnly || isFab
        ? undefined
        : endIcon;

  // Button is disabled when explicitly disabled or loading
  const isDisabled = disabled || loading;

  // For FAB or icon-only buttons, use icon as children if no children provided
  const renderChildren = () => {
    if (isFab || iconOnly) {
      return icon || children;
    }
    return content;
  };

  // Custom styles for different variants
  const getSx = () => {
    const styles = [];

    // FabButton owns the shared, token-driven floating button dimensions.
    if (isFab) {
      return [
        ...(Array.isArray(sx) ? sx : [sx]),
      ];
    }

    // Icon-only button styles
    if (iconOnly) {
      styles.push((currentTheme) => ({
        minWidth: currentTheme.density.buttonHeight[size],
        width: currentTheme.density.buttonHeight[size],
        height: currentTheme.density.buttonHeight[size],
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }));
    }

    // Center loading indicator styles
    if (loading && loadingPosition === "center") {
      styles.push({
        position: "relative",
        "& .DhritiButton-content": {
          opacity: 0,
        },
        "& .DhritiButton-loader": {
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      });
    }

    // Add custom sx
    if (sx) {
      styles.push(...(Array.isArray(sx) ? sx : [sx]));
    }

    return styles;
  };

  const finalSx = getSx();

  // Render FAB button
  if (isFab) {
    return (
      <FabButton
        ref={ref}
        variant="contained"
        size={size}
        color={color}
        disabled={isDisabled}
        sx={finalSx}
        {...props}
      >
        {loading ? (
          <span className="DhritiButton-loader">{loadingIndicator}</span>
        ) : (
          <span className="DhritiButton-content">{renderChildren()}</span>
        )}
      </FabButton>
    );
  }

  // Render regular button
  return (
    <MuiButton
      ref={ref}
      variant={variant}
      size={size}
      color={color}
      disabled={isDisabled}
      startIcon={resolvedStartIcon}
      endIcon={resolvedEndIcon}
      sx={finalSx}
      {...props}
    >
      <span className="DhritiButton-content">
        {renderChildren()}
      </span>

      {loading && loadingPosition === "center" && (
        <span
          className="DhritiButton-loader"
          aria-hidden="true"
        >
          {loadingIndicator}
        </span>
      )}
    </MuiButton>
  );
});

Button.displayName = "Button";