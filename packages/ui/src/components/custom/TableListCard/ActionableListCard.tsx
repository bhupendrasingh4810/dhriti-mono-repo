"use client";

import {
  forwardRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import { alpha, styled, useTheme } from "@mui/material/styles";
import MoreVert from "@mui/icons-material/MoreVert";
import { Avatar } from "../../mui/Avatar";

export type ActionableListCardSize = "small" | "medium" | "large";
export type ActionableListCardVariant = "elevated" | "outlined" | "flat";
export type ActionableListCardLayout = "list" | "tasks";
export type ActionableListCardSubtitlePosition = "right" | "bottom";
export type ActionableListCardPriority = "high" | "medium" | "low";

export interface ActionableListCardMenuContext {
  selectedId: string | number | null;
  selectedIds: Array<string | number>;
}

export interface ActionableListItem {
  id: string | number;
  title: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  disabled?: boolean;
  selected?: boolean;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  divider?: boolean;
  priority?: ActionableListCardPriority;
  dueIn?: ReactNode;
  assigneeInitials?: string;
}

export interface ActionableListCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  headerControls?: ReactNode;
  items?: ActionableListItem[];
  emptyState?: ReactNode;
  loading?: boolean;
  loadingRows?: number;
  size?: ActionableListCardSize;
  variant?: ActionableListCardVariant;
  dense?: boolean;
  selectable?: boolean;
  selectedId?: string | number | null;
  selectedIds?: Array<string | number>;
  onItemSelect?: (item: ActionableListItem) => void;
  onItemToggle?: (item: ActionableListItem, selected: boolean) => void;
  onItemClick?: (item: ActionableListItem) => void;
  rowMenuItems?: (item: ActionableListItem, context: ActionableListCardMenuContext) => ReactNode;
  footer?: ReactNode;
  fullWidth?: boolean;
  dividers?: boolean;
  elevation?: number;
  sx?: object;
  ariaLabel?: string;
  layout?: ActionableListCardLayout;
  subtitlePosition?: ActionableListCardSubtitlePosition;
}

const sizeTokens = {
  small: { py: 1, px: 1.5, icon: 36, title: "0.875rem", description: "0.75rem" },
  medium: { py: 1.5, px: 2, icon: 44, title: "0.9375rem", description: "0.8125rem" },
  large: { py: 2, px: 2.5, icon: 52, title: "1rem", description: "0.875rem" },
} as const;

const Root = styled(Card, {
  shouldForwardProp: (prop) => prop !== "cardvariant" && prop !== "fullwidth",
})<{ cardvariant: ActionableListCardVariant; fullwidth: boolean }>(
  ({ theme, cardvariant, fullwidth }) => ({
    width: fullwidth ? "100%" : "auto",
    overflow: "hidden",
    borderRadius: theme.shape.borderRadius,
    ...(cardvariant === "outlined" && {
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: "none",
    }),
    ...(cardvariant === "flat" && {
      boxShadow: "none",
      backgroundColor: "transparent",
    }),
  }),
);

const Leading = styled(ListItemIcon)<{ dimension: number }>(({ dimension }) => ({
  minWidth: dimension,
  width: dimension,
  height: dimension,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}));

