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
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import LinearProgress from "@mui/material/LinearProgress";
import Pagination from "@mui/material/Pagination";
import { alpha, styled, useTheme } from "@mui/material/styles";

// MUI Icons
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import DownloadRounded from "@mui/icons-material/DownloadRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
import PhoneRounded from "@mui/icons-material/PhoneRounded";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import NotificationsRounded from "@mui/icons-material/NotificationsRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ChatBubbleRounded from "@mui/icons-material/ChatBubbleRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import ExploreRounded from "@mui/icons-material/ExploreRounded";
import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import HubRounded from "@mui/icons-material/HubRounded";

import { Avatar } from "../../mui/Avatar";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ListCardSize = "small" | "medium" | "large";
export type ListCardVariant = "elevated" | "outlined" | "flat";
export type ListCardSubtitlePosition = "right" | "bottom";

export type ListCardColumnKey =
  | "checkbox"
  | "user"
  | "dateTime"
  | "media"
  | "primaryText"
  | "avatarImage"
  | "avatarInitials"
  | "status"
  | "progress"
  | "email"
  | "mobile"
  | "downloadAction"
  | "emailAction"
  | "referenceId"
  | "app"
  | "event"
  | "numeric"
  | "tags"
  | "pricing"
  | "file"
  | "starred"
  | "notification"
  | "actions"
  | "chevron"
  | "custom";

export type ListCardStatusType =
  | "success"
  | "error"
  | "info"
  | "warning"
  | "primary"
  | "secondary"
  | "inherit"
  | "default";
export type ListCardDateFormat = "format1" | "format2" | "format3" | "relative" | "due" | "standard";
export type ListCardAppType = "Connect" | "Pulse" | "Flow" | "Atlas" | "Control" | "Nexus" | string;

export interface ListCardMenuContext {
  selectedId: string | number | null;
  selectedIds: Array<string | number>;
  item: ListCardItem;
}

export interface ListCardMenuItem {
  id?: string | number;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
  color?: "inherit" | "primary" | "error" | "warning";
  onClick?: (item: ListCardItem, event: MouseEvent<HTMLElement>) => void;
}

export interface ListCardHeaderIconAction {
  id?: string;
  icon: ReactNode;
  tooltip?: string;
  ariaLabel?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

export interface ListCardViewAllAction {
  label?: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  endIcon?: ReactNode;
}

export interface ListCardCustomButtonAction {
  label: ReactNode;
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "secondary" | "inherit" | "success" | "error" | "info" | "warning";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  size?: "small" | "medium";
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

export interface ListCardPaginationConfig {
  page: number;
  count: number;
  rowsPerPage?: number;
  totalItems?: number;
  showRowsPerPage?: boolean;
  onPageChange?: (event: unknown, page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
}

export interface ListCardFooterLink {
  label: string;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  endIcon?: ReactNode;
}

export interface ListCardFooterConfig {
  pagination?: ListCardPaginationConfig;
  link?: ListCardFooterLink;
  content?: ReactNode;
}

export interface ListCardItem {
  id: string | number;
  disabled?: boolean;
  selected?: boolean;
  divider?: boolean;
  href?: string;
  onClick?: (event: MouseEvent<HTMLElement>) => void;

  // 1. User Card
  user?: {
    name: string;
    avatarUrl?: string;
    initials?: string;
    avatarColor?: string;
    avatarSize?: "xs" | "sm" | "md" | "lg" | "xl";
    avatarShape?: "rounded" | "circular" | "square";
    subtitleType?: "activity" | "team" | "designation" | "none";
    activity?: string;
    designation?: string;
    teamName?: string;
    subtitle?: ReactNode;
  };

  // 2. Date / Time (Format 1: relative, Format 2: due, Format 3: standard MMM DD, YYYY)
  dateTime?:
    | {
        value?: string | Date | ReactNode;
        format?: ListCardDateFormat;
        label?: ReactNode;
      }
    | string
    | Date;

  // 3. Media Card
  media?: {
    src?: string;
    thumbnail?: ReactNode;
    title: string;
    updatedBy?: string;
    updatedAt?: string;
  };

  // 4. Common Enterprise Name (Task, Ticket, Campaign, Product, Item, etc.)
  primaryText?:
    | {
        title: ReactNode;
        subtitle?: ReactNode;
        description?: ReactNode;
        metadata?: ReactNode;
        badge?: ReactNode;
        href?: string;
        onClick?: (event: MouseEvent<HTMLElement>) => void;
      }
    | ReactNode;

  // 5. FAB Icon Image
  avatarImage?:
    | {
        src: string;
        alt?: string;
        shape?: "rounded" | "circular" | "square";
        size?: "sm" | "md" | "lg";
      }
    | string;

  // 6. FAB Initials
  avatarInitials?:
    | {
        initials: string;
        color?: string;
        textColor?: string;
        shape?: "rounded" | "circular" | "square";
      }
    | string;

  // 7. Status / Badge
  status?:
    | {
        label: ReactNode;
        type?: ListCardStatusType;
        variant?: "neon" | "subtle" | "solid" | "outlined";
      }
    | string;

  // 8. Progress Bar
  progress?:
    | {
        value: number;
        max?: number;
        color?: "primary" | "secondary" | "success" | "error" | "info" | "warning" | "inherit";
        showPercentage?: boolean;
        label?: ReactNode;
      }
    | number;

  // 9. Email
  email?:
    | {
        address: string;
        clickable?: boolean;
        align?: "left" | "right" | "center";
        onClick?: (event: MouseEvent<HTMLElement>) => void;
      }
    | string;

  // 10. Mobile Number
  mobile?:
    | {
        number: string;
        clickable?: boolean;
        align?: "left" | "right" | "center";
        onClick?: (event: MouseEvent<HTMLElement>) => void;
      }
    | string;

  // 11. Download Action
  downloadAction?: {
    url?: string;
    tooltip?: string;
    onDownload?: (item: ListCardItem, event: MouseEvent<HTMLElement>) => void;
    disabled?: boolean;
  };

