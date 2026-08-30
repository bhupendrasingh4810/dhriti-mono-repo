"use client";

import type { ReactNode } from "react";
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Typography,
    type DialogProps as MuiDialogProps,
} from "@mui/material";
import { CloseRounded } from "@mui/icons-material";
import { DialogActions, DialogContent, DialogTitle, Dialog as StyledDialog } from "../overlays";

export interface DialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    primaryActionLabel?: string;
    onPrimaryAction?: () => Promise<void> | void;
    primaryButtonVariant?: "contained" | "outlined" | "text";
    primaryButtonColor?: "primary" | "secondary" | "error" | "success";
    secondaryActionLabel?: string;
    isSubmitting?: boolean;
    maxWidth?: MuiDialogProps["maxWidth"];
    fullWidth?: boolean;
}

export function Dialog({
    open,
    onClose,
    title,
    children,
    primaryActionLabel,
    onPrimaryAction,
    primaryButtonVariant = "contained",
    primaryButtonColor = "primary",
    secondaryActionLabel = "Cancel",
    isSubmitting = false,
    maxWidth = "sm",
    fullWidth = true,
}: DialogProps) {
    return (
        <StyledDialog
            open={open}
            onClose={isSubmitting ? undefined : onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: "8px !important",
                        p: 1,
                        overflow: "hidden",
                    },
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
                {!isSubmitting && (
                    <IconButton onClick={onClose} aria-label="close" size="small">
                        <CloseRounded />
                    </IconButton>
                )}
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>{children}</Box>
            </DialogContent>

            {(primaryActionLabel || secondaryActionLabel) && (
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    {secondaryActionLabel && !isSubmitting && (
                        <Button onClick={onClose} color="inherit" variant="text">
                            {secondaryActionLabel}
                        </Button>
                    )}

                    {primaryActionLabel && (
                        <Button
                            onClick={onPrimaryAction}
                            variant={primaryButtonVariant}
                            color={primaryButtonColor}
                            disabled={isSubmitting}
                            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{ minWidth: 100 }}
                        >
                            {primaryActionLabel}
                        </Button>
                    )}
                </DialogActions>
            )}
        </StyledDialog>
    );
}
