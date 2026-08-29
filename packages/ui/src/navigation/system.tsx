"use client";

import * as React from "react";
import {
  AppBar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

export type NavigationItem = {
  id: string;
  label: string;
  active?: boolean;
};

export type AppShellProps = {
  sidebar: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, minHeight: "100vh" }}>
      <Box sx={{ display: { xs: "none", md: "block" }, borderRight: "1px solid", borderColor: "divider" }}>{sidebar}</Box>
      <Box>
        {topbar}
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

export type AppSidebarProps = {
  items: NavigationItem[];
  title?: string;
  onSelect?: (id: string) => void;
};

export function AppSidebar({ items, title = "Dhriti", onSelect }: AppSidebarProps) {
  return (
    <Stack sx={{ height: "100%" }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Divider />
      <List dense>
        {items.map((item) => (
          <ListItemButton key={item.id} selected={item.active} onClick={() => onSelect?.(item.id)}>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Stack>
  );
}

export function TopBar({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6">{title}</Typography>
        <Stack direction="row" spacing={1}>{actions}</Stack>
      </Toolbar>
    </AppBar>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2.5, justifyContent: "space-between" }}>
      <Box>
        <Typography variant="h4">{title}</Typography>
        {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      <Stack direction="row" spacing={1}>{actions}</Stack>
    </Stack>
  );
}

export function AppSwitcher({ currentApp }: { currentApp: string }) {
  return <Typography variant="body2">App: {currentApp}</Typography>;
}

export function WorkspaceSwitcher({ workspace }: { workspace: string }) {
  return <Typography variant="body2">Workspace: {workspace}</Typography>;
}

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export function CommandPalette({ open, onClose, children }: CommandPaletteProps) {
  return (
    <Drawer anchor="top" open={open} onClose={onClose}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
          <IconButton size="small" onClick={onClose} aria-label="Close command palette">
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle2">Command Palette</Typography>
        </Stack>
        {children}
      </Box>
    </Drawer>
  );
}
