"use client";

import {
  Backdrop as MuiBackdrop,
  CircularProgress as MuiCircularProgress,
  Dialog as MuiDialog,
  DialogActions as MuiDialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  LinearProgress as MuiLinearProgress,
  Popover as MuiPopover,
  Snackbar as MuiSnackbar,
  alpha,
  styled,
} from "@mui/material";

export const Dialog = styled(MuiDialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: 18,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
  },
}));

export const Backdrop = MuiBackdrop;
export const Popover = MuiPopover;
export const Snackbar = MuiSnackbar;
// export const Skeleton = styled(MuiSkeleton)(({ theme }) => ({
//   backgroundColor: alpha(theme.palette.primary.main, 0.08),
//   borderRadius: 12,
// }));

export const DialogTitle = MuiDialogTitle;
export const DialogContent = MuiDialogContent;
export const DialogActions = MuiDialogActions;

export const Progress = {
  Linear: styled(MuiLinearProgress)(({ theme }) => ({
    borderRadius: 999,
    height: 10,
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    "& .MuiLinearProgress-bar": {
      borderRadius: 999,
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.8)} 100%)`,
    },
  })),
  Circular: styled(MuiCircularProgress)(({ theme }) => ({
    color: theme.palette.primary.main,
  })),
};
