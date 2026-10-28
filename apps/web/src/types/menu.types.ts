import { ReactNode } from "react";

export type ConnectCascadingMenuItem = {
  id: string;
  label: string;
  content?: ReactNode;
  description?: string;
  descriptionLayout?: "inline" | "stacked";
  icon?: ReactNode;
  danger?: boolean;
  selected?: boolean;
  sectionTitle?: string;
  dividerAbove?: boolean;
  endAdornment?: ReactNode;
  href?: string;

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
