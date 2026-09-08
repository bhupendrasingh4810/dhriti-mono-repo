/**
 * Avatar Component for Dhriti UI
 * 
 * Enterprise-grade avatar component with:
 * - Image avatars
 * - Letter/initial avatars
 * - Icon avatars
 * - Multiple variants (circular, rounded, square)
 * - Grouped avatars with overlap
 * - Badge support
 * - Multiple sizes
 * - Full theme integration
 * - Accessibility compliance
 */

"use client";

import React, { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import Box from "@mui/material/Box";
import AvatarMui from "@mui/material/Avatar";
import AvatarGroup, { AvatarGroupProps } from "@mui/material/AvatarGroup";
import Badge, { BadgeOrigin } from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import { Person as PersonIcon } from "@mui/icons-material";

export type AvatarVariant = "circular" | "rounded" | "square";
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Avatar content (letter, icon, or image src).
   */
  children?: ReactNode;

  /**
   * Image source URL.
   */
  src?: string;

  /**
   * Image alt text.
   */
  alt?: string;

  /**
   * Avatar variant (shape).
   * @default "circular"
   */
  variant?: AvatarVariant;

  /**
   * Avatar size.
   * @default "md"
   */
  size?: AvatarSize;

  /**
   * Background color for letter/icon avatars.
   */
  color?: string;

  /**
   * Text color for letter avatars.
   */
  textColor?: string;

  /**
   * Show badge indicator.
   * @default false
   */
  withBadge?: boolean;

  /**
   * Badge position.
   * @default { vertical: "top", horizontal: "right" }
   */
  badgePosition?: BadgeOrigin;

  /**
   * Badge content.
   */
  badgeContent?: ReactNode;

  /**
   * Badge color.
   * @default "success"
   */
  badgeColor?: "default" | "error" | "info" | "success" | "warning";

  /**
   * Show online status badge.
   * @default false
   */
  online?: boolean;

  /**
   * Fallback icon when image fails to load.
   * @default <PersonIcon />
   */
  fallbackIcon?: ReactNode;

  /**
   * Custom CSS properties.
   */
  sx?: CSSProperties;
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const avatarSizes: Record<AvatarSize, { width: number; height: number; fontSize: string }> = {
  xs: { width: 24, height: 24, fontSize: "0.625rem" },
  sm: { width: 32, height: 32, fontSize: "0.75rem" },
  md: { width: 40, height: 40, fontSize: "0.875rem" },
  lg: { width: 56, height: 56, fontSize: "1.125rem" },
  xl: { width: 72, height: 72, fontSize: "1.5rem" },
};

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

interface StyledAvatarProps {
  variant: AvatarVariant;
  size: AvatarSize;
  customColor?: string;
  textColor?: string;
}

const StyledAvatar = styled(AvatarMui, {
  shouldForwardProp: (prop) =>
    prop !== "variant" && prop !== "size" && prop !== "customColor" && prop !== "textColor",
})<StyledAvatarProps>(({ theme, variant, size, customColor, textColor }) => {
  const sizeConfig = avatarSizes[size];

  return {
    width: sizeConfig.width,
    height: sizeConfig.height,
    fontSize: sizeConfig.fontSize,
    fontWeight: 600,
    backgroundColor: customColor || theme.palette.primary.main,
    color: textColor || theme.palette.primary.contrastText,
    borderRadius:
      variant === "circular"
        ? "50%"
        : variant === "rounded"
          ? theme.tokens.radius.md
          : theme.tokens.radius.none,
    transition: theme.transitions.create(["transform", "box-shadow"], {
      duration: theme.transitions.duration.normal,
    }),
    "&:hover": {
      transform: "scale(1.05)",
    },
  };
});

interface AvatarGroupWrapperProps {
  max: number;
  total: number;
}

const AvatarGroupWrapper = styled("div")<AvatarGroupWrapperProps>(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
}));

// ============================================================================
// COMPONENTS
// ============================================================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  {
    children,
    src,
    alt,
    variant = "circular",
    size = "md",
    color,
    textColor,
    withBadge = false,
    badgePosition = { vertical: "top", horizontal: "right" },
    badgeContent,
    badgeColor = "success",
    online = false,
    fallbackIcon = <PersonIcon />,
    sx,
    ...props
  },
  ref,
) {
  // Determine if this is an image avatar
  const isImage = Boolean(src);

  // Determine badge visibility
  const showBadge = withBadge || online;

  // Render avatar content
  const renderAvatar = () => {
    if (isImage) {
      return (
        <StyledAvatar
          ref={ref}
          src={src}
          alt={alt}
          variant={variant}
          size={size}
          customColor={color}
          textColor={textColor}
          sx={sx}
          {...props}
        >
          {children}
        </StyledAvatar>
      );
    }

    // Letter or icon avatar
    return (
      <StyledAvatar
        ref={ref}
        variant={variant}
        size={size}
        customColor={color}
        textColor={textColor}
        sx={sx}
        {...props}
      >
        {children || fallbackIcon}
      </StyledAvatar>
    );
  };

  // Wrap with badge if needed
  if (showBadge) {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={badgePosition}
        variant={online ? "dot" : "standard"}
        color={badgeColor}
        badgeContent={badgeContent}
      >
        {renderAvatar()}
      </Badge>
    );
  }

  return renderAvatar();
});

Avatar.displayName = "Avatar";

// ============================================================================
// AVATAR GROUP
// ============================================================================

export interface AvatarGroupCustomProps extends Omit<AvatarGroupProps, "children"> {
  /**
   * Maximum avatars to show.
   * @default 3
   */
  max?: number;

  /**
   * Avatar size.
   * @default "md"
   */
  size?: AvatarSize;

  /**
   * Avatar variant.
   * @default "circular"
   */
  variant?: AvatarVariant;

  /**
   * Total count for badge display.
   */
  total?: number;
}

export const AvatarGroupCustom = forwardRef<HTMLDivElement, AvatarGroupCustomProps>(
  function AvatarGroupCustom(
    {
      children,
      max = 3,
      size = "md",
      variant = "circular",
      total,
      sx,
      ...props
    },
    ref,
  ) {
    const avatarArray = React.Children.toArray(children);
    const visibleAvatars = avatarArray.slice(0, max);
    const remainingCount = total ? total - max : avatarArray.length - max;

    return (
      <AvatarGroupWrapper max={max} total={total || avatarArray.length} ref={ref}>
        <AvatarMui.Group
          max={max}
          sx={[
            {
              "& .MuiAvatarGroup-avatar": {
                width: avatarSizes[size].width,
                height: avatarSizes[size].height,
                fontSize: avatarSizes[size].fontSize,
                borderRadius: variant === "circular" ? "50%" : variant === "rounded" ? "8px" : "0",
              },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...props}
        >
          {visibleAvatars}
          {remainingCount > 0 && (
            <AvatarMui
              sx={{
                width: avatarSizes[size].width,
                height: avatarSizes[size].height,
                fontSize: avatarSizes[size].fontSize,
                fontWeight: 600,
              }}
            >
              +{remainingCount}
            </AvatarMui>
          )}
        </AvatarMui.Group>
      </AvatarGroupWrapper>
    );
  }
);

AvatarGroupCustom.displayName = "AvatarGroupCustom";

// ============================================================================
// EXPORTS
// ============================================================================

export type { AvatarVariant, AvatarSize };