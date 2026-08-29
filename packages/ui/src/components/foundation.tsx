"use client";

import * as React from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Badge,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Menu,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  type AlertProps,
  type AutocompleteProps,
  type AvatarProps,
  type BadgeProps,
  type ButtonProps,
  type ChipProps,
  type DialogProps,
  type DrawerProps,
  type IconButtonProps,
  type MenuProps,
  type SelectProps,
  type TabProps,
  type TabsProps,
  type TextFieldProps,
  type TooltipProps,
} from "@mui/material";

import { DataTable, type DataTableProps } from "./data-table";
import { EmptyState, type EmptyStateProps } from "./EmptyState";

export type UIButtonProps = ButtonProps & {
  loading?: boolean;
};

export const UIButton = React.forwardRef<HTMLButtonElement, UIButtonProps>(
  function UIButton({ loading = false, disabled, children, ...props }, ref) {
    return (
      <Button ref={ref} disabled={disabled || loading} {...props}>
        {loading ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
        {children}
      </Button>
    );
  },
);

export const UIIconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function UIIconButton(props, ref) {
    return <IconButton ref={ref} {...props} />;
  },
);

export type UITextFieldProps = TextFieldProps & {
  success?: boolean;
};

export const UITextField = React.forwardRef<HTMLDivElement, UITextFieldProps>(
  function UITextField({ success, helperText, ...props }, ref) {
    return (
      <TextField
        ref={ref}
        helperText={helperText}
        color={success ? "success" : props.color}
        {...props}
      />
    );
  },
);

export const UISelect = React.forwardRef<HTMLDivElement, SelectProps>(
  function UISelect(props, ref) {
    return <Select ref={ref} {...props} />;
  },
);

export function UIAutocomplete<
  T,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
>(props: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
  return <Autocomplete {...props} />;
}

export const UIDialog = React.forwardRef<HTMLDivElement, DialogProps>(
  function UIDialog(props, ref) {
    return <Dialog ref={ref} fullWidth maxWidth="md" {...props} />;
  },
);

export { DialogTitle as UIDialogTitle, DialogContent as UIDialogContent, DialogActions as UIDialogActions };

export const UIDrawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  function UIDrawer(props, ref) {
    return <Drawer ref={ref} {...props} />;
  },
);

export const UIMenu = React.forwardRef<HTMLDivElement, MenuProps>(
  function UIMenu(props, ref) {
    return <Menu ref={ref} {...props} />;
  },
);

export const UIChip = React.forwardRef<HTMLDivElement, ChipProps>(
  function UIChip(props, ref) {
    return <Chip ref={ref} {...props} />;
  },
);

export const UIBadge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function UIBadge(props, ref) {
    return <Badge ref={ref} {...props} />;
  },
);

export const UIAvatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  function UIAvatar(props, ref) {
    return <Avatar ref={ref} {...props} />;
  },
);

export const UITabs = React.forwardRef<HTMLDivElement, TabsProps>(
  function UITabs(props, ref) {
    return <Tabs ref={ref} {...props} />;
  },
);

export function UITab(props: TabProps) {
  return <Tab {...props} />;
}

export const UITooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function UITooltip(props, ref) {
    return <Tooltip ref={ref} {...props} />;
  },
);

export const UIAlert = React.forwardRef<HTMLDivElement, AlertProps>(
  function UIAlert(props, ref) {
    return <Alert ref={ref} {...props} />;
  },
);

export function UIEmptyState(props: EmptyStateProps) {
  return <EmptyState {...props} />;
}

export type UILoadingStateProps = {
  label?: string;
};

export function UILoadingState({ label = "Loading" }: UILoadingStateProps) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <CircularProgress size={16} />
      <span>{label}</span>
    </div>
  );
}

export function UIDataTable<T extends { id: string | number }>(props: DataTableProps<T>) {
  return <DataTable {...props} />;
}
