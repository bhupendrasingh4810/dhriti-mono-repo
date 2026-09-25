"use client";

import { forwardRef, useState, useMemo, type ReactNode, type MouseEvent, type ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Pagination from "@mui/material/Pagination";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Link from "@mui/material/Link";
import { alpha, styled, useTheme } from "@mui/material/styles";

// Icons
import SearchRounded from "@mui/icons-material/SearchRounded";
import ClearRounded from "@mui/icons-material/ClearRounded";
import TableRowsRounded from "@mui/icons-material/TableRowsRounded";
import GridViewRounded from "@mui/icons-material/GridViewRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import MoreVertRounded from "@mui/icons-material/MoreVertRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import HubRounded from "@mui/icons-material/HubRounded";
import ChatBubbleRounded from "@mui/icons-material/ChatBubbleRounded";
import AccountTreeRounded from "@mui/icons-material/AccountTreeRounded";
import InsightsRounded from "@mui/icons-material/InsightsRounded";
import ExploreRounded from "@mui/icons-material/ExploreRounded";
import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";

import { Avatar } from "../../mui/Avatar";
import { Tooltip, WhiteTooltip } from "../../mui/Tooltip";
import type { DTableProps, DTableColumn, DTableViewMode, DTableSortOrder } from "./types";
import type { ListCardColumnKey, ListCardStatusType } from "../TableListCard";

// ============================================================================
// STYLED CONTAINERS
// ============================================================================

const RootContainer = styled(Card, {
  shouldForwardProp: (prop) => prop !== "variantType" && prop !== "fullWidth",
})<{ variantType: "elevated" | "outlined" | "flat"; fullWidth: boolean }>(({ theme, variantType, fullWidth }) => ({
  width: fullWidth ? "100%" : "auto",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  transition: theme.transitions.create(["box-shadow", "border-color"], {
    duration: theme.transitions.duration.shorter,
  }),
  ...(variantType === "outlined" && {
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "none",
  }),
  ...(variantType === "flat" && {
    boxShadow: "none",
    border: "none",
    backgroundColor: "transparent",
  }),
}));

const SearchInput = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 10,
    backgroundColor: theme.palette.background.paper,
    fontSize: "0.875rem",
    border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
    transition: theme.transitions.create(["border-color", "box-shadow"], {
      duration: theme.transitions.duration.shorter,
    }),
    "& fieldset": {
      border: "none",
    },
    "&:hover": {
      borderColor: alpha(theme.palette.text.primary, 0.3),
    },
    "&.Mui-focused": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
  },
  "& .MuiOutlinedInput-input": {
    padding: "8px 14px",
    height: "22px",
    boxSizing: "content-box",
  },
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

