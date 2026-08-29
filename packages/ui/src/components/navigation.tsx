"use client";

import {
  AppBar as MuiAppBar,
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction as MuiBottomNavigationAction,
  Breadcrumbs as MuiBreadcrumbs,
  Drawer as MuiDrawer,
  Fab as MuiFab,
  Link as MuiLink,
  Menu as MuiMenu,
  MenuList as MuiMenuList,
  Pagination as MuiPagination,
  SpeedDial as MuiSpeedDial,
  Step as MuiStep,
  StepLabel as MuiStepLabel,
  Stepper as MuiStepper,
  Tab as MuiTab,
  Tabs as MuiTabs,
  alpha,
  styled,
} from "@mui/material";

export const AppBar = styled(MuiAppBar)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.92),
  color: theme.palette.text.primary,
  backdropFilter: "blur(10px)",
  borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  boxShadow: "none",
}));

export const BottomNavigation = MuiBottomNavigation;
export const BottomNavigationAction = MuiBottomNavigationAction;
export const Pagination = MuiPagination;
export const Menu = MuiMenu;
// export const MenuItem = MuiMenuItem;
export const MenuList = MuiMenuList;
export const MenuBar = MuiMenuList;
export const Menubar = MuiMenuList;
export const Drawer = MuiDrawer;
export const Link = MuiLink;
export const Breadcrumbs = MuiBreadcrumbs;
export const Tabs = MuiTabs;
export const Tab = MuiTab;
export const Stepper = MuiStepper;
export const Step = MuiStep;
export const StepLabel = MuiStepLabel;
export const SpeedDial = MuiSpeedDial;
export const FloatingActionButton = styled(MuiFab)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
  color: theme.palette.primary.contrastText ?? "#212121",
  boxShadow: `0 20px 32px ${alpha(theme.palette.primary.main, 0.18)}`,
}));