  // 12. Email Action
  emailAction?: {
    tooltip?: string;
    onEmail?: (item: ListCardItem, event: MouseEvent<HTMLElement>) => void;
    disabled?: boolean;
  };

  // 13. Reference ID / Identifier / Ticket Number / Order Number
  referenceId?:
    | {
        id: string | number;
        prefix?: string;
        href?: string;
        onClick?: (item: ListCardItem, event: MouseEvent<HTMLElement>) => void;
      }
    | string
    | number;

  // 14. Apps column
  app?:
    | {
        name: ListCardAppType;
        icon?: ReactNode;
        color?: string;
      }
    | ListCardAppType;

  // 15. Event Card
  event?: {
    month: string;
    day: string | number;
    title: string;
    date: string;
    time: string;
  };

  // 16. Number / Numeric
  numeric?:
    | {
        value: string | number;
        prefix?: string;
        suffix?: string;
        label?: string;
        color?: string;
        fontWeight?: number | string;
        delta?: {
          value: string | number;
          direction?: "up" | "down" | "neutral";
        };
      }
    | string
    | number;

  // 17. Tags
  tags?:
    | Array<{
        label: string;
        type?: ListCardStatusType;
        color?: string;
        bgColor?: string;
      }>
    | string[];

  // 18. Pricing
  pricing?: {
    planName: string;
    details: string[] | string;
    price?: string;
    period?: string;
  };

  // 19. File Card
  file?: {
    name: string;
    fileType: string;
    size: string;
    modifiedAt: string;
    icon?: ReactNode;
    thumbnail?: ReactNode;
  };

  // 20. Starred
  starred?: boolean;
  onStarToggle?: (item: ListCardItem, starred: boolean, event: MouseEvent<HTMLElement>) => void;

  // 21. Notification Card
  notification?: {
    appName?: string;
    appIcon?: ReactNode;
    title: string;
    type: string;
    timestamp: string;
    unread?: boolean;
  };

  // 22. Row actions
  menuItems?: ListCardMenuItem[] | ((context: ListCardMenuContext) => ReactNode);

  // 23. Custom column / slot
  custom?: ReactNode | ((item: ListCardItem) => ReactNode);

  // Backward-compatible aliases
  title?: ReactNode;
  description?: ReactNode;
  metadata?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  priority?: "high" | "medium" | "low";
  dueIn?: ReactNode;
  assigneeInitials?: string;
}

export interface ListCardProps {
  /**
   * Header title
   */
  title?: ReactNode;

  /**
   * Header subtitle
   */
  subtitle?: ReactNode;

  /**
   * Header subtitle position ("right" | "bottom")
   * @default "right"
   */
  subtitlePosition?: ListCardSubtitlePosition;

  /**
   * Big image/avatar in header
   */
  headerImage?: string | ReactNode;

  /**
   * Header icon primary color (when passing ReactNode icon)
   */
  headerIconColor?: string;

  /**
   * Header icon background color (when passing ReactNode icon)
   */
  headerIconBgColor?: string;

  /**
   * Header icon border color (when passing ReactNode icon)
   */
  headerIconBorderColor?: string;

  /**
   * Flag to show/hide header image
   * @default true (if headerImage is provided)
   */
  showHeaderImage?: boolean;

  /**
   * Header image shape
   * @default "rounded"
   */
  headerImageVariant?: "circular" | "rounded" | "square";

  /**
   * Header image dimension
   * @default 44
   */
  headerImageSize?: "sm" | "md" | "lg" | number;

  /**
   * List of header action icon buttons
   */
  headerIcons?: ListCardHeaderIconAction[];

  /**
   * "View all" link/action in header
   */
  viewAll?: ListCardViewAllAction;

  /**
   * Custom button in header
   */
  customButton?: ListCardCustomButtonAction;

  /**
   * Header 3-dots dropdown menu items
   */
  headerMenuItems?: ListCardMenuItem[] | ((context: { selectedIds: Array<string | number> }) => ReactNode);

  /**
   * Custom raw header controls fallback slot
   */
  headerControls?: ReactNode;
  headerAction?: ReactNode;

  /**
   * Custom ordered list of column types
   */
  columns?: ListCardColumnKey[];

  /**
   * List items
   */
  items?: ListCardItem[];

  /**
   * Empty state content
   * @default "No items to display"
   */
  emptyState?: ReactNode;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Number of skeleton rows when loading
   * @default 4
   */
  loadingRows?: number;

  /**
   * Visual density size
   * @default "medium"
   */
  size?: ListCardSize;

  /**
   * Card visual variant
   * @default "elevated"
   */
  variant?: ListCardVariant;

  /**
   * Compact density mode
   * @default false
   */
  dense?: boolean;

  /**
   * Enable row/checkbox selection
   * @default false
   */
  selectable?: boolean;

  /**
   * Single selected ID
   */
  selectedId?: string | number | null;

  /**
   * Multi-selection array of IDs
   */
  selectedIds?: Array<string | number>;

  /**
   * Selection handler (single select)
   */
  onItemSelect?: (item: ListCardItem) => void;

  /**
   * Selection toggle handler (multi select)
   */
  onItemToggle?: (item: ListCardItem, selected: boolean) => void;

  /**
   * Row click handler
   */
  onItemClick?: (item: ListCardItem) => void;

  /**
   * Star toggle handler
   */
  onStarToggle?: (item: ListCardItem, starred: boolean) => void;

  /**
   * Row 3-dots dropdown menu items builder
   */
  rowMenuItems?: (item: ListCardItem, context: ListCardMenuContext) => ReactNode;

  /**
   * Footer content or config
   */
  footer?: ReactNode;
  footerConfig?: ListCardFooterConfig;

  /**
   * Full width card
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Show row dividers
   * @default true
   */
  dividers?: boolean;

  /**
   * Shadow elevation for elevated variant
   * @default 1
   */
  elevation?: number;

  /**
   * Custom sx styles
   */
  sx?: object;

  /**
   * Accessibility aria-label
   */
  ariaLabel?: string;