// Format Date Utility
function formatDateString(value: any, format?: string): ReactNode {
  if (value == null) return null;
  if (typeof value !== "string" && !(value instanceof Date)) return value;
  if (typeof value === "string") return value;
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
// MAIN DTABLE COMPONENT
// ============================================================================

export const DTable = forwardRef<HTMLDivElement, DTableProps>(function DTable(
  {
    title,
    subtitle,
    headerIcon,
    headerIconColor,
    headerIconBg,
    columns,
    items = [],
    viewMode: controlledViewMode,
    defaultViewMode = "table",
    onViewModeChange,
    showViewToggle = true,
    showSearch = true,
    searchQuery: controlledSearchQuery,
    defaultSearchQuery = "",
    searchPlaceholder = "Search records...",
    onSearchChange,
    filters,
    filterValues: controlledFilterValues,
    onFilterChange,
    onResetFilters,
    showFilterButton = true,
    sortBy: controlledSortBy,
    sortOrder: controlledSortOrder,
    defaultSortBy,
    defaultSortOrder = "asc",
    onSortChange,
    showPagination = true,
    page: controlledPage,
    defaultPage = 1,
    rowsPerPage: controlledRowsPerPage,
    defaultRowsPerPage = 10,
    rowsPerPageOptions = [5, 10, 25, 50],
    totalItems: controlledTotalItems,
    onPageChange,
    onRowsPerPageChange,
    selectable = false,
    selectedIds: controlledSelectedIds,
    defaultSelectedIds = [],
    onSelectionChange,
    onItemToggle,
    bulkActions,
    onRowClick,
    rowMenuItems,
    headerActions,
    headerButtons,
    variant = "elevated",
    density = "normal",
    striped = false,
    stickyHeader = false,
    maxHeight,
    elevation = 1,
    fullWidth = true,
    sx,
    loading = false,
    loadingRows = 5,
    emptyState,
    cardGridColumns = { xs: 12, sm: 6, md: 4, lg: 3 },
  },
  ref,
) {
  const theme = useTheme();

  // 1. View Mode State
  const [internalViewMode, setInternalViewMode] = useState<DTableViewMode>(defaultViewMode);
  const viewMode = controlledViewMode ?? internalViewMode;

  const handleViewModeChange = (_: any, newMode: DTableViewMode | null) => {
    if (newMode && newMode !== viewMode) {
      if (controlledViewMode === undefined) {
        setInternalViewMode(newMode);
      }
      onViewModeChange?.(newMode);
    }
  };

  // 2. Search Query State
  const [internalSearchQuery, setInternalSearchQuery] = useState(defaultSearchQuery);
  const searchQuery = controlledSearchQuery ?? internalSearchQuery;

  const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (controlledSearchQuery === undefined) {
      setInternalSearchQuery(val);
    }
    onSearchChange?.(val);
  };

  const handleClearSearch = () => {
    if (controlledSearchQuery === undefined) {
      setInternalSearchQuery("");
    }
    onSearchChange?.("");
  };

  // 3. Filter Popover State & Active Filter Values
  const [internalFilterValues, setInternalFilterValues] = useState<Record<string, any>>({});
  const filterValues = controlledFilterValues ?? internalFilterValues;
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filterValues).filter(([_, val]) => {
      if (val == null || val === "") return false;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }).length;
  }, [filterValues]);

  const handleSetFilterValue = (filterId: string, value: any) => {
    const nextValues = { ...filterValues, [filterId]: value };
    if (controlledFilterValues === undefined) {
      setInternalFilterValues(nextValues);
    }
    onFilterChange?.(filterId, value, nextValues);
  };

  const handleClearAllFilters = () => {
    if (controlledFilterValues === undefined) {
      setInternalFilterValues({});
    }
    onResetFilters?.();
    if (filters) {
      filters.forEach((f) => onFilterChange?.(f.id, undefined, {}));
    }
  };

  // 4. Sorting State
  const [internalSortBy, setInternalSortBy] = useState<string | undefined>(defaultSortBy);
  const [internalSortOrder, setInternalSortOrder] = useState<DTableSortOrder>(defaultSortOrder);
  const sortBy = controlledSortBy ?? internalSortBy;
  const sortOrder = controlledSortOrder ?? internalSortOrder;

  const handleRequestSort = (columnId: string) => {
    const isAsc = sortBy === columnId && sortOrder === "asc";
    const nextOrder: DTableSortOrder = isAsc ? "desc" : "asc";

    if (controlledSortBy === undefined) {
      setInternalSortBy(columnId);
      setInternalSortOrder(nextOrder);
    }
    onSortChange?.(columnId, nextOrder);
  };

  // 5. Pagination State
  const [internalPage, setInternalPage] = useState<number>(defaultPage);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState<number>(defaultRowsPerPage);
  const page = controlledPage ?? internalPage;
  const rowsPerPage = controlledRowsPerPage ?? internalRowsPerPage;

  const handlePageChange = (_: unknown, newPage: number) => {
    if (controlledPage === undefined) {
      setInternalPage(newPage);
    }
    onPageChange?.(newPage);
  };

  const handleRowsPerPageSelect = (e: any) => {
    const newRows = Number(e.target.value);
    if (controlledRowsPerPage === undefined) {
      setInternalRowsPerPage(newRows);
      setInternalPage(1);
    }
    onRowsPerPageChange?.(newRows);
  };

  // 6. Selection & Checkbox State
  const [internalSelectedIds, setInternalSelectedIds] = useState<Array<string | number>>(defaultSelectedIds);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;

  const handleToggleRow = (item: any, isSelected: boolean) => {
    const nextSelected = isSelected ? [...selectedIds, item.id] : selectedIds.filter((id) => id !== item.id);

    if (controlledSelectedIds === undefined) {
      setInternalSelectedIds(nextSelected);
    }
    onItemToggle?.(item, isSelected);
    onSelectionChange?.(
      nextSelected,
      items.filter((it) => nextSelected.includes(it.id)),
    );
  };

  const handleToggleSelectAll = (checked: boolean, visibleItems: any[]) => {
    const visibleIds = visibleItems.map((it) => it.id);
    let nextSelected: Array<string | number>;

    if (checked) {
      nextSelected = Array.from(new Set([...selectedIds, ...visibleIds]));
    } else {
      nextSelected = selectedIds.filter((id) => !visibleIds.includes(id));
    }

    if (controlledSelectedIds === undefined) {
      setInternalSelectedIds(nextSelected);
    }
    onSelectionChange?.(
      nextSelected,
      items.filter((it) => nextSelected.includes(it.id)),
    );
  };

  // 7. Row Action Menu State
  const [rowMenuAnchor, setRowMenuAnchor] = useState<HTMLElement | null>(null);
  const [activeRowItem, setActiveRowItem] = useState<any | null>(null);

  // 8. Client-Side Filter & Sort & Slice Processing (Fallback when no backend query is wired)
  const processedItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return Object.values(item).some((val) => {
          if (val == null) return false;
          if (typeof val === "string" || typeof val === "number") {
            return String(val).toLowerCase().includes(q);
          }
          if (typeof val === "object") {
            return Object.values(val).some((v) => typeof v === "string" && v.toLowerCase().includes(q));
          }
          return false;
        });
      });
    }

    // Filter values
    Object.entries(filterValues).forEach(([filterId, filterVal]) => {
      if (filterVal == null || filterVal === "" || filterVal === "all") return;
      result = result.filter((item) => {
        const itemVal = item[filterId];
        if (Array.isArray(filterVal)) {
          if (filterVal.length === 0) return true;
          return filterVal.includes(itemVal) || filterVal.includes(itemVal?.type) || filterVal.includes(itemVal?.label);
        }
        if (typeof itemVal === "object" && itemVal !== null) {
          return itemVal.type === filterVal || itemVal.label === filterVal || itemVal.value === filterVal;
        }
        return itemVal === filterVal;
      });
    });

    // Client Sort
    if (sortBy) {
      result.sort((a, b) => {
        const valA = a[sortBy] ?? a.primaryText?.title ?? a.user?.name ?? a.title ?? "";
        const valB = b[sortBy] ?? b.primaryText?.title ?? b.user?.name ?? b.title ?? "";

        let comparison = 0;
        if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortOrder === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [items, searchQuery, filterValues, sortBy, sortOrder]);

  const totalItemCount = controlledTotalItems ?? processedItems.length;

  const paginatedItems = useMemo(() => {
    // If external onPageChange provided and controlledTotalItems passed, don't slice
    if (controlledTotalItems !== undefined && onPageChange) {
      return processedItems;
    }
    const start = (page - 1) * rowsPerPage;
    return processedItems.slice(start, start + rowsPerPage);
  }, [processedItems, page, rowsPerPage, controlledTotalItems, onPageChange]);

  const totalPages = Math.max(1, Math.ceil(totalItemCount / rowsPerPage));

  // Density padding
  const cellPadding = density === "compact" ? "8px 16px" : density === "comfortable" ? "18px 24px" : "14px 20px";

  // Visible columns
  const visibleColumns = useMemo(() => {
    const base = columns.filter((col) => !col.hidden);
    const hasActionsCol = base.some((c) => c.id === "actions" || c.type === "actions");
    if (!hasActionsCol) {
      return [
        ...base,
        {
          id: "actions",
          label: "",
          align: "right",
          width: 60,
          type: "actions",
          cardRole: "footer",
        } as DTableColumn,
      ];
    }
    return base;
  }, [columns]);

  // Is all visible items selected
  const isAllVisibleSelected = paginatedItems.length > 0 && paginatedItems.every((it) => selectedIds.includes(it.id));
  const isSomeVisibleSelected = paginatedItems.some((it) => selectedIds.includes(it.id)) && !isAllVisibleSelected;

  // ==========================================================================
  // CELL RENDERER
  // ==========================================================================

  const renderCellContent = (col: DTableColumn, item: any, index: number): ReactNode => {
    const rawVal = item[col.id];

    if (col.render) {
      return col.render(rawVal, item, index);
    }

    const type: ListCardColumnKey = col.type ?? (col.id as ListCardColumnKey);
    const selected = selectedIds.includes(item.id);

    switch (type) {
      case "checkbox":
        return (
          <Checkbox
            size="small"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={(_, checked) => handleToggleRow(item, checked)}
          />
        );

      case "user": {
        const u = item.user ?? (typeof rawVal === "object" ? rawVal : null);
        if (!u && typeof rawVal === "string") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar size="md">{rawVal.slice(0, 2).toUpperCase()}</Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {rawVal}
              </Typography>
            </Box>
          );
        }
        if (!u) return null;
        const subtitleText =
          u.subtitleType === "none"
            ? null
            : (u.subtitle ??
              (u.subtitleType === "activity"
                ? u.activity
                : u.subtitleType === "team"
                  ? [u.designation, u.teamName].filter(Boolean).join(" • ")
                  : u.subtitleType === "designation"
                    ? u.designation
                    : (u.activity ?? [u.designation, u.teamName].filter(Boolean).join(" • ") ?? u.designation)));

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 160 }}>
            <Avatar src={u.avatarUrl} size="md" variant={u.avatarShape ?? "circular"} color={u.avatarColor}>
              {u.initials ?? u.name?.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: selected ? 700 : 600 }}>
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

      case "primaryText": {
        const pt = item.primaryText ?? (typeof rawVal === "object" ? rawVal : { title: rawVal ?? item.title });
        const ptTitle = pt?.title ?? rawVal ?? item.title;
        const ptSubtitle = pt?.subtitle ?? item.description;
        const ptMeta = pt?.metadata ?? item.metadata;
        const ptHref = pt?.href ?? item.href;

        return (
          <Box sx={{ minWidth: 160 }}>
            {ptHref ? (
              <Link
                href={ptHref}
                color="inherit"
                underline="hover"
                sx={{ fontWeight: selected ? 700 : 600, fontSize: "0.875rem" }}
              >
                {ptTitle}
              </Link>
            ) : (
              <Typography variant="body2" noWrap sx={{ fontWeight: selected ? 700 : 600 }}>
                {ptTitle}
              </Typography>
            )}
            {(ptSubtitle || ptMeta) && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {[ptSubtitle, ptMeta].filter(Boolean).join(" • ")}
              </Typography>
            )}
          </Box>
        );
      }

      case "status": {
        const st = item.status ?? rawVal ?? item.priority;
        if (!st) return null;
        const label = typeof st === "object" ? st.label : String(st);
        const statusType: ListCardStatusType =
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
          statusType === "error"
            ? theme.palette.error
            : statusType === "warning"
              ? theme.palette.warning
              : statusType === "success"
                ? theme.palette.success
                : statusType === "info"
                  ? theme.palette.info
                  : theme.palette.primary;

        const formattedLabel = typeof label === "string" ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : label;

        return (
          <Chip
            label={formattedLabel}
            size="small"
            sx={{
              backgroundColor:
                statusType === "inherit" || statusType === "default"
                  ? theme.palette.action.selected
                  : alpha(paletteObj.main, 0.15),
              color:
                statusType === "inherit" || statusType === "default" ? theme.palette.text.primary : paletteObj.dark,
              fontWeight: 600,
              fontSize: "0.75rem",
              borderRadius: 1,
            }}
          />
        );
      }

      case "tags": {
        const tg = item.tags ?? rawVal;
        if (!tg || tg.length === 0) return null;
        return (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 220 }}>
            {tg.map((tag: any, tIdx: number) => {
              const label = typeof tag === "string" ? tag : tag.label;
              const tagType = typeof tag === "object" ? (tag.type ?? "default") : "default";
              const palette =
                tagType === "error"
                  ? theme.palette.error
                  : tagType === "warning"
                    ? theme.palette.warning
                    : tagType === "success"
                      ? theme.palette.success
                      : tagType === "info"
                        ? theme.palette.info
                        : theme.palette.primary;

              return (
                <Chip
                  key={tIdx}
                  label={label}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.725rem",
                    fontWeight: 600,
                    borderRadius: 1,
                    backgroundColor: tagType === "default" ? theme.palette.action.selected : alpha(palette.main, 0.12),
                    color: tagType === "default" ? theme.palette.text.primary : palette.dark,
                  }}
                />
              );
            })}
          </Box>
        );
      }

      case "progress": {
        const prog = item.progress ?? rawVal;
        if (prog == null) return null;
        const val = typeof prog === "number" ? prog : prog.value;
        const max = typeof prog === "object" ? (prog.max ?? 100) : 100;
        const pct = Math.round((val / max) * 100);
        const progColor = typeof prog === "object" ? (prog.color ?? "primary") : "primary";

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 120 }}>
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

      case "dateTime": {
        const dt = item.dateTime ?? rawVal;
        if (!dt) return null;
        const value = typeof dt === "object" && !(dt instanceof Date) && "value" in dt ? dt.value : dt;
        const format = typeof dt === "object" && !(dt instanceof Date) && "format" in dt ? dt.format : undefined;
        const label = typeof dt === "object" && !(dt instanceof Date) && "label" in dt ? dt.label : undefined;
        const formatted = label ?? formatDateString(value, format);

        return (
          <Typography variant="body2" color="text.secondary" noWrap>
            {formatted}
          </Typography>
        );
      }

      case "numeric": {
        const numObj = item.numeric ?? rawVal;
        if (numObj == null) return null;
        const val = typeof numObj === "object" ? numObj.value : numObj;
        const prefix = typeof numObj === "object" ? (numObj.prefix ?? "") : "";
        const suffix = typeof numObj === "object" ? (numObj.suffix ?? "") : "";
        const lbl = typeof numObj === "object" ? numObj.label : undefined;

        return (
          <Box sx={{ textAlign: col.align === "right" ? "right" : "left", minWidth: 70 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
              {prefix}
              {val}
              {suffix}
            </Typography>
            {lbl && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {lbl}
              </Typography>
            )}
          </Box>
        );
      }

      case "referenceId": {
        const refObj = item.referenceId ?? rawVal;
        if (refObj == null) return null;
        const rawId = typeof refObj === "object" ? refObj.id : refObj;
        const prefix = typeof refObj === "object" ? (refObj.prefix ?? "") : "";
        const href = typeof refObj === "object" ? refObj.href : undefined;
        const displayId = `${prefix}${rawId}`;

        return (
          <Typography
            component={href ? Link : "span"}
            href={href}
            variant="caption"
            sx={{
              fontFamily: "monospace",
              fontWeight: 700,
              bgcolor: "action.hover",
              px: 1,
              py: 0.35,
              borderRadius: 1,
              color: href ? "primary.main" : "text.primary",
              textDecoration: "none",
            }}
          >
            {displayId}
          </Typography>
        );
      }

      case "email": {
        const em = item.email ?? rawVal;
        if (!em) return null;
        const address = typeof em === "string" ? em : em.address;
        const clickable = typeof em === "object" ? em.clickable : true;

        return clickable ? (
          <Link href={`mailto:${address}`} variant="body2" color="text.secondary" underline="hover" noWrap>
            {address}
          </Link>
        ) : (
          <Typography variant="body2" color="text.secondary" noWrap>
            {address}
          </Typography>
        );
      }

      case "mobile": {
        const mob = item.mobile ?? rawVal;
        if (!mob) return null;
        const num = typeof mob === "string" ? mob : mob.number;

        return (
          <Link href={`tel:${num}`} variant="body2" color="text.secondary" underline="hover" noWrap>
            {num}
          </Link>
        );
      }

      case "media": {
        const m = item.media ?? rawVal;
        if (!m) return null;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 160 }}>
            {m.thumbnail ?? (
              <Box
                component={m.src ? "img" : "div"}
                src={m.src}
                alt={m.title}
                sx={{
                  width: 44,
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

      case "file": {
        const f = item.file ?? rawVal;
        if (!f) return null;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 160 }}>
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

      case "event": {
        const ev = item.event ?? rawVal;
        if (!ev) return null;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 180 }}>
            <Box
              sx={{
                width: 38,
                height: 42,
                borderRadius: 1,
                overflow: "hidden",
                border: `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  py: 0.2,
                }}
              >
                {ev.month?.slice(0, 3).toUpperCase()}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                }}
              >
                {ev.day}
              </Box>
            </Box>
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

      case "app": {
        const ap = item.app ?? rawVal;
        if (!ap) return null;
        const appName = typeof ap === "string" ? ap : ap.name;
        const branding = appBranding[appName] ?? {
          color: theme.palette.primary.main,
          icon: <HubRounded fontSize="small" />,
        };
        const icon = typeof ap === "object" && ap.icon ? ap.icon : branding.icon;
        const color = typeof ap === "object" && ap.color ? ap.color : branding.color;

        return (
          <Tooltip title={appName}>
            <Box
              sx={{
                width: 30,
                height: 30,
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

      case "starred": {
        const isStarred = Boolean(item.starred ?? rawVal);
        return (
          <IconButton
            size="small"
            aria-label={isStarred ? "Unstar" : "Star"}
            onClick={(e) => {
              e.stopPropagation();
              item.onStarToggle?.(item, !isStarred, e);
            }}
            sx={{ color: isStarred ? theme.palette.warning.main : theme.palette.text.disabled }}
          >
            {isStarred ? <StarRounded fontSize="small" /> : <StarBorderRounded fontSize="small" />}
          </IconButton>
        );
      }

      case "actions": {
        return (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            {item.action}
            <IconButton
              size="small"
              aria-label="More row actions"
              onClick={(e) => {
                e.stopPropagation();
                setRowMenuAnchor(e.currentTarget);
                setActiveRowItem(item);
              }}
              sx={{
                color: "text.secondary",
                borderRadius: 1,
                "&:hover": {
                  color: "text.primary",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <MoreVertRounded fontSize="small" />
            </IconButton>
          </Box>
        );
      }

      default:
        return typeof rawVal === "object" ? JSON.stringify(rawVal) : String(rawVal ?? "");
    }
  };

  // ==========================================================================
  // CARD VIEW RENDERER
  // ==========================================================================

  const renderCardItem = (item: any, index: number) => {
    const selected = selectedIds.includes(item.id);

    // Group columns by card roles
    const headerCol =
      visibleColumns.find((c) => c.cardRole === "header") ??
      visibleColumns.find((c) => c.type === "primaryText" || c.type === "user" || c.id === "name" || c.id === "title");

    const badgeCol =
      visibleColumns.find((c) => c.cardRole === "badge") ??
      visibleColumns.find((c) => c.type === "status" || c.id === "status" || c.id === "priority");

    const mediaCol =
      visibleColumns.find((c) => c.cardRole === "media") ??
      visibleColumns.find((c) => c.type === "media" || c.type === "file" || c.type === "avatarImage");

    const footerCol =
      visibleColumns.find((c) => c.cardRole === "footer") ??
      visibleColumns.find((c) => c.type === "progress" || c.type === "dateTime");

    const bodyCols = visibleColumns.filter(
      (c) =>
        c.cardRole !== "hide" &&
        c !== headerCol &&
        c !== badgeCol &&
        c !== mediaCol &&
        c !== footerCol &&
        c.type !== "checkbox" &&
        c.type !== "actions",
    );

    return (
      <Card
        key={item.id ?? index}
        variant="outlined"
        onClick={(e) => onRowClick?.(item, e)}
        sx={{
          borderRadius: 2,
          border: `1px solid ${selected ? theme.palette.primary.main : alpha(theme.palette.divider, 0.8)}`,
          backgroundColor: selected ? alpha(theme.palette.primary.main, 0.02) : theme.palette.background.paper,
          cursor: onRowClick ? "pointer" : "default",
          boxShadow: selected
            ? `0 0 0 1px ${theme.palette.primary.main}, 0 4px 12px rgba(0,0,0,0.04)`
            : "0 1px 3px rgba(0,0,0,0.03)",
          transition: theme.transitions.create(["box-shadow", "border-color", "transform"], {
            duration: theme.transitions.duration.shorter,
          }),
          "&:hover": {
            boxShadow: theme.shadows[4],
            transform: "translateY(-2px)",
            borderColor: selected ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.4),
          },
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Card Header */}
        <Box
          sx={{ p: 2.5, pb: 1.5, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
            {selectable && (
              <Checkbox
                size="small"
                checked={selected}
                onClick={(e) => e.stopPropagation()}
                onChange={(_, checked) => handleToggleRow(item, checked)}
                sx={{ p: 0.25 }}
              />
            )}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {headerCol ? (
                renderCellContent(headerCol, item, index)
              ) : (
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {item.name ?? item.title ?? `Item #${item.id ?? index + 1}`}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
            {badgeCol && renderCellContent(badgeCol, item, index)}
            {(rowMenuItems || item.menuItems) && (
              <WhiteTooltip title="More options">
                <IconButton
                  size="small"
                  aria-label="More card actions"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRowMenuAnchor(e.currentTarget);
                    setActiveRowItem(item);
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  <MoreVertRounded fontSize="small" />
                </IconButton>
              </WhiteTooltip>
            )}
          </Box>
        </Box>

        {/* Card Media Preview */}
        {mediaCol && <Box sx={{ px: 2.5, pb: 1.5 }}>{renderCellContent(mediaCol, item, index)}</Box>}

        <Divider sx={{ opacity: 0.6 }} />

        {/* Card Body Key-Values */}
        <CardContent sx={{ p: 2.5, py: 2, flex: 1 }}>
          <Stack spacing={1.5}>
            {bodyCols.map((col) => (
              <Box
                key={col.id}
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
                  {col.label}
                </Typography>
                <Box sx={{ textAlign: "right" }}>{renderCellContent(col, item, index)}</Box>
              </Box>
            ))}
          </Stack>
        </CardContent>

        {/* Card Footer */}
        {footerCol && (
          <>
            <Divider sx={{ opacity: 0.6 }} />
            <CardActions sx={{ px: 2.5, py: 1.5, justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {footerCol.label}
              </Typography>
              <Box>{renderCellContent(footerCol, item, index)}</Box>
            </CardActions>
          </>
        )}
      </Card>
    );
  };

  // ==========================================================================
  // BULK ACTIONS BAR
  // ==========================================================================

  const bulkActionBar = selectedIds.length > 0 && (
    <Box
      sx={{
        px: 3,
        py: 2,
        my: 3,
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        borderRadius: "8px",
      }}
    >
      <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
        <Chip
          label={`${selectedIds.length} Selected`}
          size="small"
          sx={{
            fontWeight: 700,
            borderRadius: "16px",
            bgcolor: theme.palette.primary.main,
            color: "#ffffff",
            fontSize: "0.75rem",
            height: 24,
            px: 0.5,
          }}
        />
        <Button
          size="small"
          variant="text"
          color="inherit"
          onClick={() => {
            if (controlledSelectedIds === undefined) setInternalSelectedIds([]);
            onSelectionChange?.([], []);
          }}
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "text.secondary",
            textTransform: "none",
            p: 0,
            "&:hover": {
              color: "primary.main",
              bgcolor: "transparent",
              textDecoration: "underline",
            },
          }}
        >
          Deselect all
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {bulkActions?.map((action) => {
          const isError = action.color === "error";
          return (
            <WhiteTooltip key={action.id} title={typeof action.label === "string" ? action.label : "Action"}>
              <span>
                <IconButton
                  size="small"
                  aria-label={typeof action.label === "string" ? action.label : "Bulk action"}
                  onClick={() =>
                    action.onClick(
                      selectedIds,
                      items.filter((it) => selectedIds.includes(it.id)),
                    )
                  }
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: "8px",
                    border: `1px solid ${isError ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.divider, 0.9)}`,
                    color: isError ? theme.palette.error.main : theme.palette.text.secondary,
                    bgcolor: theme.palette.background.paper,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                    transition: theme.transitions.create(
                      ["background-color", "border-color", "color", "transform", "box-shadow"],
                      {
                        duration: theme.transitions.duration.shorter,
                      },
                    ),
                    "&:hover": {
                      bgcolor: isError
                        ? alpha(theme.palette.error.main, 0.08)
                        : alpha(theme.palette.primary.main, 0.08),
                      borderColor: isError ? theme.palette.error.main : alpha(theme.palette.primary.main, 0.4),
                      color: isError ? theme.palette.error.dark : theme.palette.primary.main,
                      transform: "translateY(-1px)",
                      boxShadow: isError ? "0 2px 6px rgba(239,68,68,0.15)" : "0 2px 6px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  {action.icon ?? <MoreVertRounded fontSize="small" />}
                </IconButton>
              </span>
            </WhiteTooltip>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <RootContainer
      variantType={variant}
      fullWidth={fullWidth}
      elevation={variant === "elevated" ? elevation : 0}
      sx={sx}
      ref={ref}
    >
      {/* 1. Header Bar: Title + Subtitle + Header Buttons */}
      {(title || subtitle || headerIcon || headerButtons || headerActions) && (
        <CardHeader
          avatar={
            headerIcon && (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  bgcolor: headerIconBg ?? alpha(headerIconColor ?? theme.palette.primary.main, 0.12),
                  color: headerIconColor ?? theme.palette.primary.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {headerIcon}
              </Box>
            )
          }
          title={
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          }
          subheader={
            subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block" }}>
                {subtitle}
              </Typography>
            )
          }
          action={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {headerButtons?.map((btn, bIdx) => (
                <Button
                  key={bIdx}
                  size="small"
                  variant={btn.variant ?? "contained"}
                  color={btn.color ?? "primary"}
                  startIcon={btn.icon}
                  onClick={btn.onClick}
                >
                  {btn.label}
                </Button>
              ))}
              {headerActions}
            </Stack>
          }
          sx={{ px: 3, py: 2.25 }}
        />
      )}

      {(title || subtitle || headerIcon) && <Divider />}

      {/* 2. Controls Toolbar: Enterprise Search + Filters + View Toggle */}
      <Box
        sx={{
          p: 2.5,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          bgcolor: theme.palette.background.paper,
        }}
      >
        {/* Left Side: Search Bar & Filter Button */}
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: 1, minWidth: 280 }}>
          {showSearch && (
            <SearchInput
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={handleSearchInput}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch} aria-label="Clear search">
                        <ClearRounded fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ minWidth: 320, width: 380, maxWidth: 480 }}
            />
          )}

          {/* Filter Popover Trigger */}
          {filters && filters.length > 0 && showFilterButton && (
            <Button
              size="small"
              variant={activeFilterCount > 0 ? "contained" : "outlined"}
              color={activeFilterCount > 0 ? "primary" : "inherit"}
              startIcon={<FilterListRounded fontSize="small" />}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              sx={{
                borderRadius: "10px",
                height: 38,
                px: 2,
                textTransform: "none",
                fontWeight: 600,
                borderColor: alpha(theme.palette.divider, 0.9),
                boxShadow: activeFilterCount > 0 ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              }}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          )}
        </Stack>

        {/* Right Side: View Toggle & Secondary Actions */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {showViewToggle && (
            <Box
              sx={{
                p: "3px",
                bgcolor: alpha(theme.palette.divider, 0.45),
                borderRadius: "10px",
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <ToggleButtonGroup
                size="small"
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="Table or Card View Toggle"
                sx={{
                  border: "none",
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "none !important",
                    borderRadius: "7px !important",
                    px: 1.25,
                    py: 0.5,
                    minWidth: 34,
                    height: 32,
                    color: theme.palette.text.secondary,
                    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&.Mui-selected": {
                      bgcolor: `${theme.palette.background.paper} !important`,
                      color: `${theme.palette.primary.main} !important`,
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
                    },
                    "&:hover": {
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                    },
                  },
                }}
              >
                <ToggleButton value="table" aria-label="Table View">
                  <WhiteTooltip title="Table View">
                    <TableRowsRounded fontSize="small" />
                  </WhiteTooltip>
                </ToggleButton>
                <ToggleButton value="card" aria-label="Card View">
                  <WhiteTooltip title="Card View">
                    <GridViewRounded fontSize="small" />
                  </WhiteTooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}
        </Stack>
      </Box>

      {/* 3. Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <Box
          sx={{
            px: 3,
            py: 2,
            my: 2,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.25,
            borderRadius: 1,
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            Active filters:
          </Typography>
          {Object.entries(filterValues).map(([fId, fVal]) => {
            if (fVal == null || fVal === "" || fVal === "all") return null;
            const filterDef = filters?.find((f) => f.id === fId);
            const labelText = filterDef?.label ?? fId;
            const displayVal = Array.isArray(fVal) ? fVal.join(", ") : String(fVal);

            return (
              <Chip
                key={fId}
                size="small"
                label={`${labelText}: ${displayVal}`}
                onDelete={() => handleSetFilterValue(fId, undefined)}
                deleteIcon={<CloseRounded sx={{ fontSize: "14px !important" }} />}
                sx={{
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  height: 26,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.dark,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                  "& .MuiChip-deleteIcon": {
                    color: alpha(theme.palette.primary.dark, 0.7),
                    "&:hover": {
                      color: theme.palette.primary.dark,
                    },
                  },
                }}
              />
            );
          })}
          <Button
            size="small"
            variant="text"
            onClick={handleClearAllFilters}
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "none",
              p: 0,
              ml: 0.5,
              "&:hover": {
                color: "error.main",
                bgcolor: "transparent",
                textDecoration: "underline",
              },
            }}
          >
            Clear all
          </Button>
        </Box>
      )}

      {/* 4. Bulk Action Bar */}
      {bulkActionBar}

      {/* 5. Main Content Area: Table View OR Card View */}
      {loading ? (
        <Box sx={{ p: 3 }}>
          <Stack spacing={1.5}>
            {Array.from({ length: loadingRows }).map((_, idx) => (
              <Skeleton key={idx} variant="rounded" height={48} width="100%" />
            ))}
          </Stack>
        </Box>
      ) : paginatedItems.length === 0 ? (
        <Box sx={{ p: 6, textAlign: "center" }} role="status">
          {emptyState && typeof emptyState === "object" && !("props" in emptyState) && "title" in emptyState ? (
            <Box sx={{ maxWidth: 360, mx: "auto" }}>
              {(emptyState as any).icon && (
                <Box sx={{ mb: 1.5, color: "text.disabled" }}>{(emptyState as any).icon}</Box>
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {(emptyState as any).title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {(emptyState as any).description}
              </Typography>
              {(emptyState as any).actionLabel && (
                <Button variant="outlined" size="small" onClick={(emptyState as any).onAction}>
                  {(emptyState as any).actionLabel}
                </Button>
              )}
            </Box>
          ) : emptyState ? (
            (emptyState as ReactNode)
          ) : (
            <Box sx={{ maxWidth: 360, mx: "auto" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                No records found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                Try adjusting your search query or removing active filters.
              </Typography>
              {(searchQuery || activeFilterCount > 0) && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    handleClearSearch();
                    handleClearAllFilters();
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </Box>
          )}
        </Box>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <TableContainer sx={{ maxHeight: maxHeight, overflowX: "auto" }}>
          <Table stickyHeader={stickyHeader} size={density === "compact" ? "small" : "medium"}>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.action.hover, 0.25) }}>
                {selectable && (
                  <TableCell
                    padding="checkbox"
                    sx={{ width: 48, py: 1.75, pl: 2.5, borderBottom: `1px solid ${theme.palette.divider}` }}
                  >
                    <Checkbox
                      size="small"
                      checked={isAllVisibleSelected}
                      indeterminate={isSomeVisibleSelected}
                      onChange={(e) => handleToggleSelectAll(e.target.checked, paginatedItems)}
                    />
                  </TableCell>
                )}

                {visibleColumns.map((col) => {
                  const isSorted = sortBy === col.id || sortBy === col.sortKey;

                  return (
                    <TableCell
                      key={col.id}
                      align={col.align ?? "left"}
                      sortDirection={isSorted ? sortOrder : false}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "text.secondary",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        width: col.width,
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                        padding: cellPadding,
                        whiteSpace: "nowrap",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {col.sortable ? (
                        <TableSortLabel
                          active={isSorted}
                          direction={isSorted ? sortOrder : "asc"}
                          onClick={() => handleRequestSort(col.sortKey ?? col.id)}
                          sx={{
                            "&.MuiTableSortLabel-active": {
                              color: "text.primary",
                              fontWeight: 800,
                            },
                          }}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedItems.map((item, index) => {
                const selected = selectedIds.includes(item.id);

                return (
                  <TableRow
                    key={item.id ?? index}
                    hover
                    selected={selected}
                    onClick={(e) => onRowClick?.(item, e)}
                    sx={{
                      cursor: onRowClick ? "pointer" : "default",
                      bgcolor: theme.palette.background.paper,
                      ...(striped &&
                        index % 2 === 1 && {
                          bgcolor: alpha(theme.palette.action.hover, 0.08),
                        }),
                      "&.Mui-selected": {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                      "& td": {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" sx={{ width: 48, py: 1.5, pl: 2.5 }}>
                        <Checkbox
                          size="small"
                          checked={selected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(_, checked) => handleToggleRow(item, checked)}
                        />
                      </TableCell>
                    )}

                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align ?? "left"}
                        sx={{
                          padding: cellPadding,
                          width: col.width,
                          minWidth: col.minWidth,
                          maxWidth: col.maxWidth,
                        }}
                      >
                        {renderCellContent(col, item, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* CARD VIEW (GRID) */
        <Box
          sx={{
            p: 3,
            display: "grid",
            gridTemplateColumns: {
              xs: `repeat(${Math.max(1, Math.round(12 / (cardGridColumns?.xs ?? 12)))}, 1fr)`,
              sm: `repeat(${Math.max(1, Math.round(12 / (cardGridColumns?.sm ?? 6)))}, 1fr)`,
              md: `repeat(${Math.max(1, Math.round(12 / (cardGridColumns?.md ?? 4)))}, 1fr)`,
              lg: `repeat(${Math.max(1, Math.round(12 / (cardGridColumns?.lg ?? 3)))}, 1fr)`,
            },
            gap: 3,
          }}
        >
          {paginatedItems.map((item, index) => renderCardItem(item, index))}
        </Box>
      )}

      {/* 6. Footer Pagination Toolbar */}
      {showPagination && totalItemCount > 0 && (
        <>
          <Divider />
          <Box
            sx={{
              p: 2.25,
              px: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 2,
              bgcolor: theme.palette.background.paper,
            }}
          >
            {/* Left: Summary text */}
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
              Showing <strong>{Math.min((page - 1) * rowsPerPage + 1, totalItemCount)}</strong> -{" "}
              <strong>{Math.min(page * rowsPerPage, totalItemCount)}</strong> of <strong>{totalItemCount}</strong>{" "}
              records
            </Typography>

            {/* Right: Rows per page & MUI Pagination */}
            <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Rows per page:
                </Typography>
                <Select
                  size="small"
                  value={rowsPerPage}
                  onChange={handleRowsPerPageSelect}
                  sx={{ height: 34, fontSize: "0.8125rem", borderRadius: 1 }}
                >
                  {rowsPerPageOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="small"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Stack>
          </Box>
        </>
      )}

      {/* Filters Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: { p: 2.5, width: 320, borderRadius: theme.shape.borderRadius, boxShadow: theme.shadows[6] },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Filter Records
          </Typography>
          <Button size="small" onClick={handleClearAllFilters} sx={{ fontSize: "0.75rem", p: 0 }}>
            Reset
          </Button>
        </Box>

        <Stack spacing={2}>
          {filters?.map((filter) => {
            const currentVal = filterValues[filter.id] ?? (filter.type === "multi-select" ? [] : "");

            if (filter.type === "select") {
              return (
                <FormControl key={filter.id} fullWidth size="small">
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {filter.label}
                  </Typography>
                  <Select
                    value={currentVal || "all"}
                    onChange={(e) =>
                      handleSetFilterValue(filter.id, e.target.value === "all" ? undefined : e.target.value)
                    }
                  >
                    <MenuItem value="all">
                      <em>All</em>
                    </MenuItem>
                    {filter.options?.map((opt) => (
                      <MenuItem key={String(opt.value)} value={opt.value as any}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (filter.type === "multi-select") {
              const selectedArray: any[] = Array.isArray(currentVal) ? currentVal : [];
              return (
                <Box key={filter.id}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: "block" }}>
                    {filter.label}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {filter.options?.map((opt) => {
                      const isSel = selectedArray.includes(opt.value);
                      return (
                        <Chip
                          key={String(opt.value)}
                          label={opt.label}
                          size="small"
                          color={isSel ? "primary" : "default"}
                          variant={isSel ? "filled" : "outlined"}
                          onClick={() => {
                            const next = isSel
                              ? selectedArray.filter((v) => v !== opt.value)
                              : [...selectedArray, opt.value];
                            handleSetFilterValue(filter.id, next.length > 0 ? next : undefined);
                          }}
                          sx={{ fontWeight: 600 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              );
            }

            if (filter.render) {
              return (
                <Box key={filter.id}>
                  <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: "block" }}>
                    {filter.label}
                  </Typography>
                  {filter.render({
                    value: currentVal,
                    onChange: (val) => handleSetFilterValue(filter.id, val),
                    filter,
                  })}
                </Box>
              );
            }

            return null;
          })}
        </Stack>

        <Box sx={{ mt: 2.5, display: "flex", justifyContent: "flex-end" }}>
          <Button size="small" variant="contained" onClick={() => setFilterAnchorEl(null)}>
            Apply Filters
          </Button>
        </Box>
      </Popover>

      {/* Row Menu */}
      <Menu
        anchorEl={rowMenuAnchor}
        open={Boolean(rowMenuAnchor)}
        onClose={() => {
          setRowMenuAnchor(null);
          setActiveRowItem(null);
        }}
      >
        {activeRowItem &&
          (rowMenuItems ? (
            rowMenuItems(activeRowItem, {
              selectedId: selectedIds[0] ?? null,
              selectedIds,
              item: activeRowItem,
            })
          ) : activeRowItem.menuItems ? (
            activeRowItem.menuItems.map((m: any, mIdx: number) => (
              <MenuItem
                key={mIdx}
                disabled={m.disabled}
                divider={m.divider}
                onClick={(e) => {
                  setRowMenuAnchor(null);
                  m.onClick?.(activeRowItem, e);
                }}
                sx={{ color: m.color ? `${m.color}.main` : "inherit" }}
              >
                {m.icon && <Box sx={{ mr: 1, display: "flex" }}>{m.icon}</Box>}
                {m.label}
              </MenuItem>
            ))
          ) : (
            <>
              <MenuItem onClick={() => setRowMenuAnchor(null)}>View details</MenuItem>
              <MenuItem onClick={() => setRowMenuAnchor(null)}>Edit record</MenuItem>
              <MenuItem onClick={() => setRowMenuAnchor(null)}>Share link</MenuItem>
              <MenuItem sx={{ color: "error.main" }} onClick={() => setRowMenuAnchor(null)}>
                Delete record
              </MenuItem>
            </>
          ))}
      </Menu>
    </RootContainer>
  );
});

DTable.displayName = "DTable";