function LoadingRows({ count, size }: { count: number; size: ActionableListCardSize }) {
  const token = sizeTokens[size];
  return (
    <List disablePadding>
      {Array.from({ length: count }, (_, index) => (
        <ListItem key={index} sx={{ px: token.px, py: token.py }}>
          <Skeleton variant="circular" width={token.icon} height={token.icon} sx={{ mr: 1.5 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="55%" height={22} />
            <Skeleton width="75%" height={18} />
          </Box>
          <Skeleton width={56} height={28} />
        </ListItem>
      ))}
    </List>
  );
}

export const ActionableListCard = forwardRef<HTMLDivElement, ActionableListCardProps>(
  function ActionableListCard(
    {
      title,
      subtitle,
      headerAction,
      headerControls,
      items = [],
      emptyState = "No items to display",
      loading = false,
      loadingRows = 4,
      size = "medium",
      variant = "elevated",
      dense = false,
      selectable = false,
      selectedId = null,
      selectedIds,
      onItemSelect,
      onItemToggle,
      onItemClick,
      rowMenuItems,
      footer,
      fullWidth = true,
      dividers = true,
      elevation = 1,
      sx,
      ariaLabel,
      layout = "list",
      subtitlePosition = "right",
    },
    ref,
  ) {
    const theme = useTheme();
    const token = sizeTokens[size];
    const isTaskLayout = layout === "tasks";
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [menuItem, setMenuItem] = useState<ActionableListItem | null>(null);

    const handleItemClick = (item: ActionableListItem) => (event: MouseEvent<HTMLElement>) => {
      item.onClick?.(event);
      if (selectable) {
        if (isTaskLayout && selectedIds) {
          onItemToggle?.(item, !selectedIds.includes(item.id));
        } else {
          onItemSelect?.(item);
        }
      }
      onItemClick?.(item);
    };

    const handleKeyDown = (item: ActionableListItem) => (event: KeyboardEvent<HTMLElement>) => {
      if ((event.key === "Enter" || event.key === " ") && !item.disabled) {
        event.preventDefault();
        if (selectable) {
          if (isTaskLayout && selectedIds) {
            onItemToggle?.(item, !selectedIds.includes(item.id));
          } else {
            onItemSelect?.(item);
          }
        }
        onItemClick?.(item);
      }
    };

    const resolvedHeaderControls = headerControls ?? headerAction;

    const headerTitle = subtitlePosition === "right" && subtitle ? (
      <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
        <Typography variant={size === "large" ? "h6" : "subtitle1"} sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={(theme) => ({ color: alpha(theme.palette.text.disabled, 0.9), fontWeight: 700 })}>
          {subtitle}
        </Typography>
      </Stack>
    ) : title;

    return (
      <Root
        ref={ref}
        cardvariant={variant}
        fullwidth={fullWidth}
        elevation={variant === "elevated" ? elevation : 0}
        sx={sx}
      >
        {(title || subtitle || resolvedHeaderControls) && (
          <CardHeader
            title={headerTitle}
            subheader={subtitlePosition === "bottom" && subtitle ? (
              <Typography variant="caption" sx={(theme) => ({ color: alpha(theme.palette.text.disabled, 0.9), fontWeight: 700 })}>
                {subtitle}
              </Typography>
            ) : undefined}
            action={resolvedHeaderControls}
            sx={{ px: token.px, py: dense ? 1.25 : token.py }}
          />
        )}

        {(title || subtitle || resolvedHeaderControls) && (loading || items.length > 0 || emptyState) && <Divider />}

        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          {loading ? (
            <LoadingRows count={loadingRows} size={size} />
          ) : items.length === 0 ? (
            <Box sx={{ px: token.px, py: dense ? 3 : 5, textAlign: "center" }} role="status">
              {typeof emptyState === "string" ? (
                <Typography color="text.secondary" variant="body2">{emptyState}</Typography>
              ) : emptyState}
            </Box>
          ) : (
            <List disablePadding aria-label={ariaLabel}>
              {items.map((item, index) => {
                const selected = selectedIds
                  ? selectedIds.includes(item.id)
                  : selectable
                  ? selectedId === item.id || item.selected === true
                  : item.selected === true;
                const clickable = Boolean(item.onClick || onItemClick || item.href || selectable);
                const assigneeColor = [
                  theme.palette.primary.main,
                  theme.palette.secondary.main,
                  theme.palette.info.main,
                  theme.palette.success.main,
                  theme.palette.warning.main,
                ][index % 5];
                const content = (
                  <>
                    {isTaskLayout && (
                      <Checkbox
                        checked={selected}
                        disabled={item.disabled}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(_, checked) => {
                          onItemToggle?.(item, checked);
                          onItemSelect?.(item);
                        }}
                        slotProps={{
                          input: {
                            "aria-label": `Select ${typeof item.title === "string" ? item.title : "task"}`,
                          },
                        }}
                      />
                    )}
                    {item.leading && <Leading dimension={token.icon}>{item.leading}</Leading>}
                    <ListItemText
                      primary={item.title}
                      secondary={
                        <Stack spacing={0.25}>
                          {item.description && <span>{item.description}</span>}
                          {item.metadata && (
                            <Typography component="span" variant="caption" color="text.secondary">
                              {item.metadata}
                            </Typography>
                          )}
                        </Stack>
                      }
                      slotProps={{
                        primary: {
                          noWrap: true,
                          sx: { fontSize: token.title, fontWeight: selected ? 700 : 600 },
                        },
                        secondary: { noWrap: true, sx: { fontSize: token.description } },
                      }}
                      sx={{ flex: 1, minWidth: 0, my: 0 }}
                    />
                    {isTaskLayout && item.priority && (
                      <Box sx={{ display: "flex", justifyContent: "flex-end", minWidth: 80 }}>
                        <Chip
                          label={`${item.priority.charAt(0).toUpperCase()}${item.priority.slice(1)}`}
                          size="small"
                          sx={(theme) => {
                            const palette = theme.palette[
                              item.priority === "high" ? "error" : item.priority === "medium" ? "warning" : "success"
                            ];

                            return {
                              backgroundColor: alpha(palette.main, 0.2),
                              color: palette.dark,
                            };
                          }}
                        />
                      </Box>
                    )}
                    {isTaskLayout && item.dueIn && (
                      <Box sx={{ minWidth: 112, ml: 1 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.dueIn}
                        </Typography>
                      </Box>
                    )}
                    {isTaskLayout && item.assigneeInitials && (
                      <Avatar size="sm" color={assigneeColor}>{item.assigneeInitials}</Avatar>
                    )}
                    {item.trailing}
                    {item.action && <Box sx={{ ml: 1, flexShrink: 0 }}>{item.action}</Box>}
                    {isTaskLayout && rowMenuItems && (
                      <Tooltip title="More actions">
                        <IconButton
                          size="small"
                          aria-label={`More actions for ${typeof item.title === "string" ? item.title : "task"}`}
                          onClick={(event: MouseEvent<HTMLElement>) => {
                            event.stopPropagation();
                            setMenuAnchor(event.currentTarget);
                            setMenuItem(item);
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                );

                return (
                  <Box key={item.id}>
                    <ListItem
                      disablePadding
                      divider={false}
                      sx={{
                        px: clickable ? 0 : token.px,
                        py: 0,
                        opacity: item.disabled ? 0.5 : 1,
                      }}
                    >
                      {clickable ? (
                        <ListItemButton
                          component={item.href ? "a" : "div"}
                          href={item.href}
                          selected={selected}
                          disabled={item.disabled}
                          onClick={handleItemClick(item)}
                          onKeyDown={handleKeyDown(item)}
                          role={selectable ? "option" : undefined}
                          aria-selected={selectable ? selected : undefined}
                          sx={{
                            px: token.px,
                            py: dense ? 1 : token.py,
                            alignItems: "center",
                            gap: isTaskLayout ? 1.5 : 0,
                          }}
                        >
                          {content}
                        </ListItemButton>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            px: token.px,
                            py: dense ? 1 : token.py,
                            gap: isTaskLayout ? 1.5 : 0,
                          }}
                        >
                          {content}
                        </Box>
                      )}
                    </ListItem>
                    {dividers && item.divider !== false && index < items.length - 1 && <Divider component="li" />}
                  </Box>
                );
              })}
            </List>
          )}
        </CardContent>

        {footer && <><Divider /><Box sx={{ px: token.px, py: dense ? 1 : token.py }}>{footer}</Box></>}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          {menuItem && rowMenuItems?.(menuItem, { selectedId, selectedIds: selectedIds ?? [] })}
        </Menu>
      </Root>
    );
  },
);

ActionableListCard.displayName = "ActionableListCard";