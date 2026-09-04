"use client";

import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Alert as MuiAlert,
  Avatar as MuiAvatar,
  Badge as MuiBadge,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Chip as MuiChip,
  Divider as MuiDivider,
  ImageList as MuiImageList,
  ImageListItem as MuiImageListItem,
  ImageListItemBar as MuiImageListItemBar,
  List as MuiList,
  ListItem as MuiListItem,
  ListItemButton as MuiListItemButton,
  ListItemText as MuiListItemText,
  Paper as MuiPaper,
  Skeleton as MuiSkeleton,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer as MuiTableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  Tooltip as MuiTooltip,
  Typography as MuiTypography,
  alpha,
  styled,
} from "@mui/material";

export const Avatar = styled(MuiAvatar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.7)} 100%)`,
  color: theme.palette.primary.contrastText ?? "#212121",
  fontWeight: 700,
}));

export const Badge = styled(MuiBadge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText ?? "#212121",
    fontWeight: 700,
  },
}));

export const Chip = styled(MuiChip)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: alpha(theme.palette.primary.main, 0.12),
  color: theme.palette.text.primary,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
}));

export const Divider = styled(MuiDivider)(({ theme }) => ({
  borderColor: alpha(theme.palette.primary.main, 0.12),
}));

export const Card = styled(MuiCard)(({ theme }) => ({
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
  background: theme.palette.background.paper,
}));

export const Paper = styled(MuiPaper)(({ theme }) => ({
  border: `1px solid ${alpha(theme.palette.primary.main, 0.07)}`,
  background: theme.palette.background.paper,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
}));

export const Alert = styled(MuiAlert)(({ theme }) => ({
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
}));

export const Tooltip = styled(MuiTooltip)(({ theme }) => ({
  "& .MuiTooltip-tooltip": {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    fontSize: 12,
  },
}));

export const Table = styled(MuiTable)(({ theme }) => ({
  borderCollapse: "separate",
  borderSpacing: 0,
  "& .MuiTableCell-root": {
    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
    padding: "0.85rem 1rem",
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    color: theme.palette.text.primary,
    fontWeight: 700,
  },
}));

export const List = MuiList;
export const ListItem = MuiListItem;
export const ListItemButton = MuiListItemButton;
export const ListItemText = MuiListItemText;
export const TableContainer = MuiTableContainer;
export const TableHead = MuiTableHead;
export const TableBody = MuiTableBody;
export const TableRow = MuiTableRow;
export const TableCell = MuiTableCell;
export const Typography = MuiTypography;
export const Skeleton = styled(MuiSkeleton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
}));
export const Accordion = MuiAccordion;
export const AccordionSummary = MuiAccordionSummary;
export const AccordionDetails = MuiAccordionDetails;
export const CardContent = MuiCardContent;
export const ImageList = MuiImageList;
export const ImageListItem = MuiImageListItem;
export const ImageListItemBar = MuiImageListItemBar;
