"use client";

import type { ReactNode } from "react";
import { ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

export type NonBlockingMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

type NonBlockingMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: NonBlockingMenuItem[];
  minWidth?: number;
};

export function NonBlockingMenu({
  anchorEl,
  open,
  onClose,
  items,
  minWidth = 220,
}: NonBlockingMenuProps) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      disableScrollLock
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            minWidth,
            border: "1px solid #eef2f7",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
            borderRadius: 2,
          },
        },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      {items.map((item) => (
        <MenuItem
          key={item.id}
          onClick={() => {
            item.onClick?.();
            onClose();
          }}
          sx={{
            py: 1,
            "& .MuiListItemText-primary": {
              fontSize: 13,
              color: item.danger ? "#dc2626" : "#374151",
              fontWeight: 500,
            },
          }}
        >
          {item.icon ? <ListItemIcon sx={{ minWidth: 30 }}>{item.icon}</ListItemIcon> : null}
          <ListItemText primary={item.label} />
        </MenuItem>
      ))}
    </Menu>
  );
}
