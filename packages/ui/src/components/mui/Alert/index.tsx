/**
 * Alert Component for Dhriti UI
 * 
 * Enterprise-grade alert component with:
 * - Multiple variants (filled, outlined)
 * - Severity levels (success, error, warning, info)
 * - Description support
 * - Action buttons
 * - Dismiss functionality
 * - Full theme integration
 * - Accessibility compliance
 */

"use client";

import React, { forwardRef, useState, type ReactNode, type HTMLAttributes } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import { styled, type SxProps, type Theme } from "@mui/material/styles";
import {
  CheckCircleOutlineRounded as CheckCircleOutlineIcon,
  Close as CloseIcon,
  ErrorOutlineRounded as ErrorOutlineIcon,
  InfoOutlined as InfoOutlinedIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";

export type AlertVariant = "filled" | "outlined";
export type AlertSeverity = "success" | "error" | "warning" | "info";

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  /**
   * Alert content (title).
   */
  children?: ReactNode;

  /**
   * Alert severity determines the color and icon.
   * @default "info"
   */
  severity?: AlertSeverity;

  /**
   * Alert variant.
   * @default "filled"
   */
  variant?: AlertVariant;

  /**
   * Optional description text shown below the title.
   */
  description?: ReactNode;

  /**
   * Action button(s) shown on the right side.
   */
  action?: ReactNode;

  /**
   * Show dismiss button.
   * @default false
   */
  dismissible?: boolean;

  /**
   * Callback when dismiss button is clicked.
   */
  onDismiss?: () => void;

  /**
   * Control the open state (for controlled dismiss).
   */
  open?: boolean;

  /**
   * Default open state (for uncontrolled dismiss).
   * @default true
   */
  defaultOpen?: boolean;

  /**
   * Show icon.
   * @default true
   */
  showIcon?: boolean;

  /**
   * Custom icon.
   */
  icon?: ReactNode;

  /**
   * Custom role for accessibility.
   * Automatically set based on severity if not provided.
   */
  role?: string;

  /**
   * Full width alert.
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Custom styles.
   */
  sx?: SxProps<Theme> | any;
}

// ============================================================================
// ICONS
// ============================================================================

const severityIcons: Record<AlertSeverity, ReactNode> = {
  success: <CheckCircleOutlineIcon fontSize="inherit" />,
  error: <ErrorOutlineIcon fontSize="inherit" />,
  warning: <WarningAmberIcon fontSize="inherit" />,
  info: <InfoOutlinedIcon fontSize="inherit" />,
};

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

interface StyledAlertProps {
  customseverity: AlertSeverity;
  customvariant: AlertVariant;
  showIcon: boolean;
  fullWidth: boolean;
}

const getSeverityColors = (severity: AlertSeverity, mode: "light" | "dark" = "light") => {
  const colors = {
    success: {
      light: {
        filled: {
          bg: "#ECFDF5",
          border: "#10B981",
          text: "#065F46",
          icon: "#10B981",
        },
        outlined: {
          bg: "#FFFFFF",
          border: "#10B981",
          text: "#065F46",
          icon: "#10B981",
        },
      },
      dark: {
        filled: {
          bg: "#064E3B",
          border: "#10B981",
          text: "#D1FAE5",
          icon: "#10B981",
        },
        outlined: {
          bg: "#064E3B",
          border: "#10B981",
          text: "#D1FAE5",
          icon: "#10B981",
        },
      },
    },
    error: {
      light: {
        filled: {
          bg: "#FEF2F2",
          border: "#EF4444",
          text: "#991B1B",
          icon: "#EF4444",
        },
        outlined: {
          bg: "#FFFFFF",
          border: "#EF4444",
          text: "#991B1B",
          icon: "#EF4444",
        },
      },
      dark: {
        filled: {
          bg: "#7F1D1D",
          border: "#EF4444",
          text: "#FEE2E2",
          icon: "#EF4444",
        },
        outlined: {
          bg: "#7F1D1D",
          border: "#EF4444",
          text: "#FEE2E2",
          icon: "#EF4444",
        },
      },
    },
    warning: {
      light: {
        filled: {
          bg: "#FFFBEB",
          border: "#F59E0B",
          text: "#92400E",
          icon: "#F59E0B",
        },
        outlined: {
          bg: "#FFFFFF",
          border: "#F59E0B",
          text: "#92400E",
          icon: "#F59E0B",
        },
      },
      dark: {
        filled: {
          bg: "#78350F",
          border: "#F59E0B",
          text: "#FEF3C7",
          icon: "#F59E0B",
        },
        outlined: {
          bg: "#78350F",
          border: "#F59E0B",
          text: "#FEF3C7",
          icon: "#F59E0B",
        },
      },
    },
    info: {
      light: {
        filled: {
          bg: "#EFF6FF",
          border: "#06B6D4",
          text: "#0E7490",
          icon: "#06B6D4",
        },
        outlined: {
          bg: "#FFFFFF",
          border: "#06B6D4",
          text: "#0E7490",
          icon: "#06B6D4",
        },
      },
      dark: {
        filled: {
          bg: "#164E63",
          border: "#06B6D4",
          text: "#CFFAFE",
          icon: "#06B6D4",
        },
        outlined: {
          bg: "#164E63",
          border: "#06B6D4",
          text: "#CFFAFE",
          icon: "#06B6D4",
        },
      },
    },
  };

  return colors[severity][mode];
};

