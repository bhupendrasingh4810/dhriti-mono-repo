"use client";

import {
  ConnectCascadingMenu,
  type ConnectCascadingMenuItem,
} from "./ConnectCascadingMenu";

export type NonBlockingMenuItem = ConnectCascadingMenuItem;

type NonBlockingMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  items: NonBlockingMenuItem[];
  minWidth?: number;
  heading?: string;
};

export function NonBlockingMenu({
  anchorEl,
  open,
  onClose,
  items,
  minWidth = 220,
  heading,
}: NonBlockingMenuProps) {
  return (
    <ConnectCascadingMenu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      items={items}
      minWidth={minWidth}
      heading={heading}
      maxDepth={4}
    />
  );
}
