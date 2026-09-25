import { ReactNode } from "react";

export type ConnectCascadingMenuItem = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  danger?: boolean;
  selected?: boolean;
  sectionTitle?: string;
  dividerAbove?: boolean;
  endAdornment?: ReactNode;

  /**
    
    * Only applies to leaf items.
    * Parent items with children always open their submenu.
      */
  closeOnClick?: boolean;

  onClick?: (event: React.MouseEvent<HTMLElement>, item?: ConnectCascadingMenuItem) => void;

  children?: ConnectCascadingMenuItem[];
};

export type SubmenuState = {
  itemId: string;
  anchorEl: HTMLElement;
  openLeft: boolean;
};