  /**
   * Legacy layout support
   */
  layout?: "list" | "tasks";
}

// Backward-compatible type aliases
export type ActionableListCardSize = ListCardSize;
export type ActionableListCardVariant = ListCardVariant;
export type ActionableListCardSubtitlePosition = ListCardSubtitlePosition;
export type ActionableListCardMenuContext = ListCardMenuContext;
export type ActionableListItem = ListCardItem;
export type ActionableListCardProps = ListCardProps;

// ============================================================================
// STYLED COMPONENTS & THEME CONSTANTS
// ============================================================================

const sizeTokens = {
  small: { py: 1, px: 1.5, icon: 36, title: "0.875rem", description: "0.75rem", gap: 1.5 },
  medium: { py: 1.5, px: 2, icon: 44, title: "0.9375rem", description: "0.8125rem", gap: 2 },
  large: { py: 2, px: 2.5, icon: 52, title: "1rem", description: "0.875rem", gap: 2.5 },
} as const;

const Root = styled(Card, {
  shouldForwardProp: (prop) => prop !== "cardvariant" && prop !== "fullwidth",
})<{ cardvariant: ListCardVariant; fullwidth: boolean }>(
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

// App Branding Map
const appBranding: Record<string, { color: string; icon: ReactNode }> = {
  Connect: { color: "#0284C7", icon: <ChatBubbleRounded fontSize="small" /> },
  Pulse: { color: "#8B5CF6", icon: <InsightsRounded fontSize="small" /> },
  Flow: { color: "#10B981", icon: <AccountTreeRounded fontSize="small" /> },
  Atlas: { color: "#F59E0B", icon: <ExploreRounded fontSize="small" /> },
  Control: { color: "#EF4444", icon: <AdminPanelSettingsRounded fontSize="small" /> },
  Nexus: { color: "#6366F1", icon: <HubRounded fontSize="small" /> },
};

function LoadingRows({ count, size }: { count: number; size: ListCardSize }) {
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

// Format relative/due/standard dates
function formatDateString(value: string | Date | ReactNode, format?: ListCardDateFormat): ReactNode {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    if (format === "format3" || format === "standard") {
      return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return String(value);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ListCard = forwardRef<HTMLDivElement, ListCardProps>(function ListCard(
  {
    title,
    subtitle,
    subtitlePosition = "right",
    headerImage,
    headerIconColor,
    headerIconBgColor,
    headerIconBorderColor,
    showHeaderImage,
    headerImageVariant = "rounded",
    headerImageSize = 44,
    headerIcons,
    viewAll,
    customButton,
    headerMenuItems,
    headerControls,
    headerAction,
    columns,
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
    onStarToggle,
    rowMenuItems,
    footer,
    footerConfig,
    fullWidth = true,
    dividers = true,
    elevation = 1,
    sx,
    ariaLabel,
    layout = "list",
  },
  ref,
) {
  const theme = useTheme();
  const token = sizeTokens[size];

  // Header Menu State
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState<HTMLElement | null>(null);

  // Row Menu State
  const [rowMenuAnchor, setRowMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeRowItem, setActiveRowItem] = useState<ListCardItem | null>(null);

  // Derive active selection list
  const currentSelectedIds = selectedIds ?? (selectedId != null ? [selectedId] : []);

  // Is an item selected
  const isItemSelected = (item: ListCardItem) => {
    if (selectedIds) return selectedIds.includes(item.id);
    if (selectable && selectedId != null) return selectedId === item.id;
    return item.selected === true;
  };

  // Row click
  const handleItemClick = (item: ListCardItem) => (event: MouseEvent<HTMLElement>) => {
    item.onClick?.(event);
    if (selectable) {
      if (selectedIds) {
        onItemToggle?.(item, !selectedIds.includes(item.id));
      } else {
        onItemSelect?.(item);
      }
    }
    onItemClick?.(item);
  };

  const handleKeyDown = (item: ListCardItem) => (event: KeyboardEvent<HTMLElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !item.disabled) {
      event.preventDefault();
      if (selectable) {
        if (selectedIds) {
          onItemToggle?.(item, !selectedIds.includes(item.id));
        } else {
          onItemSelect?.(item);
        }
      }
      onItemClick?.(item);
    }
  };

  // Resolve Header Image
  const shouldRenderHeaderImage = showHeaderImage ?? Boolean(headerImage);
  const imageDimension =
    typeof headerImageSize === "number"
      ? headerImageSize
      : headerImageSize === "sm"
      ? 36
      : headerImageSize === "lg"
      ? 52
      : 44;

  const resolvedHeaderIconColor = headerIconColor ?? theme.palette.primary.main;
  const resolvedHeaderIconBgColor =
    headerIconBgColor ?? alpha(resolvedHeaderIconColor, 0.08);
  const resolvedHeaderIconBorderColor =
    headerIconBorderColor ?? alpha(resolvedHeaderIconColor, 0.2);

  const headerAvatarNode = shouldRenderHeaderImage && headerImage && (
    <Box sx={{ mr: 1.5, display: "flex", alignItems: "center" }}>
      {typeof headerImage === "string" ? (
        <Avatar
          src={headerImage}
          variant={headerImageVariant}
          sx={{ width: imageDimension, height: imageDimension }}
        />
      ) : (
        <Box
          sx={{
            width: imageDimension,
            height: imageDimension,
            borderRadius:
              headerImageVariant === "circular"
                ? "50%"
                : headerImageVariant === "rounded"
                ? 1.5
                : 0,
            border: `1px solid ${resolvedHeaderIconBorderColor}`,
            backgroundColor: resolvedHeaderIconBgColor,
            color: resolvedHeaderIconColor,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 0.75,
            flexShrink: 0,
          }}
        >
          {headerImage}
        </Box>
      )}
    </Box>
  );

  // Resolve Header Title & Subtitle
  const headerTitleNode = (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      {headerAvatarNode}
      <Box sx={{ minWidth: 0 }}>
        {subtitlePosition === "right" && subtitle ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
            <Typography variant={size === "large" ? "h6" : "subtitle1"} sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography
              variant="caption"
              sx={(t) => ({ color: alpha(t.palette.text.disabled, 0.9), fontWeight: 700 })}
            >
              {subtitle}
            </Typography>
          </Stack>
        ) : (
          <Typography variant={size === "large" ? "h6" : "subtitle1"} sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        )}
      </Box>
    </Box>
  );

  const headerSubheaderNode =
    subtitlePosition === "bottom" && subtitle ? (
      <Typography
        variant="caption"
        sx={(t) => ({ color: alpha(t.palette.text.disabled, 0.9), fontWeight: 700, display: "block", mt: 0.25 })}
      >
        {subtitle}
      </Typography>
    ) : undefined;

  // Resolve Header Right Controls
  const hasStructuredHeaderControls =
    Boolean(headerIcons && headerIcons.length > 0) ||
    Boolean(viewAll) ||
    Boolean(customButton) ||
    Boolean(headerMenuItems);

  const resolvedHeaderControls = headerControls ?? headerAction ?? (
    hasStructuredHeaderControls ? (
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {/* 1. Header Action Icons */}
        {headerIcons?.map((action, idx) => (
          <Tooltip key={action.id ?? idx} title={action.tooltip ?? action.ariaLabel ?? ""}>
            <span>
              <IconButton
                size="small"
                aria-label={action.ariaLabel ?? action.tooltip ?? "Action"}
                disabled={action.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick?.(e);
                }}
              >
                {action.icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}

        {/* 2. Custom Button */}
        {customButton && (
          <Button
            size={customButton.size ?? "small"}
            variant={customButton.variant ?? "outlined"}
            color={customButton.color ?? "primary"}
            startIcon={customButton.startIcon}
            endIcon={customButton.endIcon}
            disabled={customButton.disabled}
            onClick={(e) => {
              e.stopPropagation();
              customButton.onClick?.(e);
            }}
          >
            {customButton.label}
          </Button>
        )}

        {/* 3. View All Link */}
        {viewAll && (
          <Link
            component={viewAll.href ? "a" : "button"}
            href={viewAll.href}
            variant="body2"
            underline="hover"
            onClick={(e: MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              viewAll.onClick?.(e);
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              fontWeight: 600,
              gap: 0.5,
              cursor: "pointer",
              border: 0,
              background: "none",
              p: 0,
            }}
          >
            {viewAll.label ?? "View all"}
            {viewAll.endIcon}
          </Link>
        )}

        {/* 4. Three dots vertical menu for header */}
        {headerMenuItems && (
          <Tooltip title="More options">
            <IconButton
              size="small"
              aria-label="More header options"
              onClick={(e) => {
                e.stopPropagation();
                setHeaderMenuAnchor(e.currentTarget);
              }}
            >
              <MoreVertRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    ) : null
  );

  // ==========================================================================
  // COLUMN RENDERING LOGIC
  // ==========================================================================

  const renderColumnContent = (colKey: ListCardColumnKey, item: ListCardItem, index: number) => {
    const selected = isItemSelected(item);

    switch (colKey) {
      // 1. Checkbox
      case "checkbox": {
        return (
          <Checkbox
            key="checkbox"
            checked={selected}
            disabled={item.disabled}
            onClick={(e) => e.stopPropagation()}
            onChange={(_, checked) => {
              onItemToggle?.(item, checked);
              onItemSelect?.(item);
            }}
            slotProps={{
              input: {
                "aria-label": `Select item ${item.id}`,
              },
            }}
            sx={{ p: 0.5 }}
          />
        );
      }

      // 2. User Card (FAB avatar, Name, bottom subtitle)
      case "user": {
        const u = item.user;
        if (!u) return null;
        const subtitleText =
          u.subtitleType === "none"
            ? null
            : u.subtitle ??
              (u.subtitleType === "activity"
                ? u.activity
                : u.subtitleType === "team"
                ? [u.designation, u.teamName].filter(Boolean).join(" • ")
                : u.subtitleType === "designation"
                ? u.designation
                : u.activity ?? [u.designation, u.teamName].filter(Boolean).join(" • ") ?? u.designation);

        const avatarSizeProp = u.avatarSize ?? "md";

        return (
          <Box key="user" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180, flex: 1 }}>
            <Avatar
              src={u.avatarUrl}
              size={avatarSizeProp}
              variant={u.avatarShape ?? "circular"}
              color={u.avatarColor}
              sx={{ flexShrink: 0 }}
            >
              {u.initials ?? u.name.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: selected ? 700 : 600, color: "text.primary" }}
              >
                {u.name}
              </Typography>
              {subtitleText && (
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                  {subtitleText}
                </Typography>
              )}
            </Box>
          </Box>
        );
      }

      // 3. Date / Time (Format 1: relative, Format 2: due, Format 3: MMM DD, YYYY)
      case "dateTime": {
        const dt = item.dateTime;
        if (!dt) return null;
        const value = typeof dt === "object" && !(dt instanceof Date) && "value" in dt ? dt.value : dt;
        const format = typeof dt === "object" && !(dt instanceof Date) && "format" in dt ? dt.format : undefined;
        const label = typeof dt === "object" && !(dt instanceof Date) && "label" in dt ? dt.label : undefined;
        const formatted = label ?? formatDateString(value as ReactNode | Date, format);

        return (
          <Box key="dateTime" sx={{ minWidth: 100, flexShrink: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {formatted}
            </Typography>
          </Box>
        );
      }

      // 4. Media Card (Thumbnail, File name, Updated by {user} dot {time})
      case "media": {
        const m = item.media;
        if (!m) return null;
        return (
          <Box key="media" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180, flex: 1 }}>
            {m.thumbnail ?? (
              <Box
                component={m.src ? "img" : "div"}
                src={m.src}
                alt={m.title}
                sx={{
                  width: 48,
                  height: 36,
                  borderRadius: 1,
                  objectFit: "cover",
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: selected ? 700 : 600 }}>
                {m.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {[m.updatedBy ? `Updated by ${m.updatedBy}` : "", m.updatedAt].filter(Boolean).join(" • ")}
              </Typography>
            </Box>
          </Box>
        );
      }

      // 5. Common Enterprise Name (Primary Text)
      case "primaryText": {
        const rawPt = item.primaryText ?? item.title;
        if (!rawPt) return null;
        const isObj = typeof rawPt === "object" && rawPt !== null && "title" in rawPt;
        const ptTitle = isObj ? (rawPt as any).title : rawPt;
        const ptSubtitle = isObj ? (rawPt as any).subtitle : item.description;
        const ptMeta = isObj ? (rawPt as any).metadata : item.metadata;
        const ptBadge = isObj ? (rawPt as any).badge : null;
        const ptHref = isObj ? (rawPt as any).href : item.href;
        const ptClick = isObj ? (rawPt as any).onClick : undefined;

        return (
          <Box key="primaryText" sx={{ flex: 1, minWidth: 0 }}>
            {item.leading && <Leading dimension={token.icon}>{item.leading}</Leading>}
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {ptHref ? (
                    <Link
                      href={ptHref}
                      color="inherit"
                      underline="hover"
                      onClick={(e) => {
                        e.stopPropagation();
                        ptClick?.(e);
                      }}
                      sx={{ fontWeight: selected ? 700 : 600 }}
                    >
                      {ptTitle}
                    </Link>
                  ) : (
                    <Typography
                      component="span"
                      variant="body2"
                      noWrap
                      sx={{ fontSize: token.title, fontWeight: selected ? 700 : 600 }}
                    >
                      {ptTitle}
                    </Typography>
                  )}
                  {ptBadge}
                </Box>
              }
              secondary={
                (ptSubtitle || ptMeta) ? (
                  <Stack spacing={0.25}>
                    {ptSubtitle && <span>{ptSubtitle}</span>}
                    {ptMeta && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {ptMeta}
                      </Typography>
                    )}
                  </Stack>
                ) : undefined
              }
              slotProps={{
                secondary: { noWrap: true, sx: { fontSize: token.description } },
              }}
              sx={{ my: 0 }}
            />
          </Box>
        );
      }

      // 6. FAB Image (Square rounded / circular)
      case "avatarImage": {
        const ai = item.avatarImage;
        if (!ai) return null;
        const src = typeof ai === "string" ? ai : ai.src;
        const shape = typeof ai === "object" ? ai.shape : "rounded";
        const avatarSize = typeof ai === "object" ? ai.size : "sm";

        return (
          <Avatar
            key="avatarImage"
            src={src}
            variant={shape === "square" ? "square" : shape === "rounded" ? "rounded" : "circular"}
            size={avatarSize}
            sx={{ flexShrink: 0 }}
          />
        );
      }

      // 7. FAB Initials (Rounded)
      case "avatarInitials": {
        const initials =
          typeof item.avatarInitials === "object"
            ? item.avatarInitials.initials
            : item.avatarInitials ?? item.assigneeInitials;
        if (!initials) return null;
        const palette = [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.warning.main,
        ];
        const customColor =
          typeof item.avatarInitials === "object"
            ? item.avatarInitials.color
            : palette[index % palette.length];

        return (
          <Avatar
            key="avatarInitials"
            size="sm"
            color={customColor}
            variant="circular"
            sx={{ flexShrink: 0 }}
          >
            {initials}
          </Avatar>
        );
      }

      // 8. Status / Priority Badge (Enterprise Neon/Subtle Badge)
      case "status": {
        const st = item.status ?? item.priority;
        if (!st) return null;
        const label = typeof st === "object" ? st.label : String(st);
        const type: ListCardStatusType =
          typeof st === "object" && st.type
            ? st.type
            : st === "high"
            ? "error"
            : st === "medium"
            ? "warning"
            : st === "low"
            ? "success"
            : "default";

        const paletteObj =
          type === "error"
            ? theme.palette.error
            : type === "warning"
            ? theme.palette.warning
            : type === "success"
            ? theme.palette.success
            : type === "info"
            ? theme.palette.info
            : type === "secondary"
            ? theme.palette.secondary
            : theme.palette.primary;

        const formattedLabel =
          typeof label === "string"
            ? `${label.charAt(0).toUpperCase()}${label.slice(1)}`
            : label;

        return (
          <Box key="status" sx={{ display: "flex", justifyContent: "center", minWidth: 96, flexShrink: 0 }}>
            <Chip
              label={formattedLabel}
              size="small"
              sx={{
                backgroundColor: type === "inherit" || type === "default"
                  ? theme.palette.action.selected
                  : alpha(paletteObj.main, 0.15),
                color: type === "inherit" || type === "default"
                  ? theme.palette.text.primary
                  : paletteObj.dark,
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>
        );
      }

      // 9. Progress Bar (With percentage at end)
      case "progress": {
        const prog = item.progress;
        if (prog == null) return null;
        const value = typeof prog === "number" ? prog : prog.value;
        const max = typeof prog === "object" ? prog.max ?? 100 : 100;
        const pct = Math.round((value / max) * 100);
        const progColor = typeof prog === "object" ? prog.color ?? "primary" : "primary";

        return (
          <Box key="progress" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 130, flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              color={progColor as any}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 32, textAlign: "right" }}>
              {pct}%
            </Typography>
          </Box>
        );
      }

      // 10. Email
      case "email": {
        const em = item.email;
        if (!em) return null;
        const address = typeof em === "string" ? em : em.address;
        const clickable = typeof em === "object" ? em.clickable : true;
        const align = typeof em === "object" && em.align ? em.align : "left";

        return (
          <Box
            key="email"
            sx={{
              minWidth: 190,
              flexShrink: 0,
              display: "flex",
              justifyContent: align === "right" ? "flex-end" : "flex-start",
              textAlign: align === "right" ? "right" : "left",
            }}
          >
            {clickable ? (
              <Link
                href={`mailto:${address}`}
                variant="body2"
                color="text.secondary"
                underline="hover"
                noWrap
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof em === "object") em.onClick?.(e);
                }}
              >
                {address}
              </Link>
            ) : (
              <Typography variant="body2" color="text.secondary" noWrap>
                {address}
              </Typography>
            )}
          </Box>
        );
      }

      // 11. Mobile Number
      case "mobile": {
        const mob = item.mobile;
        if (!mob) return null;
        const num = typeof mob === "string" ? mob : mob.number;
        const clickable = typeof mob === "object" ? mob.clickable : true;
        const align = typeof mob === "object" && mob.align ? mob.align : "left";

        return (
          <Box
            key="mobile"
            sx={{
              minWidth: 150,
              flexShrink: 0,
              display: "flex",
              justifyContent: align === "right" ? "flex-end" : "flex-start",
              textAlign: align === "right" ? "right" : "left",
            }}
          >
            {clickable ? (
              <Link
                href={`tel:${num}`}
                variant="body2"
                color="text.secondary"
                underline="hover"
                noWrap
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof mob === "object") mob.onClick?.(e);
                }}
              >
                {num}
              </Link>
            ) : (
              <Typography variant="body2" color="text.secondary" noWrap>
                {num}
              </Typography>
            )}
          </Box>
        );
      }

      // 12. Download Icon Action
      case "downloadAction": {
        const dl = item.downloadAction;
        if (!dl) return null;
        return (
          <Tooltip key="downloadAction" title={dl.tooltip ?? "Download"}>
            <span>
              <IconButton
                size="small"
                disabled={dl.disabled}
                aria-label={dl.tooltip ?? "Download"}
                onClick={(e) => {
                  e.stopPropagation();
                  dl.onDownload?.(item, e);
                }}
              >
                <DownloadRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      }

      // 13. Email Icon Action
      case "emailAction": {
        const ea = item.emailAction;
        if (!ea) return null;
        return (
          <Tooltip key="emailAction" title={ea.tooltip ?? "Send email"}>
            <span>
              <IconButton
                size="small"
                disabled={ea.disabled}
                aria-label={ea.tooltip ?? "Send email"}
                onClick={(e) => {
                  e.stopPropagation();
                  ea.onEmail?.(item, e);
                }}
              >
                <MailOutlineRounded fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      }

      // 14. Reference ID / Identifier / Ticket Number / Order Number
      case "referenceId": {
        const refObj = item.referenceId;
        if (refObj == null) return null;
        const rawId = typeof refObj === "object" ? refObj.id : refObj;
        const prefix = typeof refObj === "object" ? refObj.prefix ?? "" : "";
        const href = typeof refObj === "object" ? refObj.href : undefined;
        const click = typeof refObj === "object" ? refObj.onClick : undefined;
        const displayId = `${prefix}${rawId}`;

        return (
          <Box key="referenceId" sx={{ minWidth: 110, flex: 1, flexShrink: 0 }}>
            {href || click ? (
              <Link
                href={href}
                variant="body2"
                underline="hover"
                onClick={(e) => {
                  e.stopPropagation();
                  click?.(item, e);
                }}
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  bgcolor: "action.hover",
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  display: "inline-block",
                }}
              >
                {displayId}
              </Link>
            ) : (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  bgcolor: "action.hover",
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  color: "text.primary",
                  display: "inline-block",
                }}
              >
                {displayId}
              </Typography>
            )}
          </Box>
        );
      }

