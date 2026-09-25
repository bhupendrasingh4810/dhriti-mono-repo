"use client";

import type { ReactNode, MouseEvent } from "react";
import type {
  ListCardColumnKey,
  ListCardStatusType,
  ListCardDateFormat,
  ListCardAppType,
  ListCardMenuItem,
  ListCardMenuContext,
} from "../TableListCard";

export type DTableViewMode = "table" | "card";
export type DTableDensity = "compact" | "normal" | "comfortable";
export type DTableSortOrder = "asc" | "desc";
export type DTableVariant = "elevated" | "outlined" | "flat";

export type DTableFilterType = "select" | "multi-select" | "search" | "boolean" | "date-range" | "custom";

export interface DTableFilterOption {
  label: string;
  value: string | number | boolean;
  color?: string;
  count?: number;
  icon?: ReactNode;
}

export interface DTableFilter {
  id: string;
  label: string;
  type: DTableFilterType;
  options?: DTableFilterOption[];
  value?: any;
  defaultValue?: any;
  placeholder?: string;
  icon?: ReactNode;
  render?: (props: { value: any; onChange: (val: any) => void; filter: DTableFilter }) => ReactNode;
}

export interface DTableColumn<T = any> {
  /**
   * Unique column identifier matching item key or custom id
   */
  id: string;

  /**
   * Header title / label for the column
   */
  label: ReactNode;

  /**
   * Text / content alignment
   * @default "left"
   */
  align?: "left" | "center" | "right";

  /**
   * Column width constraints
   */
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;

  /**
   * Enable column sorting
   * @default false
   */
  sortable?: boolean;

  /**
   * Custom field key for sorting if different from `id`
   */
  sortKey?: string;

  /**
   * Built-in visual renderer type from ListCard ecosystem
   */
  type?: ListCardColumnKey;

  /**
   * Custom cell renderer for Table View
   */
  render?: (value: any, item: T, index: number) => ReactNode;

  /**
   * Custom card section renderer for Card View
   */
  renderCard?: (value: any, item: T, index: number) => ReactNode;

  /**
   * Role in Card View
   * - "header": Displayed as title / header in card
   * - "media": Displayed as top image / media thumbnail
   * - "badge": Top-right or status chip
   * - "body": Standard detail row in card body
   * - "footer": Bottom metadata or action row
   * - "hide": Excluded from card view
   * @default "body"
   */
  cardRole?: "header" | "media" | "badge" | "body" | "footer" | "hide";

  /**
   * Allow user to toggle visibility of this column
   * @default true
   */
  hideable?: boolean;

  /**
   * Initial hidden state
   * @default false
   */
  hidden?: boolean;
}

export interface DTableBulkAction<T = any> {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success" | "inherit";
  onClick: (selectedIds: Array<string | number>, selectedItems: T[]) => void;
}

export interface DTableProps<T extends { id?: string | number; [key: string]: any } = any> {
  /**
   * Main title in header
   */
  title?: ReactNode;

  /**
   * Subtitle in header
   */
  subtitle?: ReactNode;

  /**
   * Header square icon with background
   */
  headerIcon?: ReactNode;
  headerIconColor?: string;
  headerIconBg?: string;

  /**
   * Array of column definitions
   */
  columns: DTableColumn<T>[];

  /**
   * Data items / records
   */
  items: T[];

  /**
   * View Mode: "table" (list/table view) or "card" (grid cards view)
   */
  viewMode?: DTableViewMode;
  defaultViewMode?: DTableViewMode;
  onViewModeChange?: (mode: DTableViewMode) => void;
  showViewToggle?: boolean;

  /**
   * Search Configuration
   */
  showSearch?: boolean;
  searchQuery?: string;
  defaultSearchQuery?: string;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;

  /**
   * Filter Configurations
   */
  filters?: DTableFilter[];
  filterValues?: Record<string, any>;
  onFilterChange?: (filterId: string, value: any, allFilterValues: Record<string, any>) => void;
  onResetFilters?: () => void;
  showFilterButton?: boolean;

  /**
   * Sorting Configuration
   */
  sortBy?: string;
  sortOrder?: DTableSortOrder;
  defaultSortBy?: string;
  defaultSortOrder?: DTableSortOrder;
  onSortChange?: (columnKey: string, order: DTableSortOrder) => void;

  /**
   * Pagination Configuration
   */
  showPagination?: boolean;
  page?: number;
  defaultPage?: number;
  rowsPerPage?: number;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;

  /**
   * Row Selection & Checkboxes
   */
  selectable?: boolean;
  selectedIds?: Array<string | number>;
  defaultSelectedIds?: Array<string | number>;
  onSelectionChange?: (selectedIds: Array<string | number>, selectedItems: T[]) => void;
  onItemToggle?: (item: T, selected: boolean) => void;
  bulkActions?: DTableBulkAction<T>[];

  /**
   * Row Click & Actions
   */
  onRowClick?: (item: T, event: MouseEvent<HTMLElement>) => void;
  rowMenuItems?: (item: T, context: ListCardMenuContext) => ReactNode;

  /**
   * Header Action Controls
   */
  headerActions?: ReactNode;
  headerButtons?: Array<{
    label: ReactNode;
    icon?: ReactNode;
    variant?: "contained" | "outlined" | "text";
    color?: "primary" | "secondary" | "success" | "error" | "inherit";
    onClick?: () => void;
  }>;

  /**
   * Appearance & Layout
   */
  variant?: DTableVariant;
  density?: DTableDensity;
  striped?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  elevation?: number;
  fullWidth?: boolean;
  sx?: object;

  /**
   * State overrides
   */
  loading?: boolean;
  loadingRows?: number;
  emptyState?:
    | {
        icon?: ReactNode;
        title?: ReactNode;
        description?: ReactNode;
        actionLabel?: string;
        onAction?: () => void;
      }
    | ReactNode;

  /**
   * Card grid layout columns for Card View
   */
  cardGridColumns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}