const AlertRoot = styled(Paper, {
  shouldForwardProp: (prop) =>
    prop !== "customseverity" && prop !== "customvariant" && prop !== "showIcon" && prop !== "fullWidth",
})<StyledAlertProps>(({ theme, customseverity, customvariant, showIcon, fullWidth }) => {
  const mode = theme.palette.mode;
  const colors = getSeverityColors(customseverity, mode as "light" | "dark");
  const colorSet = customvariant === "filled" ? colors.filled : colors.outlined;

  return {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: theme.spacing(3, 4),
    width: fullWidth ? "100%" : "auto",
    minWidth: fullWidth ? undefined : 320,
    maxWidth: "100%",
    backgroundColor: colorSet.bg,
    border: customvariant === "outlined" ? `2px solid ${colorSet.border}` : "none",
    borderLeft: customvariant === "filled" ? `4px solid ${colorSet.border}` : undefined,
    borderRadius: theme.shape?.borderRadius ?? 8,
    boxShadow: customvariant === "filled" ? theme.shadows[1] : "none",
    color: colorSet.text,
    position: "relative",
    transition: theme.transitions.create(["opacity", "transform", "max-height"], {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }),

    // Icon container
    "& .DhritiAlert-icon": {
      display: showIcon ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      color: colorSet.icon,
      fontSize: 24,
      flexShrink: 0,
    },

    // Content container
    "& .DhritiAlert-content": {
      flex: 1,
      minWidth: 0,
    },

    // Title
    "& .DhritiAlert-title": {
      fontWeight: 600,
      fontSize: theme.typography.body1.fontSize,
      lineHeight: 1.5,
      marginBottom: 0,
    },

    // Description
    "& .DhritiAlert-description": {
      marginTop: theme.spacing(1),
      fontSize: theme.typography.body2.fontSize,
      lineHeight: 1.5,
      opacity: 0.9,
    },

    // Action container
    "& .DhritiAlert-action": {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginLeft: theme.spacing(2),
      flexShrink: 0,
    },

    // Dismiss button
    "& .DhritiAlert-dismiss": {
      marginLeft: theme.spacing(2),
      color: "inherit",
      opacity: 0.7,
      "&:hover": {
        opacity: 1,
        backgroundColor: "transparent",
      },
    },
  };
});

// ============================================================================
// COMPONENT
// ============================================================================

export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    children,
    severity = "info",
    variant = "filled",
    description,
    action,
    dismissible = false,
    onDismiss,
    open: controlledOpen,
    defaultOpen = true,
    showIcon = true,
    icon,
    role,
    fullWidth = true,
    sx,
    ...props
  },
  ref,
) {
  // Controlled/uncontrolled state
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleDismiss = () => {
    setInternalOpen(false);
    onDismiss?.();
  };

  // Determine role based on severity
  const getRole = () => {
    if (role) return role;
    switch (severity) {
      case "error":
        return "alert";
      case "warning":
        return "alert";
      case "success":
        return "status";
      case "info":
        return "status";
      default:
        return "region";
    }
  };

  // Get icon based on severity or custom icon
  const displayIcon = icon !== undefined ? icon : severityIcons[severity];

  return (
    <Collapse in={isOpen} timeout="auto">
      <AlertRoot
        ref={ref}
        customseverity={severity}
        customvariant={variant}
        showIcon={showIcon}
        fullWidth={fullWidth}
        role={getRole()}
        sx={sx}
        {...props}
      >
        {/* Icon */}
        {showIcon && (
          <Box className="DhritiAlert-icon" aria-hidden="true">
            {displayIcon}
          </Box>
        )}

        {/* Content */}
        <Box className="DhritiAlert-content">
          {/* Title */}
          {children && (
            <Typography
              className="DhritiAlert-title"
              variant="body1"
              component="div"
            >
              {children}
            </Typography>
          )}

          {/* Description */}
          {description && (
            <Typography
              className="DhritiAlert-description"
              variant="body2"
              component="div"
            >
              {description}
            </Typography>
          )}
        </Box>

        {/* Action */}
        {action && (
          <Box className="DhritiAlert-action">{action}</Box>
        )}

        {/* Dismiss button */}
        {dismissible && (
          <IconButton
            className="DhritiAlert-dismiss"
            size="small"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            edge="end"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </AlertRoot>
    </Collapse>
  );
});

Alert.displayName = "Alert";