      // 15. Apps column (Connect, Pulse, Flow, Atlas, Control, Nexus)
      case "app": {
        const ap = item.app;
        if (!ap) return null;
        const appName = typeof ap === "string" ? ap : ap.name;
        const branding = appBranding[appName] ?? { color: theme.palette.primary.main, icon: <HubRounded fontSize="small" /> };
        const icon = typeof ap === "object" && ap.icon ? ap.icon : branding.icon;
        const color = typeof ap === "object" && ap.color ? ap.color : branding.color;

        return (
          <Tooltip key="app" title={appName}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                backgroundColor: alpha(color, 0.12),
                color: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          </Tooltip>
        );
      }

      // 16. Event (Calendar Badge + Event Name + Date dot Time)
      case "event": {
        const ev = item.event;
        if (!ev) return null;
        return (
          <Box key="event" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 200, flex: 1 }}>
            {/* Calendar Block */}
            <Box
              sx={{
                width: 40,
                height: 44,
                borderRadius: 1.2,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <Box sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontSize: "0.625rem", fontWeight: 700, py: 0.25 }}>
                {ev.month.slice(0, 3).toUpperCase()}
              </Box>
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.875rem" }}>
                {ev.day}
              </Box>
            </Box>

            {/* Details */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: selected ? 700 : 600 }}>
                {ev.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {[ev.date, ev.time].filter(Boolean).join(" • ")}
              </Typography>
            </Box>
          </Box>
        );
      }

