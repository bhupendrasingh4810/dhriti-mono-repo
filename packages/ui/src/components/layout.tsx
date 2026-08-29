"use client";

import {
  Box as MuiBox,
  Container as MuiContainer,
  Grid as MuiGrid,
  IconButton as MuiIconButton,
  Stack as MuiStack,
  Toolbar as MuiToolbar,
  alpha,
  styled,
} from "@mui/material";

export const Box = MuiBox;
export const Container = MuiContainer;
export const Grid = MuiGrid;
export const Stack = MuiStack;
export const Toolbar = MuiToolbar;
export const IconButton = MuiIconButton;

export const Panel = styled(MuiBox)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
  background: alpha(theme.palette.primary.main, 0.02),
  padding: theme.spacing(2),
}));