      // 17. Number / Numeric / Amount
      case "numeric": {
        const numObj = item.numeric;
        if (numObj == null) return null;
        const val = typeof numObj === "object" ? numObj.value : numObj;
        const prefix = typeof numObj === "object" ? numObj.prefix ?? "" : "";
        const suffix = typeof numObj === "object" ? numObj.suffix ?? "" : "";
        const lbl = typeof numObj === "object" ? numObj.label : undefined;
        const color = typeof numObj === "object" && numObj.color ? numObj.color : "text.secondary";
        const fontWeight = typeof numObj === "object" && numObj.fontWeight ? numObj.fontWeight : 500;

        return (
          <Box key="numeric" sx={{ textAlign: "right", minWidth: 90, flexShrink: 0 }}>
            <Typography variant="body2" sx={{ fontWeight, color }}>
              {prefix}{val}{suffix}
            </Typography>
            {lbl && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {lbl}
              </Typography>
            )}
          </Box>
        );
      }

      // 18. Tags (List of badges)
      case "tags": {
        const tg = item.tags;
        if (!tg || tg.length === 0) return null;

        const tagColorPalettes = [
          { bg: alpha(theme.palette.primary.main, 0.12), text: theme.palette.primary.dark },
          { bg: alpha(theme.palette.secondary.main, 0.12), text: theme.palette.secondary.dark },
          { bg: alpha(theme.palette.info.main, 0.12), text: theme.palette.info.dark },
          { bg: alpha(theme.palette.success.main, 0.12), text: theme.palette.success.dark },
          { bg: alpha(theme.palette.warning.main, 0.12), text: theme.palette.warning.dark },
        ];

        return (
          <Box key="tags" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, maxWidth: 300, flexShrink: 0 }}>
            {tg.map((tag, tIdx) => {
              const label = typeof tag === "string" ? tag : tag.label;
              const type = typeof tag === "object" ? tag.type : undefined;
              const customColor = typeof tag === "object" ? tag.color : undefined;
              const customBg = typeof tag === "object" ? tag.bgColor : undefined;

              const paletteConfig =
                type === "error"
                  ? { bg: alpha(theme.palette.error.main, 0.15), text: theme.palette.error.dark }
                  : type === "warning"
                  ? { bg: alpha(theme.palette.warning.main, 0.15), text: theme.palette.warning.dark }
                  : type === "success"
                  ? { bg: alpha(theme.palette.success.main, 0.15), text: theme.palette.success.dark }
                  : type === "info"
                  ? { bg: alpha(theme.palette.info.main, 0.15), text: theme.palette.info.dark }
                  : type === "secondary"
                  ? { bg: alpha(theme.palette.secondary.main, 0.15), text: theme.palette.secondary.dark }
                  : type === "primary"
                  ? { bg: alpha(theme.palette.primary.main, 0.15), text: theme.palette.primary.dark }
                  : tagColorPalettes[tIdx % tagColorPalettes.length];

              return (
                <Chip
                  key={tIdx}
                  label={label}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: customBg ?? paletteConfig.bg,
                    color: customColor ?? paletteConfig.text,
                  }}
                />
              );
            })}
          </Box>
        );
      }

      // 19. Pricing (Plan Name, dot separated details)
      case "pricing": {
        const pr = item.pricing;
        if (!pr) return null;
        const detailStr = Array.isArray(pr.details) ? pr.details.join(" • ") : pr.details;

        return (
          <Box key="pricing" sx={{ flex: 1, minWidth: 160 }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                {pr.planName}
              </Typography>
              {pr.price && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {pr.price}{pr.period ? `/${pr.period}` : ""}
                </Typography>
              )}
            </Box>
            {detailStr && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {detailStr}
              </Typography>
            )}
          </Box>
        );
      }

      // 20. File Card (File icon, File name, {type} dot {size} dot Modified {format1})
      case "file": {
        const f = item.file;
        if (!f) return null;
        return (
          <Box key="file" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180, flex: 1 }}>
            {f.thumbnail ?? (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                {f.icon ?? <InsertDriveFileRounded fontSize="small" />}
              </Box>
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: selected ? 700 : 600 }}>
                {f.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {[f.fileType, f.size, f.modifiedAt ? `Modified ${f.modifiedAt}` : ""].filter(Boolean).join(" • ")}
              </Typography>
            </Box>
          </Box>
        );
      }

      // 21. Starred column
      case "starred": {
        const isStarred = Boolean(item.starred);
        return (
          <Tooltip key="starred" title={isStarred ? "Unstar" : "Star"}>
            <span>
              <IconButton
                size="small"
                aria-label={isStarred ? "Starred" : "Not starred"}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onStarToggle?.(item, !isStarred, e);
                  onStarToggle?.(item, !isStarred);
                }}
                sx={{
                  color: isStarred ? theme.palette.warning.main : theme.palette.text.disabled,
                }}
              >
                {isStarred ? <StarRounded fontSize="small" /> : <StarBorderRounded fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        );
      }

      // 22. Notification Card (App Icon, Notification Title, Type dot Timestamp)
      case "notification": {
        const notif = item.notification;
        if (!notif) return null;
        return (
          <Box key="notification" sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180, flex: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {notif.appIcon ?? <NotificationsRounded fontSize="small" />}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: notif.unread ? 700 : selected ? 600 : 400 }}
              >
                {notif.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {[notif.type, notif.timestamp].filter(Boolean).join(" • ")}
              </Typography>
            </Box>
          </Box>
        );
      }

      // 23. Row Actions / Menu (3 dots vertical)
      case "actions": {
        const hasActions = Boolean(rowMenuItems || item.menuItems || item.action);
        if (!hasActions) return null;

        return (
          <Box key="actions" sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            {item.trailing}
            {item.action && <Box sx={{ ml: 0.5 }}>{item.action}</Box>}
            {(rowMenuItems || item.menuItems) && (
              <Tooltip title="More actions">
                <IconButton
                  size="small"
                  aria-label="More actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRowMenuAnchor(e.currentTarget);
                    setActiveRowItem(item);
                  }}
                >
                  <MoreVertRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }

      // 24. Chevron Right (Arrow)
      case "chevron": {
        return (
          <Box key="chevron" sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
            <ChevronRightRounded fontSize="small" sx={{ color: "text.disabled" }} />
          </Box>
        );
      }

      // 25. Custom Column Slot
      case "custom": {
        if (!item.custom) return null;
        return (
          <Box key="custom" sx={{ flexShrink: 0 }}>
            {typeof item.custom === "function" ? item.custom(item) : item.custom}
          </Box>
        );
      }

      default:
        return null;
    }
  };

  // Determine Columns for each row
  // If `columns` prop passed, use it directly!
  // If not, auto-derive smart layout based on item fields or legacy task layout
  const resolveRowColumns = (item: ListCardItem): ListCardColumnKey[] => {
    if (columns && columns.length > 0) {
      return columns;
    }

    // Smart auto-detection from item properties
    const cols: ListCardColumnKey[] = [];
    if (selectable) cols.push("checkbox");
    if (item.starred !== undefined) cols.push("starred");
    if (item.user) cols.push("user");
    if (item.media) cols.push("media");
    if (item.event) cols.push("event");
    if (item.file) cols.push("file");
    if (item.notification) cols.push("notification");
    if (item.pricing) cols.push("pricing");
    if (item.app) cols.push("app");
    if (item.avatarImage) cols.push("avatarImage");
    if (item.avatarInitials || item.assigneeInitials) cols.push("avatarInitials");
    if (item.primaryText || item.title) cols.push("primaryText");
    if (item.status || item.priority) cols.push("status");
    if (item.progress !== undefined) cols.push("progress");
    if (item.referenceId !== undefined) cols.push("referenceId");
    if (item.numeric !== undefined) cols.push("numeric");
    if (item.tags) cols.push("tags");
    if (item.email) cols.push("email");
    if (item.mobile) cols.push("mobile");
    if (item.dateTime || item.dueIn) cols.push("dateTime");
    if (item.downloadAction) cols.push("downloadAction");
    if (item.emailAction) cols.push("emailAction");
    if (item.custom) cols.push("custom");
    if (rowMenuItems || item.menuItems || item.action || layout === "tasks") cols.push("actions");

    return cols;
  };

  // Render Row Item
  const renderRowItem = (item: ListCardItem, index: number) => {
    const selected = isItemSelected(item);
    const clickable = Boolean(item.onClick || onItemClick || item.href || selectable);
    const rowCols = resolveRowColumns(item);

    const rowContent = (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          gap: token.gap,
          minWidth: 0,
        }}
      >
        {rowCols.map((colKey) => renderColumnContent(colKey, item, index))}
      </Box>
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
              }}
            >
              {rowContent}
            </ListItemButton>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                px: token.px,
                py: dense ? 1 : token.py,
              }}
            >
              {rowContent}
            </Box>
          )}
        </ListItem>
        {dividers && item.divider !== false && index < items.length - 1 && <Divider component="li" />}
      </Box>
    );
  };

  // Resolve Footer
  const footerNode = footer ?? (
    footerConfig ? (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: footerConfig.pagination ? "space-between" : "flex-end",
          flexWrap: "wrap",
          gap: 1.5,
          px: token.px,
          py: dense ? 1 : token.py,
        }}
      >
        {footerConfig.content}
        {footerConfig.pagination && (
          <Pagination
            count={footerConfig.pagination.count}
            page={footerConfig.pagination.page}
            onChange={footerConfig.pagination.onPageChange}
            size={size === "small" ? "small" : "medium"}
            color="primary"
          />
        )}
        {footerConfig.link && (
          <Link
            component={footerConfig.link.href ? "a" : "button"}
            href={footerConfig.link.href}
            variant="body2"
            underline="hover"
            onClick={(e: MouseEvent<HTMLElement>) => {
              e.stopPropagation();
              footerConfig.link?.onClick?.(e);
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              fontWeight: 600,
              gap: 0.5,
              cursor: "pointer",
              border: 0,
              background: "none",
              p: 0,
            }}
          >
            {footerConfig.link.label}
            {footerConfig.link.endIcon ?? <ArrowForwardRounded fontSize="inherit" />}
          </Link>
        )}
      </Box>
    ) : null
  );

  return (
    <Root
      ref={ref}
      cardvariant={variant}
      fullwidth={fullWidth}
      elevation={variant === "elevated" ? elevation : 0}
      sx={sx}
    >
      {/* Header */}
      {(title || subtitle || resolvedHeaderControls || shouldRenderHeaderImage) && (
        <CardHeader
          title={headerTitleNode}
          subheader={headerSubheaderNode}
          action={resolvedHeaderControls}
          sx={{ px: token.px, py: dense ? 1.25 : token.py }}
        />
      )}

      {(title || subtitle || resolvedHeaderControls || shouldRenderHeaderImage) &&
        (loading || items.length > 0 || emptyState) && <Divider />}

      {/* Content */}
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
            {items.map((item, index) => renderRowItem(item, index))}
          </List>
        )}
      </CardContent>

      {/* Footer */}
      {footerNode && (
        <>
          <Divider />
          {footerNode}
        </>
      )}

      {/* Header Menu */}
      {headerMenuItems && (
        <Menu
          anchorEl={headerMenuAnchor}
          open={Boolean(headerMenuAnchor)}
          onClose={() => setHeaderMenuAnchor(null)}
        >
          {typeof headerMenuItems === "function"
            ? headerMenuItems({ selectedIds: currentSelectedIds })
            : headerMenuItems.map((mItem, mIdx) => (
                <MenuItem
                  key={mItem.id ?? mIdx}
                  disabled={mItem.disabled}
                  divider={mItem.divider}
                  onClick={(e) => {
                    setHeaderMenuAnchor(null);
                    mItem.onClick?.({} as any, e);
                  }}
                  sx={{ gap: 1.5 }}
                >
                  {mItem.icon && <Box sx={{ display: "flex", color: "text.secondary" }}>{mItem.icon}</Box>}
                  {mItem.label}
                </MenuItem>
              ))}
        </Menu>
      )}

      {/* Row Menu */}
      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setActiveRowItem(null);
        }}
      >
        {activeRowItem && (
          rowMenuItems ? (
            rowMenuItems(activeRowItem, {
              selectedId,
              selectedIds: currentSelectedIds,
              item: activeRowItem,
            })
          ) : activeRowItem.menuItems ? (
            typeof activeRowItem.menuItems === "function" ? (
              activeRowItem.menuItems({
                selectedId,
                selectedIds: currentSelectedIds,
                item: activeRowItem,
              })
            ) : (
              activeRowItem.menuItems.map((mItem, mIdx) => (
                <MenuItem
                  key={mItem.id ?? mIdx}
                  disabled={mItem.disabled}
                  divider={mItem.divider}
                  onClick={(e) => {
                    setRowMenuAnchor(null);
                    mItem.onClick?.(activeRowItem, e);
                  }}
                  sx={{ gap: 1.5 }}
                >
                  {mItem.icon && <Box sx={{ display: "flex", color: "text.secondary" }}>{mItem.icon}</Box>}
                  {mItem.label}
                </MenuItem>
              ))
            )
          ) : null
        )}
      </Menu>
    </Root>
  );
});

ListCard.displayName = "ListCard";

// Backward compatibility alias export
export const ActionableListCard = ListCard;
